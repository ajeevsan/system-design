import { RequireEmployee } from "@/components/employee-session";
import type { Metadata } from "next";
import { ContactsTabs } from "@/components/contacts-tabs";
import { ContactStats } from "@/components/contact-stats";
export const metadata: Metadata = { title: "Contact statistics" };
export default function StatsPage() {
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12"><div><p className="mb-2 text-xs font-medium uppercase tracking-widest text-brand-400">Contact workspace</p><h1 className="text-2xl font-bold sm:text-3xl">Contact statistics</h1><p className="mt-2 text-sm text-muted">Track your completed outreach by day, week, and month.</p></div><ContactsTabs /><RequireEmployee><ContactStats /></RequireEmployee></main>;
}
