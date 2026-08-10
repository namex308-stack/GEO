# End-to-end tests (Playwright)

Two suites — do not mix expectations.

## CI (deterministic) — `npm run test:e2e`

Project: `ci` under `e2e/ci/`.

Always runs:

1. Landing page loads
2. Auth page + invalid-credential rejection (no session bypass)
3. Unauthorized `POST /api/audit` → 401/503

Optional when credentials are set (still CI-safe, no live crawl):

| Env | Effect |
|-----|--------|
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | Enables SSRF rejection test |
| `E2E_STORE_URL` | Needed if that user must complete onboarding |
| `E2E_EXPECT_FREE_PLAN=1` | Enables competitor plan-lock assertion |

## Live smoke — `npm run test:e2e:smoke`

Project: `smoke` under `e2e/smoke/`. **Skipped unless `E2E_SMOKE=1`.**

Runs the full merchant journey against a real store URL (login → onboarding → audit → report with a real `overallScore`). Requires working crawl/AI configuration. Does not invent fixture audit results.

Required:

```
E2E_SMOKE=1
E2E_USER_EMAIL=
E2E_USER_PASSWORD=
E2E_STORE_URL=https://…
```

Optional: `PLAYWRIGHT_BASE_URL` to point at an already-running deployment (skips local `next start`).

## Notes

- Secrets must live in the environment / CI secret store — never commit them.
- Default verification uses the `ci` project only so external Firecrawl/Gemini are not required in CI.
