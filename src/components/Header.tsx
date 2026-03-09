
'use client';
import LogoutButton from "./LogoutButton";
import { logout } from "@/lib/supabase/logout";

export default function Header() {
  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };
  return (
    <header className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
      <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">IFGF Admin Dashboard</div>
      <div className="flex items-center gap-4">
        <LogoutButton onLogout={handleLogout} />
      </div>
    </header>
  );
}
