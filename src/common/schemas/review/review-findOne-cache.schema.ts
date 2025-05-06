import { z } from 'zod';

export const ReviewIDItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  rating: z.number(),
  comment: z.string(),
  createdAt: z.string(),
});

export const ReviewIDCacheSchema = z.object({
  message: z.string(),
  review: ReviewIDItemSchema,
});

export type ReviewIDCache = z.infer<typeof ReviewIDCacheSchema>;
