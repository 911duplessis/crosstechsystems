-- 0008_stock.sql
-- Inventory control: categories, suppliers, products, and an append-only
-- stock_movements ledger. products.stock_quantity is a cache kept in sync by
-- trigger — stock_movements is the source of truth, the same pattern
-- job_status_history and audit_logs already use for their tables.

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_category_id uuid references public.product_categories (id),
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  description text,
  category_id uuid references public.product_categories (id),
  supplier_id uuid references public.suppliers (id),
  cost_price numeric(12, 2) not null default 0,
  selling_price numeric(12, 2) not null default 0,
  unit text not null default 'each',
  stock_quantity numeric(10, 2) not null default 0,
  min_stock_level numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  website_visible boolean not null default false, -- Phase 4 hook, unused until then
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_supplier_id_idx on public.products (supplier_id);

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Phase 2's quote_line_items/invoice_line_items were built before this table
-- existed, with a plain (unconstrained) product_id column — add the real FK
-- now that products exists.
alter table public.quote_line_items
  add constraint quote_line_items_product_id_fkey foreign key (product_id) references public.products (id);
alter table public.invoice_line_items
  add constraint invoice_line_items_product_id_fkey foreign key (product_id) references public.products (id);

create type stock_movement_type as enum ('purchase_in', 'job_usage', 'sale', 'adjustment', 'return');
create type stock_reference_type as enum ('job', 'invoice', 'manual');

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  movement_type stock_movement_type not null,
  quantity_change numeric(10, 2) not null,
  reference_type stock_reference_type,
  reference_id uuid,
  notes text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index stock_movements_product_id_idx on public.stock_movements (product_id);
create index stock_movements_reference_idx on public.stock_movements (reference_type, reference_id);

create function public.sync_product_stock_quantity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.products
  set stock_quantity = stock_quantity + new.quantity_change
  where id = new.product_id;
  return new;
end;
$$;

create trigger stock_movements_sync_product
  after insert on public.stock_movements
  for each row execute function public.sync_product_stock_quantity();

-- Stock leaves inventory when it's actually invoiced, not when merely
-- quoted (a quote is a proposal, not a commitment). Deleting an invoice
-- line item (only possible pre-payment, per the invoice UI's editable rule)
-- reverses the movement. Cancelling an invoice after stock has already left
-- does NOT auto-restore it — that's a deliberate MVP boundary; handle it
-- with a manual adjustment movement rather than an implicit reversal that
-- could double-credit stock if a line item was already deleted first.
create function public.record_invoice_line_stock_movement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.product_id is not null then
    insert into public.stock_movements
      (product_id, movement_type, quantity_change, reference_type, reference_id, notes, created_by)
    values
      (new.product_id, 'sale', -new.quantity, 'invoice', new.invoice_id, 'Invoiced', auth.uid());
  end if;
  return new;
end;
$$;

create trigger invoice_line_items_stock_movement
  after insert on public.invoice_line_items
  for each row execute function public.record_invoice_line_stock_movement();

create function public.reverse_invoice_line_stock_movement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.product_id is not null then
    insert into public.stock_movements
      (product_id, movement_type, quantity_change, reference_type, reference_id, notes, created_by)
    values
      (old.product_id, 'return', old.quantity, 'invoice', old.invoice_id, 'Invoice line item removed', auth.uid());
  end if;
  return old;
end;
$$;

create trigger invoice_line_items_reverse_stock_movement
  after delete on public.invoice_line_items
  for each row execute function public.reverse_invoice_line_stock_movement();

alter table public.product_categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;

create policy "product_categories_all_admin_manager"
  on public.product_categories for all
  using (public.current_role() in ('admin', 'manager'))
  with check (public.current_role() in ('admin', 'manager'));
create policy "product_categories_select_staff"
  on public.product_categories for select
  using (public.current_role() in ('sales', 'technician'));

create policy "suppliers_all_admin_manager"
  on public.suppliers for all
  using (public.current_role() in ('admin', 'manager'))
  with check (public.current_role() in ('admin', 'manager'));

create policy "products_all_admin_manager"
  on public.products for all
  using (public.current_role() in ('admin', 'manager'))
  with check (public.current_role() in ('admin', 'manager'));
create policy "products_select_staff"
  on public.products for select
  using (public.current_role() in ('sales', 'technician'));

create policy "stock_movements_all_admin_manager"
  on public.stock_movements for all
  using (public.current_role() in ('admin', 'manager'))
  with check (public.current_role() in ('admin', 'manager'));
