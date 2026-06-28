import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Receipt,
  BellRing,
  BarChart3,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "People", href: "/people", icon: Users },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { title: "Expenses", href: "/expenses", icon: Receipt },
  { title: "Reminders", href: "/reminders", icon: BellRing },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];
