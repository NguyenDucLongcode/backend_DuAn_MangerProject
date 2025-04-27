import { z } from 'zod';

export const GroupDevIDItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  visibility: z.string(),
  maxMembers: z.number(),
  createdAt: z.string(),
});

export const GroupDevIDCacheSchema = z.object({
  message: z.string(),
  groupDev: GroupDevIDItemSchema,
});

export type GroupDevIDCache = z.infer<typeof GroupDevIDCacheSchema>;
