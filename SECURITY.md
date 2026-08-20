# Security Policy

## Supported versions

Security fixes are applied on the `main` branch for the production deployment at [https://www.convaudit.com](https://www.convaudit.com).

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security-sensitive reports.

Email the maintainers via the contact channel listed on [https://www.convaudit.com](https://www.convaudit.com), or open a **private** security advisory on GitHub if available for this repository.

Include:

- Affected URL or component (API route, auth, billing, RLS, etc.)
- Steps to reproduce
- Impact assessment (data exposure, privilege escalation, payment bypass)
- Your contact details for follow-up

We aim to acknowledge reports within a few business days.

## Secrets

Never commit API keys, service-role tokens, webhook secrets, or customer data.
Use `.env.example` as the template; keep real values in Vercel / local `.env` only.
