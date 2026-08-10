# Supabase security hardening (production)

## Repository-managed (migrations)

Migration `20260810160000_lock_security_definer_execute.sql`:

- Revokes client `EXECUTE` on trigger-only / internal `SECURITY DEFINER` functions (`handle_new_user`, `profiles_protect_onboarding_completed_at`, `workspaces_protect_plan_id`, `rls_auto_enable`, `can_write_audit`).
- Keeps `is_workspace_member` / `has_workspace_role` executable by **`authenticated`** (required by SELECT RLS policies).
- Revokes those helpers from **`anon`**.
- Reaffirms `try_consume_usage_quota` is **`service_role` / `postgres` only**.
- Reaffirms `search_path = public` (or `pg_catalog` for `rls_auto_enable`) on hardened functions.
- Re-drops legacy authenticated write policies on audit/billing pipeline tables (service-role API writes unchanged).

Apply with your normal Supabase migration workflow before relying on production advisors going green for EXECUTE warnings.

## Dashboard-only (not migratable safely)

### Leaked password protection

Supabase Auth advisor: **Leaked Password Protection Disabled**.

This cannot be enabled via SQL migrations in the app repo. Enable it in the Supabase Dashboard:

1. Open the project → **Authentication** → **Providers** → **Email** (or **Auth** → **Attack Protection** depending on dashboard version).
2. Enable **Leaked password protection** (HaveIBeenPwned check).
3. Save.

Docs: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Do this in **production** (and staging if used for auth testing). No application code change is required.
