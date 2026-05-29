import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Stage, Layer, Line, Rect, Circle, Arrow, Transformer
} from 'react-konva';

const clamp      = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── helpers ───────────────────────────────────────────────────
const getStrokeOrigin = (stroke) => {
  const pts = stroke.points;
  switch (stroke.tool) {
    case 'rect': {
      const x1 = Math.min(pts[0], pts[pts.length - 2]);
      const y1 = Math.min(pts[1], pts[pts.length - 1]);
      return { x: stroke.offsetX ?? x1, y: stroke.offsetY ?? y1 };
    }
    case 'circle': {
      const cx = (pts[0] + pts[pts.length - 2]) / 2;
      const cy = (pts[1] + pts[pts.length - 1]) / 2;
      return { x: stroke.offsetX ?? cx, y: stroke.offsetY ?? cy };
    }
    case 'line':
    case 'arrow':
      return { x: stroke.offsetX ?? 0, y: stroke.offsetY ?? 0 };
    case 'pen': {
      let minX = Infinity, minY = Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        minX = Math.min(minX, pts[i]);
        minY = Math.min(minY, pts[i + 1]);
      }
      return { x: minX, y: minY };
    }
    default: return { x: 0, y: 0 };
  }
};

const getStrokeBounds = (stroke) => {
  const pts = stroke.points;
  if (!pts || pts.length < 2) return null;
  switch (stroke.tool) {
    case 'rect': {
      const x1 = Math.min(pts[0], pts[pts.length - 2]);
      const y1 = Math.min(pts[1], pts[pts.length - 1]);
      const ox = stroke.offsetX ?? x1;
      const oy = stroke.offsetY ?? y1;
      return {
        x1: ox, y1: oy,
        x2: ox + (stroke.scaleW ?? Math.abs(pts[pts.length - 2] - pts[0])),
        y2: oy + (stroke.scaleH ?? Math.abs(pts[pts.length - 1] - pts[1])),
      };
    }
    case 'circle': {
      const cx = (pts[0] + pts[pts.length - 2]) / 2;
      const cy = (pts[1] + pts[pts.length - 1]) / 2;
      const r  = Math.hypot(
        pts[pts.length - 2] - pts[0],
        pts[pts.length - 1] - pts[1]
      ) / 2;
      const ox = stroke.offsetX ?? cx;
      const oy = stroke.offsetY ?? cy;
      const sr = stroke.scaleR ?? r;
      return { x1: ox - sr, y1: oy - sr, x2: ox + sr, y2: oy + sr };
    }
    case 'line':
    case 'arrow': {
      const ox = stroke.offsetX ?? 0;
      const oy = stroke.offsetY ?? 0;
      return {
        x1: ox + Math.min(pts[0], pts[pts.length - 2]),
        y1: oy + Math.min(pts[1], pts[pts.length - 1]),
        x2: ox + Math.max(pts[0], pts[pts.length - 2]),
        y2: oy + Math.max(pts[1], pts[pts.length - 1]),
      };
    }
    case 'pen': {
      let minX = Infinity, minY = Infinity,
          maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        minX = Math.min(minX, pts[i]);     maxX = Math.max(maxX, pts[i]);
        minY = Math.min(minY, pts[i + 1]); maxY = Math.max(maxY, pts[i + 1]);
      }
      return { x1: minX, y1: minY, x2: maxX, y2: maxY };
    }
    default: return null;
  }
};

const boxesIntersect = (a, b) =>
  a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;

const clampTranslation = (bounds, dx, dy, stageW, stageH) => ({
  dx: clamp(dx, -bounds.x1, stageW - bounds.x2),
  dy: clamp(dy, -bounds.y1, stageH - bounds.y2),
});

