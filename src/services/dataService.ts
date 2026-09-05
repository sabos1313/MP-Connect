import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type {
  AppSettings, AppSettingsInsert, Customer, CustomerInsert, Formula, FormulaInsert, FormulaItem, Ingredient, IngredientInsert, IngredientPurchase, Product, ProductInsert, Sale, SaleItem, StockMovement, StockUnit, MovementType,
} from '../types/database';

export interface FormulaRecord extends Formula { items: FormulaItem[]; }
export interface SaleRecord extends Sale { items: SaleItem[]; }
export interface DashboardData { ingredients: Ingredient[]; products: Product[]; sales: SaleRecord[]; customers: Customer[]; movements: StockMovement[]; }

function client() {
  if (!supabase) throw new Error('Configure o Supabase para usar os dados reais da aplicação.');
  return supabase;
}

function ensure<T>({ data, error }: { data: T | null; error: PostgrestError | null }): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('O Supabase não retornou o registro esperado.');
  return data;
}

function ensureSuccess({ error }: { error: PostgrestError | null }) {
  if (error) throw new Error(error.message);
}

export async function listIngredients(search = '', active?: boolean) {
  let query = client().from('ingredients').select('*').order('name');
  if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
  if (active !== undefined) query = query.eq('active', active);
  return ensure(await query);
}

export async function saveIngredient(input: IngredientInsert, id?: string) {
  if (id) return ensure(await client().from('ingredients').update(input).eq('id', id).select().single());
  return ensure(await client().from('ingredients').insert(input).select().single());
}

export async function listProducts(search = '', active?: boolean) {
  let query = client().from('products').select('*').order('name');
  if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
  if (active !== undefined) query = query.eq('active', active);
  return ensure(await query);
}

export async function saveProduct(input: ProductInsert, id?: string) {
  if (id) return ensure(await client().from('products').update(input).eq('id', id).select().single());
  return ensure(await client().from('products').insert(input).select().single());
}

export async function listCustomers(search = '', active?: boolean) {
  let query = client().from('customers').select('*').order('name');
  if (search.trim()) query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
  if (active !== undefined) query = query.eq('active', active);
  return ensure(await query);
}

export async function saveCustomer(input: CustomerInsert, id?: string) {
  if (id) return ensure(await client().from('customers').update(input).eq('id', id).select().single());
  return ensure(await client().from('customers').insert(input).select().single());
}

export async function listFormulas() {
  const formulas = ensure(await client().from('formulas').select('*').order('name'));
  const items = ensure(await client().from('formula_items').select('*'));
  return formulas.map((formula) => ({ ...formula, items: items.filter((item: FormulaItem) => item.formula_id === formula.id) })) as FormulaRecord[];
}

export async function saveFormula(input: FormulaInsert, items: Array<{ ingredient_id: string; quantity: number; unit: StockUnit; notes: string | null }>, id?: string) {
  const savedFormula: Formula = id
    ? ensure(await client().from('formulas').update(input).eq('id', id).select().single())
    : ensure(await client().from('formulas').insert(input).select().single());
  if (id) ensureSuccess(await client().from('formula_items').delete().eq('formula_id', id));
  if (items.length) ensureSuccess(await client().from('formula_items').insert(items.map((item) => ({ ...item, formula_id: savedFormula.id }))));
  return savedFormula;
}

export async function listSales(status?: 'completed' | 'cancelled') {
  let query = client().from('sales').select('*').order('sale_date', { ascending: false });
  if (status) query = query.eq('status', status);
  const sales = ensure(await query);
  const items = ensure(await client().from('sale_items').select('*'));
  return sales.map((sale) => ({ ...sale, items: items.filter((item: SaleItem) => item.sale_id === sale.id) })) as SaleRecord[];
}

export async function createSale(customerId: string | null, items: { product_id: string; quantity: number; unit_price: number }[], discount: number, notes: string | null) {
  return ensure(await client().rpc('create_sale', { p_customer_id: customerId, p_items: items, p_discount: discount, p_notes: notes }));
}

export async function cancelSale(id: string, reason: string) {
  ensureSuccess(await client().rpc('cancel_sale', { p_sale_id: id, p_reason: reason || null }));
}

export async function adjustStock(item: { ingredient_id?: string; product_id?: string; delta: number; movement_type: MovementType; notes?: string }) {
  return ensure(await client().rpc('adjust_stock', { p_ingredient_id: item.ingredient_id ?? null, p_product_id: item.product_id ?? null, p_delta: item.delta, p_movement_type: item.movement_type, p_notes: item.notes ?? null, p_reference_id: null }));
}

export async function produceFormula(formulaId: string, quantity: number) {
  return ensure(await client().rpc('produce_formula', { p_formula_id: formulaId, p_quantity: quantity }));
}

export async function registerIngredientPurchase(input: { ingredient_id: string; quantity: number; unit: StockUnit; total_cost: number; supplier?: string | null; purchase_date?: string; notes?: string | null }) {
  return ensure(await client().rpc('register_ingredient_purchase', {
    p_ingredient_id: input.ingredient_id,
    p_quantity: input.quantity,
    p_unit: input.unit,
    p_total_cost: input.total_cost,
    p_supplier: input.supplier ?? null,
    p_purchase_date: input.purchase_date,
    p_notes: input.notes ?? null,
  }));
}

export async function listIngredientPurchases(ingredientId?: string) {
  let query = client().from('ingredient_purchases').select('*').order('purchase_date', { ascending: false });
  if (ingredientId) query = query.eq('ingredient_id', ingredientId);
  return ensure(await query) as IngredientPurchase[];
}

export async function listMovements(limit = 100) {
  return ensure(await client().from('stock_movements').select('*').order('created_at', { ascending: false }).limit(limit));
}

export async function getSettings() {
  const { data: settings, error } = await client().from('app_settings').select('*').eq('id', 1).maybeSingle();
  if (error) throw new Error(error.message);
  if (settings) return settings;
  return ensure(await client().from('app_settings').insert({ id: 1 }).select().single());
}

export async function saveSettings(input: Partial<AppSettingsInsert>) {
  return ensure(await client().from('app_settings').upsert({ id: 1, ...input }).select().single());
}

export async function getDashboardData(): Promise<DashboardData> {
  const [ingredients, products, sales, customers, movements] = await Promise.all([listIngredients(), listProducts(), listSales('completed'), listCustomers(), listMovements(8)]);
  return { ingredients, products, sales, customers, movements };
}

export async function getBirthdays() {
  return listCustomers('', true);
}

export async function deleteIfSafe(table: 'ingredients' | 'products' | 'customers', id: string) {
  ensureSuccess(await client().from(table).delete().eq('id', id));
}

export function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

export function unitOptions(): StockUnit[] { return ['g', 'kg', 'ml', 'L', 'unidade']; }