import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth }   from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useCanvas     from '../hooks/useCanvas';
import CanvasBoard   from '../components/canvas/CanvasBoard';
import Toolbar       from '../components/canvas/Toolbar';
import CursorOverlay from '../components/canvas/CursorOverlay';
import jsPDF         from 'jspdf';
import api           from '../api/axios';

export default function Room() {
  const { id: roomId } = useParams();
  const { user }       = useAuth();
  const socket         = useSocket();
  const navigate       = useNavigate();
  const stageRef       = useRef(null);

  const [room,        setRoom]        = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [cursors,     setCursors]     = useState({});
  const [loading,     setLoading]     = useState(true);

  const canvas = useCanvas({ socket, roomId, user });
  const {
    loadStrokes,
    addRemoteStroke,
    clearLiveStroke,
    updateLiveStroke,
    confirmStroke,
    updateStroke,
    applyUndo,
    clearCanvas,
    undo,
    setTool,
  } = canvas;

  // ── Socket events ───────────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId || !user) return;

    socket.emit('room:join', { roomId });

    socket.on('room:joined', ({ room, strokes }) => {
      setRoom(room);
      loadStrokes(strokes);
      setLoading(false);
    });

    socket.on('room:active_users', ({ users }) => setActiveUsers(users));

    socket.on('room:user_joined', ({ user: u }) => {
      setActiveUsers(prev =>
        prev.find(x => x._id === u._id) ? prev : [...prev, u]
      );
    });

    socket.on('room:user_left', ({ userId }) => {
      setActiveUsers(prev => prev.filter(u => u._id !== userId));
      setCursors(prev => {
        const next = { ...prev }; delete next[userId]; return next;
      });
    });

    // canvas events
    socket.on('draw:stroke', (stroke) => {
      addRemoteStroke(stroke);
      clearLiveStroke(stroke.userId?._id ?? stroke.userId);
    });

    socket.on('draw:stroke_live', (data) => {
      updateLiveStroke(data);
    });

    socket.on('draw:stroke_saved', ({ tempId, _id }) => {
      confirmStroke(tempId, _id);
    });

    socket.on('canvas:stroke_updated', ({ strokeId, changes }) => {
      updateStroke(strokeId, changes, false);
    });

    socket.on('canvas:undo',  ({ strokeId }) => applyUndo(strokeId));
    socket.on('canvas:clear', () => clearCanvas());

    // cursor events
    socket.on('cursor:move', (data) => {
      setCursors(prev => ({ ...prev, [data.userId]: data }));
    });
    socket.on('cursor:leave', ({ userId }) => {
      setCursors(prev => { const n = { ...prev }; delete n[userId]; return n; });
    });

    return () => {
      socket.emit('room:leave', { roomId });
      socket.emit('cursor:leave', { roomId });
      socket.off('room:joined');
      socket.off('room:active_users');
      socket.off('room:user_joined');
      socket.off('room:user_left');
      socket.off('draw:stroke');
      socket.off('draw:stroke_live');
      socket.off('draw:stroke_saved');
      socket.off('canvas:stroke_updated');
      socket.off('canvas:undo');
      socket.off('canvas:clear');
      socket.off('cursor:move');
      socket.off('cursor:leave');
    };
  }, [socket, roomId, user, loadStrokes, addRemoteStroke, clearLiveStroke, updateLiveStroke, confirmStroke, updateStroke, applyUndo, clearCanvas]);

  useEffect(() => {
  const handleKeyDown = (e) => {
    // ignore shortcuts when typing in an input
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    // ctrl+z — undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
      return;
    }

    // tool shortcuts — 1 through 7
    const toolMap = {
      '1': 'select',
      '2': 'pen',
      '3': 'line',
      '4': 'rect',
      '5': 'circle',
      '6': 'arrow',
    };

    if (toolMap[e.key]) {
      setTool(toolMap[e.key]);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, setTool]);

  // ── Cursor tracking ─────────────────────────────────────────
  const cursorThrottle = useRef(null);
const handleMouseMove = useCallback((e) => {
  const stage = stageRef.current;
  if (!stage) return;
  canvas.handleMouseMove(e, stage);

  if (cursorThrottle.current) return;
  cursorThrottle.current = setTimeout(() => {
    cursorThrottle.current = null;
    // getRelativePointerPosition accounts for zoom/pan transform
    const pos = stage.getRelativePointerPosition();
    if (pos) socket?.emit('cursor:move', { roomId, x: pos.x, y: pos.y });
  }, 30);
}, [canvas, socket, roomId]);

  // ── PDF export ───────────────────────────────────────────────
 const exportPDF = useCallback(async () => {
  const stage = stageRef.current;
  if (!stage) return;

  const dataUrl = stage.toDataURL({ pixelRatio: 1 });

  // A4 landscape in mm
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

    const canvasW = stage.width();
    const canvasH = stage.height();
    const scale = Math.min(pageW / canvasW, pageH / canvasH);
    const imgW = canvasW * scale;
    const imgH = canvasH * scale;
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;

    pdf.addImage(dataUrl, 'PNG', x, y, imgW, imgH);
  pdf.save(`${room?.name ?? 'canvas'}.pdf`);

  try {
    await api.post('/snapshots', {
      roomId,
      imageUrl:     dataUrl.substring(0, 200),
      canvasWidth:  stage.width(),
      canvasHeight: stage.height(),
      label:        `Export ${new Date().toLocaleString()}`,
    });
  } catch (err) {
    console.error('Snapshot save failed:', err);
  }
}, [room, roomId]);

  const handleClear = useCallback(() => {
    if (!window.confirm('Clear the entire canvas for everyone?')) return;
    canvas.clearCanvas();
    socket?.emit('canvas:clear', { roomId });
  }, [canvas, socket, roomId]);

  // ── Loading state ────────────────────────────────────────────
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-400">Joining room...</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center
                      px-4 gap-3 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-gray-700 text-sm"
        >
          ← Back
        </button>
        <span className="font-medium text-gray-900 text-sm">{room?.name}</span>
        <span className="text-xs bg-green-50 text-green-700 border border-green-100
                         rounded-full px-2 py-0.5 font-mono">
          {room?.inviteCode}
        </span>

        <div className="flex-1" />

        {/* Active users */}
        <div className="flex -space-x-2">
          {activeUsers.slice(0, 5).map(u => (
            <div
              key={u._id}
              title={u.username}
              className="w-7 h-7 rounded-full border-2 border-white flex items-center
                         justify-center text-white text-xs font-medium"
              style={{ backgroundColor: u.displayColor }}
            >
              {u.username?.[0]?.toUpperCase()}
            </div>
          ))}
          {activeUsers.length > 5 && (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200
                            flex items-center justify-center text-xs text-gray-600">
              +{activeUsers.length - 5}
            </div>
          )}
        </div>

        <button
          onClick={exportPDF}
          className="border border-gray-200 text-gray-700 text-sm font-medium
                     px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Export PDF
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Toolbar */}
        <div className="w-12 shrink-0">
          <Toolbar
            tool={canvas.tool}       setTool={canvas.setTool}
            color={canvas.color}     setColor={canvas.setColor}
            width={canvas.width}     setWidth={canvas.setWidth}
            opacity={canvas.opacity} setOpacity={canvas.setOpacity}
            onUndo={canvas.undo}
            onClear={handleClear}
          />
        </div>

        {/* Canvas + cursor overlay */}
        <div className="relative flex-1">
          <CanvasBoard
            stageRef={stageRef}
            strokes={canvas.strokes}
            liveStrokes={canvas.liveStrokes}
            selectedTool={canvas.tool}
            onUpdateStroke={canvas.updateStroke}
            onDeleteStroke={canvas.deleteStroke}
            onMouseDown={e => canvas.handleMouseDown(e, stageRef.current)}
            onMouseMove={handleMouseMove}
            onMouseUp={e => canvas.handleMouseUp(e, stageRef.current)}
          />
          <CursorOverlay cursors={cursors} />
        </div>

        {/* Right panel */}
        <div className="w-48 shrink-0 bg-white border-l border-gray-200
                        flex flex-col overflow-hidden">

          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              In this room ({activeUsers.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {activeUsers.map(u => (
                <div key={u._id} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center
                               text-white text-xs font-medium shrink-0"
                    style={{ backgroundColor: u.displayColor }}
                  >
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-700 truncate">{u.username}</span>
                  {u._id === user?._id && (
                    <span className="text-xs text-gray-400 ml-auto">you</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
