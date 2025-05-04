import { z } from 'zod';

export const SubscriptionIDItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  plan: z.string(),
  expiresAt: z.string(),
  price: z.number(),
  createdAt: z.string(),
});

export const SubscriptionIDCacheSchema = z.object({
  message: z.string(),
  project: SubscriptionIDItemSchema,
});

export type SubscriptionIDCache = z.infer<typeof SubscriptionIDCacheSchema>;
