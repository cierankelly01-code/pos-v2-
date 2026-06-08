-- Stratford Bar POS — Supabase schema
-- Run this in the Supabase SQL editor for each new venue project.

-- Orders table
create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  table_number integer not null,
  items jsonb not null default '[]',
  note text,
  total numeric not null default 0,
  status text default 'pending',
  tab_closed boolean default false,
  completed_at timestamptz,
  payment_method text,
  id_checked boolean default false,
  allergy_checked boolean default false,
  allergens jsonb default '[]'
);

-- Bookings table
create table bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text,
  phone text,
  date date not null,
  time text not null,
  party_size integer not null,
  table_preference text,
  occasion text default 'none',
  dietary_notes text,
  special_requests text,
  status text default 'confirmed',
  deposit_paid boolean default false,
  notes text,
  marketing_email boolean default false,
  marketing_sms boolean default false,
  marketing_phone boolean default false
);

-- Settings table (single record)
create table settings (
  id uuid primary key default gen_random_uuid(),
  venue_name text default 'Stratford Bar',
  table_count integer default 40,
  admin_pin text default '1234',
  floor_map jsonb default '[]',
  menu_items jsonb default '[]'
);

-- Row Level Security (staff-only internal app — anon read/write)
alter table orders enable row level security;
alter table bookings enable row level security;
alter table settings enable row level security;

create policy "anon_all_orders" on orders for all to anon using (true) with check (true);
create policy "anon_all_bookings" on bookings for all to anon using (true) with check (true);
create policy "anon_all_settings" on settings for all to anon using (true) with check (true);

-- Enable realtime on orders
alter publication supabase_realtime add table orders;
