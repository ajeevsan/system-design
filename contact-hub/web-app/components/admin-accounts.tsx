"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useEmployee } from "@/components/employee-session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
type Account = { id: number; firstName: string; lastName: string; email: string; phone: string; role: string; status: string };
export function AdminAccounts() {
  const employee = useEmployee();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Account | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (employee.role !== "admin") return;
    let active = true;
    const controller = new AbortController();
    setLoading(true); setError("");
    api<Account[]>("/users/employee", { signal: controller.signal }).then(result => { if (active) setAccounts(result); }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load accounts."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [employee.role, revision]);
  if (employee.role !== "admin") return <div role="alert" className="rounded-xl border border-border bg-surface p-6">Administrator access is required to manage accounts. <Link href="/contacts" className="text-brand-400 underline">Return to contacts</Link></div>;
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return;
    const form = e.currentTarget; const data = new FormData(form);
    if (data.get("password") !== data.get("confirmPassword")) { setError("Passwords do not match."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await api<Account>("/users/employee", { method: "POST", body: JSON.stringify(Object.fromEntries(["firstName", "lastName", "email", "phone", "role", "password"].map(key => [key, data.get(key)]))) });
      setAccounts(previous => [result, ...previous]); form.reset(); setNotice(`Account created for ${result.email}. Share the initial password with the employee securely.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Account creation failed."); }
    finally { setBusy(false); }
  }
  async function reset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy || !selected) return;
    const data = new FormData(e.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) { setError("Passwords do not match."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      await api(`/users/employee/${selected.id}/password`, { method: "PATCH", body: JSON.stringify({ password: data.get("password") }) });
      setNotice(`Password updated for ${selected.email}. Their existing sessions have been revoked.`); setSelected(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Password reset failed."); }
    finally { setBusy(false); }
  }
  const filtered = accounts.filter(account => `${account.firstName} ${account.lastName} ${account.email}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6">
    {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}
    {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">{notice}</p>}
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="font-semibold">Create an account</h2><p className="mt-1 text-sm text-muted">Set an initial password. Employees can change it from Account after signing in.</p>
      <form onSubmit={create} className="mt-5 grid gap-4 sm:grid-cols-2"><fieldset disabled={busy} className="contents">
        <Input id="new-first" name="firstName" label="First name" required maxLength={100} autoComplete="off" />
        <Input id="new-last" name="lastName" label="Last name" required maxLength={100} autoComplete="off" />
        <Input id="new-email" name="email" label="Email" type="email" required maxLength={254} autoComplete="off" />
        <Input id="new-phone" name="phone" label="Phone" type="tel" required maxLength={100} autoComplete="off" />
        <Input id="new-password" name="password" label="Initial password (12–128 characters)" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
        <Input id="new-confirm" name="confirmPassword" label="Confirm initial password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
        <div><label htmlFor="new-role" className="mb-1.5 block text-sm font-medium">Role</label><select id="new-role" name="role" defaultValue="EMPLOYEE" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"><option value="EMPLOYEE">Employee</option><option value="ADMIN">Administrator</option></select></div>
        <div className="self-end"><Button disabled={busy}>{busy ? "Saving…" : "Create account"}</Button></div>
      </fieldset></form>
    </section>
    {selected && <section aria-labelledby="reset-title" className="rounded-2xl border border-brand-500/40 bg-surface p-5"><h2 id="reset-title" className="font-semibold">Reset password</h2><p className="mt-2 break-all text-sm text-muted">Account: {selected.email}. This signs the employee out of all sessions.</p><form key={selected.id} onSubmit={reset} className="mt-4 grid gap-4 sm:grid-cols-2"><Input id="reset-password" name="password" label="New password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy} /><Input id="reset-confirm" name="confirmPassword" label="Confirm new password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy} /><Button disabled={busy}>Confirm password reset</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setSelected(null)}>Cancel</Button></form></section>}
    <section className="overflow-hidden rounded-2xl border border-border bg-surface"><div className="flex flex-wrap items-end justify-between gap-4 p-5"><div><h2 className="font-semibold">User accounts</h2><p className="mt-1 text-sm text-muted">{accounts.length} accounts</p></div><Input id="account-search" label="Search accounts" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or email" /><button className="text-sm text-brand-400" disabled={loading || busy} onClick={() => setRevision(n => n + 1)}>Refresh</button></div>
      {loading ? <p role="status" className="p-6 text-muted">Loading accounts…</p> : <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-surface-muted text-muted"><tr>{["Employee", "Role", "Status", "Password"].map(title => <th key={title} scope="col" className="px-5 py-3 font-medium">{title}</th>)}</tr></thead><tbody>{filtered.map(account => <tr key={account.id} className="border-t border-border"><td className="px-5 py-4"><p className="font-medium">{account.firstName} {account.lastName}</p><p className="mt-1 text-xs text-muted">{account.email}</p></td><td className="px-5 py-4 capitalize">{account.role}</td><td className="px-5 py-4 text-xs text-emerald-400">{account.status}</td><td className="px-5 py-4">{account.id === employee.id ? <Link href="/account" className="text-brand-400">Change my password</Link> : <button disabled={busy} className="rounded-lg border border-border px-3 py-2 text-brand-400 disabled:opacity-50" onClick={() => { setSelected(account); setError(""); setNotice(""); }}>Reset password</button>}</td></tr>)}</tbody></table>{!filtered.length && <p className="p-8 text-center text-muted">No accounts match your search.</p>}</div>}
    </section>
  </div>;
}
