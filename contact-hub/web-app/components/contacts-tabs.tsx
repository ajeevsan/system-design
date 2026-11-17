"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function ContactsTabs() {
  const path = usePathname();
  return <nav aria-label="Contacts views" className="flex flex-wrap gap-2 border-b border-border pb-3">
    {[["/contacts", "Allocate contacts"], ["/contacts/contacted", "Contacted history"], ["/contacts/stats", "Statistics"]].map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${path === href ? "bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30" : "text-muted hover:bg-surface hover:text-foreground"}`}>{label}</Link>)}
  </nav>;
}
