"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));

    if (!email.includes("@")) return setError("Enter a valid email address");

    setLoading(true);
    try {
      // TODO: call your API here
      console.log({ email, password });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input id="email" name="email" type="email" label="Email" placeholder="you@example.com" autoComplete="email" required error={error} />
      <Input id="password" name="password" type="password" label="Password" placeholder="••••••••" autoComplete="current-password" required />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" className="size-4 rounded border-border accent-brand-500" />
            Remember me
        </label>
        <a href="#" className="font-medium text-brand-400 hover:text-brand-500">
            Forgot password?
        </a>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}