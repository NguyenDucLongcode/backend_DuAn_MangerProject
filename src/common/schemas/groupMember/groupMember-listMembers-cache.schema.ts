import { z } from 'zod';

export const ListMembersItemSchema = z.object({
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

export const ListMembersCacheSchema = z.object({
  message: z.string(),
  members: z.array(ListMembersItemSchema),
});

export type ListMemberCache = z.infer<typeof ListMembersCacheSchema>;
