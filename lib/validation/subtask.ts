import { z } from "zod";

export const createSubtaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  done: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
