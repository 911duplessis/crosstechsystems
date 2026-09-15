-- 0007_quotes_invoices_payments.sql
-- Quotation and invoicing. Totals (subtotal/discount/tax/total) are always
-- server-computed from line items via trigger — never trusted from the
-- client — so a quote or invoice can never display a total that doesn't
-- match its lines. Approval is staff-recorded (a note + timestamp captured
-- by whoever confirms the customer's verbal/WhatsApp/email approval), not a
-- customer-facing e-signature flow — that's a later phase if ever needed.

create type quote_status as enum ('draft', 'sent', 'approved', 'rejected', 'expired');
create type invoice_status as enum ('unpaid', 'partial', 'paid', 'overdue', 'cancelled');
create type discount_type as enum ('none', 'percent', 'fixed');
create type line_item_type as enum ('labour', 'product');
create type payment_method as enum ('cash', 'eft', 'card', 'other');

create sequence public.quote_number_seq;
create sequence public.invoice_number_seq;

-- ============================================================= quotes ====

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text unique,
  job_id uuid not null references public.jobs (id),
  customer_id uuid not null references public.customers (id),
  status quote_status not null default 'draft',
  issue_date date not null default current_date,
  expiry_date date,
  subtotal numeric(12, 2) not null default 0,
  discount_type discount_type not null default 'none',
  discount_value numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 15.00,
  tax_amount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  terms_and_conditions text,
  approved_at timestamptz,
  approved_by_note text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotes_job_id_idx on public.quotes (job_id);
create index quotes_customer_id_idx on public.quotes (customer_id);

create trigger set_quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

create function public.generate_quote_number()
returns trigger
language plpgsql
as $$
begin
  if new.quote_number is null then
    new.quote_number := 'QT-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.quote_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger quotes_set_quote_number
  before insert on public.quotes
  for each row execute function public.generate_quote_number();

create table public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  item_type line_item_type not null default 'product',
  -- No FK to products yet — stock (Phase 3) doesn't exist. Phase 3's
  -- migration adds `alter table quote_line_items add constraint ... foreign
  -- key (product_id) references products (id)` once it does.
  product_id uuid,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  line_discount_percent numeric(5, 2) not null default 0,
  line_total numeric(12, 2) not null default 0,
  sort_order int not null default 0
);

create index quote_line_items_quote_id_idx on public.quote_line_items (quote_id);

-- Single trigger function does the whole computed-columns pass in one atomic
-- step (subtotal -> discount -> tax -> total), so nothing can observe a
-- half-updated total, and there's no ordering dependency between separate
-- triggers to reason about.
create function public.recalc_quote_before_write()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_subtotal numeric(12, 2);
begin
  select coalesce(sum(line_total), 0) into v_subtotal
  from public.quote_line_items where quote_id = new.id;

  new.subtotal := v_subtotal;
  new.discount_amount := case new.discount_type
    when 'percent' then round(v_subtotal * new.discount_value / 100, 2)
    when 'fixed' then new.discount_value
    else 0
  end;
  new.tax_amount := round((v_subtotal - new.discount_amount) * new.tax_rate / 100, 2);
  new.total := v_subtotal - new.discount_amount + new.tax_amount;

  return new;
end;
$$;

create trigger quotes_recalc_before_write
  before insert or update on public.quotes
  for each row execute function public.recalc_quote_before_write();

create function public.compute_line_total()
returns trigger
language plpgsql
as $$
begin
  new.line_total := round(new.quantity * new.unit_price * (1 - new.line_discount_percent / 100), 2);
  return new;
end;
$$;

create trigger quote_line_items_compute_total
  before insert or update on public.quote_line_items
  for each row execute function public.compute_line_total();

-- A line item change doesn't change the quote row directly — it "touches"
-- it with a no-op update, which re-fires quotes_recalc_before_write to pull
-- the now-current sum of line items.
create function public.touch_quote_totals()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.quotes set updated_at = now()
  where id = coalesce(new.quote_id, old.quote_id);
  return null;
end;
$$;

create trigger quote_line_items_touch_quote
  after insert or update or delete on public.quote_line_items
  for each row execute function public.touch_quote_totals();

alter table public.quotes enable row level security;
alter table public.quote_line_items enable row level security;

create policy "quotes_all_admin_manager_sales"
  on public.quotes for all
  using (public.current_role() in ('admin', 'manager', 'sales'))
  with check (public.current_role() in ('admin', 'manager', 'sales'));

create policy "quote_line_items_all_admin_manager_sales"
  on public.quote_line_items for all
  using (public.current_role() in ('admin', 'manager', 'sales'))
  with check (public.current_role() in ('admin', 'manager', 'sales'));

-- Phase 4/5 hook: a customer portal account will read its own quotes.
create policy "quotes_select_customer_own"
  on public.quotes for select
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

