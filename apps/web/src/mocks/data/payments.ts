import type { SavedPaymentMethod } from '@lo2ma/core';

/** The demo's saved payment methods. The backend's demo has the same (backend/seed/payment-methods.json). */
export const savedPaymentMethods: SavedPaymentMethod[] = [
  { method: 'card', last4: '4821' },
  { method: 'wallet' },
];
