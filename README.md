# ConvAudit

AI-powered e-commerce audit SaaS (Next.js App Router + Supabase + Kashier).

## Requirements

- Node.js 22+
- npm

## Setup

```bash
cp .env.example .env.local
# Fill in Supabase / Gemini / Firecrawl / Kashier keys as needed
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without AI/payment keys the app runs in demo mode with sample audit data.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build (+ standalone asset copy) |
| `npm start` | Start Next production server |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |

## Architecture

- **App Router only** — marketing `/`, auth `/auth`, product routes under `/dashboard`, `/audit`, `/onboarding`, etc.
- **Supabase** — auth + profiles/subscriptions (PostgreSQL)
- **Kashier** — billing (`/checkout`, `/api/webhook/kashier`)
- **Gemini + Firecrawl** — audit/scrape pipeline (`/api/audit`)

## Env vars

See [`.env.example`](.env.example). Required names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional: `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, Kashier keys, Upstash Redis, Google OAuth, Resend.

**Rotate any keys that were previously committed in example env files.**

## Deploy

`output: "standalone"` is enabled. After `npm run build`, run:

```bash
npm run start:standalone
```

Or use `npm start` with the standard Next server.