-- ========================================================== invoices ====

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique,
  quote_id uuid references public.quotes (id),
  job_id uuid not null references public.jobs (id),
  customer_id uuid not null references public.customers (id),
  status invoice_status not null default 'unpaid',
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(12, 2) not null default 0,
  discount_type discount_type not null default 'none',
  discount_value numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 15.00,
  tax_amount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  balance_due numeric(12, 2) not null default 0,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_job_id_idx on public.invoices (job_id);
create index invoices_customer_id_idx on public.invoices (customer_id);
create index invoices_quote_id_idx on public.invoices (quote_id);

create trigger set_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create function public.generate_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_number is null then
    new.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.invoice_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger invoices_set_invoice_number
  before insert on public.invoices
  for each row execute function public.generate_invoice_number();

create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  item_type line_item_type not null default 'product',
  product_id uuid, -- see quote_line_items comment: FK added once Phase 3 exists
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  line_discount_percent numeric(5, 2) not null default 0,
  line_total numeric(12, 2) not null default 0,
  sort_order int not null default 0
);

create index invoice_line_items_invoice_id_idx on public.invoice_line_items (invoice_id);

create trigger invoice_line_items_compute_total
  before insert or update on public.invoice_line_items
  for each row execute function public.compute_line_total();

-- Recomputes subtotal/discount/tax/total from line items AND balance_due /
-- payment-derived status from amount_paid, in one pass, so the two never
-- disagree. `amount_paid` itself is only ever written by
-- sync_invoice_amount_paid() below (summed from actual payments) — this
-- trigger treats whatever value of NEW.amount_paid it's handed as ground
-- truth and derives everything else from it.
create function public.recalc_invoice_before_write()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_subtotal numeric(12, 2);
begin
  select coalesce(sum(line_total), 0) into v_subtotal
  from public.invoice_line_items where invoice_id = new.id;

  new.subtotal := v_subtotal;
  new.discount_amount := case new.discount_type
    when 'percent' then round(v_subtotal * new.discount_value / 100, 2)
    when 'fixed' then new.discount_value
    else 0
  end;
  new.tax_amount := round((v_subtotal - new.discount_amount) * new.tax_rate / 100, 2);
  new.total := v_subtotal - new.discount_amount + new.tax_amount;
  new.balance_due := new.total - new.amount_paid;

  -- 'cancelled' is a manual, sticky state — a stray payment or line-item
  -- edit must not resurrect a cancelled invoice into unpaid/partial/paid.
  -- 'overdue' is likewise left alone here: nothing at write-time knows
  -- "today" changed, so marking overdue is a Phase 5 scheduled sweep (or a
  -- UI-computed display flag in the meantime) — not this trigger's job.
  if new.status not in ('cancelled', 'overdue') then
    new.status := case
      when new.amount_paid <= 0 then 'unpaid'
      when new.amount_paid < new.total then 'partial'
      else 'paid'
    end;
  end if;

  return new;
end;
$$;

create trigger invoices_recalc_before_write
  before insert or update on public.invoices
  for each row execute function public.recalc_invoice_before_write();

create function public.touch_invoice_totals()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.invoices set updated_at = now()
  where id = coalesce(new.invoice_id, old.invoice_id);
  return null;
end;
$$;

create trigger invoice_line_items_touch_invoice
  after insert or update or delete on public.invoice_line_items
  for each row execute function public.touch_invoice_totals();

alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;

create policy "invoices_all_admin_manager_sales"
  on public.invoices for all
  using (public.current_role() in ('admin', 'manager', 'sales'))
  with check (public.current_role() in ('admin', 'manager', 'sales'));

create policy "invoice_line_items_all_admin_manager_sales"
  on public.invoice_line_items for all
  using (public.current_role() in ('admin', 'manager', 'sales'))
  with check (public.current_role() in ('admin', 'manager', 'sales'));

create policy "invoices_select_customer_own"
  on public.invoices for select
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

-- ========================================================== payments ====

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id),
  amount numeric(12, 2) not null,
  payment_method payment_method not null,
  payment_date date not null default current_date,
  reference_number text,
  recorded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index payments_invoice_id_idx on public.payments (invoice_id);

create function public.sync_invoice_amount_paid()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_invoice_id uuid := coalesce(new.invoice_id, old.invoice_id);
begin
  update public.invoices
  set amount_paid = (
    select coalesce(sum(amount), 0) from public.payments where invoice_id = v_invoice_id
  )
  where id = v_invoice_id;
  return null;
end;
$$;

create trigger payments_sync_invoice
  after insert or update or delete on public.payments
  for each row execute function public.sync_invoice_amount_paid();

alter table public.payments enable row level security;

create policy "payments_all_admin_manager_sales"
  on public.payments for all
  using (public.current_role() in ('admin', 'manager', 'sales'))
  with check (public.current_role() in ('admin', 'manager', 'sales'));
