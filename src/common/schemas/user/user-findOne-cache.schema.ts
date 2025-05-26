import { z } from 'zod';

export const UserIDItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  gender: z.string().nullable(),
  role: z.string(),
  isActive: z.boolean(),
  avatar_url: z.string(),
  createdAt: z.string(),
});

export const UserIDCacheSchema = z.object({
  message: z.string(),
  user: UserIDItemSchema,
});

export type UserIDCache = z.infer<typeof UserIDCacheSchema>;
