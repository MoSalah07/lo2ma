import {
  ADMIN_PAGE_SIZE,
  adminOrderStatuses,
  BREAK_TIMES,
  fromPounds,
  type AdminOrder,
  type AdminOrdersPage,
  type AdminOrdersQuery,
  type AdminOrderStatus,
  type AdminOverview,
  type OverviewRange,
} from '@lo2ma/core';
import { companies, conversations, customers } from '../data/admin';
import { restaurants } from '../data/restaurants';

// A believable order history for the admin dashboard, generated the same way on every load: the same day
// always gives the same orders, so screenshots and tests stay stable.

const HISTORY_WORKDAYS = 50;
const CHART_DAYS = 10;
const RECENT = 5;
/** The newest order of the latest workday; older orders count down from here. */
const NEWEST_ID = 10482;
const RANGE_WORKDAYS: Record<Exclude<OverviewRange, 'today'>, number> = { week: 5, month: 22 };

/** A small seeded random generator (mulberry32), so the history is the same on every load. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(items: readonly T[], random: () => number): T =>
  items[Math.floor(random() * items.length)]!;

// Dates are handled as "YYYY-MM-DD" in UTC so the time zone never shifts a day.
const toIso = (date: Date) => date.toISOString().slice(0, 10);
const isWorkday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay() <= 4; // Sunday–Thursday

function previousDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return toIso(date);
}

/** The workdays up to `today`, newest first. On a weekend «today» is the last Thursday. */
export function workdaysBefore(today: Date, count: number): string[] {
  const local = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const days: string[] = [];
  for (let iso = toIso(local); days.length < count; iso = previousDay(iso)) {
    if (isWorkday(iso)) days.push(iso);
  }
  return days;
}

function statusFor(random: () => number, isLatestDay: boolean): AdminOrderStatus {
  const roll = random();
  if (!isLatestDay) return roll < 0.012 ? 'rejected' : roll < 0.06 ? 'late' : 'delivered';
  if (roll < 0.04) return 'new';
  if (roll < 0.14) return 'preparing';
  if (roll < 0.21) return 'onTheWay';
  if (roll < 0.28) return 'late';
  if (roll < 0.3) return 'rejected';
  return 'delivered';
}

let cache: { key: string; orders: AdminOrder[] } | null = null;

/** Every order of the last {@link HISTORY_WORKDAYS} workdays, newest first. */
export function orderHistory(today: Date): AdminOrder[] {
  const days = workdaysBefore(today, HISTORY_WORKDAYS);
  const key = days[0]!;
  if (cache?.key === key) return cache.orders;

  const random = seeded(Number(key.replaceAll('-', '')));
  const orders: AdminOrder[] = [];
  let id = NEWEST_ID;
  days.forEach((date, age) => {
    // Busier lately: about 95 orders a day two months ago, about 140 now.
    const count = Math.round(140 - age * 0.9 + (random() - 0.5) * 24);
    for (let index = 0; index < count; index += 1) {
      const solo = random() < 0.1;
      orders.push({
        id: `LQ-${id--}`,
        date,
        customer: pick(customers, random),
        company: solo ? null : pick(companies, random),
        restaurant: pick(restaurants, random).name,
        total: fromPounds(100 + Math.floor(random() * 23) * 5),
        breakTime: pick(BREAK_TIMES, random),
        status: statusFor(random, age === 0),
      });
    }
  });

  // The orders the agent log links to belong to the people in those conversations.
  for (const conversation of conversations) {
    const order = orders.find((candidate) => candidate.id === conversation.orderId);
    const confirmed = conversation.steps.find((step) => step.kind === 'confirmed');
    if (order && conversation.customer && confirmed) {
      order.customer = conversation.customer;
      order.total = confirmed.total;
    }
  }

  cache = { key, orders };
  return orders;
}

