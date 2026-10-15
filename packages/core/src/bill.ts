import { assertPiasters, type Piasters } from './money.ts';

export interface BillItem {
  price: Piasters;
  quantity: number;
}

export interface BillInput {
  items: readonly BillItem[];
  delivery: Piasters;
  service: Piasters;
}

export interface Bill {
  food: Piasters;
  delivery: Piasters;
  service: Piasters;
  total: Piasters;
}

/**
 * The bill shown to the user. The backend always recalculates it: never trust a total sent by the client.
 */
export function calculateBill({ items, delivery, service }: BillInput): Bill {
  for (const { price, quantity } of items) {
    assertPiasters(price);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new RangeError(`Quantity must be a whole number of at least 1, got ${quantity}`);
    }
  }
  assertPiasters(delivery);
  assertPiasters(service);

  const food = items.reduce((sum, { price, quantity }) => sum + price * quantity, 0);
  return { food, delivery, service, total: food + delivery + service };
}
