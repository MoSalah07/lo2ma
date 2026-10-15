import type { AdminUser, Coupon, Order, SessionUser, UserPrefs, WeeklyPlan } from '@lo2ma/core';
import { seedCoupons } from './data/admin';

// The mock "database". Handlers run in the browser, so localStorage keeps data across reloads.
// In tests (no localStorage) everything lives in memory.

interface MockState {
  prefs: UserPrefs | null;
  session: SessionUser | null;
  orders: (Order & { createdAt: number })[];
  plan: WeeklyPlan | null;
  /** The cheapest total of the last suggestions, for «أرخص من كده». */
  lastCheapest: number | null;
  /** Admins have their own session, separate from customers. */
  adminSession: AdminUser | null;
  /** Between the password step and the authenticator code. */
  adminChallenge: { id: string; email: string } | null;
  coupons: Coupon[];
}

const KEY = 'lo2ma-mock-db';
const empty = (): MockState => ({
  prefs: null,
  session: null,
  orders: [],
  plan: null,
  lastCheapest: null,
  adminSession: null,
  adminChallenge: null,
  coupons: seedCoupons,
});

let memory: MockState = empty();

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readDb(): MockState {
  const raw = storage()?.getItem(KEY);
  return raw ? { ...empty(), ...(JSON.parse(raw) as Partial<MockState>) } : memory;
}

export function writeDb(update: (state: MockState) => MockState): MockState {
  const next = update(readDb());
  const store = storage();
  if (store) store.setItem(KEY, JSON.stringify(next));
  else memory = next;
  return next;
}

export function resetDb(): void {
  memory = empty();
  storage()?.removeItem(KEY);
}
