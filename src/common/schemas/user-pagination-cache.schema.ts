import { z } from 'zod';

export const UserPaginationItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  gender: z.string().nullable(),
  role: z.string(),
  createdAt: z.string(),
});

export const UserPaginationDataSchema = z.object({
  dataUser: z.array(UserPaginationItemSchema),
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export const UserPaginationCacheSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: UserPaginationDataSchema,
  timestamp: z.string(),
  path: z.string(),
});

export type UserPaginationCache = z.infer<typeof UserPaginationCacheSchema>;