const clampStrokeChangeToStage = (stroke, changes, stageSize) => {
  const stageW = Math.max(0, stageSize?.w ?? 0);
  const stageH = Math.max(0, stageSize?.h ?? 0);

  if (!stageW || !stageH) return changes;

  if (Array.isArray(changes.points)) {
    const currentBounds = getStrokeBounds(stroke);
    if (!currentBounds) return changes;

    const dx = changes.points[0] - stroke.points[0];
    const dy = changes.points[1] - stroke.points[1];
    const clamped = clampTranslation(currentBounds, dx, dy, stageW, stageH);

    return {
      ...changes,
      points: stroke.points.map((value, index) => (
        index % 2 === 0
          ? value + clamped.dx
          : value + clamped.dy
      )),
    };
  }

  if (stroke.tool === 'rect') {
    const width = stroke.scaleW ?? Math.abs(stroke.points[stroke.points.length - 2] - stroke.points[0]);
    const height = stroke.scaleH ?? Math.abs(stroke.points[stroke.points.length - 1] - stroke.points[1]);
    const offsetX = clamp(changes.offsetX ?? stroke.offsetX ?? Math.min(stroke.points[0], stroke.points[stroke.points.length - 2]), 0, Math.max(0, stageW - width));
    const offsetY = clamp(changes.offsetY ?? stroke.offsetY ?? Math.min(stroke.points[1], stroke.points[stroke.points.length - 1]), 0, Math.max(0, stageH - height));
    return { ...changes, offsetX, offsetY };
  }

  if (stroke.tool === 'circle') {
    const radius = stroke.scaleR ?? Math.hypot(
        stroke.points[stroke.points.length - 2] - stroke.points[0],
        stroke.points[stroke.points.length - 1] - stroke.points[1]
      ) / 2;
    const fallbackX = (stroke.points[0] + stroke.points[stroke.points.length - 2]) / 2;
    const fallbackY = (stroke.points[1] + stroke.points[stroke.points.length - 1]) / 2;
    const offsetX = clamp(changes.offsetX ?? stroke.offsetX ?? fallbackX, radius, Math.max(radius, stageW - radius));
    const offsetY = clamp(changes.offsetY ?? stroke.offsetY ?? fallbackY, radius, Math.max(radius, stageH - radius));
    return { ...changes, offsetX, offsetY };
  }

  if (stroke.tool === 'line' || stroke.tool === 'arrow') {
    const pts = stroke.points;
    const localWidth = Math.abs(pts[pts.length - 2] - pts[0]);
    const localHeight = Math.abs(pts[pts.length - 1] - pts[1]);
    const offsetX = clamp(changes.offsetX ?? stroke.offsetX ?? 0, 0, Math.max(0, stageW - localWidth));
    const offsetY = clamp(changes.offsetY ?? stroke.offsetY ?? 0, 0, Math.max(0, stageH - localHeight));
    return { ...changes, offsetX, offsetY };
  }

  return changes;
};

const mergeBounds = (boundsList) => {
  if (!boundsList.length) return null;
  return boundsList.reduce((acc, b) => ({
    x1: Math.min(acc.x1, b.x1),
    y1: Math.min(acc.y1, b.y1),
    x2: Math.max(acc.x2, b.x2),
    y2: Math.max(acc.y2, b.y2),
  }));
};

const isPointNearBounds = (point, bounds, padding = 16) => {
  if (!point || !bounds) return false;
  return (
    point.x >= bounds.x1 - padding &&
    point.x <= bounds.x2 + padding &&
    point.y >= bounds.y1 - padding &&
    point.y <= bounds.y2 + padding
  );
};

