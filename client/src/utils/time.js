// Locale-aware relative time formatting: "just now", "3 min ago", "5 days
// ago" ... and falls back to an absolute date once something is more than
// 30 days old, per spec.

export function formatRelative(ts, now = Date.now()) {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);

  if (min < 1) return 'just now';
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`;
  return formatAbsolute(ts);
}

export function formatAbsolute(ts) {
  const d = new Date(ts);
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  );
}

// Detail/history page: after 30 days, show the actual timestamp instead of
// a relative string, per spec -- even the "primary" label, not just a title.
export function formatHistoryLabel(ts, now = Date.now()) {
  const day = Math.floor(Math.max(0, now - ts) / 86400000);
  return day >= 30 ? formatAbsolute(ts) : formatRelative(ts, now);
}
