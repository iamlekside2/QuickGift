# Database setup (NestJS backend)

Two files create a fresh, ready-to-run database — no dependency on the Python backend.

- **`schema.sql`** — full DDL: 23 tables with all foreign keys, indexes and constraints.
- **`seed.sql`** — reference data only (6 categories, 10 occasions, 12 products, 4 providers + 12 services, and the admin + provider user accounts). No test/transaction rows.

## Local / self-hosted Postgres

```bash
createdb quickgift                         # or: CREATE DATABASE quickgift;
psql -d quickgift -f db/schema.sql
psql -d quickgift -f db/seed.sql
```

## Managed Postgres (Supabase / Neon / Render)

Run the two files against the connection string (SQL editor or psql):

```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed.sql
```

Then set `DATABASE_URL` in the app environment to that database and start the API
(`npm run build && npm start`). `seed.sql` loads in FK-safe order inside a single
transaction, so it works with foreign keys enforced.

## Seed login accounts

| Role     | Email / phone            | Password     |
|----------|--------------------------|--------------|
| Admin    | admin@quickgift.ng       | `admin123`   |
| Provider | amara@quickgift.ng …     | `provider123`|

## Regenerating these files

- `schema.sql` is a `pg_dump --schema-only` of the models' `create_all` output.
- `seed.sql` is dumped from the reference tables (see `scratchpad/dump_seed.js`).
