import { z } from 'zod';

export const GroupDevPaginationItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  visibility: z.string(),
  maxMembers: z.number(),
  createdAt: z.string(),
});

export const GroupDevPaginationCacheSchema = z.object({
  message: z.string(),
  groupDevs: z.array(GroupDevPaginationItemSchema), // Lưu danh sách users trực tiếp
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type GroupDevPaginationCache = z.infer<
  typeof GroupDevPaginationCacheSchema
>;
