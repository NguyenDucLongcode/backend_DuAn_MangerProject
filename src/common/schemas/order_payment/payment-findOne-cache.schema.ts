import { z } from 'zod';

export const PaymentIDItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amount: z.number(),
  method: z.string(),
  status: z.string(),
  createdAt: z.string(),
});

export const PaymentIDCacheSchema = z.object({
  message: z.string(),
  payment: PaymentIDItemSchema,
});

export type PaymentIDCache = z.infer<typeof PaymentIDCacheSchema>;
