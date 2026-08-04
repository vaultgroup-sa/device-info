export default function Footer() {
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '18px 56px',
        borderTop: '1px solid var(--border)',
        marginTop: 40,
      }}
    >
      <img
        src="/vaultgroup-mark.png"
        alt="Vaultgroup"
        style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover' }}
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
        Powered by Vaultgroup
      </span>
    </footer>
  );
}
