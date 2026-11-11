import RoleLink from '@/components/RoleLink';

export default function Providers() {
  return (
    <section id="providers" className="providers">
      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FBE4D7',
            borderRadius: '100px',
            padding: '7px 14px',
            marginBottom: '18px',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#E8632F',
            }}
          />
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: '800',
              color: '#C94F1F',
              letterSpacing: '0.5px',
            }}
          >
            For Providers · Now onboarding
          </span>
        </div>
        <h2
          className="serif"
          style={{
            fontSize: '44px',
            color: '#211F1C',
            lineHeight: '1.1',
            margin: '0 0 18px',
          }}
        >
          Your craft, booked.{' '}
          <span style={{ fontStyle: 'italic', color: '#E8632F' }}>Your money, upfront.</span>
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: '#6E6A63',
            lineHeight: '1.65',
            margin: '0 0 22px',
          }}
        >
          QuickGift puts you in front of people across Lagos &amp; Abuja who are already shopping for a gift,
          so you spend less time chasing DMs and more time doing what you love.
        </p>
        <div className="chips" style={{ marginBottom: '30px' }}>
          <span className="chip">Bakers</span>
          <span className="chip">Florists</span>
          <span className="chip">Nail techs</span>
          <span className="chip">Makeup artists</span>
          <span className="chip">Tailors</span>
          <span className="chip">Photographers</span>
          <span className="chip">Caterers</span>
          <span className="chip">Gift packers</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#FBE4D7',
                flexShrink: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 4h16v12H5.2L4 17.2V4z"
                  stroke="#E8632F"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M8 9h8M8 12h5" stroke="#E8632F" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: '700',
                  color: '#211F1C',
                }}
              >
                Orders come to you
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#6E6A63',
                  marginTop: '2px',
                  lineHeight: '1.55',
                }}
              >
                Customers find you by occasion, budget and location. Accept the jobs you want.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#E4F0E9',
                flexShrink: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="6" width="18" height="13" rx="2" stroke="#3E8E63" strokeWidth="1.8" />
                <path d="M3 10h18M7 15h4" stroke="#3E8E63" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: '700',
                  color: '#211F1C',
                }}
              >
                Get paid upfront
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#6E6A63',
                  marginTop: '2px',
                  lineHeight: '1.55',
                }}
              >
                Customers pay when they order. No more &quot;I&apos;ll send it later&quot;. Earnings go
                straight to your bank account.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#E7EEF6',
                flexShrink: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z"
                  stroke="#4C7CB0"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.5 12l2.5 2.5 4.5-5"
                  stroke="#4C7CB0"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: '700',
                  color: '#211F1C',
                }}
              >
                A verified badge customers trust
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#6E6A63',
                  marginTop: '2px',
                  lineHeight: '1.55',
                }}
              >
                Every review you earn builds the reputation that wins your next order.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#EFE9F6',
                flexShrink: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 19V5M4 19h16" stroke="#7A5FA8" strokeWidth="1.8" strokeLinecap="round" />
                <path
                  d="M8 15l3.5-4 3 2.5L19 8"
                  stroke="#7A5FA8"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: '700',
                  color: '#211F1C',
                }}
              >
                Run it all from your phone
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#6E6A63',
                  marginTop: '2px',
                  lineHeight: '1.55',
                }}
              >
                Orders, prices, delivery areas, busy days and earnings, all in one dashboard.
              </div>
            </div>
          </div>
        </div>
        <RoleLink
          href="#apply"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: '#E8632F',
            color: '#fff',
            padding: '15px 26px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '700',
            marginTop: '34px',
            boxShadow: '0 16px 32px rgba(232,99,47,0.24)',
          }}
          role="provider"
        >
          Join as a founding provider
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </RoleLink>
      </div>
      <div
        style={{
          background: '#fff',
          borderRadius: '28px',
          padding: '32px',
          boxShadow: '0 30px 60px rgba(33,31,28,0.10)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <div
            className="serif"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: '#1F4A45',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            Q
          </div>
          <div style={{ flex: '1' }}>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: '700',
                color: '#211F1C',
              }}
            >
              Tolu&apos;s Cakes
            </div>
            <div style={{ fontSize: '11.5px', color: '#9A948A' }}>Provider dashboard · preview</div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#E7EEF6',
              color: '#4C7CB0',
              borderRadius: '100px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: '800',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 13l4 4L19 7"
                stroke="#4C7CB0"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Verified
          </div>
        </div>
        <div
          style={{
            background: '#FAF3E9',
            border: '1.5px solid #F6C9A9',
            borderRadius: '18px',
            padding: '18px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: '#C94F1F',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              New order · 2m ago
            </div>
            <div style={{ fontSize: '11px', color: '#9A948A' }}>Lekki Phase 1</div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '12px',
              marginTop: '10px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#211F1C',
                }}
              >
                Red Velvet Cake, 8&quot;
              </div>
              <div style={{ fontSize: '12px', color: '#6E6A63', marginTop: '3px' }}>
                &quot;Happy 30th, Ada!&quot; · Sat, 2-4pm
              </div>
            </div>
            <div className="serif" style={{ fontSize: '24px', color: '#211F1C' }}>
              ₦15,000
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <div
              style={{
                flex: '1',
                textAlign: 'center',
                background: '#1F4A45',
                color: '#fff',
                borderRadius: '12px',
                padding: '11px',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              Accept
            </div>
            <div
              style={{
                flex: '1',
                textAlign: 'center',
                background: '#fff',
                border: '1px solid #EAE3D8',
                color: '#211F1C',
                borderRadius: '12px',
                padding: '11px',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              Decline
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              background: '#FBE4D7',
              borderRadius: '14px',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#C94F1F' }}>3</div>
            <div style={{ fontSize: '10px', color: '#8A5A45', marginTop: '2px' }}>Orders today</div>
          </div>
          <div
            style={{
              background: '#E7EFEC',
              borderRadius: '14px',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1F4A45' }}>4.9</div>
            <div style={{ fontSize: '10px', color: '#4E6864', marginTop: '2px' }}>Rating</div>
          </div>
          <div
            style={{
              background: '#E4F0E9',
              borderRadius: '14px',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#3E8E63' }}>Paid</div>
            <div style={{ fontSize: '10px', color: '#4E6864', marginTop: '2px' }}>Upfront</div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#E4F0E9',
            borderRadius: '14px',
            padding: '12px',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '10px',
              background: '#C9E3D3',
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
          <div style={{ flex: '1' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#211F1C' }}>Payment received</div>
            <div style={{ fontSize: '10.5px', color: '#6E6A63' }}>Chocolate Box · ₦9,800</div>
          </div>
          <div style={{ fontSize: '10px', color: '#9A948A' }}>1h ago</div>
        </div>
        <div
          style={{
            fontSize: '11px',
            color: '#9A948A',
            textAlign: 'center',
            marginTop: '14px',
          }}
        >
          Sample data, a preview of the provider app
        </div>
      </div>
    </section>
  );
}
