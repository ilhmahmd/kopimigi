-- ============================================================
-- Coffeeshop POS + Photobooth — Supabase Migration
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. APP USERS (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────
create type user_role as enum ('owner', 'manager', 'cashier');

create table public.app_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null,
  role        user_role not null default 'cashier',
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Auto-create app_user row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.app_users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'cashier')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. CATEGORIES
-- ─────────────────────────────────────────────────────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text,                  -- emoji or icon name
  color       text,                  -- hex color for UI badge
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. PRODUCTS
-- ─────────────────────────────────────────────────────────────
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories(id) on delete restrict,
  name         text not null,
  description  text,
  price        numeric(12, 0) not null check (price >= 0),
  image_url    text,
  is_available boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4. DISCOUNTS
-- ─────────────────────────────────────────────────────────────
create type discount_type as enum ('percentage', 'fixed');

create table public.discounts (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name         text not null,
  type         discount_type not null,
  value        numeric(12, 2) not null check (value > 0),
  min_order    numeric(12, 0),       -- minimum order total to apply
  max_uses     int,                  -- null = unlimited
  used_count   int not null default 0,
  is_active    boolean not null default true,
  valid_from   timestamptz,
  valid_until  timestamptz,
  created_at   timestamptz not null default now(),

  constraint percentage_max check (
    type != 'percentage' or value <= 100
  )
);

-- ─────────────────────────────────────────────────────────────
-- 5. ORDERS
-- ─────────────────────────────────────────────────────────────
create type order_status as enum ('pending', 'paid', 'completed', 'cancelled');
create type payment_method as enum ('cash', 'qris', 'debit', 'credit');

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,
  cashier_id      uuid not null references public.app_users(id),
  subtotal        numeric(12, 0) not null check (subtotal >= 0),
  discount_id     uuid references public.discounts(id),
  discount_amount numeric(12, 0) not null default 0,
  tax_amount      numeric(12, 0) not null default 0,
  total           numeric(12, 0) not null check (total >= 0),
  payment_method  payment_method not null,
  amount_paid     numeric(12, 0) not null check (amount_paid >= 0),
  change_amount   numeric(12, 0) not null default 0,
  status          order_status not null default 'pending',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- Auto-increment discount usage when order is paid
create or replace function public.increment_discount_usage()
returns trigger language plpgsql as $$
begin
  if new.status = 'paid' and old.status != 'paid' and new.discount_id is not null then
    update public.discounts
    set used_count = used_count + 1
    where id = new.discount_id;
  end if;
  return new;
end;
$$;

create trigger order_paid_discount_usage
  after update on public.orders
  for each row execute procedure public.increment_discount_usage();

-- Sequence-based order number: CS-YYYYMMDD-XXXX
create or replace function public.generate_order_number()
returns text language plpgsql as $$
declare
  today      text := to_char(now(), 'YYYYMMDD');
  seq        int;
  result     text;
begin
  select count(*) + 1 into seq
  from public.orders
  where created_at::date = current_date;

  result := 'CS-' || today || '-' || lpad(seq::text, 4, '0');
  return result;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. ORDER ITEMS
-- ─────────────────────────────────────────────────────────────
create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  product_id     uuid not null references public.products(id),
  product_name   text not null,   -- snapshot
  product_price  numeric(12, 0) not null,  -- snapshot
  quantity       int not null check (quantity > 0),
  subtotal       numeric(12, 0) not null,
  notes          text
);

create index order_items_order_id_idx on public.order_items(order_id);

-- ─────────────────────────────────────────────────────────────
-- 7. PHOTO SESSIONS
-- ─────────────────────────────────────────────────────────────
create type photo_session_status as enum ('pending', 'used', 'expired');

create table public.photo_sessions (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  token          uuid not null unique default gen_random_uuid(),
  token_url      text not null,
  access_code    text not null unique,
  with_photo     boolean not null default true,
  background_id  text,
  status         photo_session_status not null default 'pending',
  photo_url      text,
  thumbnail_url  text,
  processed_photo_url text,
  receipt_image_url   text,
  expires_at     timestamptz not null default (now() + interval '30 minutes'),
  used_at        timestamptz,
  printed_at     timestamptz,
  created_at     timestamptz not null default now()
);

