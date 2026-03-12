import { LayoutDashboard, Users, Calendar, Settings, BookOpen, Church, Group } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const adminNav: NavItem[] = [
  { href: "/admin",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/jemaat",       label: "Jemaat",       icon: Users },
  { href: "/admin/icare-groups", label: "iCare Groups", icon: Church },
  { href: "/admin/events",       label: "Events",       icon: Calendar },
  { href: "/admin/users",        label: "Users",        icon: Users },
  { href: "/admin/pelayanan",    label: "Pelayanan",    icon: Group },
  { href: "/admin/settings",     label: "Settings",     icon: Settings },
];

export const leaderNav: NavItem[] = [
  { href: "/leader",                label: "Dashboard", icon: LayoutDashboard },
  { href: "/leader/icare", label: "Pertemuan", icon: BookOpen },
  { href: "/leader/members",        label: "Anggota",   icon: Users },
];

export const navByRole: Record<string, NavItem[]> = {
  admin:  adminNav,
  leader: leaderNav,
};