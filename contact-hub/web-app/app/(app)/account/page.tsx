import type { Metadata } from "next";
import { RequireEmployee } from "@/components/employee-session";
import { ChangePassword } from "@/components/change-password";
export const metadata: Metadata = { title: "Account settings" };
export default function Page() {
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12"><div><h1 className="text-2xl font-bold sm:text-3xl">Account settings</h1><p className="mt-2 text-sm text-muted">Keep your password up to date.</p></div><RequireEmployee><ChangePassword /></RequireEmployee></main>;
}
