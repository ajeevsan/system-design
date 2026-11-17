import { RequireEmployee } from "@/components/employee-session";
import type { Metadata } from "next";
import { ContactsTabs } from "@/components/contacts-tabs";
import { ContactClaimForm } from "@/components/contact-claim-form";
export const metadata: Metadata = { title: "Contacts" };
export default function ContactsPage() {
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
    <div><h1 className="text-2xl font-bold sm:text-3xl">Contact allocation</h1><p className="mt-2 text-sm text-muted">Request up to 2,000 contacts and keep track of your daily allowance.</p></div>
    <ContactsTabs />
    <RequireEmployee><ContactClaimForm /></RequireEmployee>
  </main>;
}
