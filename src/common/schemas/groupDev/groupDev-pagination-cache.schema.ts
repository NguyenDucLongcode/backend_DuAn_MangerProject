import { z } from 'zod';

export const GroupDevPaginationItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  visibility: z.string(),
  maxMembers: z.number(),
  avatar_url: z.string().nullable(),
  createdAt: z.string(),
});

export const GroupDevPaginationCacheSchema = z.object({
  message: z.string(),
  groupDevs: z.array(GroupDevPaginationItemSchema),
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type GroupDevPaginationCache = z.infer<
  typeof GroupDevPaginationCacheSchema
>;
