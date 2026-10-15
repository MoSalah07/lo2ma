import {
  addMinutes,
  ARRIVAL_BUFFER_MINUTES,
  createOrderSchema,
  orderSteps,
  type Order,
  type OrderStatus,
} from '@lo2ma/core';
import { http, HttpResponse } from 'msw';
import { suggestionFromId } from '../engine/suggest';
import { readDb, writeDb } from '../store';
import { fail, readBody, route } from './respond';

/** The demo moves an order one step every few seconds, so the tracking screen can be watched end to end. */
const SECONDS_PER_STEP = 8;

/** Minutes before arrival at which each step is expected. */
const STEP_OFFSETS: Record<OrderStatus, number> = {
  sent: -45,
  accepted: -44,
  preparing: -35,
  onTheWay: -20,
  delivered: 0,
};

function statusAt(createdAt: number, now: number): OrderStatus {
  const step = Math.floor((now - createdAt) / 1000 / SECONDS_PER_STEP);
  return orderSteps[Math.min(step, orderSteps.length - 1)] ?? 'sent';
}

/** A demo number; the courier's real number arrives with the restaurant integration. */
const DEMO_COURIER_PHONE = '+201000000000';

function withLiveStatus({ createdAt, ...order }: Order & { createdAt: number }): Order {
  const status = statusAt(createdAt, Date.now());
  const courierAssigned = orderSteps.indexOf(status) >= orderSteps.indexOf('onTheWay');
  return { ...order, status, courierPhone: courierAssigned ? DEMO_COURIER_PHONE : undefined };
}

export const orderHandlers = [
  http.get(route('/payment-methods'), () =>
    HttpResponse.json([{ method: 'card', last4: '4821' }, { method: 'wallet' }]),
  ),

  http.post(route('/orders'), async ({ request }) => {
    const db = readDb();
    if (!db.session) return fail(401, 'auth_required');
    const body = await readBody(request, createOrderSchema);
    if (!body) return fail(400, 'invalid_order');
    const suggestion = suggestionFromId(body.suggestionId);
    if (!suggestion) return fail(404, 'suggestion_not_found');

    const breakTime = db.prefs?.breakTime ?? '13:30';
    const arrivalTime = addMinutes(breakTime, -ARRIVAL_BUFFER_MINUTES);
    const order = {
      id: `LQ-${10482 + db.orders.length}`,
      suggestion,
      status: 'sent' as const,
      timeline: orderSteps.map((status) => ({
        status,
        at: addMinutes(arrivalTime, STEP_OFFSETS[status]),
      })),
      breakTime,
      arrivalTime,
      onTime: true,
      paymentMethod: body.paymentMethod,
      note: body.note,
      createdAt: Date.now(),
    };
    writeDb((state) => ({ ...state, orders: [order, ...state.orders] }));
    return HttpResponse.json(withLiveStatus(order), { status: 201 });
  }),

  http.get(route('/orders'), () => HttpResponse.json(readDb().orders.map(withLiveStatus))),

  http.get(route('/orders/:id'), ({ params }) => {
    const order = readDb().orders.find((item) => item.id === params.id);
    return order ? HttpResponse.json(withLiveStatus(order)) : fail(404, 'order_not_found');
  }),
];
