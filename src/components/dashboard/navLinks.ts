import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Tags,
  PiggyBank,
  Repeat,
  Target,
  HandCoins,
  BarChart3,
  DatabaseBackup,
  User,
  Settings,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "تراکنش‌ها", icon: ArrowLeftRight },
  { href: "/dashboard/accounts", label: "حساب‌های مالی", icon: Landmark },
  { href: "/dashboard/categories", label: "دسته‌بندی‌ها", icon: Tags },
  { href: "/dashboard/budgets", label: "بودجه‌ها", icon: PiggyBank },
  { href: "/dashboard/recurring", label: "تکرارشونده‌ها", icon: Repeat },
  { href: "/dashboard/goals", label: "اهداف پس‌انداز", icon: Target },
  { href: "/dashboard/debts", label: "بدهی و مطالبات", icon: HandCoins },
  { href: "/dashboard/reports", label: "گزارش‌ها", icon: BarChart3 },
  { href: "/dashboard/data", label: "داده و پشتیبان‌گیری", icon: DatabaseBackup },
];

export const SECONDARY_NAV_LINKS: NavLink[] = [
  { href: "/dashboard/profile", label: "پروفایل", icon: User },
  { href: "/dashboard/settings", label: "تنظیمات", icon: Settings },
];
