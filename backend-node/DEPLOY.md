# Deploying the QuickGift Node backend

Everything here can be done on **free tiers** (no card). The only paid upgrade is
keeping the backend always-on (no cold starts) — ~$7/mo, do it later.

Total time once you have the accounts: ~15 minutes.

---

## 1. Create a free Postgres database

**Neon (recommended)** → neon.tech → New project → copy the connection string
(`postgresql://user:PASSWORD@ep-xxxx.neon.tech/neondb?sslmode=require`).
Neon scales to zero when idle but **auto-wakes in ~0.5s**, so the DB is always
reachable — the right fit for "test anytime on real data."

**Supabase (alternative)** → supabase.com → Settings → Database → *Connection
string* → **Session / direct** (not the transaction pooler):
`postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres`.
⚠ The free plan **pauses after ~1 week idle** and needs a manual restore — fine if
you test often, annoying otherwise.

> Use the **direct/session** connection string, not a transaction pooler — the app
> runs its own connection pool. SSL is handled automatically for any non-localhost URL.

## 2. Load the schema + seed into it

From this folder, with `psql` installed (or use the provider's SQL editor and paste
the file contents):

```bash
psql "YOUR_DATABASE_URL" -f db/schema.sql
psql "YOUR_DATABASE_URL" -f db/seed.sql
```

That creates all 23 tables (with foreign keys) and the reference data
(products, providers, services, categories, occasions, admin + provider logins).

## 3. Deploy the backend

### Option A — Render (Blueprint, uses `render.yaml`)
1. Push this repo to GitHub (if not already).
2. Render → **New → Blueprint** → select the repo. It reads `backend-node/render.yaml`.
3. When prompted, fill the secrets:
   - `DATABASE_URL` = the string from step 1
   - `PAYSTACK_TEST_SECRET_KEY` = your Paystack test secret key
   - (leave the rest blank for now — they're optional for the beta)
4. Deploy. The health check is `/health`.

> `plan: free` sleeps after ~15 min idle. For a smooth always-on beta, change
> `plan: free` → `plan: starter` in `render.yaml` (~$7/mo).

### Keep it awake for free (instead of the $7 upgrade)
Render free sleeps after 15 min idle (~50s cold start). A free cron pinger keeps it warm:
1. **cron-job.org** (free, no card) → Create cronjob.
2. URL = `https://quickgift-node-api.onrender.com/health`
3. Schedule = **every 10 minutes**.

That keeps the one free service running ~24/7 (uses ~730 of the 750 free
instance-hours/month — enough for a single service). UptimeRobot works too.

### Option B — Railway / Fly.io
- Railway: New project → Deploy from GitHub → set root to `backend-node`,
  build `npm install && npm run build`, start `npm start`, add the env vars.
- Any host works: it's a standard Node app that builds to `dist/` and runs on `$PORT`.

## 4. Beta login without SMS (optional)
Set `DEBUG=true` in the environment. Then the OTP is returned in the API response
(the app auto-fills it), so testers can log in **without Termii/SMS configured**.
Switch to `DEBUG=false` + a real Termii key before a public launch.

## 5. Point the apps at the deployed URL
Once deployed (e.g. `https://quickgift-node-api.onrender.com`):
- **Mobile:** nothing to flip by hand — `mobile/src/services/api.js` auto-switches
  (`__DEV__` → local during `expo start`, the Render URL in any release/EAS build).
  Just confirm the host matches your actual Render URL; edit it there if your
  service name differs from `quickgift-node-api`.
- **Admin (Vercel):** Project → Settings → Environment Variables →
  `VITE_API_URL = https://…onrender.com/api/v1`, then redeploy.
- **CORS:** the backend currently allows all origins (fine for a beta). Lock it to
  your admin domain later in `src/main.ts` (`app.enableCors({ origin: [...] })`).

## 6. Build the mobile APK (free)
```bash
cd mobile
eas build -p android --profile preview   # free EAS tier, builds a shareable APK
```
Share the resulting APK download link with testers (sideload). `eas update` pushes
JS/UI changes later without a rebuild.

## Seed logins
| Role     | Email                | Password      |
|----------|----------------------|---------------|
| Admin    | admin@quickgift.ng   | `admin123`    |
| Provider | amara@quickgift.ng   | `provider123` |

---

**Checklist**
- [ ] Free Postgres created (Neon), `DATABASE_URL` copied
- [ ] `schema.sql` + `seed.sql` loaded
- [ ] Backend deployed (Render Blueprint), `/health` returns `{"status":"ok"}`
- [ ] `DATABASE_URL` + `PAYSTACK_TEST_SECRET_KEY` set in Render
- [ ] cron-job.org pinger hitting `/health` every 10 min (keep-awake)
- [ ] Admin `VITE_API_URL` set on Vercel → redeploy
- [ ] Mobile host in `api.js` matches the Render URL → `eas build -p android --profile preview`
