'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, naira, serverMessage } from '@/lib/api';
import LinkPageShell from './LinkPageShell';
import styles from './link-page.module.css';

interface Pool {
  code: string;
  title: string;
  recipient_name: string | null;
  organiser_name: string | null;
  message: string | null;
  target: number;
  raised: number;
  remaining: number;
  status: 'open' | 'funding' | 'funded' | 'expired' | 'cancelled';
  deadline: string;
  min_contribution: number;
  contributors: string[];
}

interface VerifyResult {
  status: 'success' | 'pending' | 'failed';
  refunded: boolean;
  pool: Pool;
}

type View =
  | { kind: 'loading'; confirming: boolean }
  | { kind: 'pool' }
  | { kind: 'problem'; title: 'invalid' | 'failed' | 'payment'; lead: string; retry: (() => void) | null };

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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_LEAD = 'Please open the full link you were sent, or ask the organiser to share it again.';

/** Nigeria is UTC+1 all year: show the closing day on the Lagos calendar. */
function closingDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const lagos = new Date(d.getTime() + 60 * 60 * 1000);
  return `${lagos.getUTCDate()} ${MONTHS[lagos.getUTCMonth()]}`;
}

const PROBLEM_TITLES = {
  invalid: (
    <>
      This link is not <em>valid</em>
    </>
  ),
  failed: (
    <>
      We could not open this <em>gift</em>
    </>
  ),
  payment: (
    <>
      We could not confirm your <em>payment</em>
    </>
  ),
};

/**
 * The page friends open to chip in for a group gift. They pay by card with no
 * account. Coming back from the card page, the payment is confirmed with the
 * server before anything is shown as added.
 */
