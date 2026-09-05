import type { FormulaItem, Ingredient, StockUnit } from '../types/database';

export interface FormulaCostItem extends FormulaItem {
  ingredient: Ingredient;
  normalizedQuantity: number;
  unitCost: number;
  itemCost: number;
}

export interface FormulaCostSummary {
  items: FormulaCostItem[];
  ingredientsCost: number;
  additionalCost: number;
  totalCost: number;
  desiredMarkup: number;
  estimatedProfit: number;
  suggestedPrice: number;
  salePrice: number | null;
  realProfit: number | null;
  realMarkup: number | null;
}

export function unitDimension(unit: StockUnit) {
  if (unit === 'g' || unit === 'kg') return 'mass';
  if (unit === 'ml' || unit === 'L') return 'volume';
  return 'count';
}

export function normalizeQuantity(quantity: number, unit: StockUnit) {
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('A quantidade deve ser maior que zero.');
  if (unit === 'kg' || unit === 'L') return quantity * 1000;
  return quantity;
}

export function convertQuantity(quantity: number, fromUnit: StockUnit, toUnit: StockUnit) {
  if (unitDimension(fromUnit) !== unitDimension(toUnit)) {
    throw new Error(`Não é possível converter ${fromUnit} para ${toUnit}.`);
  }
  return normalizeQuantity(quantity, fromUnit) / normalizeQuantity(1, toUnit);
}

export function calculateFormulaCost(
  items: FormulaItem[],
  ingredients: Ingredient[],
  additionalCost: number,
  desiredMarkup: number,
  salePrice: number | null,
): FormulaCostSummary {
  if (!Number.isFinite(additionalCost) || additionalCost < 0) throw new Error('O custo adicional não pode ser negativo.');
  if (!Number.isFinite(desiredMarkup) || desiredMarkup < 0) throw new Error('O markup desejado não pode ser negativo.');
  const costItems = items.map((item) => {
    const ingredient = ingredients.find((candidate) => candidate.id === item.ingredient_id);
    if (!ingredient) throw new Error('Um ingrediente da ficha técnica não está disponível.');
    const normalizedQuantity = convertQuantity(item.quantity, item.unit, ingredient.unit);
    const unitCost = ingredient.unit_cost;
    return { ...item, ingredient, normalizedQuantity, unitCost, itemCost: normalizedQuantity * unitCost };
  });
  const ingredientsCost = costItems.reduce((total, item) => total + item.itemCost, 0);
  const totalCost = ingredientsCost + additionalCost;
  const estimatedProfit = totalCost * (desiredMarkup / 100);
  const suggestedPrice = totalCost + estimatedProfit;
  const realProfit = salePrice === null ? null : salePrice - totalCost;
  const realMarkup = salePrice === null || totalCost === 0 ? null : (realProfit! / totalCost) * 100;
  return { items: costItems, ingredientsCost, additionalCost, totalCost, desiredMarkup, estimatedProfit, suggestedPrice, salePrice, realProfit, realMarkup };
}
