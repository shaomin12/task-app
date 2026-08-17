import { addDays, addMonths, addWeeks, addYears, isWeekend } from "date-fns";
import type { RecurrencePattern } from "@/app/generated/prisma/enums";

export interface RecurrenceRule {
  pattern: RecurrencePattern;
  daysOfWeek: number[]; // 0 = Sun .. 6 = Sat, used for WEEKLY with specific days
  interval: number;
  // Base unit for CUSTOM patterns only — "every {interval} {customUnit}".
  customUnit?: RecurrencePattern | null;
}

// Returns the next due date for a recurring task's rule, or null if it
// can't be computed (no next date within an unrecognized/unset custom unit).
export function computeNextDueDate(rule: RecurrenceRule, from: Date): Date | null {
  const interval = rule.interval || 1;

  if (rule.pattern === "CUSTOM") {
    switch (rule.customUnit) {
      case "DAILY":
        return addDays(from, interval);
      case "WEEKLY":
        return addWeeks(from, interval);
      case "MONTHLY":
        return addMonths(from, interval);
      case "YEARLY":
        return addYears(from, interval);
      default:
        return null;
    }
  }

  switch (rule.pattern) {
    case "DAILY":
      return addDays(from, interval);

    case "WEEKDAYS": {
      let next = addDays(from, 1);
      while (isWeekend(next)) next = addDays(next, 1);
      return next;
    }

    case "WEEKLY": {
      if (rule.daysOfWeek.length > 0) {
        for (let i = 1; i <= 7; i++) {
          const candidate = addDays(from, i);
          if (rule.daysOfWeek.includes(candidate.getDay())) return candidate;
        }
        return null;
      }
      return addWeeks(from, interval);
    }

    case "BIWEEKLY":
      return addWeeks(from, 2 * interval);

    case "MONTHLY":
      return addMonths(from, interval);

    case "YEARLY":
      return addYears(from, interval);

    default:
      return null;
  }
}
