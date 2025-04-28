import { z } from 'zod';

export const ProjectIDItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  groupId: z.string(),
  createdAt: z.string(),
});

export const ProjectIDCacheSchema = z.object({
  message: z.string(),
  project: ProjectIDItemSchema,
});

export type ProjectIDCache = z.infer<typeof ProjectIDCacheSchema>;