// ── stroke components ─────────────────────────────────────────
const StrokePen = ({ stroke, isSelectMode, isSelected, onSelect, onChange }) => {
  if (stroke.isDeleted) return null;
  return (
    <Line
      id={stroke._id}
      points={stroke.points}
      stroke={isSelected ? '#6366f1' : stroke.color}
      strokeWidth={stroke.width}
      opacity={stroke.opacity ?? 1}
      tension={0.4}
      lineCap="round"
      lineJoin="round"
      listening={isSelectMode}
      hitStrokeWidth={14}
      shadowForStrokeEnabled={false}
      draggable={isSelectMode && isSelected}
      onClick={isSelectMode ? onSelect : undefined}
      onTap={isSelectMode   ? onSelect : undefined}
      onDragEnd={(e) => {
        const dx = e.target.x();
        const dy = e.target.y();
        if (dx !== 0 || dy !== 0) {
          onChange({
            points: stroke.points.map((v, i) => (i % 2 === 0 ? v + dx : v + dy)),
          });
        }
        // Keep node transform clean; movement is persisted in points.
        e.target.position({ x: 0, y: 0 });
      }}
    />
  );
};

const StrokeLine = ({ stroke, isSelectMode, isSelected, onSelect, onChange }) => {
  if (stroke.isDeleted) return null;
  const pts = stroke.points;
  return (
    <Line
      id={stroke._id}
      x={stroke.offsetX ?? 0}
      y={stroke.offsetY ?? 0}
      points={[pts[0], pts[1], pts[pts.length - 2], pts[pts.length - 1]]}
      stroke={isSelected ? '#6366f1' : stroke.color}
      strokeWidth={stroke.width}
      opacity={stroke.opacity ?? 1}
      lineCap="round"
      listening={isSelectMode}
      hitStrokeWidth={14}
      draggable={isSelectMode && isSelected}
      onClick={isSelectMode ? onSelect : undefined}
      onTap={isSelectMode   ? onSelect : undefined}
      onDragEnd={e => onChange({ offsetX: e.target.x(), offsetY: e.target.y() })}
    />
  );
};

