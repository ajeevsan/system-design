"use client";
import { useState } from "react";
import type { Contact } from "@/lib/api";
import { Input } from "@/components/ui/input";
export function ContactsTable({ contacts, history = false }: { contacts: (Contact & { contactedAt?: string })[]; history?: boolean }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = history ? contacts : contacts.filter(contact => [contact.name, contact.email, contact.phone, contact.interest].some(value => value?.toLowerCase().includes(search.toLowerCase())));
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  const current = Math.min(page, pages);
  const rows = history ? filtered : filtered.slice((current - 1) * 25, current * 25);
  return <div className="overflow-hidden rounded-2xl border border-border bg-surface">
    {!history && <div className="border-b border-border p-4 sm:flex sm:items-end sm:justify-between sm:gap-6"><div><h3 className="font-semibold">Allocation directory</h3><p className="mt-1 text-xs text-muted">{contacts.length.toLocaleString()} contacts in this batch</p></div><div className="mt-4 sm:mt-0 sm:w-72"><Input id="allocation-search" label="Search this allocation" placeholder="Name, email, phone or interest" type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div></div>}
    <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm">
      <caption className="sr-only">{history ? "Previously contacted contacts" : "Allocated contact records"}</caption>
      <thead className="bg-surface-muted/60 text-xs uppercase tracking-wider text-muted"><tr>{["Contact", "Phone", "Interest", ...(history ? ["Contacted"] : [])].map(title => <th scope="col" key={title} className="px-5 py-4 font-medium">{title}</th>)}</tr></thead>
      <tbody>{rows.map(contact => <tr key={contact.id} className="border-t border-border/60 transition-colors hover:bg-surface-muted/40">
        <td className="px-5 py-4"><div className="flex items-center gap-3"><span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-400">{(contact.name || "?").split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span><div className="min-w-0"><p className="max-w-xs break-words font-medium">{contact.name || "Unnamed contact"}</p><p className="mt-1 max-w-xs break-all text-xs text-muted">{contact.email || "No email"}</p></div></div></td>
        <td className="whitespace-nowrap px-5 py-4 text-muted">{contact.phone || "—"}</td><td className="px-5 py-4"><span className="inline-block rounded-full bg-brand-500/10 px-2.5 py-1 text-xs text-brand-400">{contact.interest || "Unspecified"}</span></td>
        {history && <td className="whitespace-nowrap px-5 py-4 text-xs text-muted">{contact.contactedAt ? new Date(contact.contactedAt).toLocaleString() : "—"}</td>}
      </tr>)}</tbody>
    </table></div>
    {!rows.length && <div role="status" className="px-6 py-12 text-center"><p className="font-medium">{search ? "No matching contacts" : history ? "No contacted records yet" : "No contacts available"}</p><p className="mt-2 text-sm text-muted">{search ? "Try a different name, phone number or interest." : history ? "Completed outreach will appear here." : "Upload and process a spreadsheet before requesting contacts."}</p></div>}
    {!history && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-xs text-muted"><span>{filtered.length ? `${(current - 1) * 25 + 1}–${Math.min(current * 25, filtered.length)} of ${filtered.length}` : "0 contacts"}</span><div className="flex items-center gap-4"><button disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded border border-border px-3 py-2 disabled:opacity-30">Previous</button><span>Page {current} of {pages}</span><button disabled={current === pages} onClick={() => setPage(current + 1)} className="rounded border border-border px-3 py-2 disabled:opacity-30">Next</button></div></div>}
  </div>;
}
