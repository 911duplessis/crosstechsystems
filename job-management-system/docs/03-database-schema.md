# 03 — Database Schema Proposal

PostgreSQL (Supabase). This is the proposed logical schema — actual migrations will be created
as versioned SQL files under `supabase/migrations/` once Phase 1 implementation is approved.

Conventions: `uuid` primary keys (`gen_random_uuid()`), `created_at`/`updated_at` timestamps on
every table, soft-delete via status/void fields for financial records (never hard-delete a
quote/invoice), money stored as `numeric(12,2)`.

## 3.1 Entity relationship overview

```
profiles (users) ──┬── jobs ───┬── job_notes
                    │           ├── job_status_history
                    │           ├── communication_logs
                    │           ├── attachments (polymorphic)
                    │           ├── quotes ── quote_line_items
                    │           └── invoices ── invoice_line_items
                    │                       └── payments
customers ──────────┴── jobs
                        quotes
                        invoices
                        communication_logs

product_categories ── products ──┬── quote_line_items
suppliers ─────────── products   ├── invoice_line_items
                                  └── stock_movements

audit_logs (references any entity, generic)
```

## 3.2 Core tables

### `profiles`
Extends `auth.users` (Supabase). One row per staff user.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| full_name | text | |
| email | text | mirrors auth email |
| phone | text | |
| role | enum: `admin, manager, sales, technician, customer` | drives RLS |
| is_active | boolean default true | deactivate instead of delete |
| created_at / updated_at | timestamptz | |

### `customers`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_type | enum: `individual, business` | |
| name | text | contact name, or business name if type=business |
| company_name | text nullable | |
| email | text | |
| phone | text | |
| address_line1 / address_line2 | text | |
| city | text | |
| postal_code | text | |
| notes | text | general customer notes |
| auth_user_id | uuid nullable, FK → auth.users | populated when customer portal (Phase 4/5) grants login |
| created_by | uuid FK → profiles | |
| created_at / updated_at | timestamptz | |

### `jobs`
The central entity — covers enquiry → booking → job → completion → archive as one lifecycle.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| job_number | text unique | e.g. `CTS-2026-0001`, generated server-side, sequential |
| customer_id | uuid FK → customers | |
| assigned_technician_id | uuid nullable, FK → profiles | |
| service_requested | text | free text / short description |
| service_category | text nullable | e.g. CCTV, Networking, Cabling — informs stock/reporting |
| priority | enum: `low, normal, high, urgent` | |
| status | enum (see 3.3) | |
| source | enum: `phone, whatsapp, email, walk_in, website, referral` | |
| site_address_line1 / line2 / city / postal_code | text | job site, may differ from customer billing address |
| preferred_date | date nullable | customer's requested date |
| scheduled_date | timestamptz nullable | confirmed appointment |
| completed_at | timestamptz nullable | |
| archived_at | timestamptz nullable | |
| created_by | uuid FK → profiles | |
| created_at / updated_at | timestamptz | |

### `job_status_history`
Every status transition, immutable audit trail.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| job_id | uuid FK → jobs | |
| old_status | text nullable | |
| new_status | text | |
| note | text nullable | |
| changed_by | uuid FK → profiles | |
| changed_at | timestamptz default now() | |

### `job_notes`
Technician notes, fault-finding, materials/labour estimates, internal comments — one table,
distinguished by `note_type` to avoid four near-identical tables.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| job_id | uuid FK → jobs | |
| note_type | enum: `fault_finding, materials_required, labour_estimate, internal_comment, general` | |
| content | text | |
| time_estimate_hours | numeric(5,2) nullable | only meaningful for labour_estimate notes |
| author_id | uuid FK → profiles | |
| created_at | timestamptz | |

### `attachments`
Polymorphic — reused for job photos (before/after), quote/invoice PDFs, customer documents.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| entity_type | enum: `job, quote, invoice, customer` | |
| entity_id | uuid | not a FK (polymorphic) — validated in app layer |
| file_path | text | Supabase Storage object path |
| file_type | text | mime type |
| caption | text nullable | e.g. "before", "after", "fault photo" |
| uploaded_by | uuid FK → profiles | |
| created_at | timestamptz | |

### `communication_logs`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_id | uuid FK → customers | |
| job_id | uuid nullable, FK → jobs | |
| channel | enum: `phone, whatsapp, email, in_person, sms` | |
| direction | enum: `inbound, outbound` | |
| summary | text | |
| logged_by | uuid FK → profiles | |
| occurred_at | timestamptz default now() | |

## 3.3 Job status enum

```sql
create type job_status as enum (
  'new_enquiry',
  'scheduled',
  'inspection_required',
  'quote_pending',
  'quote_sent',
  'approved',
  'work_in_progress',
  'completed',
  'invoice_issued',
  'paid',
  'archived',
  'cancelled'      -- not in original list; needed as a valid terminal state
);
```

## 3.4 Quotation system

### `quotes`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| quote_number | text unique | e.g. `QT-2026-0001` |
| job_id | uuid FK → jobs | |
| customer_id | uuid FK → customers | denormalized for query convenience |
| status | enum: `draft, sent, approved, rejected, expired` | |
| issue_date | date | |
| expiry_date | date | |
| subtotal | numeric(12,2) | sum of line totals before discount/tax |
| discount_type | enum: `none, percent, fixed` | |
| discount_value | numeric(12,2) default 0 | |
| discount_amount | numeric(12,2) | computed |
| tax_rate | numeric(5,2) default 15.00 | VAT %, configurable not hardcoded |
| tax_amount | numeric(12,2) | computed |
| total | numeric(12,2) | |
| terms_and_conditions | text | |
| approved_at | timestamptz nullable | |
| approved_by_note | text nullable | e.g. "Verbal approval via call, confirmed by WhatsApp" |
| created_by | uuid FK → profiles | |
| created_at / updated_at | timestamptz | |

