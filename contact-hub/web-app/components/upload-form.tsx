"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatBytes, validateExcelFile } from "@/lib/file-validataion";
import { uploadFile } from "@/lib/upload";

type Status = "idle" | "uploading" | "success" | "error";

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<unknown>(null);

  const uploading = status === "uploading";

  function selectFile(selected?: File) {
    if (!selected) return;
    setStatus("idle");
    setResult(null);
    setProgress(0);

    const problem = validateExcelFile(selected);
    if (problem) {
      setFile(null);
      setError(problem);
      return;
    }
    setError("");
    setFile(selected);
  }

  function reset() {
    setFile(null);
    setError("");
    setProgress(0);
    setStatus("idle");
    setResult(null);
  }

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const data = await uploadFile(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/upload`, // <- your endpoint
        file,
        setProgress
      );
      setResult(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <label
        htmlFor="file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          selectFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border px-4 py-10 text-center transition-colors sm:py-14",
          "hover:border-brand-500 hover:bg-surface-muted/40 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30",
          dragging && "border-brand-500 bg-brand-500/10",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <svg className="size-10 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <div>
          <p className="text-sm font-medium text-foreground sm:text-base">
            <span className="text-brand-400">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Excel (.xlsx) only, less than 50 MB
          </p>
        </div>
        <input
          ref={inputRef}
          id="file"
          type="file"
          className="sr-only"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={uploading}
          onChange={(e) => {
            selectFile(e.target.files?.[0]);
            e.target.value = ""; // lets the user pick the same file again
          }}
        />
      </label>

      {/* Validation / API error */}
      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Selected file */}
      {file && (
        <div className="rounded-xl bg-surface-muted/50 p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted">{formatBytes(file.size)}</p>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={reset}
                className="shrink-0 text-sm font-medium text-muted hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-brand-500 transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">Uploading... {progress}%</p>
            </div>
          )}
        </div>
      )}

      <Button type="button" onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Upload file"}
      </Button>

      {/* API response */}
      {status === "success" && (
        <section aria-label="Upload result" className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Response</h2>
          <pre className="max-h-80 overflow-auto rounded-xl bg-background p-4 text-xs text-muted ring-1 ring-white/10">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}