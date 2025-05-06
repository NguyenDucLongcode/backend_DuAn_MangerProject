import { z } from 'zod';

export const NotificationPaginationItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});

export const NotificationPaginationCacheSchema = z.object({
  message: z.string(),
  notifications: z.array(NotificationPaginationItemSchema),
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type NotificationPaginationCache = z.infer<
  typeof NotificationPaginationCacheSchema
>;
