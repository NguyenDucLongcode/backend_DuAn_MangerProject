import { z } from 'zod';

export const ReviewPaginationItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  rating: z.number(),
  comment: z.string(),
  createdAt: z.string(),
});

export const ReviewPaginationCacheSchema = z.object({
  message: z.string(),
  reviews: z.array(ReviewPaginationItemSchema),
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type ReviewPaginationCache = z.infer<typeof ReviewPaginationCacheSchema>;
