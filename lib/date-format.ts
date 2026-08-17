import { format } from "date-fns";

export const DATE_FORMAT_OPTIONS = [
  { value: "MMM d, yyyy", label: "Aug 20, 2026" },
  { value: "MM/dd/yyyy", label: "08/20/2026" },
  { value: "dd/MM/yyyy", label: "20/08/2026" },
  { value: "yyyy-MM-dd", label: "2026-08-20" },
] as const;

export type DateFormatValue = (typeof DATE_FORMAT_OPTIONS)[number]["value"];

// Formats a plain YYYY-MM-DD (or a full ISO datetime string, using just its
// date portion) as a local calendar date in the user's chosen date format —
// constructing via y/m/d components rather than `new Date(isoString)` so it
// never shifts a day under a positive UTC offset.
export function formatTaskDate(isoDateOrDateString: string, dateFormat: string): string {
  const datePart = isoDateOrDateString.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  return format(new Date(y, m - 1, d), dateFormat);
}
