import { Injectable, Logger } from '@nestjs/common';

/**
 * Minimal transactional email via Brevo's REST API (no SDK, just fetch).
 *
 * Fully optional: if BREVO_API_KEY is not set the service is a no-op, so a
 * missing mail config can never break a waitlist signup or any other flow.
 * Sends are fire-and-forget from callers — send() swallows every error and
 * returns false rather than throwing.
 *
 * To switch it on in production (Render dashboard):
 *   1. Create a free Brevo account. Under Senders, verify a sender address
 *      (e.g. hello@quickgift.ng) — a single-sender verification is enough to
 *      start; add domain authentication (SPF/DKIM) later for best delivery.
 *   2. Create an API key (SMTP & API -> API Keys) and set BREVO_API_KEY = xkeysib-...
 *   3. (optional) Set MAIL_FROM_EMAIL / MAIL_FROM_NAME — must match a verified
 *      sender. Defaults to "QuickGift <hello@quickgift.ng>".
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey = process.env.BREVO_API_KEY || '';
  private readonly fromEmail =
    process.env.MAIL_FROM_EMAIL || 'hello@quickgift.ng';
  private readonly fromName = process.env.MAIL_FROM_NAME || 'QuickGift';

  get enabled(): boolean {
    return !!this.apiKey;
  }

  /** Send one email. Never throws: logs and returns false on any failure. */
  private async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug(`mail skipped (no BREVO_API_KEY): "${subject}" -> ${to}`);
      return false;
    }
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: this.fromName, email: this.fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(`mail failed (${res.status}) to ${to}: ${body.slice(0, 300)}`);
        return false;
      }
      this.logger.log(`mail sent: "${subject}" -> ${to}`);
      return true;
    } catch (err: any) {
      this.logger.warn(`mail error to ${to}: ${err?.message || err}`);
      return false;
    }
  }

  /** Waitlist confirmation email. Copy shifts slightly for providers. */
  async sendWaitlistConfirmation(to: string, role: string): Promise<boolean> {
    const isProvider = role === 'provider';
    const subject = isProvider
      ? "You're on the QuickGift provider waitlist \u{1F381}"
      : "You're on the QuickGift waitlist \u{1F381}";
    return this.send(to, subject, waitlistHtml(isProvider));
  }
}

/** Branded, email-client-safe HTML (all styles inline). */
function waitlistHtml(isProvider: boolean): string {
  const lead = isProvider
    ? 'Thanks for your interest in becoming a founding QuickGift provider. You are on the list.'
    : 'Thanks for joining the QuickGift waitlist. You are on the list.';
  const body = isProvider
    ? 'When founding-provider onboarding opens, we will reach out on WhatsApp to help you set up your shop, verify your details and start taking orders, all inside the QuickGift app. Founding providers pay 0% commission at launch.'
    : 'We are launching same-day gifts and verified artisan services in Lagos and Abuja very soon. You will be among the first to know the moment we go live, with early-access perks for our first members.';
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#FAF3E9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF3E9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(33,31,28,0.08);">
            <tr>
              <td style="background:#1F4A45;padding:28px 32px;">
                <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">QuickGift</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#211F1C;">You're on the list! &#127881;</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#4E4A42;">${lead}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#4E4A42;">${body}</p>
                <a href="https://www.quickgift.ng" style="display:inline-block;background:#E8632F;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:12px;">Visit QuickGift</a>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 36px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9A948A;">You are receiving this because you joined the QuickGift waitlist at quickgift.ng. If this wasn't you, you can ignore this email.</p>
                <p style="margin:12px 0 0;font-size:12px;color:#9A948A;">&copy; 2026 QuickGift &middot; Lagos, Nigeria</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
