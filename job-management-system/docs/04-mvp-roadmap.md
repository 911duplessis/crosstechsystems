# 04 — MVP Implementation Plan

Build order follows the brief's phasing. Each phase ships something the business can actually
use, rather than one large release at the end. No phase starts coding until the previous one
is confirmed working.

## Phase 0 — Foundations (before any feature work)

- Scaffold Next.js app in `job-management-system/app`, TypeScript, Tailwind, shadcn/ui.
- Create Supabase project (dev), wire up env config, `.env.example`.
- First migration: `profiles` table + role enum + Supabase Auth integration.
- Base layout: authenticated shell, role-aware navigation, login/logout.
- CI: lint + typecheck on PR (GitHub Actions).

**Exit criteria**: an admin user can log in and see an empty dashboard shell. Nothing else yet.

## Phase 1 — Customers, Jobs, Status Tracking, Notes, Login

- `customers` table + CRUD screens (list, create, edit, detail with communication history).
- `jobs` table + status enum + job number generator.
- Job creation flow (linked to customer), technician assignment.
- Status change UI, backed by `job_status_history` (every change logged, visible as a timeline
  on the job detail page).
- `job_notes` (fault-finding, materials, labour estimate, internal comment).
- `attachments`: photo/document upload to Supabase Storage, attached to a job.
- `communication_logs`: manually logged call/WhatsApp/email entries against a customer or job.
- Role-based visibility: technician sees only assigned jobs; sales/manager/admin see all.
- Simple job list/board view (filter by status, technician, priority).

**Exit criteria**: a real enquiry can be logged, assigned, worked, and moved through statuses
to "Completed" — replacing the spreadsheet for this slice end-to-end.

## Phase 2 — Quotes, Invoices, Payments

- `quotes` + `quote_line_items`: builder UI (add labour/product lines, discount, VAT,
  auto-totals), PDF generation, expiry date, status (draft/sent/approved/rejected/expired).
- Quote → Job status sync (sending a quote moves job to "Quote sent"; approval moves it to
  "Approved").
- `invoices` + `invoice_line_items`: convert an approved quote to an invoice (copies line
  items so historic invoices are immutable even if prices change later), or create a
  standalone invoice.
- `payments`: record payments against an invoice, auto-derive invoice status
  (unpaid/partial/paid/overdue) via trigger.
- PDF receipt generation on payment.
- Manager-level discount approval rule (configurable threshold — confirm with you before
  building).

**Exit criteria**: a completed job can be quoted, approved, invoiced, and paid — fully
replacing paper quotes for this slice.

## Phase 3 — Stock Management

- `product_categories`, `suppliers`, `products` CRUD.
- `stock_movements` ledger; `products.stock_quantity` kept in sync via trigger.
- Low-stock alerts (dashboard widget + list view) based on `min_stock_level`.
- Link products into quote/invoice line items (already modeled in Phase 2 schema) — selecting
  a product on a quote/invoice pulls price and (on invoice/job completion) deducts stock via a
  `job_usage` movement.
- Stock value report (sum of `stock_quantity * cost_price`).

**Exit criteria**: stock quantities update automatically as jobs consume materials and
purchases come in; no more manual stock spreadsheet.

## Phase 4 — Website Product Integration (prep, not full public site rebuild)

- `products.website_visible` flag + minimal public read API (route handler) for approved
  products only — cost price and internal fields never exposed.
- Public catalogue page (can live alongside or link from the existing marketing site).
- Public quote-request form and booking form → creates a `jobs` row with
  `status = new_enquiry`, `source = website` (reuses Phase 1 pipeline, no parallel system).
- Customer portal groundwork: `customers.auth_user_id`, RLS policies for `customer` role
  already modeled in Phase 3.x of the schema — build the actual portal screens here.

**Exit criteria**: a customer can request a quote or booking from the website and it lands
directly in the internal job pipeline as a "New enquiry" — no manual re-entry.

## Phase 5 — Automation

- Email notifications (Resend): quote sent, invoice sent, payment received, job status
  changes relevant to the customer.
- WhatsApp notifications (WhatsApp Business Cloud API): booking confirmation, technician
  on-the-way, invoice reminder — pending your confirmation of a WhatsApp Business account.
  Twilio is the fallback provider if Meta's direct API isn't set up.
  This phase requires connector credentials only you can provision; the app is built to be
  provider-agnostic behind a single notifications service so swapping provider later is
  contained.
- Reminder jobs (Supabase scheduled functions / cron): overdue invoice reminders, upcoming
  scheduled jobs, low-stock alerts.
- Monthly report generation (revenue, outstanding invoices, technician performance,
  best-selling products) — exportable PDF/CSV, feeding the Phase 1-3 dashboard widgets built
  incrementally rather than as one big reporting phase.

**Exit criteria**: routine follow-ups (payment reminders, status updates) no longer require a
staff member to remember to send a WhatsApp message.

## Dashboard & reporting

Not a separate phase — dashboard widgets are added incrementally as their underlying data
exists (active jobs count after Phase 1, revenue/outstanding invoices after Phase 2, stock
value/best-sellers after Phase 3). Building an empty dashboard shell upfront and filling it in
avoids a disconnected "reporting phase" built on stale assumptions.

## GitHub workflow conventions

- `main` is always deployable; no direct commits to `main`.
- One feature branch per phase-slice (e.g. `feature/jms-customers-crud`,
  `feature/jms-quote-builder`), branched from `main`, merged via PR after review — not one
  giant branch for an entire phase.
- Commits are small and descriptive (`feat(jobs): add status history timeline`,
  `fix(quotes): correct VAT rounding on line totals`).
- Database changes always go through a numbered migration file in
  `supabase/migrations/`, never a manual schema edit in the Supabase dashboard on
  staging/production — local dev iteration is fine, but the migration file is the record of
  truth that gets committed.
- `README.md` at the app root kept current with local setup steps (env vars, `npm install`,
  running migrations) as each phase adds new requirements.
- No deploys to production without your explicit go-ahead, even once CI is green.

## Sequencing summary

```
Phase 0  Foundations              ─┐
Phase 1  Customers/Jobs/Status     │  MVP — usable replacement for
Phase 2  Quotes/Invoices/Payments  │  spreadsheets + WhatsApp + paper quotes
Phase 3  Stock Management         ─┘
Phase 4  Website integration         (extends reach, not core ops)
Phase 5  Automation                  (removes manual follow-up work)
```

Each phase is proposed as its own review checkpoint — implementation on a phase does not begin
until the prior phase is confirmed working and this plan (or an updated version of it) is
approved by you.
