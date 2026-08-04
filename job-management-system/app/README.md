# CrossTech Systems — Job Management System (app)

Next.js 16 (App Router, TypeScript, Tailwind, shadcn/ui) + Supabase (Postgres, Auth, Storage).
See [`../docs`](../docs) for the system analysis, architecture, database schema, and roadmap
this app implements.

## Status

**Phase 0 through 3 are implemented**: customers, jobs, status tracking, notes, communication
log, attachments, audit log, login (Phase 1); quotes (PDF + staff-recorded approval), quote →
invoice conversion, standalone invoices, payments with auto-derived status and receipts
(Phase 2); product categories, suppliers, products, and an append-only stock ledger with
auto-deduction on invoicing and low-stock/stock-value dashboard widgets (Phase 3). Website
integration (Phase 4) and automation (Phase 5) are not yet built — see
[`../docs/04-mvp-roadmap.md`](../docs/04-mvp-roadmap.md).

No Supabase project has been provisioned yet. Nothing in this app has been deployed.

## Local setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (or run one locally
   via the [Supabase CLI](https://supabase.com/docs/guides/local-development)).
2. **Run the migrations** in `supabase/migrations/` against that project, in order — either
   via `npx supabase db push` (CLI linked to the project) or by pasting each file into the
   Supabase SQL editor in filename order.
3. **Copy `.env.example` to `.env.local`** and fill in the project URL and anon key from
   Supabase → Project Settings → API.
4. **Create your first user**: sign up via Supabase Auth (dashboard → Authentication → Add
   user, or your own sign-up flow), then in the SQL editor promote it to admin:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   (A profile row is created automatically for every new auth user, defaulting to
   `technician` — see `supabase/migrations/0001_profiles.sql`.)
5. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Regenerating database types

`types/database.ts` is hand-written to match the SQL migrations (no live project existed when
it was created). Once a Supabase project is linked, replace it with the generated types and
keep it regenerated after every new migration:

```bash
npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build (also type-checks)
- `npm run lint` — ESLint

## Conventions

- Every schema change is a new file in `supabase/migrations/`, numbered sequentially — never
  edit a migration that's already been applied anywhere.
- Role-based access is enforced in Postgres (Row-Level Security), not just hidden in the UI —
  see the policies in each migration file.
- No deploys without explicit sign-off; this repo/branch is the working copy.
