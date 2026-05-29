import { useState, useRef, useCallback } from 'react';

export default function useCanvas({ socket, roomId, user }) {
  const [tool,        setTool]        = useState('pen');
  const [color,       setColor]       = useState(user?.displayColor ?? '#534AB7');
  const [width,       setWidth]       = useState(4);
  const [opacity,     setOpacity]     = useState(1);
  const [strokes,     setStrokes]     = useState([]);
  const [liveStrokes, setLiveStrokes] = useState({});
  const [undoStack,   setUndoStack]   = useState([]);

  const isDrawing   = useRef(false);
  const startPos    = useRef({ x: 0, y: 0 });
  const currentPath = useRef([]);
  const tempId      = useRef(null);

  const generateTempId = () => `temp_${Date.now()}_${Math.random()}`;
  const isShapeTool = (t) => ['rect', 'circle', 'arrow', 'line'].includes(t);

  const loadStrokes  = useCallback((existing) => setStrokes(existing), []);

  const deleteStroke = useCallback((id) => {
  setStrokes(prev => prev.map(s => s._id === id ? { ...s, isDeleted: true } : s));
  setUndoStack(prev => prev.filter(uid => uid !== id));
  socket?.emit('canvas:undo', { roomId, strokeId: id });
}, [socket, roomId]);

  const getPos = (stage) => {
  // getRelativePointerPosition accounts for stage scale + pan offset
  const pos = stage.getRelativePointerPosition();
  return pos ? { x: pos.x, y: pos.y } : null;
};

  const handleMouseDown = useCallback((e, stage) => {
    const pos = getPos(stage);
    if (!pos) return;
    isDrawing.current      = true;
    startPos.current       = pos;
    currentPath.current    = [pos.x, pos.y];
    tempId.current         = generateTempId();
  }, []);

  const buildPoints = useCallback((tool, currentPos) => {
    if (isShapeTool(tool)) {
      return [startPos.current.x, startPos.current.y, currentPos.x, currentPos.y];
    }
    return [...currentPath.current, currentPos.x, currentPos.y];
  }, []);

  const handleMouseMove = useCallback((e, stage) => {
    if (!isDrawing.current) return;
    const pos = getPos(stage);
    if (!pos) return;

    const points = buildPoints(tool, pos);

    // grow freehand path
    if (!isShapeTool(tool)) currentPath.current = points;

    const liveData = {
      tempId:  tempId.current,
      roomId,
      tool,
      points,
      color:   tool === 'eraser' ? '#000000' : color,
      width:   tool === 'eraser' ? width * 5  : width,
      opacity: tool === 'eraser' ? 1          : opacity,
    };

    socket?.emit('draw:stroke_live', liveData);

    setLiveStrokes(prev => ({
      ...prev,
      [socket?.id ?? 'local']: liveData,
    }));
  }, [tool, color, width, opacity, roomId, socket, buildPoints]);

  const handleMouseUp = useCallback((e, stage) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const pos = getPos(stage);
    const finalPoints = isShapeTool(tool)
      ? pos
        ? [startPos.current.x, startPos.current.y, pos.x, pos.y]
        : currentPath.current
      : currentPath.current;

    // clear local live preview immediately
    setLiveStrokes(prev => {
      const next = { ...prev };
      delete next[socket?.id ?? 'local'];
      return next;
    });

    if (finalPoints.length < 4) {
      currentPath.current = [];
      tempId.current = null;
      return;
    }

    const strokeData = {
      tempId:   tempId.current,
      roomId,
      tool,
      points:   finalPoints,
      color:    tool === 'eraser' ? '#000000' : color,
      width:    tool === 'eraser' ? width * 5  : width,
      opacity:  tool === 'eraser' ? 1          : opacity,
    };

    const optimistic = {
      ...strokeData,
      _id:       strokeData.tempId,
      userId:    { _id: user._id, username: user.username, displayColor: user.displayColor },
      isDeleted: false,
    };

    setStrokes(prev => [...prev, optimistic]);
    setUndoStack(prev => [...prev, optimistic._id]);

    socket?.emit('draw:stroke', strokeData);

    currentPath.current = [];
    tempId.current = null;
  }, [tool, color, width, opacity, roomId, socket, user]);

  const confirmStroke  = useCallback((tId, realId) => {
    setStrokes(prev  => prev.map(s => s._id === tId ? { ...s, _id: realId } : s));
    setUndoStack(prev => prev.map(id => id === tId ? realId : id));
  }, []);

  const addRemoteStroke  = useCallback((stroke) => setStrokes(prev => [...prev, stroke]), []);
  const updateLiveStroke = useCallback((data)   => setLiveStrokes(prev => ({ ...prev, [data.userId]: data })), []);
  const clearLiveStroke  = useCallback((userId) => setLiveStrokes(prev => { const n = { ...prev }; delete n[userId]; return n; }), []);

  const undo = useCallback(() => {
    if (!undoStack.length) return;
    const lastId = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setStrokes(prev => prev.map(s => s._id === lastId ? { ...s, isDeleted: true } : s));
    socket?.emit('canvas:undo', { roomId, strokeId: lastId });
  }, [undoStack, roomId, socket]);

  const applyUndo  = useCallback((strokeId) => setStrokes(prev => prev.map(s => s._id === strokeId ? { ...s, isDeleted: true } : s)), []);
  const clearCanvas = useCallback(() => { setStrokes([]); setLiveStrokes({}); setUndoStack([]); }, []);

  // update a stroke's position/size after drag/resize
  const updateStroke = useCallback((id, changes, broadcast = true) => {
    setStrokes(prev => prev.map(s => (
      s._id === id ? { ...s, ...changes } : s
    )));

    if (broadcast) {
      socket?.emit('canvas:stroke_updated', { roomId, strokeId: id, changes });
    }
  }, [socket, roomId]);

  return {
    tool, setTool,
    color, setColor,
    width, setWidth,
    opacity, setOpacity,
    strokes, liveStrokes, undoStack,
    loadStrokes, handleMouseDown, handleMouseMove, handleMouseUp,
    confirmStroke, addRemoteStroke, updateLiveStroke, clearLiveStroke,
    undo, applyUndo, clearCanvas, updateStroke, deleteStroke,
  };
}
