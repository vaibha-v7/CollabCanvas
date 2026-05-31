export default function Logo({ className = 'h-5 w-5', title = 'CollabCanvas' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{title}</title>
      <path d="M30 12h-8a12 12 0 0 0 0 24h8" />
      <path d="M26 18h-6a6 6 0 0 0 0 12h6" />
    </svg>
  );
}