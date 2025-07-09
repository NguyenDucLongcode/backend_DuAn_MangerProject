import { z } from 'zod';

export const SubscriptionPaginationItemSchema = z.object({
  id: z.string(),
  plan: z.string(),
  expiresAt: z.string(),
  price: z.number(),
  createdAt: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    gender: z.string().nullable(),
    role: z.string(),
    isActive: z.boolean(),
    avatar_url: z.string().nullable(),
    createdAt: z.string(),
  }),
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
