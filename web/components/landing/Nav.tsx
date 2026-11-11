export default function Nav() {
  return (
    <div className="wrap">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '26px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo.png"
            alt="QuickGift logo"
            style={{ width: '34px', height: '34px', objectFit: 'contain' }}
          />
          <span className="serif" style={{ fontSize: '22px', color: '#211F1C' }}>
            Quick
            <span style={{ color: '#E8632F', fontStyle: 'italic' }}>Gift</span>
          </span>
        </div>
        <nav className="nav-links">
          <a href="#features" style={{ color: '#4E4A42', fontSize: '14px', fontWeight: '600' }}>
            Features
          </a>
          <a href="#how" style={{ color: '#4E4A42', fontSize: '14px', fontWeight: '600' }}>
            How it Works
          </a>
          <a href="#providers" style={{ color: '#4E4A42', fontSize: '14px', fontWeight: '600' }}>
            For Providers
          </a>
          <a href="#moments" style={{ color: '#4E4A42', fontSize: '14px', fontWeight: '600' }}>
            Moments
          </a>
          <a
            href="#apply"
            className="nav-prov"
            style={{
              color: '#E8632F',
              fontSize: '14px',
              fontWeight: '800',
              border: '1.5px solid #F6C9A9',
              padding: '9px 16px',
              borderRadius: '100px',
            }}
          >
            Become a provider
          </a>
          <a
            href="#waitlist"
            className="nav-cta"
            style={{
              background: '#1F4A45',
              color: '#fff',
              padding: '11px 22px',
              borderRadius: '100px',
              fontSize: '13.5px',
              fontWeight: '700',
            }}
          >
            Join Waitlist
          </a>
        </nav>
      </div>
    </div>
  );
}
