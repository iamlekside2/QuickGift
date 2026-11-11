# QuickGift public website

The public site at https://www.quickgift.ng, built with Next.js (App Router, TypeScript).
It replaces the hand-written HTML in `../landing/`.

| Page | Address | What it is |
| --- | --- | --- |
| Home | `/` | Landing page and waitlist form |
| Gift address | `/gift/?t=TOKEN` | A gift's recipient says where to deliver it |
| Group gift | `/group/?c=CODE` | Friends chip in for a group gift by card |

The two link pages are shared with people outside the app, so their addresses must not change.

## Run it

```bash
npm install
npm run dev
```

It opens on http://localhost:3022 and talks to the local API at `http://localhost:8001/api/v1`
(set in `.env.development`). Start the API from `../backend-node` first to use the gift and
group pages.

## Build

```bash
npm run build
```

This writes plain static files to `out/` (no server needed). The production build talks to the
live API unless `NEXT_PUBLIC_API_URL` is set.

The build uses webpack on purpose (`next build --webpack`): under Turbopack, `next/font`
ignores `adjustFontFallback: false`, which changes how the naira sign and arrows are drawn.

## Deploy (Render static site)

Point the existing `quickgift-landing` static site at this folder:

| Setting | Value |
| --- | --- |
| Root Directory | `web` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `out` |

Until those settings are changed, Render keeps serving the old `landing/` folder.

## Layout

- `app/` - the three routes, the shared layout (fonts, metadata) and `globals.css`
- `components/landing/` - the home page, one component per section
- `components/WaitlistForm.tsx`, `RoleContext.tsx`, `RoleLink.tsx` - the waitlist form and the
  buttons that preselect "Provider" in it
- `components/GiftClaim.tsx`, `GroupGift.tsx` - the two link pages
- `components/link-page.module.css` - styles shared by the two link pages
- `lib/api.ts` - API base address and a small fetch helper
- `public/app-home.webp` - the app screenshot shown in the phone on the home page
