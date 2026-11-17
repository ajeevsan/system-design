export type Period = "daily" | "weekly" | "monthly";
export type DailyContactCount = { date: string; contactsUsed: number };
export function dateKey(date: Date): string { return date.toISOString().slice(0, 10); }
export function periodStart(key: string, period: Period): Date {
  const date = new Date(`${key}T00:00:00Z`);
  if (period === "weekly") date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  if (period === "monthly") date.setUTCDate(1);
  return date;
}
export function shiftPeriod(date: Date, period: Period, amount: number): Date {
  const next = new Date(date);
  if (period === "monthly") next.setUTCMonth(next.getUTCMonth() + amount);
  else next.setUTCDate(next.getUTCDate() + amount * (period === "weekly" ? 7 : 1));
  return next;
}
export function statsRange(anchor: string) {
  return { from: dateKey(shiftPeriod(periodStart(anchor, "monthly"), "monthly", -11)), to: anchor };
}
export function contactBuckets(rows: DailyContactCount[], anchor: string, period: Period) {
  const size = period === "daily" ? 14 : period === "weekly" ? 8 : 12;
  const last = periodStart(anchor, period);
  return Array.from({ length: size }, (_, index) => {
    const start = shiftPeriod(last, period, index - size + 1);
    const key = dateKey(start);
    const next = dateKey(shiftPeriod(start, period, 1));
    const end = dateKey(new Date(new Date(`${next}T00:00:00Z`).getTime() - 86400000));
    return { date: key, end: end < anchor ? end : anchor,
      count: rows.filter(row => row.date >= key && row.date < next && row.date <= anchor).reduce((total, row) => total + row.contactsUsed, 0) };
  });
}
export function periodTotal(rows: DailyContactCount[], anchor: string, period: Period) {
  const start = dateKey(periodStart(anchor, period));
  return rows.filter(row => row.date >= start && row.date <= anchor).reduce((sum, row) => sum + row.contactsUsed, 0);
}
