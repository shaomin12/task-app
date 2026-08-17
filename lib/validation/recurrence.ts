import { z } from "zod";
import { RecurrencePattern } from "@/app/generated/prisma/enums";

export const createRecurrenceSchema = z
  .object({
    pattern: z.enum(RecurrencePattern),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    interval: z.number().int().min(1).max(52).optional(),
    customUnit: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
  })
  .refine((data) => data.pattern !== "CUSTOM" || data.customUnit, {
    message: "Choose a unit for the custom recurrence.",
    path: ["customUnit"],
  });
