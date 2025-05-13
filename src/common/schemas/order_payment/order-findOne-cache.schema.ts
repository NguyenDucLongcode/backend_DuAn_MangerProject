import { z } from 'zod';

export const OrderIDItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  totalAmount: z.number(),
  createdAt: z.string(),
});

export const OrderIDCacheSchema = z.object({
  message: z.string(),
  order: OrderIDItemSchema,
});

export type OrderIDCache = z.infer<typeof OrderIDCacheSchema>;
