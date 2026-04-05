"use client";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobile) setCollapsed(false);
  }, [isMobile]);

  useEffect(() => {
    onMobileClose?.();
  }, [pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .maybeSingle();
      if (profile) {
        setNavItems(navByRole[profile.role ?? "finance"] ?? []);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const autoOpen: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children?.some((child) => child.href === pathname)) {
        autoOpen[item.label] = true;
      }
    });
    setOpenDropdowns((prev) => ({ ...prev, ...autoOpen }));
  }, [navItems, pathname]);

  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Use a stable default width on the server; only apply isMobile logic after mount
  const sidebarWidth = !mounted
    ? "w-72"
    : isMobile
    ? "w-72"
    : collapsed
    ? "w-14"
    : "w-72";

  const sidebarContent = (
    <aside
      className={`h-full bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300 ${sidebarWidth}`}
    >
      {/* Top bar */}
      <div className="h-14 border-b border-gray-100 flex items-center shrink-0 px-3">
        {mounted && isMobile ? (
          <>
            <div className="flex items-center gap-2 flex-1">
              <img
                src="/assets/ifgf-logo.png"
                alt="IFGF Logo"
                width={28}
                height={28}
                className="h-20 w-auto object-contain"
              />
            </div>
            <button
              onClick={onMobileClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : collapsed && mounted ? (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand"
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors mx-auto"
          >
            <ChevronRight size={14} />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img
                src="/assets/ifgf-logo.png"
                alt="IFGF Logo"
                width={28}
                height={28}
                className="h-15 w-auto object-contain"
              />
            </div>
            {mounted && (
              <button
                onClick={() => setCollapsed(true)}
                aria-label="Collapse"
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
              >
                <ChevronLeft size={14} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {navItems.map((item) => {
          const { label, icon: Icon, href, children } = item;
          const effectiveMobile = mounted && isMobile;
          const effectiveCollapsed = mounted && collapsed;

          if (children && children.length > 0) {
            const isOpen = openDropdowns[label] ?? false;
            const anyChildActive = children.some((c) => c.href === pathname);

            return (
              <div key={label}>
                <button
                  onClick={() => {
                    if (effectiveCollapsed && !effectiveMobile) {
                      setCollapsed(false);
                    } else {
                      toggleDropdown(label);
                    }
                  }}
                  title={effectiveCollapsed && !effectiveMobile ? label : undefined}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors
                    ${effectiveCollapsed && !effectiveMobile ? "justify-center" : ""}
                    ${anyChildActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                >
                  <Icon size={17} className="shrink-0" />
                  {(!effectiveCollapsed || effectiveMobile) && (
                    <>
                      <span className="whitespace-nowrap flex-1 text-left">{label}</span>
                      {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </>
                  )}
                </button>

                {(!effectiveCollapsed || effectiveMobile) && isOpen && (
                  <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-gray-100 pl-2">
                    {children.map((child) => {
                      const childActive = pathname === child.href;
                      const ChildIcon = child.icon;
                      return (
                        <a
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors
                            ${childActive ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
                        >
                          <ChildIcon size={15} className="shrink-0" />
                          <span className="whitespace-nowrap">{child.label}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = pathname === href;
          return (
            <a
              key={href}
              href={href}
              title={effectiveCollapsed && !effectiveMobile ? label : undefined}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors
                ${effectiveCollapsed && !effectiveMobile ? "justify-center" : ""}
                ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
            >
              <Icon size={17} className="shrink-0" />
              {(!effectiveCollapsed || effectiveMobile) && (
                <span className="whitespace-nowrap">{label}</span>
              )}
            </a>
          );
        })}
      </nav>
    </aside>
  );

  if (mounted && isMobile) {
    return (
      <>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/40" onClick={onMobileClose} />
        )}
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