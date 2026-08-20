import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const LOCK_MIGRATION = "supabase/migrations/20260818172205_lock_stores_writes.sql";
const SCHEMA_MIGRATION = "supabase/migrations/20260728140000_audit_engine_schema.sql";

describe("stores RLS lock", () => {
  const lockSql = readFileSync(resolve(LOCK_MIGRATION), "utf8");
  const schemaSql = readFileSync(resolve(SCHEMA_MIGRATION), "utf8");

  it("drops the authenticated write policy and does not recreate it", () => {
    expect(lockSql).toContain('drop policy if exists "Members can write stores" on public.stores');
    expect(lockSql).not.toMatch(/create policy ["']Members can write stores["']/i);
  });

  it("revokes client INSERT/UPDATE/DELETE while keeping service_role writes", () => {
    expect(lockSql).toMatch(
      /revoke insert,\s*update,\s*delete on public\.stores from anon,\s*authenticated/i
    );
    expect(lockSql).toMatch(/grant all on public\.stores to service_role/i);
    expect(lockSql).toMatch(/grant select on public\.stores to authenticated/i);
  });

  it("keeps workspace-scoped SELECT so cross-workspace access stays blocked", () => {
    expect(schemaSql).toContain(
      "on public.stores for select using (public.is_workspace_member(workspace_id))"
    );
    expect(lockSql).not.toContain('drop policy if exists "Members can read stores"');
    expect(lockSql).not.toMatch(/disable row level security/i);
  });
});
