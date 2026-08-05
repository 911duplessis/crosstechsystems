# 01 — System Analysis

## 1.1 Business context

CrossTech Systems is a South African IT services business (CCTV, networking, installation,
consumables/hardware retail). Operations currently run on spreadsheets, WhatsApp, and paper
quotes. There is no single source of truth for a job's status, no enforced quote → invoice →
payment trail, and no stock visibility. This creates:

- Lost or forgotten enquiries (no forced status progression)
- Inconsistent quoting (no standard template, no VAT enforcement, no expiry control)
- No visibility into technician workload or performance
- No stock reconciliation — no way to know true stock value or reorder points
- No audit trail — disputes over "who approved what, when" can't be resolved

The system being built replaces these manual channels with one controlled workflow, without
trying to solve problems the business doesn't have yet (e.g. multi-branch, multi-tenant,
franchising — none of that is in scope unless the business actually grows into it).

## 1.2 Actors / Roles

| Role | Responsibilities |
|---|---|
| **Administrator** | Full system access. User management, role assignment, system configuration, all data. |
| **Manager** | Full visibility of jobs/quotes/invoices/stock/reporting. Approves discounts, can reassign technicians, cannot manage users/system config. |
| **Sales** | Creates enquiries/bookings, builds quotes, tracks customer communication. Limited stock visibility (read-only pricing), no invoicing/payment access. |
| **Technician** | Sees only jobs assigned to them. Logs notes, fault-finding, materials used, time, before/after photos. Cannot see other technicians' jobs, cannot edit pricing. |
| **Customer** (future — Phase 4/5 portal) | Views own bookings/quotes/invoices, approves quotes online, tracks job status. No write access to internal data. |

## 1.3 Core lifecycle (single source of truth)

The brief describes "Enquiry/Booking" and "Job Creation" as two steps, but in practice they are
the same record at different stages — an enquiry *becomes* a job the moment it's logged, it
doesn't get re-entered into a second system. Modeling them as one `jobs` entity with a
`status` state machine avoids duplicate data entry and matches how the status list is already
written (it starts at "New enquiry").

```
New enquiry → Scheduled → Inspection required → Quote pending → Quote sent →
Approved → Work in progress → Completed → Invoice issued → Paid → Archived
```

Not every job passes through every status (e.g. a simple call-out may skip "Inspection
required"), so status transitions are logged but not rigidly enforced as a strict linear
sequence — enforced only in the sense that every change is timestamped, attributed to a user,
and visible in history. This gives visibility without making the tool fight how real jobs
actually move.

Cancellation/rejection is a real outcome not explicitly listed in the brief — the schema
includes a `cancelled` status (quote rejected, customer withdrew, etc.) so jobs don't get stuck
mid-pipeline with no valid end state.

## 1.4 Key entities identified

Customer, Job, Job Note (technician/internal), Attachment (photo/document, reusable across
jobs/quotes/invoices), Communication Log, Quote, Quote Line Item, Invoice, Invoice Line Item,
Payment, Product, Product Category, Supplier, Stock Movement, User/Profile, Role, Status
History, Audit Log.

## 1.5 Assumptions (flag if wrong)

- Single business entity, single currency (ZAR), single VAT rate (15%, standard SA rate) —
  rate stored as a configurable value, not hardcoded, in case it changes.
- One technician assigned per job at a time (not a crew of many) for MVP. Revisit if the
  business regularly sends multi-person teams.
- Quotes and invoices are business-generated documents (PDF), not requiring a separate
  e-signature product — "approval" is tracked as an in-system action (customer clicks
  approve on a link, or staff capture verbal/WhatsApp approval with a note).
- No accounting-system integration (Xero/Sage/QuickBooks) in this phase — payments are
  recorded manually against invoices. This is a reasonable v1 boundary; can be added later
  without a schema rewrite (`payments.reference_number` already gives an integration hook).
- Photos/documents stored as files (Supabase Storage), not inline blobs in Postgres.

## 1.6 Non-functional requirements

- **Reliability**: this replaces the business's operational memory — data loss is
  unacceptable. Daily automated backups, point-in-time recovery.
- **Auditability**: every status change, price change, and payment is attributed to a user
  and timestamped. Nothing is hard-deleted from financial records (soft-delete/void instead).
- **Mobile-friendly**: technicians work from phones on-site — job detail, notes, and photo
  upload must work well on a small screen and flaky data connections.
- **Role isolation**: a technician must never see another technician's jobs or pricing/cost
  data unless their role permits it. Enforced at the database layer (Postgres RLS), not just
  hidden in the UI.
