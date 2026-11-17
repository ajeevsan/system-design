"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Employee } from "@/lib/api";
export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError("");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!email || !password) return setError("Enter your email and password.");
    setLoading(true);
    try {
      const result = await api<{ success: boolean; user?: Employee; accessToken?: string }>("/users/login", { method: "POST", body: JSON.stringify({ email, password }) });
      if (!result.success || !result.user || !Number.isInteger(result.user.id) || !result.accessToken) throw new Error("Invalid email or password.");
      sessionStorage.setItem("contact-hub.token", result.accessToken);
      sessionStorage.setItem("contact-hub.employee", JSON.stringify({ ...result.user, email }));
      router.replace("/upload");
    } catch (err) { setError(err instanceof Error ? err.message : "Sign in failed."); }
    finally { setLoading(false); }
  }
  return <form onSubmit={handleSubmit} className="space-y-5">
    <Input id="email" name="email" type="email" label="Email" autoComplete="email" required disabled={loading} />
    <Input id="password" name="password" type="password" label="Password" autoComplete="current-password" required disabled={loading} />
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <Button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
  </form>;
}
