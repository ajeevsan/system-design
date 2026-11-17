"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { contactBuckets, dateKey, periodTotal, statsRange, type DailyContactCount, type Period } from "@/lib/contact-stats";
import { useEmployee } from "@/components/employee-session";
import { Input } from "@/components/ui/input";
type Report = { users: { employeeId: number; daily: DailyContactCount[] }[] };
const periods: Period[] = ["daily", "weekly", "monthly"];
const labels = { daily: "Selected day", weekly: "Week to date", monthly: "Month to date" };
function displayDate(key: string, month = false) {
  return new Intl.DateTimeFormat("en", { timeZone: "UTC", month: "short", ...(month ? { year: "numeric" } : { day: "numeric" }) }).format(new Date(`${key}T00:00:00Z`));
}
export function ContactStats() {
  const employee = useEmployee();
  const [anchor, setAnchor] = useState("");
  const [period, setPeriod] = useState<Period>("daily");
  const [rows, setRows] = useState<DailyContactCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [updated, setUpdated] = useState("");
  useEffect(() => { setAnchor(dateKey(new Date())); }, []);
  useEffect(() => {
    if (!anchor) return;
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError("");
    const range = statsRange(anchor);
    async function load() {
      try {
        const report = await api<Report>(`/share-usage?employeeId=${employee.id}&from=${range.from}&to=${range.to}`, { signal: controller.signal });
        const user = report.users.find(user => user.employeeId === employee.id);
        if (!user || !Array.isArray(user.daily)) throw new Error("Contact statistics are unavailable.");
        if (active) { setRows(user.daily); setUpdated(new Date().toLocaleTimeString()); }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : "Could not load statistics."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [anchor, employee.id, revision]);
  const buckets = anchor ? contactBuckets(rows, anchor, period) : [];
  const maximum = Math.max(1, ...buckets.map(bucket => bucket.count));
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  return <div className="space-y-6">
    <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
      <div><h2 className="font-semibold">Your outreach performance</h2><p className="mt-1 text-sm text-muted">Completed contacts, counted by the date they were marked as contacted.</p><p className="mt-2 text-xs text-muted">UTC calendar · Monday-start weeks · Periods end on the selected date</p></div>
      <div className="flex flex-wrap items-end gap-3"><Input id="stats-date" type="date" label="Report through" value={anchor} min="2000-01-01" max={dateKey(new Date())} onChange={e => { const value = e.target.value; if (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && value <= dateKey(new Date())) setAnchor(value); }} /><button disabled={loading} onClick={() => setRevision(n => n + 1)} className="rounded-lg border border-border px-4 py-2.5 text-sm text-brand-400 disabled:opacity-50">Refresh</button></div>
    </section>
    {loading ? <div role="status" className="animate-pulse rounded-2xl border border-border bg-surface p-12 text-center text-muted">Loading contact statistics…</div> : error ? <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400">{error} <button className="ml-2 underline" onClick={() => setRevision(n => n + 1)}>Try again</button></div> : <>
      <section aria-label="Contacted totals" className="grid gap-4 sm:grid-cols-3">{periods.map(item => <div key={item} className="rounded-2xl border border-border bg-surface p-5"><p className="text-sm text-muted">{labels[item]}</p><p className="mt-3 text-4xl font-semibold tracking-tight">{periodTotal(rows, anchor, item).toLocaleString()}</p><p className="mt-2 text-xs text-muted">People contacted</p></div>)}</section>
      <section className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold">Contacted trend</h2><p className="mt-1 text-xs text-muted">{total.toLocaleString()} contacted across {buckets.length} {period === "daily" ? "days" : period === "weekly" ? "weeks" : "months"}{updated ? ` · Updated ${updated}` : ""}</p></div><div aria-label="Trend grouping" className="flex flex-wrap gap-1 rounded-xl bg-background p-1">{periods.map(item => <button key={item} aria-pressed={period === item} onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-2 text-sm capitalize ${period === item ? "bg-brand-500/20 text-brand-400" : "text-muted hover:text-foreground"}`}>{item}</button>)}</div></div>
        {total === 0 && <p role="status" className="rounded-lg bg-background p-4 text-sm text-muted">No contacted records in this range. Completed outreach will appear here after you mark an allocation as contacted.</p>}
        <div role="img" aria-label={`${period} contacted totals: ${buckets.map(bucket => `${bucket.date}: ${bucket.count}`).join(", ")}`} className="space-y-3">{buckets.map(bucket => <div key={bucket.date} className="grid grid-cols-[76px_1fr_48px] items-center gap-3 text-xs sm:grid-cols-[110px_1fr_64px]"><span className="text-muted">{displayDate(bucket.date, period === "monthly")}</span><div className="h-6 overflow-hidden rounded-md bg-background"><div className="h-full rounded-md bg-brand-500 transition-[width] duration-300" style={{ width: `${bucket.count / maximum * 100}%` }} /></div><span className="text-right font-medium tabular-nums">{bucket.count.toLocaleString()}</span></div>)}</div>
        <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm text-brand-400">View exact date ranges</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2 font-medium text-muted">From (UTC)</th><th className="py-2 font-medium text-muted">Through (UTC)</th><th className="py-2 text-right font-medium text-muted">Contacted</th></tr></thead><tbody>{buckets.map(bucket => <tr key={bucket.date} className="border-t border-border"><td className="py-2">{bucket.date}</td><td className="py-2">{bucket.end}</td><td className="py-2 text-right tabular-nums">{bucket.count.toLocaleString()}</td></tr>)}</tbody></table></div></details>
      </section>
      <Link href="/contacts/contacted" className="inline-flex rounded-lg border border-border px-4 py-3 text-sm text-brand-400">View contacted records →</Link>
    </>}
  </div>;
}
