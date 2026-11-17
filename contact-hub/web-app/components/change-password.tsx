"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function ChangePassword() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return;
    const data = new FormData(e.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) { setError("New passwords do not match."); return; }
    setBusy(true); setError("");
    try {
      await api("/users/me/password", { method: "PATCH", body: JSON.stringify({ currentPassword: data.get("currentPassword"), password: data.get("password") }) });
      sessionStorage.removeItem("contact-hub.token"); sessionStorage.removeItem("contact-hub.employee"); router.replace("/login?passwordChanged=1");
    } catch (err) { setError(err instanceof Error ? err.message : "Password change failed."); setBusy(false); }
  }
  return <form onSubmit={submit} className="max-w-lg space-y-5 rounded-2xl border border-border bg-surface p-6"><Input id="current-password" name="currentPassword" type="password" label="Current password" required autoComplete="current-password" disabled={busy} /><Input id="changed-password" name="password" type="password" label="New password (12–128 characters)" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy} /><Input id="changed-confirm" name="confirmPassword" type="password" label="Confirm new password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy} /><p className="text-sm text-muted">Changing your password signs you out of all sessions. Sign in again with your new password.</p>{error && <p role="alert" className="text-sm text-red-400">{error}</p>}<Button disabled={busy}>{busy ? "Updating…" : "Change password"}</Button></form>;
}
