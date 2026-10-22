import Link from "next/link";
import { Wallet, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "#features", label: "امکانات" },
  { href: "#security", label: "امنیت" },
  { href: "#faq", label: "پرسش‌های رایج" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
            <Wallet size={18} />
          </span>
          تراز
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-text-secondary md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-text-primary">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted sm:block"
          >
            ورود
          </Link>
          <Link href="/register" className="btn-brand px-4 py-2 text-sm font-medium">
            شروع رایگان
          </Link>
          <button type="button" className="rounded-lg border border-border p-2 text-text-secondary md:hidden" aria-label="باز کردن منو">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
