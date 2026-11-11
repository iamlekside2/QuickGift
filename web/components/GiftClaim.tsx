'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, serverMessage } from '@/lib/api';
import LinkPageShell from './LinkPageShell';
import styles from './link-page.module.css';

interface Gift {
  state: 'waiting' | 'confirmed' | 'unavailable';
  recipient_name: string | null;
  sender_name: string | null;
  message: string | null;
  scheduled_date: string | null;
}

type View =
  | { kind: 'loading' }
  | { kind: 'gift'; gift: Gift }
  | { kind: 'problem'; title: 'invalid' | 'unavailable' | 'failed'; lead: string; canRetry: boolean };

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const INVALID_LEAD = 'Please open the full link you were sent, or ask the sender to share it again.';

/** "14 November" from YYYY-MM-DD, read from the text so no time zone can move it. */
function dayText(day: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day || '');
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}` : '';
}

function Note({ gift }: { gift: Gift }) {
  if (!gift.message) return null;
  return (
    <div className={styles.note}>
      <span className={styles.noteLabel}>
        {gift.sender_name ? `A note from ${gift.sender_name}` : 'A note for you'}
      </span>
      <p className={styles.noteText}>{gift.message}</p>
    </div>
  );
}

const PROBLEM_TITLES = {
  invalid: (
    <>
      This gift link is not <em>valid</em>
    </>
  ),
  unavailable: (
    <>
      This gift link is not <em>available</em>
    </>
  ),
  failed: (
    <>
      We could not open your <em>gift</em>
    </>
  ),
};

/**
 * The page a gift's recipient opens from the link the buyer shared. They say
 * where to deliver, once. It never shows what the gift is or what it cost.
 */
export default function GiftClaim() {
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (t: string) => {
    setView({ kind: 'loading' });
    if (t.length < 20) {
      setView({ kind: 'problem', title: 'invalid', lead: INVALID_LEAD, canRetry: false });
      return;
    }
    try {
      const r = await api<Gift>('GET', `/gifts/claim/${encodeURIComponent(t)}`);
      if (r.status === 200) {
        if (r.data.state === 'unavailable') {
          setView({
            kind: 'problem',
            title: 'unavailable',
            lead: 'The gift may have been cancelled, or it is not ready yet. Please check with the person who sent you the link.',
            canRetry: false,
          });
        } else {
          setView({ kind: 'gift', gift: r.data });
        }
      } else if (r.status === 404) {
        setView({ kind: 'problem', title: 'invalid', lead: INVALID_LEAD, canRetry: false });
      } else {
        setView({
          kind: 'problem',
          title: 'failed',
          lead:
            r.status === 429
              ? 'Too many attempts. Please wait a few minutes and try again.'
              : 'Something went wrong on our side. Please try again in a moment.',
          canRetry: true,
        });
      }
    } catch {
      setView({
        kind: 'problem',
        title: 'failed',
        lead: 'Please check your internet connection and try again.',
        canRetry: true,
      });
    }
  }, []);

  // The token is in the address (?t=...). It is read in the browser because
  // the page itself is a static file.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('t') || '';
    setToken(t);
    load(t);
  }, [load]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving || token === null) return;
    setError('');
    if (address.trim().length < 8) {
      setError('Please enter the full delivery address, with the street and area.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a phone number the rider can call.');
      return;
    }
    setSaving(true);
    try {
      const r = await api('POST', `/gifts/claim/${encodeURIComponent(token)}`, {
        address: address.trim(),
        city: city.trim(),
        phone: phone.trim(),
      });
      if (r.status === 200) {
        await load(token);
      } else {
        setError(serverMessage(r.data, 'We could not save your address. Please try again.'));
      }
    } catch {
      setError('Please check your internet connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  let content;
  if (view.kind === 'loading') {
    content = <div className={styles.spinner} role="status" aria-label="Loading" />;
  } else if (view.kind === 'problem') {
    content = (
      <>
        <div className={styles.badge} aria-hidden="true">
          🎀
        </div>
        <h1 className={styles.title}>{PROBLEM_TITLES[view.title]}</h1>
        <p className={styles.lead}>{view.lead}</p>
        {view.canRetry && token !== null ? (
          <button type="button" className={styles.ghost} onClick={() => load(token)}>
            Try again
          </button>
        ) : null}
      </>
    );
  } else if (view.gift.state === 'confirmed') {
    content = (
      <>
        <div className={`${styles.badge} ${styles.badgeOk}`} aria-hidden="true">
          ✓
        </div>
        <h1 className={styles.title}>
          Address <em>confirmed</em>
        </h1>
        <p className={styles.lead}>Thank you. Your gift is being prepared and will be on its way to you.</p>
        <Note gift={view.gift} />
        <p className={styles.hint}>You can close this page. The rider will call you before delivery.</p>
      </>
    );
  } else {
    const gift = view.gift;
    const who = gift.recipient_name ? gift.recipient_name.split(/\s+/)[0] : '';
    const when = dayText(gift.scheduled_date);
    content = (
      <>
        <div className={styles.badge} aria-hidden="true">
          🎁
        </div>
        <h1 className={styles.title}>
          You have a <em>gift</em>!
        </h1>
        <p className={styles.lead}>
          {who ? `Hi ${who}. ` : ''}
          {gift.sender_name ? `${gift.sender_name} has sent you a gift` : 'Someone has sent you a gift'}
          {when ? `, planned for ${when}` : ''}. Tell us where to deliver it and we will take care of the
          rest.
        </p>
        <Note gift={gift} />
        <form onSubmit={handleSubmit} noValidate>
          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Delivery address</span>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={300}
              autoComplete="street-address"
              placeholder="House number, street and area"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              City <span className={styles.optional}>(optional)</span>
            </span>
            <input
              className={styles.input}
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={60}
              autoComplete="address-level2"
              placeholder="e.g. Lagos"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Phone number</span>
            <input
              className={styles.input}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              autoComplete="tel"
              placeholder="e.g. 0801 234 5678"
              required
            />
          </label>
          <button type="submit" className={styles.button} disabled={saving}>
            {saving ? 'Confirming...' : 'Confirm delivery address'}
          </button>
          <p className={styles.hint}>
            We only use these details to deliver this gift. The rider will call the number you give.
          </p>
        </form>
      </>
    );
  }

  return (
    <LinkPageShell
      footer={
        <>
          Sent with <a href="/">QuickGift</a>. Send gifts and book trusted services across Nigeria.
        </>
      }
    >
      {content}
    </LinkPageShell>
  );
}