create index photo_sessions_token_idx on public.photo_sessions(token);
create index photo_sessions_access_code_idx on public.photo_sessions(access_code);
create index photo_sessions_order_id_idx on public.photo_sessions(order_id);

-- Auto-expire sessions via a scheduled job (set up in Supabase Edge Functions / pg_cron)
-- Or run manually: UPDATE photo_sessions SET status='expired' WHERE expires_at < now() AND status='pending';

-- ─────────────────────────────────────────────────────────────
-- 8. VIEWS — Daily sales summary
-- ─────────────────────────────────────────────────────────────
create or replace view public.daily_sales_summary as
select
  created_at::date as date,
  count(*) as total_orders,
  sum(total) as total_revenue,
  sum(discount_amount) as total_discount
from public.orders
where status in ('paid', 'completed')
group by created_at::date
order by date desc;

-- ─────────────────────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

-- Enable RLS on all tables
alter table public.app_users        enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.discounts        enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.photo_sessions   enable row level security;

-- Helper: get current user's role
create or replace function public.current_user_role()
returns user_role language sql stable security definer as $$
  select role from public.app_users where id = auth.uid()
$$;

-- ── app_users ──
create policy "Users can read own profile"
  on public.app_users for select
  using (id = auth.uid() or public.current_user_role() in ('owner', 'manager'));

create policy "Owner/manager can manage users"
  on public.app_users for all
  using (public.current_user_role() in ('owner', 'manager'));

-- ── categories ──
create policy "Authenticated users can read categories"
  on public.categories for select
  using (auth.role() = 'authenticated');

create policy "Owner/manager can manage categories"
  on public.categories for all
  using (public.current_user_role() in ('owner', 'manager'));

-- ── products ──
create policy "Authenticated users can read products"
  on public.products for select
  using (auth.role() = 'authenticated');

create policy "Owner/manager can manage products"
  on public.products for all
  using (public.current_user_role() in ('owner', 'manager'));

-- ── discounts ──
create policy "Authenticated users can read active discounts"
  on public.discounts for select
  using (auth.role() = 'authenticated');

create policy "Owner/manager can manage discounts"
  on public.discounts for all
  using (public.current_user_role() in ('owner', 'manager'));

-- ── orders ──
create policy "Cashier sees own orders; manager/owner sees all"
  on public.orders for select
  using (
    cashier_id = auth.uid() or
    public.current_user_role() in ('owner', 'manager')
  );

create policy "Booth can read orders for active photo sessions"
  on public.orders for select
  using (
    auth.role() = 'anon'
    and exists (
      select 1
      from public.photo_sessions ps
      where ps.order_id = orders.id
        and ps.status = 'pending'
        and ps.expires_at > now()
    )
  );

create policy "Authenticated users can create orders"
  on public.orders for insert
  with check (auth.role() = 'authenticated');

create policy "Cashier can update own orders; manager/owner can update all"
  on public.orders for update
  using (
    cashier_id = auth.uid() or
    public.current_user_role() in ('owner', 'manager')
  );

-- ── order_items ──
create policy "order_items visible with parent order"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.cashier_id = auth.uid() or public.current_user_role() in ('owner', 'manager'))
    )
  );

create policy "Booth can read order items for active photo sessions"
  on public.order_items for select
  using (
    auth.role() = 'anon'
    and exists (
      select 1
      from public.photo_sessions ps
      where ps.order_id = order_items.order_id
        and ps.status = 'pending'
        and ps.expires_at > now()
    )
  );

create policy "Authenticated users can create order items"
  on public.order_items for insert
  with check (auth.role() = 'authenticated');

-- ── photo_sessions ──
-- Booth station accesses via token (anon key), POS via authenticated user
create policy "POS can read photo sessions"
  on public.photo_sessions for select
  using (auth.role() = 'authenticated');

