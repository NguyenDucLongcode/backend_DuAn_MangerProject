import { z } from 'zod';

export const SubscriptionPaginationItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  plan: z.string(),
  expiresAt: z.string(),
  price: z.number(),
  createdAt: z.string(),
});

export const SubscriptionPaginationCacheSchema = z.object({
  message: z.string(),
  subscriptions: z.array(SubscriptionPaginationItemSchema),
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type SubscriptionPaginationCache = z.infer<
  typeof SubscriptionPaginationCacheSchema
>;
