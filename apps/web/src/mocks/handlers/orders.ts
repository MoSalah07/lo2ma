import {
  arrivalTimeFor,
  createOrderSchema,
  orderSteps,
  type Order,
  type OrderStatus,
} from '@lo2ma/core';
import { http, HttpResponse } from 'msw';
import { savedPaymentMethods } from '../data/payments';
import { courierPhoneAt, timelineFor } from '../engine/order-timeline';
import { planOrders } from '../engine/plan-progress';
import { suggestionFromId } from '../engine/suggest';
import { readDb, writeDb } from '../store';
import { fail, readBody, route } from './respond';

/** The demo moves an order one step every few seconds, so the tracking screen can be watched end to end. */
const SECONDS_PER_STEP = 8;

function statusAt(createdAt: number, now: number): OrderStatus {
  const step = Math.floor((now - createdAt) / 1000 / SECONDS_PER_STEP);
  return orderSteps[Math.min(step, orderSteps.length - 1)] ?? 'sent';
}

function withLiveStatus({ createdAt, ...order }: Order & { createdAt: number }): Order {
  const status = statusAt(createdAt, Date.now());
  return { ...order, status, courierPhone: courierPhoneAt(status) };
}

/** One-off orders first, then the ones the weekly plan has sent. */
function allOrders(): Order[] {
  const db = readDb();
  return [...db.orders.map(withLiveStatus), ...planOrders(db.plan)];
}

export const orderHandlers = [
  http.get(route('/payment-methods'), () => HttpResponse.json(savedPaymentMethods)),

  http.post(route('/orders'), async ({ request }) => {
    const db = readDb();
    if (!db.session) return fail(401, 'auth_required');
    const body = await readBody(request, createOrderSchema);
    if (!body) return fail(400, 'invalid_order');
    const suggestion = suggestionFromId(body.suggestionId);
    if (!suggestion) return fail(404, 'suggestion_not_found');

    const breakTime = db.prefs?.breakTime ?? '13:30';
    const arrivalTime = arrivalTimeFor(breakTime);
    const order = {
      id: `LQ-${10482 + db.orders.length}`,
      suggestion,
      status: 'sent' as const,
      timeline: timelineFor(arrivalTime),
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

  http.get(route('/orders'), () => HttpResponse.json(allOrders())),

  http.get(route('/orders/:id'), ({ params }) => {
    const order = allOrders().find((item) => item.id === params.id);
    return order ? HttpResponse.json(order) : fail(404, 'order_not_found');
  }),
];
