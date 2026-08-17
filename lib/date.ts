// Local (viewer) calendar date as YYYY-MM-DD — deliberately NOT
// `date.toISOString().slice(0, 10)`, which reports the UTC calendar date and
// drifts a day off from the viewer's actual "today" for part of every day.
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
