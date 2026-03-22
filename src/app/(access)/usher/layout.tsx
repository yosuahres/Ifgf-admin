//usher/layout.tsx
import AdminShell from "@/components/AdminShell";

export default function UsherLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}