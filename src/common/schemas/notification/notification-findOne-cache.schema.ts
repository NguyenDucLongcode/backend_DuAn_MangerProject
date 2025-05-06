import { z } from 'zod';

export const NotificationIDItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});

export const NotificationIDCacheSchema = z.object({
  message: z.string(),
  notification: NotificationIDItemSchema,
});

export type NotificationIDCache = z.infer<typeof NotificationIDCacheSchema>;
