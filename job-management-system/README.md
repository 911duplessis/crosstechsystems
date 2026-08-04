# CrossTech Systems — Job Management System

A controlled, central system replacing spreadsheets, WhatsApp, and paper quotes for CrossTech
Systems' end-to-end job lifecycle: enquiry → booking → job → assessment → quote → invoice →
payment, plus stock control and reporting.

**Status: planning phase. No application code has been written yet.** The documents below are
the analysis, architecture, database design, and roadmap for review and approval before any
implementation begins.

## Planning documents

1. [`docs/01-system-analysis.md`](docs/01-system-analysis.md) — business context, roles,
   lifecycle, assumptions, non-functional requirements.
2. [`docs/02-architecture.md`](docs/02-architecture.md) — recommended stack, component
   diagram, role-based access control model, security approach, repo/deploy structure.
3. [`docs/03-database-schema.md`](docs/03-database-schema.md) — full table-by-table schema
   proposal, plus open questions that need your confirmation before Phase 1 build.
4. [`docs/04-mvp-roadmap.md`](docs/04-mvp-roadmap.md) — phase-by-phase implementation plan
   (Phase 0 foundations → Phase 5 automation) and GitHub workflow conventions.

## Next step

Review the four documents above, answer the open questions in
`docs/03-database-schema.md` §3.9, and confirm the plan (or request changes). Once approved,
Phase 0/1 implementation begins on a dedicated feature branch — nothing gets deployed without
a separate explicit go-ahead.
