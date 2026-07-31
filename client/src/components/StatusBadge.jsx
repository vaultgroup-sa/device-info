export default function StatusBadge({ status }) {
  const isFull = status === 1;
  return (
    <span className={`status-pill ${isFull ? 'full' : 'empty'}`}>
      {isFull ? 'FULL' : 'EMPTY'}
    </span>
  );
}
