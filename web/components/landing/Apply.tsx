import RoleLink from '@/components/RoleLink';

export default function Apply() {
  return (
    <section id="apply" style={{ background: '#F0E9DA', padding: '110px 0' }}>
      <div className="wrap apply-grid">
        <div>
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
            Become a provider
          </div>
          <h2
            className="serif"
            style={{
              fontSize: '42px',
              color: '#211F1C',
              lineHeight: '1.1',
              margin: '0 0 16px',
            }}
          >
            Ready to grow? <span style={{ fontStyle: 'italic', color: '#E8632F' }}>Join us.</span>
          </h2>
          <p
            style={{
              fontSize: '15.5px',
              color: '#6E6A63',
              lineHeight: '1.65',
              margin: '0 0 30px',
            }}
          >
            Join the waitlist today. When we launch you will set up your shop and get verified right inside
            the QuickGift app.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <details className="faq" open>
              <summary>Who can join?</summary>
              <p>
                Bakers, florists, nail techs, makeup artists, tailors, photographers, caterers, gift packers,
                or any gifting or personal-service business in Lagos or Abuja that does great work.
              </p>
            </details>
            <details className="faq">
              <summary>How much does it cost?</summary>
              <p>
                Joining is free. Founding providers pay 0% commission at launch, and you&apos;ll always see
                our fees clearly before you accept any order.
              </p>
            </details>
            <details className="faq">
              <summary>How do I get paid?</summary>
              <p>
                Customers pay through QuickGift when they place an order, so the money is secured before you
                start. Your earnings are paid out to your Nigerian bank account.
              </p>
            </details>
            <details className="faq">
              <summary>What happens after I join?</summary>
              <p>
                When onboarding opens we reach out, then you set up your shop and get verified right inside
                the app, for free.
              </p>
            </details>
          </div>
        </div>
        <div
          style={{
            background: '#fff',
            borderRadius: '28px',
            padding: '40px 34px',
            boxShadow: '0 30px 60px rgba(33,31,28,0.10)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#E7EFEC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1F4A45"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="6" y="2" width="12" height="20" rx="2.6" />
              <path d="M10.5 18h3" />
            </svg>
          </div>
          <h3 className="serif" style={{ fontSize: '26px', color: '#211F1C', margin: '0 0 10px' }}>
            Providers join in the app
          </h3>
          <p
            style={{
              fontSize: '15px',
              color: '#6E6A63',
              lineHeight: '1.6',
              margin: '0 0 26px',
            }}
          >
            No forms to fill. You set up your shop and manage every order right inside the QuickGift app. Join
            the waitlist with your email and we will tell you the moment founding-provider onboarding opens.
          </p>
          <RoleLink
            href="#waitlist"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              background: '#1F4A45',
              color: '#fff',
              padding: '17px 28px',
              borderRadius: '16px',
              fontSize: '15px',
              fontWeight: '700',
              boxShadow: '0 16px 32px rgba(31,74,69,0.24)',
              boxSizing: 'border-box',
            }}
            role="provider"
          >
            Join the waitlist
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </RoleLink>
          <p
            style={{
              margin: '16px 2px 0',
              fontSize: '12.5px',
              color: '#9A948A',
            }}
          >
            Already onboarded? Download the QuickGift app and sign in.
          </p>
        </div>
      </div>
    </section>
  );
}
