import { RequireEmployee } from "@/components/employee-session";
import type { Metadata } from "next";
import { ContactsTabs } from "@/components/contacts-tabs";
import { ContactedHistory } from "@/components/contacted-history";
export const metadata: Metadata = { title: "Contacted history" };
export default function ContactedPage() {
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12"><div><p className="mb-2 text-xs font-medium uppercase tracking-widest text-brand-400">Contact workspace</p><h1 className="text-2xl font-bold sm:text-3xl">Contacted history</h1><p className="mt-2 text-sm text-muted">Find past outreach, across all your completed allocations.</p></div><ContactsTabs /><RequireEmployee><ContactedHistory /></RequireEmployee></main>;
}
