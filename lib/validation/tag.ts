import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #767a6c")
    .optional(),
});
