import { z } from "zod";
import { Priority, ThemePreference } from "@/app/generated/prisma/enums";
import { ACCENT_SWATCHES } from "@/lib/accent-color";
import { DATE_FORMAT_OPTIONS } from "@/lib/date-format";

const ACCENT_HEXES = ACCENT_SWATCHES.map((s) => s.hex) as [string, ...string[]];
const DATE_FORMAT_VALUES = DATE_FORMAT_OPTIONS.map((o) => o.value) as [string, ...string[]];

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().min(1).max(64).optional(),
  language: z.string().min(2).max(10).optional(),
  dateFormat: z.enum(DATE_FORMAT_VALUES).optional(),
  defaultPriority: z.enum(Priority).optional(),
  defaultView: z
    .enum(["today", "upcoming", "tasks", "inbox", "completed", "kanban", "calendar", "dashboard"])
    .optional(),
  defaultProjectId: z.string().min(1).nullable().optional(),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]).optional(),
  theme: z.enum(ThemePreference).optional(),
  accentColor: z.enum(ACCENT_HEXES).nullable().optional(),
});