export default function GroupGift() {
  const [code, setCode] = useState('');
  const [view, setView] = useState<View>({ kind: 'loading', confirming: false });
  const [pool, setPool] = useState<Pool | null>(null);
  const [thanks, setThanks] = useState('');
  const [pendingRef, setPendingRef] = useState('');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const path = (c: string, rest = '') => `/pools/public/${encodeURIComponent(c)}${rest}`;

  const load = useCallback(async (c: string) => {
    setView({ kind: 'loading', confirming: false });
    if (c.length !== 8) {
      setView({ kind: 'problem', title: 'invalid', lead: INVALID_LEAD, retry: null });
      return;
    }
    try {
      const r = await api<Pool>('GET', path(c));
      if (r.status === 200) {
        setPool(r.data);
        setView({ kind: 'pool' });
      } else if (r.status === 404) {
        setView({ kind: 'problem', title: 'invalid', lead: INVALID_LEAD, retry: null });
      } else {
        setView({
          kind: 'problem',
          title: 'failed',
          lead:
            r.status === 429
              ? 'Too many attempts. Please wait a few minutes and try again.'
              : 'Something went wrong on our side. Please try again in a moment.',
          retry: () => load(c),
        });
      }
    } catch {
      setView({
        kind: 'problem',
        title: 'failed',
        lead: 'Please check your internet connection and try again.',
        retry: () => load(c),
      });
    }
  }, []);

  // Back from the card page (or a retry): ask the server whether it went through.
  const confirmPayment = useCallback(
    async (c: string, reference: string) => {
      setView({ kind: 'loading', confirming: true });
      try {
        const r = await api<VerifyResult>('POST', path(c, '/verify'), { reference });
        // Drop the payment reference from the address so a refresh does not repeat this.
        window.history.replaceState(null, '', `${window.location.pathname}?c=${c}`);
        if (r.status !== 200) {
          await load(c);
          return;
        }
        const d = r.data;
        setPool(d.pool);
        setPendingRef('');
        setError('');
        if (d.status === 'success') {
          setThanks(
            d.refunded
              ? 'Thank you. This gift had already closed or reached its target, so your payment is being returned to your card.'
              : 'Thank you! Your contribution has been added.',
          );
        } else if (d.status === 'pending') {
          setThanks('We have not received confirmation of your payment yet. This can take a minute.');
          setPendingRef(reference);
        } else {
          setThanks('');
          setError('Your payment did not go through and you have not been charged. Please try again.');
        }
        setView({ kind: 'pool' });
      } catch {
        setView({
          kind: 'problem',
          title: 'payment',
          lead: 'Please check your internet connection and try again.',
          retry: () => confirmPayment(c, reference),
        });
      }
    },
    [load],
  );

  // The code (and, after paying, the payment reference) are in the address.
  // They are read in the browser because the page itself is a static file.
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const c = (qs.get('c') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const reference = qs.get('reference') || qs.get('trxref') || '';
    setCode(c);
    if (reference && c.length === 8) confirmPayment(c, reference);
    else load(c);
  }, [load, confirmPayment]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy || !pool) return;
    setError('');
    const value = Number(amount);
    if (!value) return setError('Please choose or type an amount.');
    if (value < pool.min_contribution) {
      return setError(`The smallest contribution is ${naira(pool.min_contribution)}.`);
    }
    if (value > pool.remaining) {
      return setError(`Only ${naira(pool.remaining)} is left to raise. Please enter that or less.`);
    }
    if (name.trim().length < 2) return setError('Please enter your name.');
    if (!EMAIL_RE.test(email.trim())) {
      return setError('Please enter a valid email address. Your receipt goes there.');
    }

    setBusy(true);
    try {
      const r = await api<{ reference: string; authorization_url: string | null }>(
        'POST',
        path(code, '/contribute'),
        {
          name: name.trim(),
          email: email.trim(),
          amount: value,
        },
      );
      if (r.status !== 200) {
        setError(serverMessage(r.data, 'We could not start your payment. Please try again.'));
        // The pool may have filled or closed since the page was opened.
        if (r.status === 400) {
          const fresh = await api<Pool>('GET', path(code));
          if (fresh.status === 200) setPool(fresh.data);
        }
        return;
      }
      if (r.data.authorization_url) {
        window.location.href = r.data.authorization_url; // card page; it sends the payer back here
        return;
      }
      await confirmPayment(code, r.data.reference); // local development: no card page
    } catch {
      setError('Please check your internet connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  let content;
  if (view.kind === 'loading') {
    content = (
      <>
        <div className={styles.spinner} role="status" aria-label="Loading" />
        {view.confirming ? <p className={styles.lead}>Confirming your payment...</p> : null}
      </>
    );
  } else if (view.kind === 'problem' || !pool) {
    const p = view.kind === 'problem' ? view : null;
    content = (
      <>
        <div className={styles.badge} aria-hidden="true">
          🎀
        </div>
        <h1 className={styles.title}>{PROBLEM_TITLES[p?.title ?? 'failed']}</h1>
        <p className={styles.lead}>{p?.lead}</p>
        {p?.retry ? (
          <button type="button" className={styles.ghost} onClick={p.retry}>
            Try again
          </button>
        ) : null}
      </>
    );
  } else {
    const open = pool.status === 'open';
    const funded = pool.status === 'funded' || pool.status === 'funding';
    const pct = pool.target > 0 ? Math.min(100, Math.round((pool.raised / pool.target) * 100)) : 0;
    const day = closingDay(pool.deadline);
    const picks = [1000, 2000, 5000].filter((v) => v < pool.remaining && v >= pool.min_contribution);
    picks.push(pool.remaining);

    content = (
      <>
        <div className={`${styles.badge} ${funded ? styles.badgeOk : ''}`} aria-hidden="true">
          {funded ? '🎉' : '🎁'}
        </div>
        <h1 className={styles.title}>{pool.title || 'A group gift'}</h1>
        <p className={styles.lead}>
          {funded
            ? 'This gift is fully paid for. Thank you to everyone who chipped in.'
            : open
              ? `${pool.organiser_name ? `${pool.organiser_name} is` : 'Friends are'} putting money together for this gift. Add whatever you can.`
              : 'This group gift has closed. Anyone who chipped in has been refunded to their card.'}
        </p>
        {thanks ? (
          <div className={styles.thanks} role="status">
            {thanks}
          </div>
        ) : null}
        {pool.message ? (
          <div className={styles.note}>
            <p className={styles.noteText}>{pool.message}</p>
          </div>
        ) : null}

        <div className={styles.progress}>
          <div
            className={styles.bar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div className={styles.barFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.numbers}>
            <span>
              <span className={styles.raised}>{naira(pool.raised)}</span> raised
            </span>
            <span>of {naira(pool.target)}</span>
          </div>
          <div className={styles.meta}>
            {open
              ? `${naira(pool.remaining)} to go${day ? `. Closes on ${day}.` : '.'}`
              : funded
                ? 'Target reached.'
                : ''}
          </div>
        </div>
        {pool.contributors.length ? (
          // Short names end in an initial and a full stop ("Bola F."), so none is added.
          <p className={styles.who}>Chipped in so far: {pool.contributors.join(', ')}</p>
        ) : null}

        {open ? (
          <form onSubmit={handleSubmit} noValidate>
            {error ? (
              <div className={styles.error} role="alert">
                {error}
              </div>
            ) : null}
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <span className={styles.fieldLabel}>How much would you like to add?</span>
            </div>
            <div className={styles.chips} style={{ gridTemplateColumns: `repeat(${picks.length}, 1fr)` }}>
              {picks.map((v, i) => (
                <button
                  key={v}
                  type="button"
                  className={`${styles.chip} ${Number(amount) === v ? styles.chipOn : ''}`}
                  onClick={() => setAmount(String(v))}
                >
                  {i === picks.length - 1 ? 'The rest' : naira(v)}
                </button>
              ))}
            </div>
            <label className={styles.field}>
              <span className={styles.srOnly}>Amount in naira</span>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Or type an amount in naira"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Your name</span>
              <input
                className={styles.input}
                type="text"
                maxLength={80}
                autoComplete="name"
                placeholder="So they know who chipped in"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Email</span>
              <input
                className={styles.input}
                type="email"
                maxLength={160}
                autoComplete="email"
                placeholder="For your receipt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button type="submit" className={styles.button} disabled={busy}>
              {busy ? 'Starting payment...' : 'Chip in'}
            </button>
            <p className={styles.hint}>
              You pay securely by card. If the gift is not fully funded in time, your money is returned to
              your card.
            </p>
          </form>
        ) : error ? (
          <div className={styles.error} role="alert">
            {error}
          </div>
        ) : null}

        {pendingRef ? (
          <button type="button" className={styles.ghost} onClick={() => confirmPayment(code, pendingRef)}>
            Check my payment again
          </button>
        ) : null}
      </>
    );
  }

  return (
    <LinkPageShell
      footer={
        <>
          Powered by <a href="/">QuickGift</a>. Send gifts and book trusted services across Nigeria.
        </>
      }
    >
      {content}
    </LinkPageShell>
  );
}
