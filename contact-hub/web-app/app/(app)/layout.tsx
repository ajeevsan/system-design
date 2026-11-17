import { EmployeeSession } from "@/components/employee-session";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeSession>{children}</EmployeeSession>;
}
