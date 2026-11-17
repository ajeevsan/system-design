"use client";
import { useEffect, useState } from "react";
import { api, type Upload } from "@/lib/api";
const terminal = new Set(["COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED", "QUEUE_FAILED"]);
export function UploadStatus({ uploadId }: { uploadId: string }) {
  const [upload, setUpload] = useState<Upload | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        const next = await api<Upload>(`/uploads/${encodeURIComponent(uploadId)}`, { signal: controller.signal });
        if (disposed) return;
        setUpload(next); setError("");
        if (!terminal.has(next.status)) timer = setTimeout(poll, 2500);
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : "Could not check processing status.");
      }
    }
    void poll();
    return () => { disposed = true; controller.abort(); clearTimeout(timer); };
  }, [uploadId, attempt]);
  return <section aria-label="Upload processing" className="space-y-4 rounded-xl border border-border p-4">
    <h2 className="font-semibold">Spreadsheet processing</h2>
    <p className="break-all text-xs text-muted">Upload ID: {uploadId}</p>
    <p role="status" className="text-brand-400">{upload ? upload.status.replaceAll("_", " ") : "Checking status…"}</p>
    {upload && <>
      <p className="break-all text-sm">{upload.originalFileName}</p>
      <dl className="grid grid-cols-3 gap-3 text-sm">{[["Total rows", upload.totalRows], ["Successful", upload.succesfulRows], ["Failed", upload.failedRows]].map(([label, value]) => <div key={label}><dt className="text-muted">{label}</dt><dd className="mt-1 font-semibold">{Number(value).toLocaleString()}</dd></div>)}</dl>
      {(upload.status === "FAILED" || upload.status === "QUEUE_FAILED") && <p role="alert" className="text-sm text-red-400">{upload.status === "QUEUE_FAILED" ? "The file could not be scheduled for processing. Contact your administrator." : "Processing failed. Check the spreadsheet format and try a corrected file."}</p>}
      {upload.status === "COMPLETED_WITH_ERRORS" && <p className="text-sm text-amber-400">Processing finished. Some rows could not be imported.</p>}
    </>}
    {error && <div role="alert" className="text-sm text-red-400">{error} <button className="underline" onClick={() => setAttempt(n => n + 1)}>Retry status check</button></div>}
  </section>;
}
