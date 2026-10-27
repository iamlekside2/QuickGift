import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool, PoolClient, types } from 'pg';

/**
 * node-postgres reads `timestamp without time zone` (OID 1114) as LOCAL time,
 * which silently shifts every date by the machine's offset. The backend stores
 * UTC, so parse these values as UTC. (See the pg-timestamp-UTC gotcha.)
 */
types.setTypeParser(1114, (v: string) => new Date(v.replace(' ', 'T') + 'Z'));
// `date` (OID 1082) — keep as plain YYYY-MM-DD string, no TZ shenanigans.
types.setTypeParser(1082, (v: string) => v);

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: Pool;

  async onModuleInit() {
    const connStr = process.env.DATABASE_URL || '';
    // Managed Postgres (Supabase/Neon/Render) requires SSL; local dev does not.
    const isLocal = connStr.includes('localhost') || connStr.includes('127.0.0.1');
    this.pool = new Pool({
      connectionString: connStr,
      max: 10,
      // Force every session to UTC at connection time (startup param, not a
      // query — avoids the client.query-on-connect deprecation).
      options: '-c timezone=UTC',
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
    // Fail fast if the DB is unreachable at boot.
    await this.pool.query('SELECT 1');
    this.logger.log('Postgres pool ready');
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }

  /** Run a parameterized query and return all rows. */
  async query<T = any>(text: string, params: any[] = []): Promise<T[]> {
    const res = await this.pool.query(text, params);
    return res.rows as T[];
  }

  /** Run a parameterized query and return the first row (or null). */
  async queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length ? rows[0] : null;
  }

  /** Run work inside a transaction with a dedicated client. */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
