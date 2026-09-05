import { describe, expect, it } from 'vitest';
import { calculateFormulaCost, convertQuantity } from './costing';
import type { FormulaItem, Ingredient } from '../types/database';

const ingredient = (id: string, unit: Ingredient['unit'], unitCost: number): Ingredient => ({
  id, name: id, description: null, unit, unit_cost: unitCost, current_stock: 1000, minimum_stock: 0, active: true, created_at: '', updated_at: '',
});

const item = (ingredientId: string, quantity: number, unit: FormulaItem['unit']): FormulaItem => ({
  id: ingredientId, formula_id: 'formula', ingredient_id: ingredientId, quantity, unit, notes: null, created_at: '', updated_at: '',
});

describe('formation of cost calculations', () => {
  it('converts kg to g and calculates item and total costs', () => {
    expect(convertQuantity(1, 'kg', 'g')).toBe(1000);
    const result = calculateFormulaCost([item('oil', 100, 'g')], [ingredient('oil', 'g', 0.04)], 0, 0, null);
    expect(result.items[0].itemCost).toBeCloseTo(4);
    expect(result.totalCost).toBeCloseTo(4);
  });

  it('converts liters to milliliters', () => {
    expect(convertQuantity(1, 'L', 'ml')).toBe(1000);
    const result = calculateFormulaCost([item('essence', 10, 'ml')], [ingredient('essence', 'L', 30)], 0, 0, null);
    expect(result.items[0].itemCost).toBeCloseTo(0.3);
  });

  it('calculates 30% and 120% markup over total cost', () => {
    const ingredients = [ingredient('base', 'g', 0.1)];
    expect(calculateFormulaCost([item('base', 100, 'g')], ingredients, 0, 30, null).suggestedPrice).toBeCloseTo(13);
    expect(calculateFormulaCost([item('base', 100, 'g')], ingredients, 0, 120, null).suggestedPrice).toBeCloseTo(22);
  });

  it('calculates real profit and markup from the actual sale price', () => {
    const result = calculateFormulaCost([item('base', 100, 'g')], [ingredient('base', 'g', 0.1)], 0, 120, 30);
    expect(result.realProfit).toBeCloseTo(20);
    expect(result.realMarkup).toBeCloseTo(200);
  });

  it('recalculates when quantity changes and rejects incompatible units', () => {
    const ingredients = [ingredient('oil', 'g', 0.04)];
    expect(calculateFormulaCost([item('oil', 100, 'g')], ingredients, 1, 50, null).totalCost).toBeCloseTo(5);
    expect(calculateFormulaCost([item('oil', 200, 'g')], ingredients, 1, 50, null).totalCost).toBeCloseTo(9);
    expect(() => calculateFormulaCost([item('oil', 10, 'ml')], ingredients, 0, 0, null)).toThrow('Não é possível converter');
  });
});
