import { describe, expect, it } from 'vitest';
import { calculateBill } from './bill.ts';

describe('calculateBill', () => {
  it('matches the meal details screen: food 120 + delivery 20 + service 10 = 150', () => {
    const bill = calculateBill({
      items: [
        { price: 9500, quantity: 1 },
        { price: 2500, quantity: 1 },
      ],
      delivery: 2000,
      service: 1000,
    });
    expect(bill).toEqual({ food: 12000, delivery: 2000, service: 1000, total: 15000 });
  });

  it('multiplies by quantity', () => {
    const bill = calculateBill({ items: [{ price: 4500, quantity: 3 }], delivery: 0, service: 0 });
    expect(bill.food).toBe(13500);
  });

  it('gives a zero food subtotal for an empty cart', () => {
    expect(calculateBill({ items: [], delivery: 2000, service: 1000 }).food).toBe(0);
  });

  it.each([
    { items: [{ price: 95.5, quantity: 1 }], delivery: 0, service: 0 },
    { items: [{ price: 9500, quantity: 0 }], delivery: 0, service: 0 },
    { items: [{ price: 9500, quantity: 1.5 }], delivery: 0, service: 0 },
    { items: [], delivery: 20.5, service: 0 },
  ])('rejects invalid input %#', (input) => {
    expect(() => calculateBill(input)).toThrow(RangeError);
  });
});
