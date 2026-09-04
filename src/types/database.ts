export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      ingredients: { Row: Ingredient & Record<string, unknown>; Insert: IngredientInsert & Record<string, unknown>; Update: IngredientUpdate & Record<string, unknown>; Relationships: []; };
      products: { Row: Product & Record<string, unknown>; Insert: ProductInsert & Record<string, unknown>; Update: ProductUpdate & Record<string, unknown>; Relationships: []; };
      formulas: {
        Row: Formula & Record<string, unknown>; Insert: FormulaInsert & Record<string, unknown>; Update: FormulaUpdate & Record<string, unknown>;
        Relationships: [{ foreignKeyName: 'formulas_product_id_fkey'; columns: ['product_id']; isOneToOne: false; referencedRelation: 'products'; referencedColumns: ['id'] }];
      };
      formula_items: {
        Row: FormulaItem & Record<string, unknown>; Insert: FormulaItemInsert & Record<string, unknown>; Update: FormulaItemUpdate & Record<string, unknown>;
        Relationships: [
          { foreignKeyName: 'formula_items_formula_id_fkey'; columns: ['formula_id']; isOneToOne: false; referencedRelation: 'formulas'; referencedColumns: ['id'] },
          { foreignKeyName: 'formula_items_ingredient_id_fkey'; columns: ['ingredient_id']; isOneToOne: false; referencedRelation: 'ingredients'; referencedColumns: ['id'] }
        ];
      };
      customers: { Row: Customer & Record<string, unknown>; Insert: CustomerInsert & Record<string, unknown>; Update: CustomerUpdate & Record<string, unknown>; Relationships: []; };
      sales: {
        Row: Sale & Record<string, unknown>; Insert: SaleInsert & Record<string, unknown>; Update: SaleUpdate & Record<string, unknown>;
        Relationships: [{ foreignKeyName: 'sales_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'customers'; referencedColumns: ['id'] }];
      };
      app_settings: { Row: AppSettings & Record<string, unknown>; Insert: AppSettingsInsert & Record<string, unknown>; Update: AppSettingsUpdate & Record<string, unknown>; Relationships: []; };
      sale_items: {
        Row: SaleItem & Record<string, unknown>; Insert: SaleItemInsert & Record<string, unknown>; Update: SaleItemUpdate & Record<string, unknown>;
        Relationships: [
          { foreignKeyName: 'sale_items_product_id_fkey'; columns: ['product_id']; isOneToOne: false; referencedRelation: 'products'; referencedColumns: ['id'] },
          { foreignKeyName: 'sale_items_sale_id_fkey'; columns: ['sale_id']; isOneToOne: false; referencedRelation: 'sales'; referencedColumns: ['id'] }
        ];
      };
      stock_movements: {
        Row: StockMovement & Record<string, unknown>; Insert: StockMovementInsert & Record<string, unknown>; Update: StockMovementUpdate & Record<string, unknown>;
        Relationships: [
          { foreignKeyName: 'stock_movements_ingredient_id_fkey'; columns: ['ingredient_id']; isOneToOne: false; referencedRelation: 'ingredients'; referencedColumns: ['id'] },
          { foreignKeyName: 'stock_movements_product_id_fkey'; columns: ['product_id']; isOneToOne: false; referencedRelation: 'products'; referencedColumns: ['id'] }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      adjust_stock: { Args: { p_ingredient_id?: string | null; p_product_id?: string | null; p_delta?: number; p_movement_type?: MovementType; p_notes?: string | null; p_reference_id?: string | null }; Returns: StockMovement };
      create_sale: { Args: { p_customer_id: string | null; p_items: Json; p_discount?: number; p_notes?: string | null }; Returns: string };
      cancel_sale: { Args: { p_sale_id: string; p_reason?: string | null }; Returns: undefined };
      produce_formula: { Args: { p_formula_id: string; p_quantity: number }; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type StockUnit = 'g' | 'kg' | 'ml' | 'L' | 'unidade';
export type MovementType = 'purchase' | 'manual_addition' | 'sale' | 'adjustment' | 'production' | 'manual_removal';

export interface Ingredient { id: string; name: string; description: string | null; unit: StockUnit; current_stock: number; minimum_stock: number; unit_cost: number; active: boolean; created_at: string; updated_at: string; }
export interface IngredientInsert { [key: string]: unknown; id?: string; name: string; description?: string | null; unit: StockUnit; current_stock?: number; minimum_stock?: number; unit_cost?: number; active?: boolean; created_at?: string; updated_at?: string; }
export interface IngredientUpdate { [key: string]: unknown; id?: string; name?: string; description?: string | null; unit?: StockUnit; current_stock?: number; minimum_stock?: number; unit_cost?: number; active?: boolean; created_at?: string; updated_at?: string; }

export interface Product { id: string; name: string; description: string | null; sale_price: number; current_stock: number; minimum_stock: number; unit: StockUnit; active: boolean; created_at: string; updated_at: string; }
export interface ProductInsert { [key: string]: unknown; id?: string; name: string; description?: string | null; sale_price?: number; current_stock?: number; minimum_stock?: number; unit?: StockUnit; active?: boolean; created_at?: string; updated_at?: string; }
export interface ProductUpdate { [key: string]: unknown; id?: string; name?: string; description?: string | null; sale_price?: number; current_stock?: number; minimum_stock?: number; unit?: StockUnit; active?: boolean; created_at?: string; updated_at?: string; }

export interface Formula { id: string; product_id: string; name: string; description: string | null; yield_quantity: number | null; yield_unit: StockUnit | null; preparation_notes: string | null; created_at: string; updated_at: string; }
export interface FormulaInsert { [key: string]: unknown; id?: string; product_id: string; name: string; description?: string | null; yield_quantity?: number | null; yield_unit?: StockUnit | null; preparation_notes?: string | null; created_at?: string; updated_at?: string; }
export interface FormulaUpdate { [key: string]: unknown; id?: string; product_id?: string; name?: string; description?: string | null; yield_quantity?: number | null; yield_unit?: StockUnit | null; preparation_notes?: string | null; created_at?: string; updated_at?: string; }

export interface FormulaItem { id: string; formula_id: string; ingredient_id: string; quantity: number; unit: StockUnit; notes: string | null; created_at: string; }
export interface FormulaItemInsert { id?: string; formula_id: string; ingredient_id: string; quantity: number; unit: StockUnit; notes?: string | null; created_at?: string; }
export interface FormulaItemUpdate { id?: string; formula_id?: string; ingredient_id?: string; quantity?: number; unit?: StockUnit; notes?: string | null; created_at?: string; }

export interface Customer { id: string; name: string; phone: string | null; email: string | null; birth_date: string | null; notes: string | null; active: boolean; created_at: string; updated_at: string; }
export interface CustomerInsert { [key: string]: unknown; id?: string; name: string; phone?: string | null; email?: string | null; birth_date?: string | null; notes?: string | null; active?: boolean; created_at?: string; updated_at?: string; }
export interface CustomerUpdate { [key: string]: unknown; id?: string; name?: string; phone?: string | null; email?: string | null; birth_date?: string | null; notes?: string | null; active?: boolean; created_at?: string; updated_at?: string; }

export type SaleStatus = 'completed' | 'cancelled';
export interface Sale { id: string; customer_id: string | null; sale_date: string; subtotal: number; discount: number; total: number; status: SaleStatus; cancelled_at: string | null; cancellation_reason: string | null; notes: string | null; created_at: string; updated_at: string; }
export interface SaleInsert { id?: string; customer_id?: string | null; sale_date?: string; subtotal?: number; discount?: number; total?: number; status?: SaleStatus; cancelled_at?: string | null; cancellation_reason?: string | null; notes?: string | null; created_at?: string; updated_at?: string; }
export interface SaleUpdate { id?: string; customer_id?: string | null; sale_date?: string; subtotal?: number; discount?: number; total?: number; status?: SaleStatus; cancelled_at?: string | null; cancellation_reason?: string | null; notes?: string | null; created_at?: string; updated_at?: string; }

export interface SaleItem { id: string; sale_id: string; product_id: string; quantity: number; unit_price: number; subtotal: number; created_at: string; }
export interface SaleItemInsert { id?: string; sale_id: string; product_id: string; quantity: number; unit_price: number; subtotal: number; created_at?: string; }
export interface SaleItemUpdate { id?: string; sale_id?: string; product_id?: string; quantity?: number; unit_price?: number; subtotal?: number; created_at?: string; }

export interface StockMovement { id: string; ingredient_id: string | null; product_id: string | null; movement_type: MovementType; quantity: number; unit: StockUnit; previous_stock: number | null; new_stock: number | null; reference_id: string | null; notes: string | null; created_at: string; }
export interface StockMovementInsert { id?: string; ingredient_id?: string | null; product_id?: string | null; movement_type: MovementType; quantity: number; unit: StockUnit; previous_stock?: number | null; new_stock?: number | null; reference_id?: string | null; notes?: string | null; created_at?: string; }
export interface StockMovementUpdate { id?: string; ingredient_id?: string | null; product_id?: string | null; movement_type?: MovementType; quantity?: number; unit?: StockUnit; previous_stock?: number | null; new_stock?: number | null; reference_id?: string | null; notes?: string | null; created_at?: string; }

export interface AppSettings { id: number; company_name: string; currency: string; notes: string | null; created_at: string; updated_at: string; }
export interface AppSettingsInsert { id?: number; company_name?: string; currency?: string; notes?: string | null; created_at?: string; updated_at?: string; }
export interface AppSettingsUpdate { id?: number; company_name?: string; currency?: string; notes?: string | null; created_at?: string; updated_at?: string; }