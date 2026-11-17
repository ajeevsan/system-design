import type { Metadata } from "next";
import { RequireEmployee } from "@/components/employee-session";
import { AdminAccounts } from "@/components/admin-accounts";
export const metadata: Metadata = { title: "Account administration" };
export default function Page() {
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12"><div><h1 className="text-2xl font-bold sm:text-3xl">Account administration</h1><p className="mt-2 text-sm text-muted">Create employee accounts and manage password resets.</p></div><RequireEmployee><AdminAccounts /></RequireEmployee></main>;
}
