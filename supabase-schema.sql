-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

-- 1. Products table
create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  note text,
  price numeric not null default 0,
  image text,
  created_at timestamptz not null default now()
);

alter table products enable row level security;

drop policy if exists "Public read products" on products;
create policy "Public read products" on products for select using (true);

drop policy if exists "Public insert products" on products;
create policy "Public insert products" on products for insert with check (true);

drop policy if exists "Public update products" on products;
create policy "Public update products" on products for update using (true);

drop policy if exists "Public delete products" on products;
create policy "Public delete products" on products for delete using (true);

-- Seed with your existing 16 products, so you don''t start from an empty catalog.
-- Safe to run once; running it twice will duplicate rows, so skip this block on re-runs.
insert into products (name, category, note, price, image) values
('Noir Oud', 'perfumes', 'Smoked oud, dark amber, leather', 6500, null),
('Velvet Amber', 'perfumes', 'Amber resin, vanilla, warm musk', 6200, null),
('Iron & Rose', 'perfumes', 'Bulgarian rose, black pepper, cedar', 6800, null),
('Golden Hour', 'perfumes', 'Bergamot, sandalwood, wild honey', 5900, null),
('Rose Attar', 'attars', 'Pure rose, threads of saffron', 3800, null),
('Oud Al Layl', 'attars', 'Aged oud, dark musk', 4500, null),
('Amber Mist', 'attars', 'Amber resin, soft vanilla', 3600, null),
('White Musk Attar', 'attars', 'Clean musk, light florals', 3400, null),
('Charcoal Detox Bar', 'soaps', 'Activated charcoal, cedarwood', 950, null),
('Gold Silk Bodywash', 'soaps', 'Shea butter, amber', 1450, null),
('Sandalwood Soap', 'soaps', 'Sandalwood, oat milk', 900, null),
('Oud Clay Bar', 'soaps', 'Black clay, oud', 1050, null),
('Ember & Oud', 'candles', 'Smoked oud, warm spice', 2800, null),
('Vanilla Noir', 'candles', 'Vanilla, dark musk', 2600, null),
('Gold Amber', 'candles', 'Amber resin, warm woods', 2700, null),
('Rose Quartz', 'candles', 'Rose, soft musk', 2650, null)
;

-- 2. Settings table (single row holding your site-wide settings)
create table if not exists settings (
  id int primary key default 1,
  brand_font text not null default ''Audiowide'',
  accent_color text not null default ''#d4af37'',
  show_new_badge boolean not null default true,
  carousel_autoplay boolean not null default true,
  constraint single_row check (id = 1)
);

insert into settings (id) values (1) on conflict (id) do nothing;

alter table settings enable row level security;

drop policy if exists "Public read settings" on settings;
create policy "Public read settings" on settings for select using (true);

drop policy if exists "Public update settings" on settings;
create policy "Public update settings" on settings for update using (true);
