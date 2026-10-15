import { z } from 'zod';
import { time24Schema } from './common.ts';
import { suggestionSchema } from './suggestion.ts';

/** The steps a customer sees, in order. */
export const orderSteps = ['sent', 'accepted', 'preparing', 'onTheWay', 'delivered'] as const;
export const orderStatusSchema = z.enum(orderSteps);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const paymentMethodSchema = z.enum(['card', 'wallet']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const createOrderSchema = z.object({
  suggestionId: z.string(),
  paymentMethod: paymentMethodSchema,
  note: z.string().max(200).optional(),
});
export type CreateOrder = z.infer<typeof createOrderSchema>;

export const orderSchema = z.object({
  id: z.string(),
  suggestion: suggestionSchema,
  status: orderStatusSchema,
  /** When each step happened or is expected, as "HH:mm". */
  timeline: z.array(z.object({ status: orderStatusSchema, at: time24Schema })),
  breakTime: time24Schema,
  arrivalTime: time24Schema,
  onTime: z.boolean(),
  paymentMethod: paymentMethodSchema,
  note: z.string().max(200).optional(),
  /** Shared once the courier is on the way. */
  courierPhone: z.string().optional(),
});
export type Order = z.infer<typeof orderSchema>;

export const savedPaymentMethodSchema = z.object({
  method: paymentMethodSchema,
  /** Last four digits for cards. */
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
});
export type SavedPaymentMethod = z.infer<typeof savedPaymentMethodSchema>;
