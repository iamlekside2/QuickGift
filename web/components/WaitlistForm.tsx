'use client';

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { api, serverMessage } from '@/lib/api';
import { useRole, type Role } from './RoleContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIMEOUT_MS = 20000;
const HINT = "No spam. We'll only reach out when we launch.";
const ERROR_COLOR = '#E8632F';
const HINT_COLOR = 'rgba(255,255,255,0.65)';

const ROLES: { value: Role; label: string }[] = [
  { value: 'customer', label: 'Buyer' },
  { value: 'provider', label: 'Provider' },
];

const pill = (on: boolean): CSSProperties => ({
  display: 'block',
  textAlign: 'center',
  padding: '12px 8px',
  borderRadius: '11px',
  border: '1px solid transparent',
  background: on ? '#ffffff' : 'transparent',
  color: on ? '#1F4A45' : 'rgba(255,255,255,0.78)',
  fontSize: '13.5px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all .18s ease',
  boxShadow: on ? '0 6px 14px rgba(0,0,0,0.20)' : 'none',
});

/**
 * The waitlist form. Submissions post straight to the QuickGift backend and
 * show up in the admin dashboard (Applications tab). No third-party form service.
 */
export default function WaitlistForm() {
  const { role, setRole } = useRole();
  const [email, setEmail] = useState('');
  const [skill, setSkill] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [announce, setAnnounce] = useState(false);
  const [message, setMessage] = useState({ text: HINT, color: HINT_COLOR });
  const emailRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // The confirmation replaces the form. Its status region is put in the page
  // empty and filled a moment later so screen readers announce it, then focus
  // moves to it because the submit button that had focus no longer exists.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      setAnnounce(true);
      doneRef.current?.focus({ preventScroll: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [done]);

  const fail = (text: string) => {
    setSending(false);
    setMessage({ text, color: ERROR_COLOR });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const address = email.trim();
    // Check the address ourselves before sending: the browser accepts things
    // like "name@host" that the waitlist cannot use.
    if (!EMAIL_RE.test(address)) {
      setMessage({ text: 'Please enter a valid email address.', color: ERROR_COLOR });
      emailRef.current?.focus();
      return;
    }

    setSending(true);
    // Whichever happens first (a response, a network error or the timeout)
    // settles the attempt.
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, TIMEOUT_MS);
    try {
      const res = await api(
        'POST',
        '/waitlist',
        { role, skill: skill.trim(), email: address },
        controller.signal,
      );
      if (res.status >= 200 && res.status < 300) {
        setDone(true);
        return;
      }
      // The server was reached and said no: show its reason, not a connection error.
      fail(serverMessage(res.data, 'Something went wrong on our side. Please try again in a moment.'));
    } catch {
      fail(
        timedOut
          ? 'This is taking longer than usual, please try again.'
          : 'We could not reach the server. Please check your connection and try again.',
      );
    } finally {
      clearTimeout(timer);
    }
  };

  if (done) {
    return (
      <div style={{ maxWidth: '440px', margin: '0 auto', textAlign: 'left' }}>
        <div
          ref={doneRef}
          className="wl-done"
          role="status"
          aria-live="polite"
          tabIndex={-1}
          style={{ textAlign: 'center', padding: '6px 0', color: '#fff' }}
        >
          {announce ? (
            <>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 14px',
                  borderRadius: '50%',
                  background: '#3E8E63',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800 }}>You’re on the list! 🎉</div>
              <div style={{ fontSize: '13.5px', opacity: 0.75, marginTop: '6px' }}>
                We’ll reach out the moment QuickGift launches.
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form
      className="wl-form"
      onSubmit={handleSubmit}
      noValidate
      style={{ maxWidth: '440px', margin: '0 auto', textAlign: 'left' }}
    >
      <p
        style={{
          margin: '0 0 8px',
          fontSize: '12.5px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.62)',
          textAlign: 'center',
          letterSpacing: '0.3px',
        }}
      >
        I&apos;m interested as a…
      </p>
      <div
        role="radiogroup"
        aria-label="I am interested as a"
        style={{
          display: 'flex',
          gap: '6px',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          padding: '6px',
          marginBottom: '12px',
        }}
      >
        {ROLES.map((r) => (
          <label key={r.value} className="wl-role" style={{ flex: 1, minWidth: 0 }}>
            <input
              type="radio"
              name="role"
              value={r.value}
              checked={role === r.value}
              onChange={() => setRole(r.value)}
              style={{ position: 'absolute', opacity: 0 }}
            />
            <span style={pill(role === r.value)}>{r.label}</span>
          </label>
        ))}
      </div>

      {role === 'provider' ? (
        <div className="wl-skill" style={{ marginBottom: '12px' }}>
          <input
            type="text"
            name="skill"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Your skill or service (e.g. baker, florist, nail tech)"
            aria-label="Your skill or service"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>
      ) : null}

      <div
        className="wl-join"
        style={{
          display: 'flex',
          gap: '8px',
          background: '#fff',
          borderRadius: '18px',
          padding: '7px',
          boxShadow: '0 20px 44px rgba(0,0,0,0.20)',
        }}
      >
        <input
          ref={emailRef}
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '14px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            fontSize: '14.5px',
            color: '#211F1C',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          className="wl-join-btn"
          disabled={sending}
          style={{
            background: '#E8632F',
            color: '#fff',
            padding: '14px 26px',
            borderRadius: '12px',
            fontSize: '14.5px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sending ? 'Joining…' : 'Join the waitlist'}
        </button>
      </div>
      <p
        className="wl-msg"
        role="status"
        aria-live="polite"
        style={{
          margin: '14px 2px 0',
          fontSize: '13px',
          color: message.color,
          textAlign: 'center',
          minHeight: '18px',
        }}
      >
        {message.text}
      </p>
      <p
        style={{
          margin: '8px 2px 0',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.65)',
          textAlign: 'center',
        }}
      >
        Providers (vendors &amp; artisans) get first access and 0% commission at launch. We&apos;ll reach out
        to set you up.
      </p>
    </form>
  );
}
