"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, type Employee } from "@/lib/api";
const Context = createContext<Employee | null>(null);
export function useEmployee() {
  const employee = useContext(Context);
  if (!employee) throw new Error("Employee session required");
  return employee;
}
// Gate interactive content inside a page, keeping route segments in the render tree.
export function RequireEmployee({ children }: { children: React.ReactNode }) {
  const employee = useContext(Context);
  if (!employee) return <p role="status" className="p-8 text-muted">Loading your workspace…</p>;
  return children;
}
export function EmployeeSession({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function validate() {
      try {
        const account = await api<Employee>("/users/me", { signal: controller.signal });
        if (active) { setEmployee(account); sessionStorage.setItem("contact-hub.employee", JSON.stringify(account)); }
      } catch {
        if (active) { sessionStorage.removeItem("contact-hub.employee"); sessionStorage.removeItem("contact-hub.token"); router.replace("/login"); }
      }
    }
    void validate();
    return () => { active = false; controller.abort(); };
  }, [router]);
  return <Context.Provider value={employee}>
    {employee && <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-4 py-4 sm:px-6">
        <Link href="/upload" className="font-bold text-brand-400">Contact Hub</Link>
        <nav aria-label="Main navigation" className="flex flex-wrap gap-4 text-sm">
          {["upload", "contacts"].map(route => <Link key={route} href={`/${route}`} aria-current={(route === "contacts" ? pathname.startsWith("/contacts") : pathname === `/${route}`) ? "page" : undefined} className={(route === "contacts" ? pathname.startsWith("/contacts") : pathname === `/${route}`) ? "text-brand-400" : "text-muted"}>{route === "upload" ? "Upload" : "Contacts"}</Link>)}
          {employee.role === "admin" && <Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined} className={pathname === "/admin" ? "text-brand-400" : "text-muted"}>Admin</Link>}
          <Link href="/account" aria-current={pathname === "/account" ? "page" : undefined} className={pathname === "/account" ? "text-brand-400" : "text-muted"}>Account</Link>
        </nav>
        <span className="min-w-0 break-all text-xs text-muted sm:ml-auto">{employee.email}</span>
        <button className="text-sm text-muted hover:text-foreground" onClick={async () => { try { await api("/users/logout", { method: "POST" }); } catch { /* Clear local credentials even if the service is unreachable. */ } finally { sessionStorage.removeItem("contact-hub.employee"); sessionStorage.removeItem("contact-hub.token"); setEmployee(null); router.replace("/login"); } }}>Sign out</button>
      </div>
    </header>}{children}
  </Context.Provider>;
}
