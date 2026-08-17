import { z } from "zod";
import { Priority, TaskStatus } from "@/app/generated/prisma/enums";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format");

const timeOnly = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Due time must be in HH:mm format");

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1).nullable().optional(),
  priority: z.enum(Priority).optional(),
  dueDate: dateOnly.nullable().optional(),
  dueTime: timeOnly.nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  projectId: z.string().min(1).nullable().optional(),
  priority: z.enum(Priority).optional(),
  status: z.enum(TaskStatus).optional(),
  progressPercent: z.number().int().min(0).max(100).nullable().optional(),
  dueDate: dateOnly.nullable().optional(),
  dueTime: timeOnly.nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
});
