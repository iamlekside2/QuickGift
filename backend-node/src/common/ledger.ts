import { randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { isDeployed } from './security.service';

/**
 * Wallet ledger primitives. Every balance change in the app goes through
 * these so it is (a) atomic in SQL — no read-then-write races — and (b) always
 * paired with a `transactions` row. Call them on a transaction client.
 */

/** A positive, finite money amount, or null if the input is not one. */
export function toAmount(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export function ledgerRef(prefix: string): string {
  return `${prefix}-` + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
}

/** Adds `amount` to the wallet and records a credit. Returns the new balance. */
export async function creditWallet(
  client: PoolClient,
  userId: string,
  amount: number,
  description: string,
  reference: string,
): Promise<number | null> {
  const row = (
    await client.query(
      `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2
       RETURNING wallet_balance`,
      [amount, userId],
    )
  ).rows[0];
  if (!row) return null;
  const balance = Number(row.wallet_balance);
  await client.query(
    `INSERT INTO transactions (id, user_id, type, amount, description, reference, balance_after, status, created_at)
     VALUES ($1,$2,'credit',$3,$4,$5,$6,'completed',NOW())`,
    [randomUUID(), userId, amount, description, reference, balance],
  );
  return balance;
}

/**
 * Takes `amount` from the wallet only if the balance covers it, and records a
 * debit. Returns the new balance and the transaction id, or null when funds
 * are insufficient (nothing is changed in that case).
 */
export async function debitWallet(
  client: PoolClient,
  userId: string,
  amount: number,
  description: string,
  reference: string,
  status: 'completed' | 'pending' = 'completed',
): Promise<{ balance: number; txId: string } | null> {
  const row = (
    await client.query(
      `UPDATE users SET wallet_balance = wallet_balance - $1
       WHERE id = $2 AND wallet_balance >= $1
       RETURNING wallet_balance`,
      [amount, userId],
    )
  ).rows[0];
  if (!row) return null;
  const balance = Number(row.wallet_balance);
  const txId = randomUUID();
  await client.query(
    `INSERT INTO transactions (id, user_id, type, amount, description, reference, balance_after, status, created_at)
     VALUES ($1,$2,'debit',$3,$4,$5,$6,$7,NOW())`,
    [txId, userId, amount, description, reference, balance, status],
  );
  return { balance, txId };
}

/** The active Paystack secret key ('' when none is configured). */
export function paystackSecret(): string {
  const live = (process.env.PAYSTACK_LIVE || 'false').toLowerCase() === 'true';
  return live
    ? process.env.PAYSTACK_LIVE_SECRET_KEY || ''
    : process.env.PAYSTACK_TEST_SECRET_KEY || '';
}

/**
 * "Dev payments" auto-approve a payment with no gateway involved. Allowed only
 * when no Paystack key is configured AND the API is running locally or is
 * explicitly in DEBUG. A deployed, non-debug API with a missing key must fail
 * closed rather than hand out free orders and wallet credit.
 */
export function devPaymentsAllowed(): boolean {
  if (paystackSecret()) return false;
  return !isDeployed() || process.env.DEBUG === 'true';
}