create policy "Booth can read photo sessions by token (anon)"
  on public.photo_sessions for select
  using (auth.role() = 'anon');

create policy "Authenticated users can create photo sessions"
  on public.photo_sessions for insert
  with check (auth.role() = 'authenticated');

create policy "Booth can update session by token (anon)"
  on public.photo_sessions for update
  using (auth.role() = 'anon')
  with check (auth.role() = 'anon');

-- ─────────────────────────────────────────────────────────────
-- 10. SUPABASE STORAGE — bucket for photobooth images
-- ─────────────────────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket
-- Or via SQL:
insert into storage.buckets (id, name, public)
values ('photobooth', 'photobooth', true)
on conflict do nothing;

create policy "Anyone can read photobooth images"
  on storage.objects for select
  using (bucket_id = 'photobooth');

create policy "Authenticated users can upload photobooth images"
  on storage.objects for insert
  with check (bucket_id = 'photobooth' and auth.role() = 'authenticated');

create policy "Booth can upload photobooth images"
  on storage.objects for insert
  with check (bucket_id = 'photobooth' and auth.role() = 'anon');

create policy "Booth can update photobooth images"
  on storage.objects for update
  using (bucket_id = 'photobooth' and auth.role() = 'anon')
  with check (bucket_id = 'photobooth' and auth.role() = 'anon');

-- ─────────────────────────────────────────────────────────────
-- 11. SEED DATA — Categories & sample products
-- ─────────────────────────────────────────────────────────────
insert into public.categories (name, icon, color, sort_order) values
  ('Kopi',        '☕', '#6F4E37', 1),
  ('Non-Kopi',    '🧃', '#4CAF50', 2),
  ('Makanan',     '🍞', '#FF9800', 3),
  ('Snack',       '🍪', '#9C27B0', 4),
  ('Merchandise', '🛍️', '#2196F3', 5);

-- Sample products (prices in Rupiah)
with cats as (
  select id, name from public.categories
)
insert into public.products (category_id, name, description, price, sort_order)
select c.id, p.name, p.description, p.price, p.sort_order
from cats c
join (values
  -- Kopi
  ('Kopi', 'Americano',        'Espresso + air panas',           22000, 1),
  ('Kopi', 'Cappuccino',       'Espresso + steamed milk foam',   28000, 2),
  ('Kopi', 'Latte',            'Espresso + susu creamy',         30000, 3),
  ('Kopi', 'V60 Pour Over',    'Single origin, manual brew',     35000, 4),
  ('Kopi', 'Cold Brew',        'Kopi cold brew 12 jam',          32000, 5),
  -- Non-Kopi
  ('Non-Kopi', 'Matcha Latte', 'Matcha Jepang premium',          30000, 1),
  ('Non-Kopi', 'Teh Tarik',    'Teh susu kocok khas',            22000, 2),
  ('Non-Kopi', 'Coklat Panas', 'Belgian chocolate',              28000, 3),
  -- Makanan
  ('Makanan', 'Croissant',     'Croissant mentega Prancis',      25000, 1),
  ('Makanan', 'Roti Bakar',    'Roti tawar + selai pilihan',     18000, 2),
  ('Makanan', 'Sandwich Club', 'Ayam + telur + sayuran',         35000, 3),
  -- Snack
  ('Snack', 'Cookies',         'Cookies coklat chips homemade',  18000, 1),
  ('Snack', 'Muffin',          'Muffin blueberry',               20000, 2)
) as p(cat_name, name, description, price, sort_order) on c.name = p.cat_name;

-- Sample discount
insert into public.discounts (code, name, type, value, min_order, is_active) values
  ('WELCOME10', 'Diskon Selamat Datang 10%',  'percentage', 10, 50000,  true),
  ('HEMAT5K',   'Hemat Rp 5.000',             'fixed',      5000, 30000, true),
  ('PROMO20',   'Flash Sale 20%',             'percentage', 20, 100000, false);
