import { Injectable, Logger } from '@nestjs/common';

const TERMII_URL = 'https://v3.api.termii.com/api/sms/send';

/** Mirrors app/core/sms.py — Termii SMS; returns false if not configured. */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey = process.env.TERMII_API_KEY || '';
  private readonly senderId = process.env.TERMII_SENDER_ID || 'QuickGift';
  private readonly otpExpireMinutes = 10;

  async sendSms(to: string, body: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('Termii API key not configured — SMS not sent');
      return false;
    }
    try {
      const res = await fetch(TERMII_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          from: this.senderId,
          sms: body,
          type: 'plain',
          channel: 'generic',
          api_key: this.apiKey,
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (res.status === 200 && data?.message === 'Successfully Sent') {
        return true;
      }
      this.logger.error(`Termii SMS failed for ${to}: ${JSON.stringify(data)}`);
      return false;
    } catch (e) {
      this.logger.error(`Failed to send SMS to ${to}: ${e}`);
      return false;
    }
  }

  async sendOtpSms(phone: string, code: string): Promise<boolean> {
    const body = `Your QuickGift verification code is: ${code}. It expires in ${this.otpExpireMinutes} minutes. Do not share this code.`;
    return this.sendSms(phone, body);
  }
}
