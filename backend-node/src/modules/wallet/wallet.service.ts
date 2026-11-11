import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { PaymentsService } from '../payments/payments.service';
import {
  creditWallet,
  debitWallet,
  devPaymentsAllowed,
  ledgerRef,
  paystackSecret,
  toAmount,
} from '../../common/ledger';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const MIN_FUND = 100;
const MAX_FUND = 5_000_000;
const MIN_WITHDRAWAL = 500;
const TX_FIELDS = `id, user_id, type, amount, description, reference, balance_after, status, created_at`;
const BANK_FIELDS = `id, bank_name, bank_code, account_number, account_name, is_default, is_verified`;

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Globus Bank', code: '00103' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Lotus Bank', code: '303' },
  { name: 'Moniepoint', code: '50515' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'SunTrust Bank', code: '100' },
  { name: 'TAJ Bank', code: '302' },
  { name: 'Titan Trust Bank', code: '102' },
  { name: 'Union Bank', code: '032' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'VFD Microfinance Bank', code: '566' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

@Injectable()
export class WalletService {
  constructor(
    private readonly db: DatabaseService,
    private readonly payments: PaymentsService,
  ) {}

  private get secretKey(): string {
    return paystackSecret();
  }

  private ref(prefix: string): string {
    return ledgerRef(prefix);
  }

  async getBalance(userId: string) {
    const user = await this.db.queryOne<any>(
      `SELECT wallet_balance FROM users WHERE id = $1`,
      [userId],
    );
    if (!user) throw new NotFoundException('User not found');
    return { balance: Number(user.wallet_balance) };
  }

  async listTransactions(userId: string, q: any) {
    const page = Math.max(1, Math.floor(Number(q.page ?? 1)) || 1);
    const perPage = Math.min(100, Math.max(1, Math.floor(Number(q.per_page ?? 20)) || 20));
    return this.db.query(
      `SELECT ${TX_FIELDS} FROM transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, perPage, (page - 1) * perPage],
    );
  }

  async fundInitialize(userId: string, rawAmount: number) {
    const amount = toAmount(rawAmount);
    if (!amount) throw new BadRequestException('Amount must be greater than zero');
    if (amount < MIN_FUND || amount > MAX_FUND) {
      throw new BadRequestException(
        `You can add between ₦${MIN_FUND.toLocaleString('en-US')} and ₦${MAX_FUND.toLocaleString('en-US')} at a time`,
      );
    }
    if (!this.secretKey && !devPaymentsAllowed()) {
      throw new HttpException('Wallet funding is not available right now', HttpStatus.SERVICE_UNAVAILABLE);
    }

    // Persist the request first: only this user can later claim this reference,
    // and only for this amount.
    const reference = await this.payments.createWalletFund(userId, amount);

    if (!this.secretKey) {
      return { reference, amount, authorization_url: null, message: 'Dev mode' };
    }

    const user = await this.db.queryOne<{ email: string | null }>(
      `SELECT email FROM users WHERE id = $1`,
      [userId],
    );
    const email =
      user?.email && /^[^s@+]+@[^s@]+.[^s@]+$/.test(user.email)
        ? user.email
        : `customer-${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}@quickgift.ng`;
    const resp = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        reference,
        currency: 'NGN',
        callback_url: 'https://quickgift.ng/payment/callback',
        metadata: { type: 'wallet_fund', user_id: userId },
      }),
    }).catch(() => null);
    const data: any = resp ? await resp.json().catch(() => null) : null;
    if (!resp || resp.status !== 200 || !data?.data?.authorization_url) {
      throw new HttpException(
        'We could not start your payment. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return {
      reference,
      amount,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
    };
  }

  /**
   * Confirms a top-up. The reference must be a pending funding request that
   * belongs to the caller (so an order's card reference, or someone else's
   * top-up, cannot be replayed here), and the gateway must report the full
   * amount as paid.
   */
  async fundVerify(userId: string, reference: string) {
    const fund = await this.payments.findWalletFund(reference);
    if (!fund || fund.user_id !== userId) {
      throw new NotFoundException('Funding request not found');
    }

    if (fund.status !== 'success') {
      if (this.secretKey) {
        const result = await this.payments.walletFundState(reference);
        if (result.state !== 'success') {
          throw new BadRequestException('Payment not verified yet');
        }
        if (result.kobo < Math.round(Number(fund.amount) * 100)) {
          throw new BadRequestException('Amount paid does not match');
        }
      } else if (!devPaymentsAllowed()) {
        throw new HttpException('Wallet funding is not configured', HttpStatus.SERVICE_UNAVAILABLE);
      }
      await this.payments.creditWalletFund(reference);
    }

    const tx = await this.db.queryOne<any>(
      `SELECT ${TX_FIELDS} FROM transactions WHERE reference = $1 AND user_id = $2`,
      [reference, userId],
    );
    const balance = await this.getBalance(userId);
    // `status: 'success'` is what the app checks; the ledger row keeps its own
    // 'completed' state under `transaction`.
    return {
      status: 'success',
      reference,
      amount: Number(fund.amount),
      new_balance: balance.balance,
      transaction: tx ?? null,
    };
  }

  /**
   * Direct wallet credit with no payment behind it. Local development only —
   * on a deployed API this would be free money, so it is refused outright.
   */
  async fundLegacy(userId: string, _role: string, req: any) {
    if (!devPaymentsAllowed()) {
      throw new ForbiddenException('Direct funding is disabled. Use /wallet/fund/initialize.');
    }
    const amount = toAmount(req?.amount);
    if (!amount) throw new BadRequestException('Amount must be greater than zero');
    const reference = String(req?.reference || this.ref('WF'));
    const dup = await this.db.queryOne(
      `SELECT 1 FROM transactions WHERE reference = $1`,
      [reference],
    );
    if (dup) throw new BadRequestException('Duplicate reference');

    return this.db.transaction(async (client) => {
      const balance = await creditWallet(client, userId, amount, 'Wallet funding', reference);
      if (balance === null) throw new NotFoundException('User not found');
      return (
        await client.query(`SELECT ${TX_FIELDS} FROM transactions WHERE reference = $1`, [reference])
      ).rows[0];
    });
  }

  async transfer(userId: string, req: any) {
    const amount = toAmount(req?.amount);
    if (!amount) throw new BadRequestException('Amount must be greater than zero');

    return this.db.transaction(async (client) => {
      const sender = (
        await client.query(`SELECT id, full_name, wallet_balance FROM users WHERE id = $1`, [userId])
      ).rows[0];
      if (!sender) throw new NotFoundException('User not found');
      if (Number(sender.wallet_balance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }
      const recipient = (
        await client.query(`SELECT id, full_name FROM users WHERE phone = $1`, [req.recipient_phone])
      ).rows[0];
      if (!recipient) throw new NotFoundException('Recipient not found');
      if (recipient.id === sender.id) {
        throw new BadRequestException('Cannot transfer to yourself');
      }

      const ref = this.ref('TRF');
      const debited = (
        await client.query(
          `UPDATE users SET wallet_balance = wallet_balance - $1
           WHERE id = $2 AND wallet_balance >= $1 RETURNING wallet_balance`,
          [amount, sender.id],
        )
      ).rows[0];
      if (!debited) {
        throw new BadRequestException('Insufficient balance (concurrent update)');
      }
      const debitTxId = randomUUID();
      await client.query(
        `INSERT INTO transactions (id, user_id, type, amount, description, reference, balance_after, status, created_at)
         VALUES ($1,$2,'debit',$3,$4,$5,$6,'completed',NOW())`,
        [debitTxId, sender.id, amount, `Transfer to ${recipient.full_name}`, ref, Number(debited.wallet_balance)],
      );

      const credited = (
        await client.query(
          `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance`,
          [amount, recipient.id],
        )
      ).rows[0];
      await client.query(
        `INSERT INTO transactions (id, user_id, type, amount, description, reference, balance_after, status, created_at)
         VALUES ($1,$2,'credit',$3,$4,$5,$6,'completed',NOW())`,
        [randomUUID(), recipient.id, amount, `Transfer from ${sender.full_name}`, `${ref}-CR`, Number(credited.wallet_balance)],
      );

      return (await client.query(`SELECT ${TX_FIELDS} FROM transactions WHERE id = $1`, [debitTxId])).rows[0];
    });
  }

  listBanks() {
    return NIGERIAN_BANKS;
  }

  async resolveAccount(accountNumber: string, bankCode: string) {
    if (!this.secretKey) {
      throw new HttpException('Payment service not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const url = `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${encodeURIComponent(
      accountNumber,
    )}&bank_code=${encodeURIComponent(bankCode)}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    const data: any = await resp.json().catch(() => ({}));
    if (resp.status === 200 && data?.status) {
      return {
        account_name: data.data.account_name,
        account_number: data.data.account_number,
        bank_id: data.data.bank_id ?? null,
        verified: true,
      };
    }
    throw new BadRequestException(
      data?.message || 'Could not verify account. Check the number and try again.',
    );
  }

  async listBankAccounts(userId: string) {
    return this.db.query(
      `SELECT ${BANK_FIELDS} FROM bank_accounts WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId],
    );
  }

  async addBankAccount(userId: string, req: any) {
    const dup = await this.db.queryOne(
      `SELECT 1 FROM bank_accounts WHERE user_id = $1 AND account_number = $2 AND bank_code = $3`,
      [userId, req?.account_number, req?.bank_code],
    );
    if (dup) throw new BadRequestException('This bank account already exists');

    return this.db.transaction(async (client) => {
      if (req?.is_default) {
        await client.query(
          `UPDATE bank_accounts SET is_default = false WHERE user_id = $1`,
          [userId],
        );
      }
      const count = Number(
        (await client.query(`SELECT count(*)::int AS c FROM bank_accounts WHERE user_id = $1`, [userId])).rows[0].c,
      );
      const isFirst = count === 0;
      const id = randomUUID();
      await client.query(
        `INSERT INTO bank_accounts (id, user_id, bank_name, bank_code, account_number, account_name, is_default, is_verified, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW())`,
        [
          id,
          userId,
          req.bank_name,
          req.bank_code,
          req.account_number,
          req.account_name,
          !!req.is_default || isFirst,
        ],
      );
      return (await client.query(`SELECT ${BANK_FIELDS} FROM bank_accounts WHERE id = $1`, [id])).rows[0];
    });
  }

  async deleteBankAccount(userId: string, accountId: string) {
    const account = await this.db.queryOne(
      `SELECT id FROM bank_accounts WHERE id = $1 AND user_id = $2`,
      [accountId, userId],
    );
    if (!account) throw new NotFoundException('Bank account not found');
    await this.db.query(`DELETE FROM bank_accounts WHERE id = $1`, [accountId]);
    return { status: 'ok' };
  }

  async setDefaultBankAccount(userId: string, accountId: string) {
    await this.db.query(
      `UPDATE bank_accounts SET is_default = (id = $1) WHERE user_id = $2`,
      [accountId, userId],
    );
    return { status: 'ok' };
  }

  async withdraw(userId: string, req: any) {
    const amount = toAmount(req?.amount);
    if (!amount) throw new BadRequestException('Amount must be greater than zero');
    if (amount < MIN_WITHDRAWAL) throw new BadRequestException('Minimum withdrawal is ₦500');

    return this.db.transaction(async (client) => {
      const bank = (
        await client.query(
          `SELECT bank_name, account_number FROM bank_accounts WHERE id = $1 AND user_id = $2`,
          [req?.bank_account_id, userId],
        )
      ).rows[0];
      if (!bank) throw new NotFoundException('Bank account not found');

      // Atomic "debit only if covered": two simultaneous withdrawals of the
      // full balance can no longer both succeed.
      const last4 = String(bank.account_number).slice(-4);
      const debit = await debitWallet(
        client,
        userId,
        amount,
        `Withdrawal to ${bank.bank_name} ****${last4}`,
        this.ref('WDR'),
        'pending',
      );
      if (!debit) throw new BadRequestException('Insufficient balance');
      // The bank transfer itself is settled by staff from the admin console
      // (Payouts → Withdrawals), which marks this row completed or failed.
      return (
        await client.query(`SELECT ${TX_FIELDS} FROM transactions WHERE id = $1`, [debit.txId])
      ).rows[0];
    });
  }
}
