# 02 — Recommended Architecture

## 2.1 Stack decision

| Layer | Choice | Why |
|---|---|---|
| Frontend + backend | **Next.js 14+ (App Router), TypeScript** | Single deployable app: server components for data-heavy pages (job lists, dashboards), server actions/route handlers for mutations. No separate API service to operate. |
| Database | **Supabase (managed PostgreSQL)** | Relational integrity matters here (jobs → quotes → invoices → payments must stay consistent) — not a document-store problem. Supabase adds auth, storage, and row-level security on top of plain Postgres for free. |
| Auth | **Supabase Auth** (email/password to start) | Built into the same platform as the DB; issues JWTs that RLS policies read directly (`auth.uid()`), so permission logic isn't duplicated in app code. |
| Authorization | **Postgres Row-Level Security (RLS)**, role stored on `profiles` | Enforced at the data layer — a bug in a UI component can't leak another technician's jobs, because the database itself refuses the query. |
| File storage | **Supabase Storage** (private buckets) | Before/after photos, quote/invoice PDFs, customer documents. Signed URLs, same platform, same auth. |
| UI components | **Tailwind CSS + shadcn/ui** | Accessible, unstyled-by-default primitives that are easy to keep consistent across ~15 screens without a design team. Mobile-responsive by default. |
| Forms/validation | **React Hook Form + Zod** | Shared validation schema between client-side form and server action — one source of truth for "what is a valid job/quote/invoice". |
| Data fetching | **Supabase JS client + React Server Components**, TanStack Query for client-side interactive views (e.g. live job board) | Avoids a redundant GraphQL/REST layer for a single-consumer app. |
| PDF generation | **@react-pdf/renderer** (server-side) for quotes/invoices | Runs in the Next.js server, no third-party document service dependency for a core business function. |
| Hosting | **Vercel** (Next.js app) + **Supabase Cloud** (DB/auth/storage) | Both have generous free/low tiers, first-class Next.js support, zero server management. |
| Notifications (Phase 5) | Email via **Resend**, WhatsApp via **WhatsApp Business Cloud API** (Meta) or Twilio as fallback | Deferred — not needed for MVP, flagged now so schema/env-config leaves room for it. |

### Why not a separate backend (Node/Express, NestJS, etc.)?
The business needs one reliable internal tool, not a public multi-client API platform yet.
Next.js server actions + Supabase already give a typed, secure server layer. Introducing a
separate backend service now would be complexity the business doesn't need to operate or pay
for. If Phase 4 (public website integration) later needs a stable public API contract
independent of the internal app's release cycle, that's the point to peel off dedicated API
routes — not before.

### Why not Firebase / a NoSQL store?
The core data (job → quote → invoice → payment → stock movement) is inherently relational with
strict consistency requirements (e.g. invoice totals must match line items; stock quantities
must reconcile with movements). Postgres with real foreign keys and transactions is the right
tool; a document database would push that integrity logic into application code where it's
easier to get wrong.

## 2.2 High-level component diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App (Vercel)                    │
│                                                                │
│  ┌───────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  Public site   │  │  Internal app   │  │  Customer portal │  │
│  │  (existing     │  │  (auth-gated)   │  │  (Phase 4/5,     │  │
│  │  marketing +   │  │  /admin/*       │  │  read-only)      │  │
│  │  future        │  │  Customers,     │  │                  │  │
│  │  catalogue)    │  │  Jobs, Quotes,  │  │                  │  │
│  │                │  │  Invoices,      │  │                  │  │
│  │                │  │  Stock, Reports │  │                  │  │
│  └───────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│          │                    │                     │           │
└──────────┼────────────────────┼─────────────────────┼───────────┘
           │                    │                     │
           └────────────────────┼─────────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │   Supabase Platform     │
                    │  ─────────────────────  │
                    │  Postgres (RLS enforced)│
                    │  Auth (JWT)             │
                    │  Storage (photos/PDFs)  │
                    │  Scheduled functions    │
                    │  (Phase 5 reminders)    │
                    └────────────────────────┘
```

## 2.3 Role-based access control model

Roles live in a `role` enum on `profiles`, one row per authenticated user (`profiles.id =
auth.users.id`). Every RLS policy checks the caller's role via a `SECURITY DEFINER` helper
function (`current_role()`), not per-table duplicated logic. Summary of enforced access:

| Table | Admin | Manager | Sales | Technician | Customer (future) |
|---|---|---|---|---|---|
| customers | full | full | full | read (own jobs' customer only) | own record only |
| jobs | full | full | create/read/update (not assign-only fields) | read/update **own assigned** jobs only | read **own** jobs |
| quotes/invoices | full | full | full | none | read **own** |
| payments | full | full | read | none | none |
| products/stock | full | full | read (price only) | read (for job material logging) | none (Phase 4: read public catalogue subset) |
| audit_logs | read | read | none | none | none |
| profiles/users | full (manage) | read | none | own profile only | own profile only |

This is enforced in Postgres policies, not just hidden nav links — a technician's Supabase
JWT literally cannot `SELECT` another technician's job rows.

## 2.4 Security & compliance

- **Audit log**: append-only `audit_logs` table capturing user, action, entity, before/after
  values (JSONB) for status changes, price edits, payment records, user role changes.
  Populated via Postgres triggers on sensitive tables (not app-code, so it can't be bypassed).
- **Backups**: Supabase daily automated backups (Point-in-Time Recovery on paid tier —
  recommended given this becomes the operational system of record).
- **Secrets**: Supabase service-role key never shipped to the client; only used in server
  actions/route handlers. Public anon key + RLS handles all client-side reads.
- **Financial records are never hard-deleted**: quotes/invoices support a `void`/`cancelled`
  state instead of deletion, preserving numbering sequence and audit trail.

## 2.5 Repository structure decision

The current repo (`911duplessis/crosstechsystems`) hosts the public marketing site
(`index.html` at root, static). The job management system is a full Next.js application with
its own build/deploy lifecycle — bundling it at the repo root would conflict with the existing
static site's file layout and deploy target.

**Recommendation**: build the app inside this repo under `/job-management-system/app` (this
branch, this repo) rather than a new repository — it keeps one Git history for the business,
avoids provisioning new GitHub access, and Vercel can be pointed at that subdirectory as its
own project root. If later the two need fully independent CI/deploy cadences, splitting is a
straightforward `git subtree`/history-preserving extraction — not a decision that needs to be
made now.

Planned structure once coding starts (Phase 1):

```
job-management-system/
├── docs/                     # this planning documentation
├── app/                      # Next.js App Router
│   ├── (auth)/                # login, password reset
│   ├── (internal)/            # role-gated app: jobs, customers, quotes...
│   ├── api/                   # route handlers (webhooks, PDF generation)
│   └── layout.tsx
├── components/                # shared UI components (shadcn-based)
├── lib/
│   ├── supabase/               # client/server Supabase helpers
│   ├── validation/              # Zod schemas (shared client/server)
│   └── pdf/                    # quote/invoice PDF templates
├── supabase/
│   ├── migrations/              # versioned SQL migrations (source of truth for schema)
│   └── seed.sql
├── types/                     # generated Supabase DB types
├── .env.example
├── package.json
└── README.md
```

## 2.6 Environments

- **Local dev**: Supabase local CLI (Docker) or a dedicated dev Supabase project.
- **Staging**: separate Supabase project + Vercel preview deployments per PR.
- **Production**: dedicated Supabase project, deployed only from `main` after review —
  never deployed automatically from a feature branch.

No deployment will happen without explicit confirmation, per your instruction — this section
describes the target setup, not something being provisioned now.
