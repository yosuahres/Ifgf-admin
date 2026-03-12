'use client';
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { navByRole, type NavItem } from "@/constants/navigation";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ full_name: string; role: string } | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const pathname = usePathname();
  const supabase = createClient();

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
        setUser({ full_name: profile.full_name, role: profile.role });
        setNavItems(navByRole[profile.role] ?? []);
      }
    };
    fetchUser();
  }, []);

  return (
    <aside className={`h-full bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300 ${collapsed ? "w-14" : "w-56"}`}>

      {/* Top bar — user info + toggle */}
      <div className="h-14 border-b border-gray-100 flex items-center shrink-0 px-3 gap-2">
        {!collapsed && user && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate leading-tight">{user.full_name}</p>
              <p className="text-[0.6rem] text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
        )}

        {collapsed && user && (
          <div
            title={user.full_name}
            className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold mx-auto"
          >
            {user.full_name.charAt(0).toUpperCase()}
          </div>
        )}

        <button
          onClick={() => setCollapsed(p => !p)}
          aria-label={collapsed ? "Expand" : "Collapse"}
          className={`w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 ${collapsed ? "mx-auto" : "ml-auto"}`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <a
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors
                ${collapsed ? "justify-center" : ""}
                ${active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </a>
          );
        })}
      </nav>

    </aside>
  );
}