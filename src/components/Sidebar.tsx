"use client";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { type NavItem, navByRole } from "@/constants/navigation";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ full_name: string; role: string } | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const pathname = usePathname();
  const supabase = createClient();

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) setCollapsed(false);
  }, [isMobile]);

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose?.();
  }, [pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", authUser.id)
        .maybeSingle();
      if (profile) {
        setUser({ full_name: profile.full_name, role: profile.role ?? "user" });
        setNavItems(navByRole[profile.role ?? "user"] ?? []);
      }
    };
    fetchUser();
  }, []);

  const sidebarContent = (
    <aside
      className={`h-full bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300 ${
        isMobile ? "w-56" : collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Top bar */}
      <div className="h-14 border-b border-gray-100 flex items-center shrink-0 px-3 gap-2">
        {(!collapsed || isMobile) && user && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate leading-tight">
                {user.full_name}
              </p>
              <p className="text-[0.6rem] text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
        )}
        {collapsed && !isMobile && user && (
          <div
            title={user.full_name}
            className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold mx-auto"
          >
            {user.full_name.charAt(0).toUpperCase()}
          </div>
        )}

        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={14} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed((p) => !p)}
            aria-label={collapsed ? "Expand" : "Collapse"}
            className={`w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 ${
              collapsed ? "mx-auto" : "ml-auto"
            }`}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <a
              key={href}
              href={href}
              title={collapsed && !isMobile ? label : undefined}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors
                ${collapsed && !isMobile ? "justify-center" : ""}
                ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
            >
              <Icon size={17} className="shrink-0" />
              {(!collapsed || isMobile) && <span className="whitespace-nowrap">{label}</span>}
            </a>
          );
        })}
      </nav>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onMobileClose}
          />
        )}
        {/* Drawer */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
}