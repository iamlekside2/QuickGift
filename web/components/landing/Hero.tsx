export default function Hero() {
  return (
    <section className="hero">
      <div style={{ animation: 'qg-rise 0.7s ease both' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#E7EFEC',
            border: '1px solid #CFE0DC',
            borderRadius: '100px',
            padding: '7px 14px',
            marginBottom: '28px',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#3E8E63',
            }}
          />
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#1F4A45' }}>
            Launching soon in Lagos &amp; Abuja
          </span>
        </div>
        <h1
          className="serif hero-title"
          style={{
            fontSize: '64px',
            lineHeight: '1.05',
            color: '#211F1C',
            margin: '0',
          }}
        >
          Send the perfect gift, <span style={{ fontStyle: 'italic', color: '#E8632F' }}>today.</span>
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: '#6E6A63',
            lineHeight: '1.65',
            maxWidth: '480px',
            margin: '26px 0 0',
          }}
        >
          Cakes, flowers, chocolates and gift hampers, delivered same-day. Plus verified artisans on demand:
          beauty, tailoring, photography, catering.
        </p>
        <a
          href="#waitlist"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '34px',
            background: '#1F4A45',
            color: '#fff',
            padding: '16px 30px',
            borderRadius: '16px',
            fontSize: '14.5px',
            fontWeight: '700',
            boxShadow: '0 16px 32px rgba(31,74,69,0.24)',
          }}
        >
          Join the waitlist
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <p
          style={{
            margin: '12px 2px 0',
            fontSize: '12.5px',
            color: '#6E6A63',
            maxWidth: '480px',
          }}
        >
          Be first to know when we launch. No spam.
        </p>
        <a
          href="#apply"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginTop: '36px',
            maxWidth: '480px',
            background: '#fff',
            border: '1px solid #EFE9DE',
            borderRadius: '20px',
            padding: '14px 18px',
            boxShadow: '0 10px 24px rgba(33,31,28,0.05)',
            color: '#211F1C',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: '#FBE4D7',
              flexShrink: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 10l1.5-5h13L20 10M4 10v9h16v-9M4 10c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3"
                stroke="#E8632F"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ flex: '1' }}>
            <div style={{ fontSize: '14px', fontWeight: '800' }}>Baker, florist, nail tech or stylist?</div>
            <div style={{ fontSize: '12.5px', color: '#6E6A63', marginTop: '2px' }}>
              Become a founding provider with free shop setup &amp; 0% commission at launch.
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="#E8632F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
      <div
        style={{
          position: 'relative',
          animation: 'qg-rise 0.8s ease both 0.1s',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '290px',
            margin: '0 auto',
            background: '#211F1C',
            borderRadius: '44px',
            padding: '12px',
            boxShadow: '0 40px 80px rgba(33,31,28,0.25)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '110px',
              height: '26px',
              background: '#211F1C',
              borderRadius: '0 0 16px 16px',
              zIndex: '5',
            }}
          />
          <div
            style={{
              background: '#FAF3E9',
              borderRadius: '34px',
              overflow: 'hidden',
              aspectRatio: '9/19.5',
            }}
          >
            {/* A real screenshot of the app's home screen (public/app-home.webp). */}
            <img
              src="/app-home.webp"
              alt="The QuickGift app home screen, with Send a Gift, Hire a Pro, Shop by Occasion and Book a Pro"
              width="399"
              height="863"
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top',
              }}
            />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '0',
            background: '#fff',
            borderRadius: '16px',
            padding: '10px 14px',
            boxShadow: '0 14px 30px rgba(33,31,28,0.14)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#E4F0E9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="#3E8E63"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#211F1C' }}>Delivered!</div>
            <div style={{ fontSize: '8px', color: '#9A948A' }}>2 hours ago</div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '0',
            background: '#fff',
            borderRadius: '16px',
            padding: '10px 14px',
            boxShadow: '0 14px 30px rgba(33,31,28,0.14)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#FBE4D7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M4 9h16M4 9v10h16V9M9 9v10" stroke="#E8632F" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#211F1C' }}>New Order</div>
            <div style={{ fontSize: '9px', color: '#E8632F', fontWeight: '700' }}>₦18,500</div>
          </div>
        </div>
      </div>
    </section>
  );
}
