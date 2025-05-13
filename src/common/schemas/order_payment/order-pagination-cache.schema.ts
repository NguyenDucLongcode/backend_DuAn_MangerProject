import { z } from 'zod';

export const OrderPaginationItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  totalAmount: z.number(),
  createdAt: z.string(),
});

export const OrderPaginationCacheSchema = z.object({
  message: z.string(),
  orders: z.array(OrderPaginationItemSchema),
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type OrderPaginationCache = z.infer<typeof OrderPaginationCacheSchema>;
