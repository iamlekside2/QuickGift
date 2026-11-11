export default function Footer() {
  return (
    <footer
      className="wrap"
      style={{
        padding: '40px 24px 60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid #EFE9DE',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img
          src="/logo.png"
          alt="QuickGift logo"
          style={{ width: '26px', height: '26px', objectFit: 'contain' }}
        />
        <span className="serif" style={{ fontSize: '17px', color: '#211F1C' }}>
          QuickGift
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          gap: '22px',
          flexWrap: 'wrap',
          fontSize: '13px',
          fontWeight: '600',
        }}
      >
        <a href="#features" style={{ color: '#6E6A63' }}>
          Features
        </a>
        <a href="#how" style={{ color: '#6E6A63' }}>
          How it Works
        </a>
        <a href="#apply" style={{ color: '#E8632F' }}>
          Become a provider
        </a>
        <a href="#waitlist" style={{ color: '#6E6A63' }}>
          Join Waitlist
        </a>
      </div>
      <div style={{ fontSize: '12.5px', color: '#9A948A' }}>© 2026 QuickGift. Lagos, Nigeria.</div>
    </footer>
  );
}
