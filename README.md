# ConvAudit

**AI ecommerce audit platform for serious stores.**

Paste a product URL → get Conversion, SEO, GEO (AI-search visibility), and Trust scores — with prioritized fixes, competitor comparison, and optional AI content generation.

**Production:** [https://www.convaudit.com](https://www.convaudit.com)

[![CI](https://github.com/namex308-stack/GEO/actions/workflows/ci.yml/badge.svg)](https://github.com/namex308-stack/GEO/actions/workflows/ci.yml)

---

## Product

| Capability | Description |
|---|---|
| **Audit engine** | Conversion · SEO · GEO · Trust pillars with actionable recommendations |
| **AI Studio** | Arabic-first titles, descriptions, FAQ, meta, and ad copy (plan-gated) |
| **Competitor tools** | In-audit comparison (Pro+) and scheduled monitoring (Business) |
| **Billing** | Free / Pro / Business plans via Kashier (EGP), entitlements enforced server-side |
| **Workspace isolation** | Supabase Auth + RLS; quotas enforced in API and Postgres |

---

## Stack

- **Framework:** Next.js (App Router) · React 19 · TypeScript
- **Data / Auth:** Supabase (PostgreSQL, Auth, RLS)
- **AI / scrape:** Google Gemini · Firecrawl
- **Payments:** Kashier
- **Rate limits:** Upstash Redis
- **Deploy:** Vercel (`standalone` output)

---

## Quick start

```bash
git clone https://github.com/namex308-stack/GEO.git
cd GEO
cp .env.example .env.local
# Fill required keys — see .env.example
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without AI/payment keys the app runs in a limited demo mode.

### Requirements

- Node.js **22+**
- npm

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build + standalone copy |
| `npm start` | Next.js production server |
| `npm run start:standalone` | Standalone Node server |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright CI project |

---

## Environment

Copy [`.env.example`](.env.example). Never commit real secrets.

**Required for production auth/billing:**

- `NEXT_PUBLIC_APP_URL` (canonical: `https://www.convaudit.com`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Commonly required for full product:**

- `GEMINI_API_KEY` / `GEMINI_MODEL`
- `FIRECRAWL_API_KEY`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- Kashier: `KASHIER_MERCHANT_ID`, `KASHIER_API_KEY`, `KASHIER_SECRET_KEY`, `KASHIER_WEBHOOK_SECRET`, `KASHIER_MODE`
- Optional: `GOOGLE_SITE_VERIFICATION`, Resend, Google OAuth

---

## Architecture (high level)

```
src/app/            App Router (marketing, auth, product, API)
src/lib/billing/    Plans, entitlements, quotas, Kashier mapping
src/lib/audit/      Scoring + GEO analysis
src/lib/db/         Repositories + workspace stats
supabase/migrations PostgreSQL schema, RLS, plan_catalog
```

- Checkout amounts come from server-side `PLAN_PRICES` — never from the client.
- Webhook HMAC verification activates subscriptions from verified payment data.
- Usage quotas are enforced via atomic DB helpers + API checks.

---

## Security

- Do not commit `.env`, `.env.local`, or service-role keys.
- Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).
- Rotate any credentials that may have been exposed historically.

---

## License

Proprietary. Copyright © 2026 ConvAudit. All rights reserved.

Unauthorized copying, distribution, or commercial use of this software is prohibited unless you have a written agreement with the owners.
