//user/layout.tsx
import AdminShell from "@/components/AdminShell";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}