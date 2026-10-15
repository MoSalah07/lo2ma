import { ADMIN_PAGE_SIZE, adminOrdersPageSchema, adminOverviewSchema } from '@lo2ma/core';
import { describe, expect, it } from 'vitest';
import { orderHistory, overview, queryOrders, workdaysBefore } from './admin';

// Wednesday 14 October 2026, at 12:40.
const wednesday = new Date(2026, 9, 14, 12, 40);
// Saturday 17 October 2026: a weekend.
const saturday = new Date(2026, 9, 17, 10, 0);

describe('workdaysBefore', () => {
  it('counts back over Sunday to Thursday only', () => {
    expect(workdaysBefore(wednesday, 6)).toEqual([
      '2026-10-14',
      '2026-10-13',
      '2026-10-12',
      '2026-10-11',
      '2026-10-08',
      '2026-10-07',
    ]);
  });

  it('treats the last Thursday as «today» on a weekend', () => {
    expect(workdaysBefore(saturday, 1)).toEqual(['2026-10-15']);
  });
});

describe('orderHistory', () => {
  it('gives the same orders for the same day, newest first', () => {
    const first = orderHistory(wednesday);
    expect(orderHistory(new Date(2026, 9, 14, 16, 0))).toEqual(first);
    expect(first[0]).toMatchObject({ id: 'LQ-10482', date: '2026-10-14' });
    const sorted = first.every(
      (order, index) => index === 0 || order.date <= first[index - 1]!.date,
    );
    expect(sorted).toBe(true);
  });

  it('never has an order under the minimum', () => {
    expect(orderHistory(wednesday).every((order) => order.total >= 10000)).toBe(true);
  });

  it('gives the orders in the agent log to the people who placed them', () => {
    const order = orderHistory(wednesday).find((candidate) => candidate.id === 'LQ-10482');
    expect(order).toMatchObject({ customer: 'يوسف حسن', total: 15000 });
  });
});

describe('queryOrders', () => {
  it('pages through the latest month and counts each status for the chips', () => {
    const page = adminOrdersPageSchema.parse(queryOrders(wednesday, {}));
    expect(page.month).toBe('2026-10');
    expect(page.items).toHaveLength(ADMIN_PAGE_SIZE);
    expect(page.pageCount).toBe(Math.ceil(page.total / ADMIN_PAGE_SIZE));
    const { all, ...byStatus } = page.counts;
    expect(Object.values(byStatus).reduce((sum, count) => sum + count, 0)).toBe(all);
  });

  it('filters by status, company and search, and keeps the page in range', () => {
    const late = queryOrders(wednesday, { status: 'late', page: 999 });
    expect(late.items.every((order) => order.status === 'late')).toBe(true);
    expect(late.page).toBe(late.pageCount);

    const ofok = queryOrders(wednesday, { company: 'c1' });
    expect(ofok.items.every((order) => order.company?.id === 'c1')).toBe(true);

    const found = queryOrders(wednesday, { q: '#lq-10482' }).items.map((order) => order.id);
    expect(found).toEqual(['LQ-10482']);
  });
});

describe('overview', () => {
  it('matches the contract for every range', () => {
    for (const range of ['today', 'week', 'month'] as const) {
      const data = adminOverviewSchema.parse(overview(wednesday, range));
      expect(data.daily).toHaveLength(10);
      expect(data.slots.reduce((sum, slot) => sum + slot.orders, 0)).toBe(data.kpis.orders.value);
      expect(data.batch.trips).toBeLessThan(data.batch.orders);
    }
  });

  it('reports the time it was built and the latest workday', () => {
    const data = overview(saturday, 'today');
    expect(data.day).toBe('2026-10-15');
    expect(data.updatedAt).toBe('10:00');
  });
});
