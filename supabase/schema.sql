-- =============================================================================
-- Stratford Bar POS — Complete Supabase Schema
-- =============================================================================
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Creates: settings, orders, bookings, users, products, allergens, product_allergens
-- Enables: Row Level Security (anon access for staff kiosk app)
-- Enables: Realtime on orders, bookings, settings, products
-- Seeds:    default settings row, standard allergen list
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- ALLERGENS (reference table)
-- -----------------------------------------------------------------------------
create table if not exists public.allergens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null unique,
  sort_order integer not null default 0
);

comment on table public.allergens is 'Master list of allergens for menu filtering';

-- -----------------------------------------------------------------------------
-- USERS (staff accounts)
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text unique,
  role text not null default 'user'
    check (role in ('admin', 'waiter', 'bar', 'user')),
  pin text,
  active boolean not null default true
);

comment on table public.users is 'Staff users — admin, waiter, bar roles';

create index if not exists users_role_idx on public.users (role);
create index if not exists users_active_idx on public.users (active);

-- -----------------------------------------------------------------------------
-- PRODUCTS (menu items — normalized; app also uses settings.menu_items jsonb)
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  price numeric(10, 2) not null default 0 check (price >= 0),
  category text not null default 'drinks'
    check (category in ('drinks', 'food')),
  subcategory text,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0
);

comment on table public.products is 'Menu products — drinks and food items';

create index if not exists products_category_idx on public.products (category);
create index if not exists products_active_idx on public.products (active);

-- -----------------------------------------------------------------------------
-- PRODUCT_ALLERGENS (many-to-many)
-- -----------------------------------------------------------------------------
create table if not exists public.product_allergens (
  product_id uuid not null references public.products (id) on delete cascade,
  allergen_id uuid not null references public.allergens (id) on delete cascade,
  primary key (product_id, allergen_id)
);

comment on table public.product_allergens is 'Allergens contained in each product';

create index if not exists product_allergens_allergen_idx on public.product_allergens (allergen_id);

-- -----------------------------------------------------------------------------
-- SETTINGS (single-venue configuration)
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  venue_name text not null default 'Stratford Bar',
  table_count integer not null default 40 check (table_count between 1 and 99),
  admin_pin text not null default '1234',
  floor_map jsonb not null default '[]'::jsonb,
  menu_items jsonb not null default '[]'::jsonb
);

comment on table public.settings is 'Venue settings — one row per deployment';

-- -----------------------------------------------------------------------------
-- ORDERS
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  table_number integer not null check (table_number between 1 and 99),
  items jsonb not null default '[]'::jsonb,
  note text,
  total numeric(10, 2) not null default 0 check (total >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'complete')),
  tab_closed boolean not null default false,
  completed_at timestamptz,
  payment_method text check (payment_method is null or payment_method in ('cash', 'card')),
  id_checked boolean not null default false,
  allergy_checked boolean not null default false,
  allergens jsonb not null default '[]'::jsonb
);

comment on table public.orders is 'Table orders — pending until bar completes, tab_closed when paid';

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_table_number_idx on public.orders (table_number);
create index if not exists orders_tab_closed_idx on public.orders (tab_closed);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- -----------------------------------------------------------------------------
-- BOOKINGS
-- -----------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text,
  phone text,
  date date not null,
  time text not null,
  party_size integer not null check (party_size between 1 and 50),
  table_preference text,
  occasion text not null default 'none',
  dietary_notes text,
  special_requests text,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'arrived', 'no_show', 'cancelled')),
  deposit_paid boolean not null default false,
  notes text,
  marketing_email boolean not null default false,
  marketing_sms boolean not null default false,
  marketing_phone boolean not null default false
);

comment on table public.bookings is 'Customer table reservations';

create index if not exists bookings_date_idx on public.bookings (date);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);

-- -----------------------------------------------------------------------------
-- UPDATED_AT trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (staff kiosk app — anon read/write)
-- -----------------------------------------------------------------------------
alter table public.allergens enable row level security;
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.product_allergens enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "anon_all_allergens" on public.allergens;
create policy "anon_all_allergens" on public.allergens
  for all to anon using (true) with check (true);

drop policy if exists "anon_all_users" on public.users;
create policy "anon_all_users" on public.users
  for all to anon using (true) with check (true);

drop policy if exists "anon_all_products" on public.products;
create policy "anon_all_products" on public.products
  for all to anon using (true) with check (true);

drop policy if exists "anon_all_product_allergens" on public.product_allergens;
create policy "anon_all_product_allergens" on public.product_allergens
  for all to anon using (true) with check (true);

drop policy if exists "anon_all_settings" on public.settings;
create policy "anon_all_settings" on public.settings
  for all to anon using (true) with check (true);

drop policy if exists "anon_all_orders" on public.orders;
create policy "anon_all_orders" on public.orders
  for all to anon using (true) with check (true);

drop policy if exists "anon_all_bookings" on public.bookings;
create policy "anon_all_bookings" on public.bookings
  for all to anon using (true) with check (true);

-- -----------------------------------------------------------------------------
-- REALTIME subscriptions
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'settings'
  ) then
    alter publication supabase_realtime add table public.settings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- SEED DATA
-- -----------------------------------------------------------------------------

-- Standard allergen list (matches AllergenFilterBar.jsx)
insert into public.allergens (name, sort_order) values
  ('Gluten', 1),
  ('Dairy', 2),
  ('Nuts', 3),
  ('Vegan', 4),
  ('Vegetarian', 5),
  ('Eggs', 6),
  ('Soya', 7),
  ('Fish', 8),
  ('Shellfish', 9),
  ('Mustard', 10),
  ('Sesame', 11),
  ('Celery', 12),
  ('Lupin', 13),
  ('Molluscs', 14),
  ('Sulphites', 15)
on conflict (name) do nothing;

-- Default admin user
insert into public.users (name, email, role, pin, active) values
  ('Admin', 'admin@stratfordbar.local', 'admin', '1234', true)
on conflict (email) do nothing;

-- Default settings row (only if none exists)
insert into public.settings (venue_name, table_count, admin_pin, floor_map, menu_items)
select 'Stratford Bar', 40, '1234', '[]'::jsonb, '[]'::jsonb
where not exists (select 1 from public.settings limit 1);

-- Sample products (optional starter menu — only if table is empty)
insert into public.products (name, price, category, subcategory, sort_order)
select v.name, v.price, v.category, v.subcategory, v.sort_order
from (values
  ('House Lager', 5.50::numeric, 'drinks', 'Beer', 1),
  ('House Red Wine', 6.00::numeric, 'drinks', 'Wine', 2),
  ('Gin & Tonic', 7.50::numeric, 'drinks', 'Spirits', 3),
  ('Fish & Chips', 14.95::numeric, 'food', null, 4),
  ('Beef Burger', 13.95::numeric, 'food', null, 5)
) as v(name, price, category, subcategory, sort_order)
where not exists (select 1 from public.products limit 1);

-- =============================================================================
-- Done. Verify with: npm run db:check
-- =============================================================================
