# CrossTech Systems — Job Management System

A controlled, central system replacing spreadsheets, WhatsApp, and paper quotes for CrossTech
Systems' end-to-end job lifecycle: enquiry → booking → job → assessment → quote → invoice →
payment, plus stock control and reporting.

**Status: Phase 0 through 3 are implemented** (Next.js/Supabase app scaffold, authentication,
role-based access, customers, jobs, status tracking, notes, communication log, attachments,
audit log, quotes with PDF + approval tracking, quote-to-invoice conversion, standalone
invoices, payments with auto-derived status and receipts, and stock management — categories,
suppliers, products, and a stock ledger that deducts automatically when a product-linked
invoice line item is created). Website integration (Phase 4) onward is not yet built. Nothing
has been deployed — see [`app/README.md`](app/README.md) for local setup.

## Planning documents

1. [`docs/01-system-analysis.md`](docs/01-system-analysis.md) — business context, roles,
   lifecycle, assumptions, non-functional requirements.
2. [`docs/02-architecture.md`](docs/02-architecture.md) — recommended stack, component
   diagram, role-based access control model, security approach, repo/deploy structure.
3. [`docs/03-database-schema.md`](docs/03-database-schema.md) — full table-by-table schema
   proposal, plus open questions that need your confirmation before later phases.
4. [`docs/04-mvp-roadmap.md`](docs/04-mvp-roadmap.md) — phase-by-phase implementation plan
   (Phase 0 foundations → Phase 5 automation) and GitHub workflow conventions.

## Application

The implementation lives in [`app/`](app) — see [`app/README.md`](app/README.md) for local
setup (Supabase project, environment variables, running migrations, creating the first admin
user).

## Next step

Review the app, confirm Phase 1 covers what's needed, then proceed to Phase 2
(quotes/invoices/payments) — or request changes first.
