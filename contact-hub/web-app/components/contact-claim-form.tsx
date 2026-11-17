"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, ApiError, type Claim, type DailyUsage } from "@/lib/api";
import { useEmployee } from "@/components/employee-session";
import { ContactsTable } from "@/components/contacts-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
type UsageResponse = { users: { employeeId: number; remainingToday: number; contactsShared: number }[] };
type Saved = { claim: Claim | null; uncertain: boolean; requestId?: string; contacted?: boolean };
export function ContactClaimForm() {
  const employee = useEmployee();
  const key = `contact-hub.claim.${employee.id}`;
  const [saved, setSaved] = useState<Saved>({ claim: null, uncertain: false });
  const [ready, setReady] = useState(false);
  const [limit, setLimit] = useState("500");
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [usageError, setUsageError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [now, setNow] = useState(0);
  async function refreshUsage() {
    setUsageError("");
    try {
      // Usage service groups quota days in UTC, matching the allocation service.
      const day = new Date().toISOString().slice(0, 10);
      const result = await api<UsageResponse>(`/share-usage?employeeId=${employee.id}&from=${day}&to=${day}`);
      const user = result.users.find(user => user.employeeId === employee.id);
      if (!user) throw new Error("Daily usage is unavailable.");
      // The existing backend enforces 2,000 daily, rather than the proposed 20,000.
      setUsage({ limit: 2000, used: user.contactsShared, remaining: user.remainingToday, quotaDate: day });
    } catch (err) { setUsageError(err instanceof Error ? err.message : "Daily usage is unavailable."); }
  }
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) ?? "null") as Saved | null;
      if (stored && typeof stored.uncertain === "boolean") {
        setSaved(stored);
      }
      setReady(true);
    } catch { setError("Your saved allocation could not be read. Check with your administrator before requesting more contacts."); }
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    void refreshUsage();
    return () => clearInterval(timer);
    // Employee identity is fixed for the lifetime of this workspace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  function remember(value: Saved) {
    sessionStorage.setItem(key, JSON.stringify(value));
    setSaved(value);
  }
  const claim = saved.claim;
  const expired = !!claim?.claimExpiresAt && now >= Date.parse(claim.claimExpiresAt);
  const activeClaim = !!claim?.claimToken && !saved.contacted && !expired;
  const count = Number(limit);
  const allowance = usage?.quotaDate === new Date(now || 0).toISOString().slice(0, 10) ? usage.remaining : undefined;
  const invalid = !Number.isInteger(count) || count < 1 || count > 2000 || (allowance !== undefined && count > allowance);
  async function allocate(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || inFlight.current || saved.uncertain || activeClaim || invalid) return;
    inFlight.current = true; setBusy(true); setError("");
    let started = false;
    try {
      const requestId = crypto.randomUUID();
      // Persist uncertainty before sending. This backend does not yet honor requestId.
      remember({ ...saved, uncertain: true, requestId });
      started = true;
      const result = await api<Claim>("/contacts/claim", { method: "POST", body: JSON.stringify({ employeeId: employee.id, limit: count, requestId }) });
      if (!Array.isArray(result.contacts) || !result.dailyUsage) throw new Error("The allocation response was incomplete. Do not request another batch until the result is checked.");
      remember({ claim: result, uncertain: false });
      setUsage(result.dailyUsage);
    } catch (err) {
      if (started && err instanceof ApiError && [400, 401, 403, 404, 422, 429].includes(err.status)) {
        try { remember({ ...saved, uncertain: false }); } catch { /* Keep the persisted uncertainty lock. */ }
      }
      setError(err instanceof Error ? err.message : "Allocation failed.");
    } finally { inFlight.current = false; setBusy(false); }
  }
  async function markContacted() {
    if (!claim?.claimToken || !activeClaim || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const result = await api<{ contactedCount: number }>(`/contacts/claims/${encodeURIComponent(claim.claimToken)}/contacted`, { method: "POST", body: JSON.stringify({ employeeId: employee.id }) });
      if (result.contactedCount !== claim.contacts.length) throw new Error("The service did not confirm every contact. Refresh usage and check the allocation before continuing.");
      remember({ ...saved, contacted: true });
      await refreshUsage();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update contacts."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <div className="space-y-6">
    <section aria-label="Daily contact usage" className="rounded-2xl bg-surface p-5 ring-1 ring-white/10 sm:p-6">
      <div className="flex items-center justify-between gap-4"><h2 className="font-semibold">Daily contact usage</h2><button type="button" className="text-sm text-brand-400" onClick={() => void refreshUsage()}>Refresh usage</button></div>
      {usage && <><p className="mt-2 text-xs text-muted">Quota day: {usage.quotaDate} (UTC). Allocating contacts consumes this allowance.</p><dl className="mt-5 grid grid-cols-3 gap-3">{[["Daily limit", usage.limit], ["Allocated today", usage.used], ["Remaining", usage.remaining]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted sm:text-sm">{label}</dt><dd className="mt-1 text-xl font-semibold sm:text-2xl">{Number(value).toLocaleString()}</dd></div>)}</dl></>}
      {!usage && !usageError && <p role="status" className="mt-3 text-sm text-muted">Loading usage…</p>}
      {usageError && <p role="alert" className="mt-3 text-sm text-amber-400">{usageError} Refresh to check your allowance.</p>}
      {allowance === 0 && <p role="status" className="mt-4 text-sm text-amber-400">You have reached your daily allowance.</p>}
    </section>
    <form onSubmit={allocate} className="space-y-4 rounded-2xl bg-surface p-5 ring-1 ring-white/10 sm:p-6">
      <div><h2 className="font-semibold">Start a new allocation</h2><p className="mt-1 text-sm text-muted">Choose your batch size. Contacts are reserved for 15 minutes.</p></div>
      <div className="flex flex-wrap gap-2">{[100, 500, 1000, 2000].map(size => <button type="button" key={size} disabled={busy || saved.uncertain || activeClaim || (allowance !== undefined && size > allowance)} aria-pressed={count === size} onClick={() => setLimit(String(size))} className={`rounded-lg border px-4 py-2 text-sm disabled:opacity-30 ${count === size ? "border-brand-500 bg-brand-500/15 text-brand-400" : "border-border text-muted"}`}>{size.toLocaleString()}</button>)}</div>
      <Input id="contact-limit" label="Number of contacts" type="number" min={1} max={Math.min(2000, allowance ?? 2000)} step={1} required value={limit} onChange={e => setLimit(e.target.value)} disabled={busy || saved.uncertain || activeClaim} />
      {invalid && <p className="text-sm text-amber-400">Enter a whole number from 1 to 2,000 within your remaining allowance.</p>}
      <Button disabled={!ready || busy || invalid || saved.uncertain || activeClaim}>{busy ? "Working…" : "Fetch contacts"}</Button>
      {activeClaim && <p className="text-sm text-muted">Finish your current allocation before requesting another batch.</p>}
      {saved.uncertain && <p role="alert" className="text-sm text-amber-400">The previous allocation has no confirmed result. Another request could allocate more contacts. Contact your administrator to recover it before continuing.</p>}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </form>
    {claim && <section className="space-y-4" aria-label="Current allocation">
      <h2 className="text-lg font-semibold">Your allocated contacts</h2>
      {claim.claimToken && <p className="break-all text-xs text-muted">Allocation: {claim.claimToken}</p>}
      {claim.claimExpiresAt && <p className="text-sm text-muted">{expired ? "This allocation has expired. These records are shown for reference only." : `Allocation expires ${new Date(claim.claimExpiresAt).toLocaleString()}.`}</p>}
      {saved.contacted && <p role="status" className="text-sm text-emerald-400">Contacts marked as contacted.</p>}
      <ContactsTable contacts={claim.contacts} />
      {saved.contacted && <Link href="/contacts/contacted" className="inline-flex rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">View contacted history →</Link>}
      {activeClaim && <Button variant="outline" disabled={busy} onClick={() => void markContacted()}>Mark this allocation as contacted</Button>}
    </section>}
  </div>;
}
