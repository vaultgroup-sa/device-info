// Small icon-only delete button, reused on the Dashboard cards, the List
// rows, and the Detail page. Ghost style by default (no border, blends in
// until hovered) so it doesn't compete with the status pill next to it;
// pass `bordered` for contexts where it should look like a normal button
// (e.g. next to "Fetch latest" on the Detail page).
export default function TrashButton({ onClick, title = 'Delete device', style, bordered = false }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="trash-btn"
      style={{
        width: 32,
        height: 32,
        borderRadius: bordered ? 10 : '50%',
        border: bordered ? '1px solid var(--border)' : 'none',
        background: bordered ? '#fff' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        ...style,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    </button>
  );
}