### `quote_line_items`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| quote_id | uuid FK → quotes | |
| item_type | enum: `labour, product` | |
| product_id | uuid nullable, FK → products | null for labour lines |
| description | text | |
| quantity | numeric(10,2) | |
| unit_price | numeric(12,2) | |
| line_discount_percent | numeric(5,2) default 0 | |
| line_total | numeric(12,2) | computed |
| sort_order | int | |

## 3.5 Invoicing

### `invoices`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| invoice_number | text unique | e.g. `INV-2026-0001` |
| quote_id | uuid nullable, FK → quotes | null if invoiced directly without a quote |
| job_id | uuid FK → jobs | |
| customer_id | uuid FK → customers | |
| status | enum: `unpaid, partial, paid, overdue, cancelled` | |
| issue_date | date | |
| due_date | date | |
| subtotal / discount_amount / tax_rate / tax_amount / total | numeric(12,2) | same computed pattern as quotes |
| amount_paid | numeric(12,2) default 0 | denormalized running total from `payments` |
| balance_due | numeric(12,2) | computed = total - amount_paid |
| created_by | uuid FK → profiles | |
| created_at / updated_at | timestamptz | |

`status` is derived (via trigger) from `amount_paid` vs `total` vs `due_date`, not
hand-set — prevents "paid" invoices with an outstanding balance due to a manual mistake.

### `invoice_line_items`
Same shape as `quote_line_items`, copied at conversion time so historic invoices remain
correct even if product prices change later.

### `payments`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| invoice_id | uuid FK → invoices | |
| amount | numeric(12,2) | |
| payment_method | enum: `cash, eft, card, other` | |
| payment_date | date | |
| reference_number | text nullable | bank ref, receipt number — future accounting-system hook |
| recorded_by | uuid FK → profiles | |
| created_at | timestamptz | |

Receipts are generated on demand from a payment record + its invoice (PDF), not stored as a
separate persisted entity.

## 3.6 Stock management

### `product_categories`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "CCTV Cameras", "Network Equipment", "Cables", "Tools", "Consumables" |
| parent_category_id | uuid nullable, FK → product_categories | allows sub-categories if needed |

### `suppliers`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| contact_name | text nullable | |
| phone / email | text | |
| address | text | |
| notes | text | |

### `products`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| sku | text unique | |
| name | text | |
| description | text | |
| category_id | uuid FK → product_categories | |
| supplier_id | uuid nullable, FK → suppliers | |
| cost_price | numeric(12,2) | |
| selling_price | numeric(12,2) | |
| unit | text default 'each' | e.g. "each", "meter", "box" |
| stock_quantity | numeric(10,2) default 0 | denormalized, kept in sync by stock_movements trigger |
| min_stock_level | numeric(10,2) default 0 | triggers low-stock alert |
| is_active | boolean default true | |
| website_visible | boolean default false | Phase 4 hook — not used until website integration |
| created_at / updated_at | timestamptz | |

### `stock_movements`
Append-only ledger — `products.stock_quantity` is a cache maintained by trigger, this table is
the source of truth.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| product_id | uuid FK → products | |
| movement_type | enum: `purchase_in, job_usage, sale, adjustment, return` | |
| quantity_change | numeric(10,2) | positive = stock in, negative = stock out |
| reference_type | enum: `job, invoice, manual` nullable | |
| reference_id | uuid nullable | polymorphic, not FK |
| notes | text nullable | |
| created_by | uuid FK → profiles | |
| created_at | timestamptz default now() | |

## 3.7 Audit log

### `audit_logs`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles | |
| action | text | e.g. `status_change, price_edit, payment_recorded, user_role_changed` |
| entity_type | text | |
| entity_id | uuid | |
| old_values | jsonb nullable | |
| new_values | jsonb nullable | |
| created_at | timestamptz default now() | |

Populated by Postgres triggers on `jobs`, `quotes`, `invoices`, `payments`, `profiles` — not
solely by application code, so it can't be silently skipped by a bug or a direct DB edit from
the Supabase dashboard.

## 3.8 Numbering scheme

Job/quote/invoice numbers are generated by a Postgres sequence-backed function, not
client-side, to guarantee no gaps or collisions under concurrent use:
`{PREFIX}-{YEAR}-{4-digit sequence}` — e.g. `CTS-2026-0007`, `QT-2026-0007`,
`INV-2026-0007`, resetting to `0001` each calendar year. **Confirmed.**

## 3.9 Decisions confirmed

1. **Numbering**: `CTS-` (jobs) / `QT-` (quotes) / `INV-` (invoices), yearly reset as
   modeled in §3.8.
2. **VAT**: flat 15% standard SA rate on every quote/invoice, no per-document exemption
   override in MVP. `tax_rate` stays a stored column (not hardcoded) so it can be adjusted if
   the rate changes nationally, but there is no per-job exemption UI for now.
3. **Job assignment**: single `assigned_technician_id` on `jobs`, as modeled in §3.2 — no
   `job_technicians` join table for MVP.
4. **Quote approval**: staff-recorded approval only for MVP — `quotes.approved_by_note`
   captures how approval was obtained (e.g. "approved via WhatsApp call"). No customer-facing
   approve-link in Phase 2; that becomes a Phase 4/5 portal feature once customers have
   accounts (`customers.auth_user_id`).
