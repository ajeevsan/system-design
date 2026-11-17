import { RequireEmployee } from "@/components/employee-session";
import type { Metadata } from "next";
import { UploadForm } from "@/components/upload-form";

export const metadata: Metadata = { title: "Upload document" };

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Upload your spreadsheet
        </h1>
        <p className="mt-2 text-sm text-muted">
          Upload an Excel file and we'll process it and show the results here.
        </p>
      </div>
      <div className="rounded-2xl bg-surface p-4 ring-1 ring-white/10 sm:p-8">
        <RequireEmployee><UploadForm /></RequireEmployee>
      </div>
    </main>
  );
}