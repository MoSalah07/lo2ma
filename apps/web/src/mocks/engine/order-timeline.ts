import { sharesCourierPhone, type OrderStatus } from '@lo2ma/core';

// When each step happens is a business rule in @lo2ma/core (orderTimeline). Only the demo's courier lives here.

/** A demo number; the courier's real number arrives with the restaurant integration. */
const DEMO_COURIER_PHONE = '+201000000000';

/** The courier's number, once core says it is shared. */
export function courierPhoneAt(status: OrderStatus): string | undefined {
  return sharesCourierPhone(status) ? DEMO_COURIER_PHONE : undefined;
}
