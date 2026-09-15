-- 0009_grants.sql
-- Recent Supabase versions stopped auto-exposing newly created tables to the
-- Data API roles (see config.toml's `auto_expose_new_tables`, deprecated and
-- defaulting to off) — a table with perfect RLS policies still returns
-- "permission denied" for `authenticated` without a base SQL GRANT, since
-- privilege checks happen before RLS is ever evaluated. Every table in
-- 0001-0008 relied on the old auto-expose behaviour; this grants the
-- underlying privileges RLS was always meant to be the *only* real
-- restriction on top of, and defaults future tables the same way so this
-- can't be forgotten again in Phase 4/5 migrations.
--
-- `anon` is deliberately not granted anything: every table currently
-- requires authentication, and least-privilege means not handing out table
-- access nothing is meant to use yet (Phase 4's public catalogue reads will
-- get their own narrow grant/policy when that table-facing feature exists).

grant usage on schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
