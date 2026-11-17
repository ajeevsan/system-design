"use client";
import { useEffect, useState } from "react";
import { api, type Contact } from "@/lib/api";
import { useEmployee } from "@/components/employee-session";
import { ContactsTable } from "@/components/contacts-table";
import { Input } from "@/components/ui/input";
type Result = { contacts: (Contact & { contactedAt: string })[]; total: number; page: number; pageSize: number };
export function ContactedHistory() {
  const employee = useEmployee();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError("");
    const timer = setTimeout(async () => {
      try {
        const response = await api<Result>(`/contacts/contacted?employeeId=${employee.id}&page=${page}&search=${encodeURIComponent(search.trim())}`, { signal: controller.signal });
        if (active) setResult(response);
      } catch (err) { if (active) setError(err instanceof Error ? err.message : "Could not load contacted history."); }
      finally { if (active) setLoading(false); }
    }, 300);
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [employee.id, page, search, revision]);
  const pages = Math.max(1, Math.ceil((result?.total ?? 0) / 25));
  return <div className="space-y-5">
    <section className="flex flex-wrap items-end justify-between gap-5 rounded-2xl border border-border bg-surface p-5">
      <div><p className="text-xs uppercase tracking-wider text-muted">Completed outreach</p><p className="mt-2 text-3xl font-semibold">{loading ? "…" : error ? "—" : result?.total.toLocaleString() ?? "0"}</p><p className="mt-1 text-xs text-muted">{search ? "Matching contacted records" : "Contacts you have marked as contacted"}</p></div>
      <div className="w-full sm:w-80"><Input id="history-search" type="search" label="Search contacted history" placeholder="Name, email, phone or interest" maxLength={200} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
      <button className="rounded-lg border border-border px-4 py-2 text-sm text-brand-400 disabled:opacity-50" disabled={loading} onClick={() => setRevision(n => n + 1)}>Refresh</button>
    </section>
    {loading ? <div role="status" className="animate-pulse rounded-2xl border border-border bg-surface p-12 text-center text-muted">Loading contacted history…</div> : error ? <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400">{error} <button className="ml-2 underline" onClick={() => setRevision(n => n + 1)}>Try again</button></div> : result && <>
      <ContactsTable contacts={result.contacts} history />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted"><span>{result.total ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, result.total)} of ${result.total}` : "0 contacts"}</span><div className="flex items-center gap-4"><button className="rounded-lg border border-border px-3 py-2 disabled:opacity-30" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="rounded-lg border border-border px-3 py-2 disabled:opacity-30" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button></div></div>
    </>}
  </div>;
}
