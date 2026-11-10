# Deploying the QuickGift backend to AWS

The backend is env-driven, uses SSL for non-local Postgres, and auto-creates its
tables on boot — so moving it to AWS is mostly configuration. Recommended stack:
**AWS App Runner** (runs the Nest app, managed HTTPS + autoscaling) + **Amazon
RDS for PostgreSQL** (the database). Region: **eu-west-1 (Ireland)** is a good
balance of latency to Nigeria and service availability.

Files in this repo that support the move:
- `Dockerfile` — container image (for App Runner image deploy, or ECS later).
- `apprunner.yaml` — config for an App Runner *source* deploy (no image needed).
- `scripts/migrate-neon-to-rds.sh` — copies the DB from Neon into RDS.

---

## 0. Prerequisites (one-time)
- An AWS account. Create an **IAM admin user** and use it (never the root login).
- Set a **billing alarm** (Billing → Budgets) so costs can't surprise you.
- Install the **AWS CLI** and `psql`/`pg_dump` (PostgreSQL 16 client tools).

## 1. Database — Amazon RDS for PostgreSQL
1. RDS → Create database → PostgreSQL → **Free tier** (or `db.t4g.micro`).
2. DB name `quickgift`, set a master user + password, **storage autoscaling on**.
3. Public access: **Yes** to start (simplest). Note the **endpoint** host.
4. In its **security group**, allow inbound TCP **5432** from your IP (for the
   migration) and later from App Runner.
5. Your connection string:
   `postgres://USER:PASSWORD@ENDPOINT:5432/quickgift?sslmode=require`

## 2. Migrate the data from Neon
From Git Bash, with PostgreSQL client tools on PATH:
```bash
SOURCE_DATABASE_URL='<your current Neon URL>' \
TARGET_DATABASE_URL='<the RDS URL from step 1>' \
./scripts/migrate-neon-to-rds.sh
```
It dumps Neon and restores into RDS, then prints row counts to confirm.
(If you'd rather start empty, skip this and run `POST /admin/seed?secret=...`
against the new DB after deploy — but you'd lose existing signups/products.)

## 3. Deploy the app — AWS App Runner
**Option A — from source (no Docker):**
1. App Runner → Create service → **Source: GitHub** → connect the repo.
2. **Source directory:** `backend-node`. It picks up `apprunner.yaml`.
3. Add environment variables (see the list below) incl. the RDS `DATABASE_URL`.
4. Port: **8001**. Health check path: `/health`. Create.

**Option B — from a container image (more reproducible):**
1. Build & push to ECR:
   ```bash
   aws ecr create-repository --repository-name quickgift-api
   # follow the ECR "View push commands" to docker build/tag/push the Dockerfile
   ```
2. App Runner → Create → **Container registry** → pick the image → set env vars,
   port 8001, health check `/health`.

## 4. Environment variables to set
Core: `DATABASE_URL` (RDS), `SECRET_KEY`, `DEBUG=false`
Commission: `GIFT_COMMISSION_PERCENT=10.0`, `BEAUTY_COMMISSION_PERCENT=10.0`
Paystack: `PAYSTACK_LIVE`, `PAYSTACK_TEST_SECRET_KEY`, `PAYSTACK_LIVE_SECRET_KEY`
SMS: `TERMII_API_KEY`, `TERMII_SENDER_ID=QuickGift`
Media: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
Delivery: `KWIK_ENV=test`, `KWIK_EMAIL`, `KWIK_PASSWORD`
Email: `BREVO_API_KEY`, `MAIL_FROM_EMAIL=admin@quickgift.ng`, `MAIL_FROM_NAME=QuickGift`, `ADMIN_NOTIFY_EMAIL=admin@quickgift.ng`
(App Runner sets `PORT` automatically.) Keep secrets in **SSM Parameter Store**
and reference them, or paste them as plain env vars to start.

## 5. Custom domain + HTTPS
1. In the App Runner service → **Custom domains** → add `api.quickgift.ng`.
2. It gives you DNS validation records — add them at WhoGoHost (or move DNS to
   Route 53). ACM issues the TLS cert automatically; App Runner serves HTTPS.

## 6. Repoint the clients
- **Admin** (Render/Vercel env): `VITE_API_URL=https://api.quickgift.ng/api/v1`
- **Mobile** `src/services/api.js`: set the production base URL to the new domain.
- CORS is already open (`app.enableCors()`), so no backend change needed.

## 7. Verify, then retire Render
- `GET https://api.quickgift.ng/health` returns ok.
- Log in to the admin, load dashboard/products/waitlist, place a test order.
- Watch **CloudWatch** logs for the service.
- Once stable, delete the Render `quickgift-node-api` service.

## 8. CI/CD — auto-deploy on push (optional but recommended)
The workflow `.github/workflows/deploy-backend-aws.yml` builds the image and
pushes it to ECR whenever `backend-node/**` changes on `main`.
1. Create a **deploy IAM user** with ECR push + App Runner permissions
   (`AmazonEC2ContainerRegistryPowerUser` + an inline policy allowing
   `apprunner:StartDeployment`). Generate an access key.
2. Add repo secrets (GitHub → Settings → Secrets and variables → Actions):
   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optionally
   `APPRUNNER_SERVICE_ARN` (to force a redeploy; omit it if App Runner's
   automatic-deployments-from-ECR is on).
3. The workflow's region (`eu-west-1`) and repo name (`quickgift-api`) are set
   at the top — change them there if yours differ.
Now every backend push builds, pushes to ECR, and rolls out — hands-off like
Render. (For stronger security, swap the access keys for GitHub OIDC later.)

## Rollback
Nothing is deleted on the Render side until step 7, so to roll back just point
the clients' API URL back at the Render service. The data lives in RDS now; if
you must go back to Neon, re-run the migration script with SOURCE/TARGET swapped.

## Rough cost (low traffic)
RDS `db.t4g.micro` ~$12–15/mo (much of it covered by the 12-month free tier) +
App Runner ~$5–25/mo depending on usage. ≈ **$20–40/mo**, less on free tier.

## Notes
- If the container ever fails to bind, set the listen host explicitly in
  `src/main.ts`: `await app.listen(port, '0.0.0.0')`.
- `pg_dump`/`pg_restore` must be the same major version as the DB (PG 15/16) or
  newer, or the dump step errors.
