import { z } from 'zod';

export const ProjectPaginationItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  groupId: z.string(),
  avatar_url: z.string().nullable(),
  createdAt: z.string(),
  group: z.object({
    name: z.string(),
    maxMembers: z.number(),
  }),
});

export const ProjectPaginationCacheSchema = z.object({
  message: z.string(),
  projects: z.array(ProjectPaginationItemSchema),
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type ProjectPaginationCache = z.infer<
  typeof ProjectPaginationCacheSchema
>;
