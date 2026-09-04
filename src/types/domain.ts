export interface DashboardMetric {
  label: string;
  value: number | null;
  helper?: string;
}

export type {
  Customer,
  Formula,
  FormulaItem,
  Ingredient,
  MovementType,
  Product,
  Sale,
  SaleItem,
  StockMovement,
  StockUnit,
} from './database';

export interface NavigationItem {
  label: string;
  path: string;
  icon: string;
}

export type ModuleKey =
  | 'estoque'
  | 'insumos'
  | 'produtos'
  | 'formulas'
  | 'clientes'
  | 'vendas'
  | 'aniversarios'
  | 'relatorios'
  | 'configuracoes';