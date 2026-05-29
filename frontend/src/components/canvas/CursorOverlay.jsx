export default function CursorOverlay({ cursors }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Object.values(cursors).map(cursor => (
        <div
          key={cursor.userId}
          className="absolute flex flex-col items-start gap-0.5 transition-all duration-75"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M0 0L0 11L3.5 8L6 13L8 12L5.5 7L9 7Z"
              fill={cursor.displayColor}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          <span
            className="text-white text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: cursor.displayColor }}
          >
            {cursor.username}
          </span>
        </div>
      ))}
    </div>
  );
}