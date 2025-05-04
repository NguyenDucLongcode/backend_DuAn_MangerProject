import { z } from 'zod';

export const TaskPaginationItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  assignedTo: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  dueDate: z.string(),
  createdAt: z.string(),
});

export const TaskPaginationCacheSchema = z.object({
  message: z.string(),
  tasks: z.array(TaskPaginationItemSchema),
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type TaskPaginationCache = z.infer<typeof TaskPaginationCacheSchema>;
