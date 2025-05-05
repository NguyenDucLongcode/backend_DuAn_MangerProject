import { z } from 'zod';

export const TaskIDItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  assignedTo: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  dueDate: z.string(),
  createdAt: z.string(),
});

export const TaskIDCacheSchema = z.object({
  message: z.string(),
  task: TaskIDItemSchema,
});

export type TaskIDCache = z.infer<typeof TaskIDCacheSchema>;
