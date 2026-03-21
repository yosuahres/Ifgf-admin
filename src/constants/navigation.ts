import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  Church,
  DollarSign,
  Group,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

export type NavItem = {
  href?: string;           // optional — parent items with children don't need href
  label: string;
  icon: LucideIcon;
  children?: Omit<NavItem, "children">[];  // sub-items
};

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/jemaat", label: "Jemaat", icon: Users },
  { href: "/admin/icare-groups", label: "iCare Groups", icon: Church },
  { href: "/admin/pelayanan", label: "Pelayanan", icon: Group },
  { href: "/admin/events", label: "Events", icon: Calendar },
  // {
  //   label: "Pelayanan",
  //   icon: Group,
  //   children: [
  //     { href: "/admin/pelayanan/department", label: "Department", icon: Group },
  //     { href: "/admin/pelayanan/member", label: "Member", icon: Users },
  //   ],
  // },
  { href: "/admin/reports", label: "Reports", icon: BookOpen },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export const leaderNav: NavItem[] = [
  { href: "/leader", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leader/icare", label: "Pertemuan", icon: BookOpen },
  { href: "/leader/members", label: "Anggota", icon: Users },
];

export const userNav: NavItem[] = [
  { href: "/user", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Cashflow",
    icon: Group,
    children: [
      { href: "/user/cashflow", label: "Cash Report", icon: BookOpen },
      { href: "/user/cashin", label: "Cash In", icon: DollarSign },
      { href: "/user/cashout", label: "Cash Out", icon: DollarSign },
    ],
  },
  { href: "/user/persembahan", label: "Persembahan", icon: BookOpen },
];

export const navByRole: Record<string, NavItem[]> = {
  admin: adminNav,
  leader: leaderNav,
  user: userNav,
};