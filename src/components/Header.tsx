"use client";
import Image from "next/image";
import Link from "next/link"
import { Menu } from "lucide-react";
import { logout } from "@/lib/supabase/logout";
import LogoutButton from "./LogoutButton";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <Link href="/" >
            <img
              src="/assets/ifgf-logo.png"
              alt="IFGF Logo"
              width={28}
              height={28}
              className="h-20 w-auto object-contain"
            />
          </Link>
          <span className="font-semibold text-gray-900 text-sm">IFGF Admin</span>
        </div>
      </div>
      <LogoutButton onLogout={handleLogout} />
    </header>
  );
}