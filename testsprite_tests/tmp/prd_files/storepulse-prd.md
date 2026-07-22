# StorePulse AI — Product Requirements

## Overview
StorePulse AI is an AI-powered e-commerce audit platform. It analyzes store and product pages in ~60 seconds, producing deterministic scores for CRO, SEO, GEO/AI visibility, and Trust, plus competitor benchmarking, AI content generation, PDF reports, and Kashier billing.

## Core User Flows

### 1. Authentication
- **Login**: `/login` — email/password via Supabase
- **Signup**: `/signup` — create account, then onboarding
- **Test credentials**: storepulse.testsprite@gmail.com / TestSprite!2026

### 2. Onboarding
- New users complete `/onboarding` quiz (platform, store URL, goals)
- Answers persisted via `POST /api/onboarding`
- Redirect to `/dashboard` on completion

### 3. Audit Workflow
1. User visits `/audit/new`
2. Submits product URL (single page) or store URL (full crawl)
3. Progress shown at `/audit/[id]/scanning`
4. Results at `/audit/[id]/report` with scores, issues, recommendations

### 4. Report Actions
- **PDF export**: Download button on report page
- **Compare**: `/audit/[id]/compare` — competitor URL comparison
- **Generate**: `/audit/[id]/generate` — AI-optimized copy from audit

### 5. Dashboard & History
- `/dashboard` — recent audits, score trends, usage
- `/history` — browse all past audits

### 6. Monitoring
- `/watch` — active monitoring jobs
- `/watch/alerts` — score change alerts
- Setup from report page

### 7. Billing
- `/pricing` — plan comparison
- `/settings/billing` — current plan and upgrade
- `/checkout` — Kashier payment initiation

### 8. Tools
- `/tools/content-improver` — standalone AI copy improvement (Pro plan)

## Technical Stack
- Next.js 16 App Router, React 19, TypeScript
- Supabase Auth + PostgreSQL
- Firecrawl scraping, Gemini AI interpretation
- Kashier payments (EGP)

## Test Scope Priorities
1. Login and dashboard with seeded data
2. Full audit flow: new audit → scanning → report
3. Report PDF export
4. History and dashboard navigation
5. Onboarding for new signup
6. Pricing and billing pages
7. Competitor comparison
8. AI content generation
9. Settings usage page
10. Monitoring watchlist (if data available)

## Constraints for Automated Testing
- Do NOT use Google OAuth in headless mode
- Use unique emails for signup tests (storepulse.testsprite+<random>@gmail.com)
- Run against production build on port 3000
- Test user has completed onboarding and one seeded audit
