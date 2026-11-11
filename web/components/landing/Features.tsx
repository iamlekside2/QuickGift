export default function Features() {
  return (
    <section id="features" className="wrap" style={{ padding: '110px 24px' }}>
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto 64px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: '800',
            color: '#E8632F',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          Features
        </div>
        <h2
          className="serif"
          style={{
            fontSize: '44px',
            color: '#211F1C',
            lineHeight: '1.15',
            margin: '0',
          }}
        >
          Everything you need to make someone&apos;s day
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: '#6E6A63',
            lineHeight: '1.6',
            marginTop: '18px',
          }}
        >
          From curated gift boxes to on-demand beauty services, we handle the logistics so you can focus on
          the moment.
        </p>
      </div>
      <div className="bento-top">
        <div
          style={{
            background: '#211F1C',
            borderRadius: '28px',
            padding: '44px',
            color: '#fff',
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'rgba(232,99,47,0.12)',
            }}
          />
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '22px',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                  stroke="#E8632F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="serif" style={{ fontSize: '26px' }}>
              Same-Day Delivery
            </div>
            <div
              style={{
                fontSize: '14.5px',
                color: '#B5AFA2',
                lineHeight: '1.6',
                marginTop: '10px',
                maxWidth: '400px',
              }}
            >
              Order before 2pm and we&apos;ll deliver the same day across Lagos and Abuja, with real-time
              tracking included.
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              position: 'relative',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '100px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: '600',
              }}
            >
              2-4 hour delivery
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '100px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: '600',
              }}
            >
              Live GPS tracking
            </div>
          </div>
        </div>
        <div
          style={{
            background: '#FBE4D7',
            borderRadius: '28px',
            padding: '36px',
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <img src="/add-to-cart.webp" alt="" className="gift-art" width="150" height="150" loading="lazy" />
          <div
            className="serif"
            style={{
              width: '48px',
              height: '48px',
              background: '#F6C9A9',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '22px',
              fontSize: '20px',
              color: '#C94F1F',
            }}
          >
            G
          </div>
          <div style={{ fontSize: '19px', fontWeight: '800', color: '#211F1C' }}>200+ Gifts</div>
          <div
            style={{
              fontSize: '13.5px',
              color: '#7A5A45',
              lineHeight: '1.6',
              marginTop: '8px',
              flex: '1',
              maxWidth: '60%',
            }}
          >
            Cakes, flowers, chocolates and hampers curated for every budget and occasion.
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#C94F1F' }}>From ₦5,000</div>
        </div>
      </div>
      <div className="bento-bottom">
        <div
          style={{
            background: '#E7EFEC',
            borderRadius: '28px',
            padding: '32px',
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className="serif"
            style={{
              width: '44px',
              height: '44px',
              background: '#CFE0DC',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              fontSize: '18px',
              color: '#1F4A45',
            }}
          >
            B
          </div>
          <div style={{ fontSize: '17px', fontWeight: '800', color: '#211F1C' }}>Artisans On-Demand</div>
          <div
            style={{
              fontSize: '13px',
              color: '#4E6864',
              lineHeight: '1.6',
              marginTop: '8px',
              flex: '1',
            }}
          >
            Nail techs, stylists, tailors, photographers, caterers: verified pros who come to you.
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#1F4A45' }}>Book a pro →</div>
        </div>
        <div
          style={{
            background: '#fff',
            border: '1px solid #EFE9DE',
            borderRadius: '28px',
            padding: '32px',
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              background: '#F5F0E7',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="13" rx="2" stroke="#211F1C" strokeWidth="1.5" />
              <path d="M3 10h18" stroke="#211F1C" strokeWidth="1.5" />
            </svg>
          </div>
          <div style={{ fontSize: '17px', fontWeight: '800', color: '#211F1C' }}>Digital Gift Cards</div>
          <div
            style={{
              fontSize: '13px',
              color: '#6E6A63',
              lineHeight: '1.6',
              marginTop: '8px',
            }}
          >
            Can&apos;t decide? Send a QuickGift card and let them choose.
          </div>
        </div>
        <div
          style={{
            background: '#211F1C',
            borderRadius: '28px',
            padding: '32px',
            minHeight: '220px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s7-6.5 7-11.5A7 7 0 105 9.5C5 14.5 12 21 12 21z"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <div style={{ fontSize: '17px', fontWeight: '800' }}>Live Tracking</div>
          <div
            style={{
              fontSize: '13px',
              color: '#B5AFA2',
              lineHeight: '1.6',
              marginTop: '8px',
              flex: '1',
            }}
          >
            Watch your gift travel to their door and get notified the moment it arrives.
          </div>
        </div>
      </div>
    </section>
  );
}
