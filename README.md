# convaudit

AI-powered e-commerce audit and optimization platform. Audit any store or product page in 60 seconds — get deterministic scores for conversion, SEO, GEO/AI visibility, and trust, benchmarked against competitors.

## Features

- **GEO & AI Readiness Audit** — Deterministic GEO engine that measures AI assistant compatibility
- **AI Recommendations** — Actionable fixes tied to engine findings, interpreted by Gemini
- **AI Content Generator** — One-click optimized product titles, descriptions, FAQ, meta, and ad copy with JSON-LD
- **Competitor Comparison** — Know exactly where you win or lose across all pillars
- **Progress Tracking** — Score trend charts and re-audit deltas that prove ROI
- **PDF Reports** — Downloadable professional audit reports

## Tech Stack

- **Framework:** Next.js 16 (App Router, standalone output)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **AI:** Google Gemini (interpretation and content generation only — no scoring)
- **Scraping:** Firecrawl
- **Payments:** Kashier (EGP billing)
- **Rate Limiting:** Upstash Redis
- **UI:** shadcn/ui, Tailwind CSS, Framer Motion, Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- API keys for Gemini and Firecrawl

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your credentials:

```bash
cp .env.example .env.local
```

3. Apply the database migrations in order in your Supabase SQL Editor
   (https://supabase.com/dashboard/project/_/sql):

```bash
# Run each file in order:
#   supabase/migrations/001_core_tables.sql
#   supabase/migrations/002_subscriptions_billing_period.sql
#   supabase/migrations/003_crawl_monitoring_notifications.sql
#   supabase/migrations/004_fix_handle_new_user.sql
#   supabase/migrations/005_ensure_billing_period.sql
#   supabase/migrations/006_ai_generations.sql
```

4. Configure Supabase Auth:
   - Enable Email/Password sign-in in Authentication > Providers
   - (Optional) Enable Google OAuth and add your `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - Add your app URL to Authentication > URL Configuration > Redirect URLs

5. Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

The build uses `output: "standalone"` — deploy the `.next/standalone` directory.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `GEMINI_API_KEY` | No* | Google Gemini API key |
| `FIRECRAWL_API_KEY` | No* | Firecrawl API key for page scraping |
| `KASHIER_MERCHANT_ID` | No | Kashier merchant ID for payments |
| `KASHIER_API_KEY` | No | Kashier API key |
| `KASHIER_SECRET_KEY` | No | Kashier payment secret (escape `$` as `\$` in `.env.local`) |
| `KASHIER_WEBHOOK_SECRET` | No | Kashier webhook signature secret |
| `KASHIER_MODE` | No | `test` / `sandbox` or `live` |
| `KASHIER_FORCE_SESSION_API` | No | In development, set `true` to call Payment Sessions API (requires IP whitelist) |
| `KASHIER_SKIP_SESSION_API` | No | In production, set `true` to always use hosted checkout (HPP) |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token |
| `NEXT_PUBLIC_APP_URL` | No | Public URL of the app (defaults to `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

*The app runs in demo mode with mock data if Gemini/Firecrawl keys are not provided.

## Architecture

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/
│   │   ├── audit/          # POST /api/audit, GET /api/audit/[id], PDF export
│   │   ├── checkout/       # POST /api/checkout (Kashier)
│   │   ├── generate/       # POST /api/generate (AI content)
│   │   └── webhooks/       # POST /api/webhooks/kashier
│   ├── audit/[id]/         # Scanning, report, compare, generate pages
│   ├── dashboard/          # User dashboard
│   ├── settings/           # Billing, usage
│   └── auth/               # Login, OAuth callback
├── components/             # UI components (shadcn/ui + custom)
├── lib/
│   ├── engines/            # Deterministic scoring engines (SEO, GEO, CRO, Trust)
│   ├── ai/                 # Gemini interpreter (recommendations, no scoring)
│   ├── billing/            # Plan limits and entitlements
│   ├── supabase*.ts        # Supabase client helpers (server, browser, admin)
│   └── gemini.ts           # Gemini integration (audit + content generation)
└── hooks/                  # Custom React hooks
```

**Core principle:** Engines compute scores deterministically; Gemini interprets results and generates copy only.

## License

Private — all rights reserved.
