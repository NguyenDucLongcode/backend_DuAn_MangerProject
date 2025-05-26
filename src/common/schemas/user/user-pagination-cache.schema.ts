import { z } from 'zod';

export const UserPaginationItemSchema = z.object({
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
});

export const UserPaginationCacheSchema = z.object({
  message: z.string(),
  users: z.array(UserPaginationItemSchema), // Lưu danh sách users trực tiếp
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type UserPaginationCache = z.infer<typeof UserPaginationCacheSchema>;
