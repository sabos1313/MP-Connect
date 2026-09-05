create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  unit text not null check (unit in ('g', 'kg', 'ml', 'L', 'unidade')),
  current_stock numeric not null default 0 check (current_stock >= 0),
  minimum_stock numeric not null default 0 check (minimum_stock >= 0),
  unit_cost numeric not null default 0 check (unit_cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sale_price numeric not null default 0 check (sale_price >= 0),
  current_stock numeric not null default 0 check (current_stock >= 0),
  minimum_stock numeric not null default 0 check (minimum_stock >= 0),
  unit text not null default 'unidade' check (unit in ('g', 'kg', 'ml', 'L', 'unidade')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formulas (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  name text not null,
  description text,
  yield_quantity numeric check (yield_quantity is null or yield_quantity > 0),
  yield_unit text check (yield_unit is null or yield_unit in ('g', 'kg', 'ml', 'L', 'unidade')),
  preparation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formula_items (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references public.formulas(id) on delete restrict,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit text not null check (unit in ('g', 'kg', 'ml', 'L', 'unidade')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  birth_date date,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  sale_date timestamptz not null default now(),
  subtotal numeric not null default 0 check (subtotal >= 0),
  discount numeric not null default 0 check (discount >= 0),
  total numeric not null default 0 check (total >= 0),
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  cancelled_at timestamptz,
  cancellation_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  company_name text not null default 'Maria Paulina Saboaria',
  currency text not null default 'BRL',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  subtotal numeric not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid references public.ingredients(id) on delete restrict,
  product_id uuid references public.products(id) on delete restrict,
  movement_type text not null check (movement_type in ('purchase', 'manual_addition', 'sale', 'adjustment', 'production', 'manual_removal')),
  quantity numeric not null check (quantity > 0),
  unit text not null check (unit in ('g', 'kg', 'ml', 'L', 'unidade')),
  previous_stock numeric check (previous_stock is null or previous_stock >= 0),
  new_stock numeric check (new_stock is null or new_stock >= 0),
  reference_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  constraint stock_movements_single_item check (((ingredient_id is not null)::integer + (product_id is not null)::integer) = 1)
);

drop trigger if exists ingredients_set_updated_at on public.ingredients;
create trigger ingredients_set_updated_at before update on public.ingredients for each row execute procedure public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute procedure public.set_updated_at();
drop trigger if exists formulas_set_updated_at on public.formulas;
create trigger formulas_set_updated_at before update on public.formulas for each row execute procedure public.set_updated_at();
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers for each row execute procedure public.set_updated_at();
drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at before update on public.sales for each row execute procedure public.set_updated_at();
drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at before update on public.app_settings for each row execute procedure public.set_updated_at();

create index if not exists ingredients_active_idx on public.ingredients(active);
create index if not exists products_active_idx on public.products(active);
create index if not exists formulas_product_id_idx on public.formulas(product_id);
create index if not exists formula_items_formula_id_idx on public.formula_items(formula_id);
create index if not exists formula_items_ingredient_id_idx on public.formula_items(ingredient_id);
create index if not exists customers_birth_date_idx on public.customers(birth_date);
create index if not exists customers_active_idx on public.customers(active);
create index if not exists sales_customer_id_idx on public.sales(customer_id);
create index if not exists sales_sale_date_idx on public.sales(sale_date);
create index if not exists sale_items_sale_id_idx on public.sale_items(sale_id);
create index if not exists sale_items_product_id_idx on public.sale_items(product_id);
create index if not exists stock_movements_ingredient_id_idx on public.stock_movements(ingredient_id);
create index if not exists stock_movements_product_id_idx on public.stock_movements(product_id);
create index if not exists sales_status_idx on public.sales(status);

alter table public.ingredients enable row level security;
alter table public.products enable row level security;
alter table public.formulas enable row level security;
alter table public.formula_items enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists ingredients_single_user on public.ingredients;
create policy ingredients_single_user on public.ingredients for all to anon using ((select auth.role()) = 'anon') with check ((select auth.role()) = 'anon');
drop policy if exists products_single_user on public.products;
create policy products_single_user on public.products for all to anon using ((select auth.role()) = 'anon') with check ((select auth.role()) = 'anon');
drop policy if exists formulas_single_user on public.formulas;
create policy formulas_single_user on public.formulas for all to anon using ((select auth.role()) = 'anon') with check ((select auth.role()) = 'anon');
drop policy if exists formula_items_single_user on public.formula_items;
create policy formula_items_single_user on public.formula_items for all to anon using ((select auth.role()) = 'anon') with check ((select auth.role()) = 'anon');
drop policy if exists customers_single_user on public.customers;
create policy customers_single_user on public.customers for all to anon using ((select auth.role()) = 'anon') with check ((select auth.role()) = 'anon');
drop policy if exists sales_single_user on public.sales;
create policy sales_single_user on public.sales for all to anon using ((select auth.role()) = 'anon') with check ((select auth.role()) = 'anon');
drop policy if exists sale_items_single_user on public.sale_items;
create policy sale_items_single_user on public.sale_items for all to anon using ((select auth.role()) = 'anon') with check ((select auth.role()) = 'anon');
drop policy if exists stock_movements_single_user on public.stock_movements;
create policy stock_movements_single_user on public.stock_movements for all to anon using ((select auth.role()) = 'anon') with check ((select auth.role()) = 'anon');
drop policy if exists app_settings_single_user on public.app_settings;
create policy app_settings_single_user on public.app_settings for all to anon using ((select auth.role()) = 'anon') with check ((select auth.role()) = 'anon');

create or replace function public.adjust_stock(
  p_ingredient_id uuid default null,
  p_product_id uuid default null,
  p_delta numeric default 0,
  p_movement_type text default 'adjustment',
  p_notes text default null,
  p_reference_id uuid default null
)
returns public.stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  movement public.stock_movements;
  previous_value numeric;
  next_value numeric;
  item_unit text;
begin
  if ((p_ingredient_id is not null)::integer + (p_product_id is not null)::integer) <> 1 then
    raise exception 'Informe exatamente um insumo ou produto.' using errcode = '22023';
  end if;
  if p_delta = 0 then raise exception 'A quantidade deve ser diferente de zero.' using errcode = '22023'; end if;
  if p_movement_type not in ('purchase', 'manual_addition', 'sale', 'adjustment', 'production', 'manual_removal') then
    raise exception 'Tipo de movimentação inválido.' using errcode = '22023';
  end if;
  if p_ingredient_id is not null then
    select current_stock, unit into previous_value, item_unit from public.ingredients where id = p_ingredient_id for update;
    if previous_value is null then raise exception 'Insumo não encontrado.' using errcode = 'P0002'; end if;
    next_value := previous_value + p_delta;
    if next_value < 0 then raise exception 'Estoque insuficiente.' using errcode = '22003'; end if;
    update public.ingredients set current_stock = next_value where id = p_ingredient_id;
  else
    select current_stock, unit into previous_value, item_unit from public.products where id = p_product_id for update;
    if previous_value is null then raise exception 'Produto não encontrado.' using errcode = 'P0002'; end if;
    next_value := previous_value + p_delta;
    if next_value < 0 then raise exception 'Estoque insuficiente.' using errcode = '22003'; end if;
    update public.products set current_stock = next_value where id = p_product_id;
  end if;
  insert into public.stock_movements (ingredient_id, product_id, movement_type, quantity, unit, previous_stock, new_stock, reference_id, notes)
  values (p_ingredient_id, p_product_id, p_movement_type, abs(p_delta), item_unit, previous_value, next_value, p_reference_id, p_notes)
  returning * into movement;
  return movement;
end;
$$;

create or replace function public.create_sale(p_customer_id uuid, p_items jsonb, p_discount numeric default 0, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sale_id uuid;
  item jsonb;
  product_row public.products;
  item_quantity numeric;
  item_price numeric;
  item_subtotal numeric;
  sale_subtotal numeric := 0;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'A venda precisa ter ao menos um item.' using errcode = '22023'; end if;
  if coalesce(p_discount, 0) < 0 then raise exception 'Desconto inválido.' using errcode = '22023'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    item_quantity := (item ->> 'quantity')::numeric;
    if item_quantity <= 0 then raise exception 'Quantidade inválida.' using errcode = '22023'; end if;
    select * into product_row from public.products where id = (item ->> 'product_id')::uuid for update;
    if product_row.id is null then raise exception 'Produto não encontrado.' using errcode = 'P0002'; end if;
    if product_row.current_stock < item_quantity then raise exception 'Estoque insuficiente para %.', product_row.name using errcode = '22003'; end if;
    item_price := coalesce((item ->> 'unit_price')::numeric, product_row.sale_price);
    if item_price < 0 then raise exception 'Preço inválido.' using errcode = '22023'; end if;
    sale_subtotal := sale_subtotal + (item_quantity * item_price);
  end loop;
  if p_discount > sale_subtotal then raise exception 'Desconto não pode superar o subtotal.' using errcode = '22023'; end if;
  insert into public.sales (customer_id, subtotal, discount, total, notes)
  values (p_customer_id, sale_subtotal, coalesce(p_discount, 0), sale_subtotal - coalesce(p_discount, 0), p_notes)
  returning id into sale_id;
  for item in select * from jsonb_array_elements(p_items) loop
    item_quantity := (item ->> 'quantity')::numeric;
    item_price := coalesce((item ->> 'unit_price')::numeric, (select sale_price from public.products where id = (item ->> 'product_id')::uuid));
    item_subtotal := item_quantity * item_price;
    insert into public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    values (sale_id, (item ->> 'product_id')::uuid, item_quantity, item_price, item_subtotal);
    perform public.adjust_stock(p_product_id := (item ->> 'product_id')::uuid, p_delta := -item_quantity, p_movement_type := 'sale', p_reference_id := sale_id, p_notes := 'Venda ' || sale_id);
  end loop;
  return sale_id;
end;
$$;

create or replace function public.cancel_sale(p_sale_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sale_row public.sales;
  item record;
begin
  select * into sale_row from public.sales where id = p_sale_id for update;
  if sale_row.id is null then raise exception 'Venda não encontrada.' using errcode = 'P0002'; end if;
  if sale_row.status = 'cancelled' then raise exception 'Esta venda já foi cancelada.' using errcode = '22023'; end if;
  update public.sales set status = 'cancelled', cancelled_at = now(), cancellation_reason = p_reason where id = p_sale_id;
  for item in select * from public.sale_items where sale_id = p_sale_id loop
    perform public.adjust_stock(p_product_id := item.product_id, p_delta := item.quantity, p_movement_type := 'adjustment', p_reference_id := p_sale_id, p_notes := 'Estorno da venda ' || p_sale_id);
  end loop;
end;
$$;

create or replace function public.produce_formula(p_formula_id uuid, p_quantity numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  formula_row public.formulas;
  item record;
  multiplier numeric;
  required_quantity numeric;
  product_name text;
  produced_movement public.stock_movements;
begin
  if p_quantity <= 0 then raise exception 'A quantidade produzida deve ser maior que zero.' using errcode = '22023'; end if;
  select * into formula_row from public.formulas where id = p_formula_id;
  if formula_row.id is null or formula_row.yield_quantity is null then raise exception 'Fórmula sem rendimento válido.' using errcode = '22023'; end if;
  multiplier := p_quantity / formula_row.yield_quantity;
  for item in select fi.*, i.name, i.current_stock from public.formula_items fi join public.ingredients i on i.id = fi.ingredient_id where fi.formula_id = p_formula_id for update of i loop
    required_quantity := item.quantity * multiplier;
    if item.current_stock < required_quantity then raise exception 'Estoque insuficiente para %.', item.name using errcode = '22003'; end if;
  end loop;
  for item in select fi.* from public.formula_items fi where fi.formula_id = p_formula_id loop
    perform public.adjust_stock(p_ingredient_id := item.ingredient_id, p_delta := -(item.quantity * multiplier), p_movement_type := 'production', p_reference_id := p_formula_id, p_notes := 'Produção pela fórmula ' || formula_row.name);
  end loop;
  select name into product_name from public.products where id = formula_row.product_id;
  perform public.adjust_stock(p_product_id := formula_row.product_id, p_delta := p_quantity, p_movement_type := 'production', p_reference_id := p_formula_id, p_notes := 'Produção de ' || product_name);
  return jsonb_build_object('product_id', formula_row.product_id, 'quantity', p_quantity);
end;
$$;

revoke execute on function public.adjust_stock(uuid, uuid, numeric, text, text, uuid) from public;
grant execute on function public.adjust_stock(uuid, uuid, numeric, text, text, uuid) to anon;
revoke execute on function public.create_sale(uuid, jsonb, numeric, text) from public;
grant execute on function public.create_sale(uuid, jsonb, numeric, text) to anon;
revoke execute on function public.cancel_sale(uuid, text) from public;
grant execute on function public.cancel_sale(uuid, text) to anon;
revoke execute on function public.produce_formula(uuid, numeric) from public;
grant execute on function public.produce_formula(uuid, numeric) to anon;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ingredients') then alter publication supabase_realtime add table public.ingredients; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then alter publication supabase_realtime add table public.products; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'customers') then alter publication supabase_realtime add table public.customers; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sales') then alter publication supabase_realtime add table public.sales; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stock_movements') then alter publication supabase_realtime add table public.stock_movements; end if;
  end if;
end;
$$;