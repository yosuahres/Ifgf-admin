"use client";
import { Menu, Settings, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/supabase/logout";
import { useIsMobile } from "@/hooks/use-mobile";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [user, setUser] = useState<{ full_name: string; role: string } | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", authUser.id)
        .maybeSingle();
      if (profile) {
        setUser({ full_name: profile.full_name, role: profile.role ?? "user" });
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const initials = user
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Only render the hamburger after mount to avoid SSR/client mismatch */}
        {mounted && isMobile && (
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={18} />
          </button>
        )}
        <span className="font-semibold text-gray-900 text-xl">IFGF Batam Control</span>
      </div>

      {user && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:ring-2 hover:ring-blue-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Profile menu"
          >
            <span className="text-xs font-semibold text-blue-700 leading-none">
              {initials}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-blue-700 leading-none">
                      {initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate leading-tight">
                      {user.full_name}
                    </p>
                    <p className="text-[0.6rem] text-gray-400 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>

              <div className="p-1">
                <a
                  href="/settings"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === "/settings"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Settings size={14} className="shrink-0" />
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} className="shrink-0" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}