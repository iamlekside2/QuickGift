import WaitlistForm from '@/components/WaitlistForm';

export default function WaitlistCta() {
  return (
    <div className="wrap">
      <section
        id="waitlist"
        className="dl-cta"
        style={{
          position: 'relative',
          overflow: 'hidden',
          margin: '60px auto',
          padding: '72px 56px',
          background: '#1F4A45',
          borderRadius: '40px',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-90px',
            right: '-70px',
            width: '340px',
            height: '340px',
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(232,99,47,0.30),transparent 70%)',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-120px',
            left: '-90px',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(124,224,174,0.16),transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: '1',
            maxWidth: '520px',
            margin: '0 auto',
          }}
        >
          <img
            src="/celebration.webp"
            alt=""
            width="112"
            height="112"
            style={{
              width: '112px',
              height: '112px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 22px',
              background: '#FAF3E9',
              borderRadius: '50%',
              padding: '10px',
              boxShadow: '0 16px 34px rgba(0,0,0,0.24)',
            }}
          />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '100px',
              padding: '7px 15px',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#7CE0AE',
                boxShadow: '0 0 0 4px rgba(124,224,174,0.22)',
              }}
            />
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#fff',
                letterSpacing: '0.3px',
              }}
            >
              Launching soon
            </span>
          </div>
          <h2
            className="serif"
            style={{
              fontSize: '44px',
              lineHeight: '1.05',
              color: '#fff',
              margin: '0 0 14px',
            }}
          >
            Be first in line
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.68)',
              margin: '0 auto 30px',
              maxWidth: '420px',
              lineHeight: '1.6',
            }}
          >
            Join the waitlist and we&apos;ll tell you the moment QuickGift goes live. Early members get first
            access and launch-day perks.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </div>
  );
}
