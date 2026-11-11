export default function HowItWorks() {
  return (
    <section id="how" style={{ background: '#F0E9DA', padding: '110px 0' }}>
      <div className="wrap">
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto 64px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: '800',
              color: '#1F4A45',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            How it Works
          </div>
          <h2 className="serif" style={{ fontSize: '40px', color: '#211F1C', margin: '0' }}>
            Three simple steps
          </h2>
          <p style={{ fontSize: '15.5px', color: '#6E6A63', marginTop: '16px' }}>
            From browsing to delivery in under four hours.
          </p>
        </div>
        <div className="steps">
          <div style={{ textAlign: 'center' }}>
            <div
              className="serif"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: '#fff',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#E8632F',
                boxShadow: '0 10px 24px rgba(33,31,28,0.08)',
              }}
            >
              1
            </div>
            <div
              style={{
                fontSize: '16.5px',
                fontWeight: '800',
                color: '#211F1C',
              }}
            >
              Browse &amp; Choose
            </div>
            <div
              style={{
                fontSize: '13.5px',
                color: '#6E6A63',
                lineHeight: '1.6',
                marginTop: '8px',
                maxWidth: '260px',
                margin: '8px auto 0',
              }}
            >
              Explore curated gifts or artisan services, filtered by occasion or budget.
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              className="serif"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: '#fff',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#1F4A45',
                boxShadow: '0 10px 24px rgba(33,31,28,0.08)',
              }}
            >
              2
            </div>
            <div
              style={{
                fontSize: '16.5px',
                fontWeight: '800',
                color: '#211F1C',
              }}
            >
              Personalize It
            </div>
            <div
              style={{
                fontSize: '13.5px',
                color: '#6E6A63',
                lineHeight: '1.6',
                marginTop: '8px',
                maxWidth: '260px',
                margin: '8px auto 0',
              }}
            >
              Add a message, choose wrapping, and schedule delivery for the right moment.
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              className="serif"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: '#fff',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#3E8E63',
                boxShadow: '0 10px 24px rgba(33,31,28,0.08)',
              }}
            >
              3
            </div>
            <div
              style={{
                fontSize: '16.5px',
                fontWeight: '800',
                color: '#211F1C',
              }}
            >
              Watch Them Smile
            </div>
            <div
              style={{
                fontSize: '13.5px',
                color: '#6E6A63',
                lineHeight: '1.6',
                marginTop: '8px',
                maxWidth: '260px',
                margin: '8px auto 0',
              }}
            >
              Track delivery in real time and get notified the moment it arrives.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
