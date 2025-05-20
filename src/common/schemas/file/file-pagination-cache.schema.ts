import { z } from 'zod';

export const FilePaginationItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  filename: z.string(),
  fileType: z.string(),
  size: z.string(),
  url: z.string(),
  uploadedAt: z.string(),
});

export const FilePaginationCacheSchema = z.object({
  message: z.string(),
  files: z.array(FilePaginationItemSchema),
  total: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type FilePaginationCache = z.infer<typeof FilePaginationCacheSchema>;
