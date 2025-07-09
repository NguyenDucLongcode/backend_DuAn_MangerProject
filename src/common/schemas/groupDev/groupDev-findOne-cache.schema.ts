import { z } from 'zod';

export const GroupDevIDItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  visibility: z.string(),
  maxMembers: z.number(),
  avatar_url: z.string().nullable(),
  currentMembers: z.number(),
  leader: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string(),
      phone: z.string().nullable(),
      address: z.string().nullable(),
      gender: z.string().nullable(),
      role: z.string(),
      isActive: z.boolean(),
      avatar_url: z.string().nullable(),
      createdAt: z.string(),
    })
    .nullable(),
  createdAt: z.string(),
});

export const GroupDevIDCacheSchema = z.object({
  message: z.string(),
  groupDev: GroupDevIDItemSchema,
});

export type GroupDevIDCache = z.infer<typeof GroupDevIDCacheSchema>;