const StrokeRect = ({ stroke, isSelectMode, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef    = useRef();
  const pts = stroke.points;
  const x1  = Math.min(pts[0], pts[pts.length - 2]);
  const y1  = Math.min(pts[1], pts[pts.length - 1]);
  const w   = Math.abs(pts[pts.length - 2] - pts[0]);
  const h   = Math.abs(pts[pts.length - 1] - pts[1]);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  if (stroke.isDeleted) return null;

  return (
    <>
      <Rect
        ref={shapeRef}
        id={stroke._id}
        x={stroke.offsetX ?? x1}
        y={stroke.offsetY ?? y1}
        width={stroke.scaleW ?? w}
        height={stroke.scaleH ?? h}
        stroke={stroke.color}
        strokeWidth={stroke.width}
        opacity={stroke.opacity ?? 1}
        fill="transparent"
        listening={isSelectMode}
        draggable={isSelectMode && isSelected}
        onClick={isSelectMode ? onSelect : undefined}
        onTap={isSelectMode   ? onSelect : undefined}
        onDragEnd={e => onChange({ offsetX: e.target.x(), offsetY: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          onChange({
            offsetX: node.x(), offsetY: node.y(),
            scaleW: Math.max(5, node.width()  * node.scaleX()),
            scaleH: Math.max(5, node.height() * node.scaleY()),
          });
          node.scaleX(1); node.scaleY(1);
        }}
      />
      {isSelected && isSelectMode && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          boundBoxFunc={(old, n) => (n.width < 5 || n.height < 5 ? old : n)}
        />
      )}
    </>
  );
};

const StrokeCircle = ({ stroke, isSelectMode, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef    = useRef();
  const pts = stroke.points;
  const cx  = (pts[0] + pts[pts.length - 2]) / 2;
  const cy  = (pts[1] + pts[pts.length - 1]) / 2;
  const r   = Math.hypot(
    pts[pts.length - 2] - pts[0],
    pts[pts.length - 1] - pts[1]
  ) / 2;

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  if (stroke.isDeleted) return null;

  return (
    <>
      <Circle
        ref={shapeRef}
        id={stroke._id}
        x={stroke.offsetX ?? cx}
        y={stroke.offsetY ?? cy}
        radius={stroke.scaleR ?? r}
        stroke={stroke.color}
        strokeWidth={stroke.width}
        opacity={stroke.opacity ?? 1}
        fill="transparent"
        listening={isSelectMode}
        draggable={isSelectMode && isSelected}
        onClick={isSelectMode ? onSelect : undefined}
        onTap={isSelectMode   ? onSelect : undefined}
        onDragEnd={e => onChange({ offsetX: e.target.x(), offsetY: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          onChange({
            offsetX: node.x(), offsetY: node.y(),
            scaleR: Math.max(5,
              (stroke.scaleR ?? r) * ((node.scaleX() + node.scaleY()) / 2)
            ),
          });
          node.scaleX(1); node.scaleY(1);
        }}
      />
      {isSelected && isSelectMode && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio
          boundBoxFunc={(old, n) => (n.width < 10 ? old : n)}
        />
      )}
    </>
  );
};

const StrokeArrow = ({ stroke, isSelectMode, isSelected, onSelect, onChange }) => {
  if (stroke.isDeleted) return null;
  const pts = stroke.points;
  return (
    <Arrow
      id={stroke._id}
      x={stroke.offsetX ?? 0}
      y={stroke.offsetY ?? 0}
      points={[pts[0], pts[1], pts[pts.length - 2], pts[pts.length - 1]]}
      stroke={isSelected ? '#6366f1' : stroke.color}
      fill={isSelected ? '#6366f1' : stroke.color}
      strokeWidth={stroke.width}
      opacity={stroke.opacity ?? 1}
      pointerLength={12}
      pointerWidth={10}
      listening={isSelectMode}
      hitStrokeWidth={14}
      draggable={isSelectMode && isSelected}
      onClick={isSelectMode ? onSelect : undefined}
      onTap={isSelectMode   ? onSelect : undefined}
      onDragEnd={e => onChange({ offsetX: e.target.x(), offsetY: e.target.y() })}
    />
  );
};

// ── Main component ────────────────────────────────────────────
export default function CanvasBoard({
  strokes,
  liveStrokes,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  stageRef,
  selectedTool,
  onUpdateStroke,
  onDeleteStroke,
}) {
  const containerRef     = useRef(null);
  const [selectedIds,  setSelectedIds]  = useState([]);
  const [marquee,      setMarquee]      = useState(null);
  const [stageSize,    setStageSize]    = useState({ w: 800, h: 600 });

  const marqueeStart      = useRef(null);
  const isDraggingMarquee = useRef(false);
  const lastGroupPos      = useRef(null);
  const groupDragOrigins  = useRef({});

  const isSelectMode = selectedTool === 'select';

  const getSelectedBounds = useCallback(() => {
    const selectedBounds = strokes
      .filter(s => selectedIds.includes(s._id) && !s.isDeleted)
      .map(getStrokeBounds)
      .filter(Boolean);
    return mergeBounds(selectedBounds);
  }, [selectedIds, strokes]);

  // ── helpers to read stage transform ──────────────────────────
  // ALWAYS use getRelativePointerPosition() for canvas-space coords
  const getCanvasPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    // getRelativePointerPosition accounts for scale + position
    return stage.getRelativePointerPosition();
  }, [stageRef]);

  // ── clear on tool switch ─────────────────────────────────────
  useEffect(() => {
    if (!isSelectMode) { setSelectedIds([]); setMarquee(null); }
  }, [isSelectMode]);

  // ── delete key ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        selectedIds.forEach(id => onDeleteStroke(id));
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, onDeleteStroke]);

  // ── resize observer ──────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setStageSize({ w, h });
      if (stageRef.current) {
        stageRef.current.width(w);
        stageRef.current.height(h);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [stageRef]);

  const constrainStrokeUpdate = useCallback((stroke, changes) => (
    clampStrokeChangeToStage(stroke, changes, stageSize)
  ), [stageSize]);

  // ── unified mouse down ────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (isSelectMode) {
      const stage = stageRef.current;
      if (!stage || e.target !== stage) return;
      setSelectedIds([]);
      const pos = getCanvasPos();
      if (!pos) return;
      marqueeStart.current      = pos;
      isDraggingMarquee.current = true;
      setMarquee({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }

    // drawing — pass the event; useCanvas will call getRelativePointerPosition
    onMouseDown(e);
  }, [isSelectMode, onMouseDown, getCanvasPos, stageRef]);

  // ── unified mouse move ────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    // marquee
    if (isDraggingMarquee.current && marqueeStart.current) {
      const pos = getCanvasPos();
      if (!pos) return;
      setMarquee({
        x: Math.min(pos.x, marqueeStart.current.x),
        y: Math.min(pos.y, marqueeStart.current.y),
        w: Math.abs(pos.x - marqueeStart.current.x),
        h: Math.abs(pos.y - marqueeStart.current.y),
      });
      return;
    }

    if (!isSelectMode) onMouseMove(e);
  }, [isSelectMode, onMouseMove, getCanvasPos]);

  // ── unified mouse up ──────────────────────────────────────────
  const handleMouseUp = useCallback((e) => {
    if (isDraggingMarquee.current) {
      isDraggingMarquee.current = false;
      marqueeStart.current      = null;
      if (!marquee || (marquee.w < 5 && marquee.h < 5)) {
        setMarquee(null);
        return;
      }
      const sel = {
        x1: marquee.x,             y1: marquee.y,
        x2: marquee.x + marquee.w, y2: marquee.y + marquee.h,
      };
      const hit = strokes
        .filter(s => !s.isDeleted)
        .filter(s => { const b = getStrokeBounds(s); return b && boxesIntersect(sel, b); })
        .map(s => s._id);
      setSelectedIds(hit);
      setMarquee(null);
      return;
    }

    if (!isSelectMode) onMouseUp(e);
  }, [isSelectMode, onMouseUp, marquee, strokes]);

  // ── group drag ────────────────────────────────────────────────
  const handleGroupDragMouseDown = useCallback((e) => {
    e.evt?.stopPropagation();
    const pos = getCanvasPos();
    if (!pos) return;

    const selectedBounds = getSelectedBounds();
    if (!isPointNearBounds(pos, selectedBounds, 24)) {
      setSelectedIds([]);
      lastGroupPos.current     = null;
      groupDragOrigins.current = {};
      return;
    }

    lastGroupPos.current = pos;
    const origins = {};
    selectedIds.forEach(id => {
      const s = strokes.find(s => s._id === id);
      if (s) origins[id] = getStrokeOrigin(s);
    });
    groupDragOrigins.current = origins;
  }, [getCanvasPos, getSelectedBounds, selectedIds, strokes]);

  const handleGroupDragMouseMove = useCallback(() => {
    if (!lastGroupPos.current) return;
    const pos = getCanvasPos();
    if (!pos) return;

    const dx = pos.x - lastGroupPos.current.x;
    const dy = pos.y - lastGroupPos.current.y;
    lastGroupPos.current = pos;
    if (dx === 0 && dy === 0) return;

    selectedIds.forEach(id => {
      const s = strokes.find(s => s._id === id);
      if (!s) return;
      const origin = groupDragOrigins.current[id];
      if (!origin) return;
      const pts = s.points;

      if (s.tool === 'pen') {
        groupDragOrigins.current[id] = { x: origin.x + dx, y: origin.y + dy };
        onUpdateStroke(id, constrainStrokeUpdate(s, {
          points: pts.map((v, i) => (i % 2 === 0 ? v + dx : v + dy)),
        }));
      } else if (s.tool === 'rect') {
        const nx = origin.x + dx;
        const ny = origin.y + dy;
        groupDragOrigins.current[id] = { x: nx, y: ny };
        onUpdateStroke(id, constrainStrokeUpdate(s, { offsetX: nx, offsetY: ny }));
      } else if (s.tool === 'circle') {
        const nx = origin.x + dx;
        const ny = origin.y + dy;
        groupDragOrigins.current[id] = { x: nx, y: ny };
        onUpdateStroke(id, constrainStrokeUpdate(s, { offsetX: nx, offsetY: ny }));
      } else {
        const nx = origin.x + dx;
        const ny = origin.y + dy;
        groupDragOrigins.current[id] = { x: nx, y: ny };
        onUpdateStroke(id, constrainStrokeUpdate(s, { offsetX: nx, offsetY: ny }));
      }
    });
  }, [selectedIds, strokes, onUpdateStroke, getCanvasPos, constrainStrokeUpdate]);

  const handleGroupDragMouseUp = useCallback(() => {
    lastGroupPos.current     = null;
    groupDragOrigins.current = {};
  }, []);

  // ── render ────────────────────────────────────────────────────
  const renderStroke = (stroke, keyPrefix = '') => {
    if (!stroke || stroke.isDeleted) return null;
    const id       = stroke._id ?? stroke.tempId;
    const key      = `${keyPrefix}${id}`;
    const selected = selectedIds.includes(stroke._id);
    const onSelect = (evt) => {
      if (!isSelectMode) return;
      const isToggle = !!(evt?.evt?.shiftKey || evt?.evt?.ctrlKey || evt?.evt?.metaKey);
      if (isToggle) {
        setSelectedIds(prev =>
          prev.includes(stroke._id)
            ? prev.filter(i => i !== stroke._id)
            : [...prev, stroke._id]
        );
        return;
      }
      setSelectedIds([stroke._id]);
    };
    const onChange = (changes) => onUpdateStroke(stroke._id, constrainStrokeUpdate(stroke, changes));
    const props = { stroke, isSelectMode, isSelected: selected, onSelect, onChange, stageSize };

    switch (stroke.tool) {
      case 'pen':    return <StrokePen    key={key} {...props} />;
      case 'line':   return <StrokeLine   key={key} {...props} />;
      case 'rect':   return <StrokeRect   key={key} {...props} />;
      case 'circle': return <StrokeCircle key={key} {...props} />;
      case 'arrow':  return <StrokeArrow  key={key} {...props} />;
      default:       return null;
    }
  };

  const isGroupDrag = isSelectMode && selectedIds.length > 1;
  const cursor      = isSelectMode ? 'default' : 'crosshair';

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full overflow-hidden relative"
      style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize:  '24px 24px',
        backgroundColor: '#f9fafb',
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.w}
        height={stageSize.h}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{ cursor }}
      >
        <Layer>
          {strokes.map(s => renderStroke(s, 's_'))}
        </Layer>

        <Layer listening={false}>
          {Object.entries(liveStrokes).map(([k, s]) =>
            renderStroke(s, `live_${k}_`)
          )}
        </Layer>

        {isGroupDrag && (
          <Layer>
            <Rect
              x={-99999} y={-99999}
              width={199999} height={199999}
              fill="transparent"
              listening
              onMouseDown={handleGroupDragMouseDown}
              onMouseMove={handleGroupDragMouseMove}
              onMouseUp={handleGroupDragMouseUp}
            />
          </Layer>
        )}

        {isSelectMode && marquee && marquee.w > 2 && (
          <Layer listening={false}>
            <Rect
              x={marquee.x}
              y={marquee.y}
              width={marquee.w}
              height={marquee.h}
              fill="rgba(99,102,241,0.08)"
              stroke="#6366f1"
              strokeWidth={1}
              dash={[4, 3]}
            />
          </Layer>
        )}
      </Stage>

      {/* Selection badge */}
      {isSelectMode && selectedIds.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20
                        bg-white border border-gray-200 rounded-full shadow-sm
                        px-4 py-1.5 flex items-center gap-3 text-sm select-none">
          <span className="text-gray-600 font-medium">
            {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => { selectedIds.forEach(id => onDeleteStroke(id)); setSelectedIds([]); }}
            className="text-red-500 hover:text-red-700 font-medium"
          >Delete</button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-gray-400 hover:text-gray-600"
          >Deselect</button>
        </div>
      )}
    </div>
  );
}
