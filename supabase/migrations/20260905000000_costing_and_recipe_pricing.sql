create or replace function public.unit_dimension(p_unit text)
returns text
language sql
immutable
as $$
  select case
    when p_unit in ('g', 'kg') then 'mass'
    when p_unit in ('ml', 'L') then 'volume'
    when p_unit = 'unidade' then 'count'
    else null
  end;
$$;

create or replace function public.normalize_quantity(p_quantity numeric, p_unit text)
returns numeric
language plpgsql
immutable
as $$
begin
  if p_quantity <= 0 then
    raise exception 'A quantidade deve ser maior que zero.' using errcode = '22023';
  end if;
  if public.unit_dimension(p_unit) is null then
    raise exception 'Unidade inválida: %.', p_unit using errcode = '22023';
  end if;
  return case p_unit
    when 'kg' then p_quantity * 1000
    when 'L' then p_quantity * 1000
    else p_quantity
  end;
end;
$$;

create or replace function public.convert_quantity(p_quantity numeric, p_from_unit text, p_to_unit text)
returns numeric
language plpgsql
immutable
as $$
begin
  if public.unit_dimension(p_from_unit) is distinct from public.unit_dimension(p_to_unit) then
    raise exception 'Não é possível converter % para %.', p_from_unit, p_to_unit using errcode = '22023';
  end if;
  return public.normalize_quantity(p_quantity, p_from_unit) / public.normalize_quantity(1, p_to_unit);
end;
$$;

create table if not exists public.ingredient_purchases (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit text not null check (unit in ('g', 'kg', 'ml', 'L', 'unidade')),
  normalized_quantity numeric not null check (normalized_quantity > 0),
  total_cost numeric not null check (total_cost >= 0),
  unit_cost numeric not null check (unit_cost >= 0),
  supplier text,
  purchase_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists ingredient_purchases_ingredient_id_idx on public.ingredient_purchases(ingredient_id);
create index if not exists ingredient_purchases_purchase_date_idx on public.ingredient_purchases(purchase_date);

alter table public.formulas add column if not exists additional_cost numeric not null default 0 check (additional_cost >= 0);
alter table public.formulas add column if not exists desired_markup numeric not null default 0 check (desired_markup >= 0);
alter table public.formulas add column if not exists sale_price numeric check (sale_price is null or sale_price >= 0);
alter table public.formula_items add column if not exists updated_at timestamptz not null default now();

alter table public.ingredient_purchases enable row level security;
drop policy if exists ingredient_purchases_single_user on public.ingredient_purchases;
create policy ingredient_purchases_single_user on public.ingredient_purchases for all to anon using ((select auth.role()) = 'anon') with check ((select auth.role()) = 'anon');

create or replace function public.register_ingredient_purchase(
  p_ingredient_id uuid,
  p_quantity numeric,
  p_unit text,
  p_total_cost numeric,
  p_supplier text default null,
  p_purchase_date timestamptz default now(),
  p_notes text default null
)
returns public.ingredient_purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  ingredient_row public.ingredients;
  purchase_row public.ingredient_purchases;
  converted_quantity numeric;
  purchase_unit_cost numeric;
  weighted_unit_cost numeric;
begin
  if p_total_cost < 0 then
    raise exception 'O valor pago não pode ser negativo.' using errcode = '22023';
  end if;
  select * into ingredient_row from public.ingredients where id = p_ingredient_id for update;
  if ingredient_row.id is null then
    raise exception 'Insumo não encontrado.' using errcode = 'P0002';
  end if;
  converted_quantity := public.convert_quantity(p_quantity, p_unit, ingredient_row.unit);
  purchase_unit_cost := p_total_cost / converted_quantity;
  weighted_unit_cost := case
    when ingredient_row.current_stock + converted_quantity = 0 then purchase_unit_cost
    when ingredient_row.current_stock = 0 then purchase_unit_cost
    else ((ingredient_row.current_stock * ingredient_row.unit_cost) + (converted_quantity * purchase_unit_cost)) / (ingredient_row.current_stock + converted_quantity)
  end;

  insert into public.ingredient_purchases (ingredient_id, quantity, unit, normalized_quantity, total_cost, unit_cost, supplier, purchase_date, notes)
  values (p_ingredient_id, p_quantity, p_unit, public.normalize_quantity(p_quantity, p_unit), p_total_cost, purchase_unit_cost, p_supplier, coalesce(p_purchase_date, now()), p_notes)
  returning * into purchase_row;

  perform public.adjust_stock(
    p_ingredient_id := p_ingredient_id,
    p_delta := converted_quantity,
    p_movement_type := 'purchase',
    p_reference_id := purchase_row.id,
    p_notes := coalesce(p_notes, 'Compra registrada')
  );
  update public.ingredients set unit_cost = weighted_unit_cost where id = p_ingredient_id;
  select * into purchase_row from public.ingredient_purchases where id = purchase_row.id;
  return purchase_row;
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
begin
  if p_quantity <= 0 then raise exception 'A quantidade produzida deve ser maior que zero.' using errcode = '22023'; end if;
  select * into formula_row from public.formulas where id = p_formula_id;
  if formula_row.id is null or formula_row.yield_quantity is null then raise exception 'Fórmula sem rendimento válido.' using errcode = '22023'; end if;
  multiplier := p_quantity / formula_row.yield_quantity;
  for item in select fi.*, i.name, i.unit as ingredient_unit, i.current_stock from public.formula_items fi join public.ingredients i on i.id = fi.ingredient_id where fi.formula_id = p_formula_id for update of i loop
    required_quantity := public.convert_quantity(item.quantity * multiplier, item.unit, item.ingredient_unit);
    if item.current_stock < required_quantity then raise exception 'Estoque insuficiente para %.', item.name using errcode = '22003'; end if;
  end loop;
  for item in select fi.*, i.unit as ingredient_unit from public.formula_items fi join public.ingredients i on i.id = fi.ingredient_id where fi.formula_id = p_formula_id loop
    perform public.adjust_stock(
      p_ingredient_id := item.ingredient_id,
      p_delta := -public.convert_quantity(item.quantity * multiplier, item.unit, item.ingredient_unit),
      p_movement_type := 'production',
      p_reference_id := p_formula_id,
      p_notes := 'Produção pela fórmula ' || formula_row.name
    );
  end loop;
  select name into product_name from public.products where id = formula_row.product_id;
  perform public.adjust_stock(p_product_id := formula_row.product_id, p_delta := p_quantity, p_movement_type := 'production', p_reference_id := p_formula_id, p_notes := 'Produção de ' || product_name);
  return jsonb_build_object('product_id', formula_row.product_id, 'quantity', p_quantity);
end;
$$;

revoke execute on function public.register_ingredient_purchase(uuid, numeric, text, numeric, text, timestamptz, text) from public;
grant execute on function public.register_ingredient_purchase(uuid, numeric, text, numeric, text, timestamptz, text) to anon;
revoke execute on function public.unit_dimension(text) from public;
grant execute on function public.unit_dimension(text) to anon;
revoke execute on function public.normalize_quantity(numeric, text) from public;
grant execute on function public.normalize_quantity(numeric, text) to anon;
revoke execute on function public.convert_quantity(numeric, text, text) from public;
grant execute on function public.convert_quantity(numeric, text, text) to anon;
revoke execute on function public.produce_formula(uuid, numeric) from public;
grant execute on function public.produce_formula(uuid, numeric) to anon;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ingredient_purchases') then alter publication supabase_realtime add table public.ingredient_purchases; end if;
  end if;
end;
$$;
