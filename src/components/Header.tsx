'use client';
import LogoutButton from "./LogoutButton";
import { logout } from "@/lib/supabase/logout";

export default function Header() {
  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">IF</span>
        </div>
        <span className="font-semibold text-gray-900 text-sm">IFGF Admin</span>
      </div>
      <LogoutButton onLogout={handleLogout} />
    </header>
  );
}