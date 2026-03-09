
'use client';
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}
      style={{ minWidth: collapsed ? "80px" : "256px" }}
    >
      <button
        className="absolute top-4 right-4 p-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{ zIndex: 10 }}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
      <nav className="flex flex-col gap-4 mt-10">
        <a
          href="/admin"
          className={`font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600 transition-opacity duration-300 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          Dashboard
        </a>
        <a
          href="/admin/users"
          className={`font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600 transition-opacity duration-300 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          Users
        </a>
        <a
          href="/admin/events"
          className={`font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600 transition-opacity duration-300 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          Events
        </a>
        <a
          href="/admin/settings"
          className={`font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600 transition-opacity duration-300 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          Settings
        </a>
      </nav>
    </aside>
  );
}