const normalize = (text: string) => text.trim().toLowerCase().replace(/^#/, '');

/** The orders matching the filters: `matching` ignores the status, so the chips can show their counts. */
function filterOrders(today: Date, query: AdminOrdersQuery) {
  const history = orderHistory(today);
  const month = query.month ?? history[0]!.date.slice(0, 7);
  const q = normalize(query.q ?? '');
  const matching = history.filter(
    (order) =>
      order.date.startsWith(month) &&
      (!query.company || order.company?.id === query.company) &&
      (!q || order.id.toLowerCase().includes(q) || order.customer.toLowerCase().includes(q)),
  );
  const filtered = query.status
    ? matching.filter((order) => order.status === query.status)
    : matching;
  return { month, matching, filtered };
}

/** One page of the orders table, filtered like the admin screen asks. */
export function queryOrders(today: Date, query: AdminOrdersQuery): AdminOrdersPage {
  const { month, matching, filtered } = filterOrders(today, query);
  const counts = Object.fromEntries([
    ['all', matching.length],
    ...adminOrderStatuses.map((status) => [
      status,
      matching.filter((order) => order.status === status).length,
    ]),
  ]) as AdminOrdersPage['counts'];

  const pageCount = Math.ceil(filtered.length / ADMIN_PAGE_SIZE);
  const page = Math.min(query.page ?? 1, Math.max(pageCount, 1));
  return {
    items: filtered.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE),
    month,
    page,
    pageCount,
    total: filtered.length,
    counts,
  };
}

/** Every order matching the filters, without paging, for the CSV export. */
export const exportOrders = (today: Date, query: AdminOrdersQuery) =>
  filterOrders(today, query).filtered;

// Overview -----------------------------------------------------------------------------------------

const percentChange = (current: number, previous: number) =>
  previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);

/** The AI's cost per order on a given day, in piasters: about 0.40 EGP, a little different each day. */
const aiCostOn = (date: string) => 38 + (Number(date.replaceAll('-', '')) % 9);

function summarize(orders: AdminOrder[], days: string[]) {
  const served = orders.filter((order) => order.status !== 'rejected');
  const done = orders.filter((order) => order.status === 'delivered' || order.status === 'late');
  const onTime = done.filter((order) => order.status === 'delivered').length;
  return {
    orders: orders.length,
    revenue: served.reduce((sum, order) => sum + order.total, 0),
    onTime: done.length === 0 ? 0 : Math.round((onTime / done.length) * 100),
    aiCost: Math.round(days.reduce((sum, day) => sum + aiCostOn(day), 0) / days.length),
  };
}

/** Orders that share a day, a company and a break time travel together; solo orders go alone. */
function countTrips(orders: AdminOrder[]): number {
  return new Set(
    orders.map((order) => `${order.date}|${order.company?.id ?? order.id}|${order.breakTime}`),
  ).size;
}

const clock = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export function overview(today: Date, range: OverviewRange): AdminOverview {
  const history = orderHistory(today);
  const workdays = workdaysBefore(today, HISTORY_WORKDAYS);
  const length = range === 'today' ? 1 : RANGE_WORKDAYS[range];
  const currentDays = workdays.slice(0, length);
  // «Today» compares with the same weekday last week; longer ranges with the period just before.
  const previousDays =
    range === 'today' ? workdays.slice(5, 6) : workdays.slice(length, length * 2);

  const on = (days: string[]) => history.filter((order) => days.includes(order.date));
  const current = on(currentDays);
  const now = summarize(current, currentDays);
  const before = summarize(on(previousDays), previousDays);

  const served = current.filter((order) => order.status !== 'rejected');
  return {
    range,
    day: workdays[0]!,
    updatedAt: clock(today),
    kpis: {
      orders: { value: now.orders, change: percentChange(now.orders, before.orders) },
      revenue: { value: now.revenue, change: percentChange(now.revenue, before.revenue) },
      onTime: { value: now.onTime, change: now.onTime - before.onTime },
      aiCost: { value: now.aiCost, change: now.aiCost - before.aiCost },
    },
    daily: workdays
      .slice(0, CHART_DAYS)
      .reverse()
      .map((date) => ({ date, orders: on([date]).length })),
    slots: BREAK_TIMES.map((breakTime) => ({
      breakTime,
      orders: current.filter((order) => order.breakTime === breakTime).length,
    })),
    batch: { orders: served.length, trips: countTrips(served) },
    recent: current.slice(0, RECENT),
  };
}
