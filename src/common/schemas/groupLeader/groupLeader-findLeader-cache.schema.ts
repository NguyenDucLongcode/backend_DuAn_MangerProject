import { z } from 'zod';

export const FindLeaderByGroupItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  gender: z.string().nullable(),
  role: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const FindLeaderByGroupCacheSchema = z.object({
  message: z.string(),
  leader: FindLeaderByGroupItemSchema,
});

export type FindLeaderCache = z.infer<typeof FindLeaderByGroupCacheSchema>;
