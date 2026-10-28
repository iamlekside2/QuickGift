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
 *      (e.g. admin@quickgift.ng) — a single-sender verification is enough to
 *      start; add domain authentication (SPF/DKIM) for best deliverability.
 *   2. Create an API key (SMTP & API -> API Keys) and set BREVO_API_KEY = xkeysib-...
 *   3. (optional) Set MAIL_FROM_EMAIL / MAIL_FROM_NAME — must match a verified
 *      sender. Defaults to "QuickGift <admin@quickgift.ng>".
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey = process.env.BREVO_API_KEY || '';
  private readonly fromEmail =
    process.env.MAIL_FROM_EMAIL || 'admin@quickgift.ng';
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

/**
 * Branded, email-client-safe HTML (table layout, all styles inline). Light
 * only: a color-scheme hint discourages dark-mode inversion, and every surface
 * sets an explicit background so it stays on-brand where the hint is ignored.
 */
function waitlistHtml(isProvider: boolean): string {
  const preheader = isProvider
    ? "You're on the QuickGift founding-provider waitlist."
    : "You're on the QuickGift waitlist. We'll tell you the moment we launch.";
  const lead = isProvider
    ? 'Thanks for your interest in becoming a founding QuickGift provider. Your spot is saved.'
    : 'Thanks for joining the QuickGift waitlist. Your spot is saved.';
  const body = isProvider
    ? 'When founding-provider onboarding opens, we’ll reach out on WhatsApp to help you set up your shop and start taking orders, all inside the QuickGift app. Founding providers pay 0% commission at launch.'
    : 'We’re launching same-day gifts and verified artisan services in Lagos and Abuja very soon. You’ll be among the first to know the moment we go live, with early-access perks for our first members.';
  const perks = isProvider
    ? ['0% commission at launch', 'Free shop setup on WhatsApp', 'Featured first in your category']
    : ['Same-day gifts & hampers', 'Verified artisans on demand', 'Early-access launch perks'];

  const perkRows = perks
    .map(
      (p) => `
                <tr>
                  <td width="24" valign="top" style="padding:5px 0;font-size:15px;color:#E8632F;">&#10003;</td>
                  <td valign="top" style="padding:5px 0;font-family:Helvetica,Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#4E4A42;">${p}</td>
                </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>You're on the list!</title>
</head>
<body style="margin:0;padding:0;background-color:#F4ECDD;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4ECDD;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:544px;width:100%;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #ECE3D2;">

          <tr>
            <td style="background-color:#1F4A45;padding:22px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="padding-right:12px;" valign="middle">
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td style="background-color:#ffffff;border-radius:11px;padding:6px 7px;line-height:0;" valign="middle">
                      <img src="https://www.quickgift.ng/logo.png" width="28" height="29" alt="QuickGift" style="display:block;width:28px;height:29px;border:0;">
                    </td>
                  </tr></table>
                </td>
                <td valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:bold;color:#ffffff;letter-spacing:0.2px;">QuickGift</td>
              </tr></table>
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color:#FBF5EA;padding:34px 36px 28px;">
              <img src="https://www.quickgift.ng/celebration.png" width="96" height="96" alt="Celebration" style="display:block;width:96px;height:96px;border:0;margin-bottom:18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
                <td style="background-color:#E7EFEC;border-radius:100px;padding:7px 16px;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:bold;color:#1F4A45;letter-spacing:0.4px;text-transform:uppercase;">&#9679;&nbsp; Launching soon</td>
              </tr></table>
            </td>
          </tr>

          <tr>
            <td style="padding:34px 36px 8px;">
              <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:#211F1C;font-weight:normal;">You're on the list! <span style="color:#E8632F;">&#127881;</span></h1>
              <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15.5px;line-height:1.65;color:#4E4A42;">${lead}</p>
              <p style="margin:0 0 22px;font-family:Helvetica,Arial,sans-serif;font-size:15.5px;line-height:1.65;color:#4E4A42;">${body}</p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">${perkRows}
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td align="center" bgcolor="#E8632F" style="border-radius:12px;">
                  <a href="https://www.quickgift.ng" style="display:inline-block;padding:14px 30px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px;">Visit QuickGift &#8594;</a>
                </td>
              </tr></table>
            </td>
          </tr>

          <tr><td style="padding:28px 36px 0;"><div style="border-top:1px solid #EFE7D8;font-size:0;line-height:0;">&nbsp;</div></td></tr>
          <tr>
            <td style="padding:18px 36px 34px;">
              <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#9A948A;">You&#8217;re receiving this because you joined the QuickGift waitlist at quickgift.ng. If this wasn&#8217;t you, you can safely ignore this email.</p>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#B6B0A6;">&copy; 2026 QuickGift &nbsp;&middot;&nbsp; Lagos, Nigeria</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
