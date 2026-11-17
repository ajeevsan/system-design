import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in", 
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl ring-1 ring-white/10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to your account to continue</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted">Use your Contact Hub employee credentials.</p>
      </div>
    </main>
  );
}