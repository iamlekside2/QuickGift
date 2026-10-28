# QuickGift — Integrations & Remaining Work

_Last updated: 2026-10-28_

This is the single reference for every external service QuickGift depends on,
what's wired vs. still needed, and the outstanding work. "Scaffolded" means the
code is in place but the service isn't funded/configured yet.

---

## 1. Third-party services

### Live / active

| Service | What it does | Account | Cost | Notes |
|---|---|---|---|---|
| **GitHub** | Source control | `iamlekside2/QuickGift` | Free | `master`/`main` auto-deploys |
| **Render** | Hosts the backend API (`quickgift-node-api.onrender.com`) | — | Free tier | Free tier **cold-starts** (~30s) and can pause after long idle; a pinger keeps it warm. Upgrade to Starter (~$7/mo) for always-on. |
| **Supabase (Postgres)** | Production database | — | Free tier | Managed Postgres; backend talks to it via raw SQL (no ORM). |
| **Vercel** | Hosts the **landing** (`www.quickgift.ng`) and **admin** (`admin.quickgift.ng`) | — | Free | Auto-deploys on push to `main`. |
| **WhoGoHost** | Domain registrar + DNS for `quickgift.ng` | horllyk12@gmail.com | Paid (domain) | DNS managed here (Brevo + Zoho records live). |
| **Brevo** | Transactional **email** — waitlist confirmations, admin alerts, user order/booking/dispute updates, welcome, and **email OTP** | horllyk12@gmail.com | Free (300/day) | Domain `quickgift.ng` is authenticated (SPF/DKIM). Sends from `admin@quickgift.ng`. **SMS is paid**, not used. |
| **Zoho Mail** | Real inbox for `admin@quickgift.ng` (receives admin alerts) | horllyk12@gmail.com | Free (Forever Free) | MX/SPF/DKIM in WhoGoHost; webmail at mail.zoho.com. |
| **Expo / EAS** | Mobile app builds (Android APK / future iOS) | `leksitech` | Free tier | Project id linked; `preview` profile = APK, `production` = AAB. |

### Scaffolded (code ready, not yet active)

| Service | What it would do | To activate | Cost |
|---|---|---|---|
| **Termii** | **SMS** OTP + SMS to phone-only users | Create account, register sender ID, set `TERMII_API_KEY` in Render, set `DEBUG=false` | Paid per SMS (~₦2–4) |
| **Paystack** | Payments (orders/bookings) | Add **live** keys (`PAYSTACK_LIVE=true` + live secret); live needs CAC/business activation | % per transaction |
| **Cloudinary** | Image uploads (product photos, avatars) | Set `CLOUDINARY_*` keys in Render | Free tier available |
| **Kwik** | Delivery dispatch | Set `KWIK_EMAIL`/`KWIK_PASSWORD`, `KWIK_ENV=live` | Per delivery |
| **Expo Push** | Push notifications | Works once the app is built & installed (token registered on login) | Free |

---

## 2. Backend environment variables (Render)

| Var | Purpose | Status |
|---|---|---|
| `DATABASE_URL` | Supabase Postgres connection | **Set** |
| `SECRET_KEY` | JWT signing / seed secret | Set (generated) |
| `DEBUG` | `true` returns OTP in-app (beta); set `false` for real OTP delivery | Currently **true** (beta) |
| `BREVO_API_KEY` | Brevo email sending | **Set** |
| `MAIL_FROM_EMAIL` / `MAIL_FROM_NAME` | `admin@quickgift.ng` / `QuickGift` | Set (in render.yaml) |
| `ADMIN_NOTIFY_EMAIL` | Where admin alerts go (`admin@quickgift.ng`) | Set (in render.yaml) |
| `GIFT_COMMISSION_PERCENT` / `BEAUTY_COMMISSION_PERCENT` | 10% each | Set |
| `PAYSTACK_*` | Payments | Test only |
| `TERMII_API_KEY` / `TERMII_SENDER_ID` | SMS | Blank (sender `QuickGift`) |
| `CLOUDINARY_*` | Image uploads | Blank |
| `KWIK_*` | Delivery | Test env, blank creds |

---

## 3. Email system (fully live)

| Email | Trigger | To | Channel |
|---|---|---|---|
| Waitlist confirmation | Join at quickgift.ng | the signup | Brevo |
| Admin alert | New order / booking / provider application / waitlist / dispute | `admin@quickgift.ng` (Zoho inbox) | Brevo |
| User transactional | Order/booking/dispute/payment/status updates | the user (if they have an email) | Brevo |
| Welcome | Sign-up with email | new user | Brevo |
| **OTP (email)** | `send-otp` when an email is known | that email | Brevo (free) |

All free. **Phone-only users** still can't be messaged until Termii (SMS) is funded.

---

## 4. What's left to do

### Needs money / an account (your call)
- [ ] **Termii SMS** — fund + configure so phone-only users get OTP and the waitlist phone signups can be reached. Flip `DEBUG=false`.
- [ ] **Paystack live keys** — real payments (needs CAC/business activation).
- [ ] **Cloudinary keys** — so product photos / avatars can be uploaded.
- [ ] **Kwik live creds** — real delivery dispatch.
- [ ] **Render Starter plan** (optional) — kill cold starts for production.

### Product/engineering gaps
- [ ] **Admin: create/edit products** — the backend currently supports **delete** only; there is no create/update product endpoint, so products can't be added from the admin yet. (Add `POST/PATCH /admin/products`.)
- [ ] **Collect email at checkout / profile** — so user transactional emails + email OTP reach more people (app is phone-first; email optional today).
- [ ] **Admin "Export" buttons** — currently non-functional placeholders.
- [ ] **Re-seed demo data** (optional) — the catalog + demo providers were cleared for go-live; add clearly-labeled samples back if needed for screenshots.

### Mobile
- [x] **Android build** — `preview` APK building on EAS now (prod backend baked in).
- [ ] **iOS build** — blocked: needs an **Apple Developer account** ($99/yr) + TestFlight. Not possible until that's set up.
- [ ] Rebuild & submit once SMS/payments go live.

### Nice-to-have
- [ ] Verify a `quickgift.ng` **sender in Brevo** is used as the from-address (done: domain authenticated).
- [ ] WhatsApp notifications (paid, needs Meta business verification) — alternative to SMS.
