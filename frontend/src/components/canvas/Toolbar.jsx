import {
  ArrowUpRight,
  Circle,
  MousePointer2,
  PencilLine,
  RectangleHorizontal,
  Slash,
  RotateCcw,
  Trash2,
} from 'lucide-react';

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select', key: '1' },
  { id: 'pen', icon: PencilLine, label: 'Pen', key: '2' },
  { id: 'line', icon: Slash, label: 'Line', key: '3' },
  { id: 'rect', icon: RectangleHorizontal, label: 'Rectangle', key: '4' },
  { id: 'circle', icon: Circle, label: 'Circle', key: '5' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow', key: '6' },
];

const COLORS = [
  '#2c2c2a', '#534AB7', '#0F6E56',
  '#993C1D', '#185FA5', '#BA7517',
  '#A32D2D', '#3B6D11',
];

const WIDTHS = [2, 4, 8, 14];

export default function Toolbar({
  tool, setTool,
  color, setColor,
  width, setWidth,
  opacity, setOpacity,
  onUndo, onClear,
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-3 px-2
                    bg-white border-r border-gray-200 h-full overflow-y-auto overflow-x-hidden box-border px-1.5 min-w-0">

      {/* Tools */}
      <div className="flex flex-col gap-1">
        {TOOLS.map(t => (
          <button
            key={t.id}
            title={`${t.label} (${t.key})`}
            onClick={() => setTool(t.id)}
            className={`w-9 h-9 rounded-lg text-base flex flex-col items-center
                justify-center transition-colors relative
                ${tool === t.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <t.icon className="w-4 h-4" strokeWidth={2} />
            <span className="text-gray-300 leading-none mt-0.5"
              style={{ fontSize: '9px' }}>
              {t.key}
            </span>
          </button>
        ))}
      </div>

      <div className="w-7 h-px bg-gray-200" />

      {/* Colors */}
      <div className="flex flex-col gap-1.5">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              borderColor: color === c ? '#1e1b4b' : 'transparent',
            }}
          />
        ))}
      </div>

      <div className="w-7 h-px bg-gray-200" />

      {/* Brush widths */}
      <div className="flex flex-col gap-2 items-center">
        {WIDTHS.map(w => (
          <button
            key={w}
            onClick={() => setWidth(w)}
            className={`rounded-full bg-gray-800 transition-all
                        ${width === w ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
            style={{ width: w + 8, height: w + 8 }}
          />
        ))}
      </div>

      <div className="w-7 h-px bg-gray-200" />

      {/* Opacity */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-400">opacity</span>
        <input
          type="range"
          min={0.1} max={1} step={0.1}
          value={opacity}
          onChange={e => setOpacity(parseFloat(e.target.value))}
          className="w-16 accent-indigo-600"
          style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 60 }}
        />
        <span className="text-xs text-gray-400">{Math.round(opacity * 100)}%</span>
      </div>

      <div className="w-7 h-px bg-gray-200" />

      {/* Actions */}
      <button
        title="Undo (Ctrl+Z)"
        onClick={onUndo}
        className="w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100
             flex flex-col items-center justify-center"
      >
        <RotateCcw className="w-4 h-4" strokeWidth={2} />
        <span className="text-gray-300 leading-none mt-0.5"
          style={{ fontSize: '9px' }}>
          ⌃Z
        </span>
      </button>
      <button
        title="Clear canvas"
        onClick={onClear}
        className="w-9 h-9 rounded-lg text-red-400 hover:bg-red-50
             flex flex-col items-center justify-center"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2} />
        <span className="text-gray-300 leading-none mt-0.5"
          style={{ fontSize: '9px' }}>
          del
        </span>
      </button>

    </div>
  );
}