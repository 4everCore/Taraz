import Link from "next/link";
import { Wallet } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <Wallet size={16} className="text-brand" />
          تراز
        </Link>
        <p className="text-xs text-text-secondary">© {new Date().getFullYear()} تراز. ابزار شخصی مدیریت مالی، بدون وابستگی به نهادهای بانکی.</p>
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <Link href="/login" className="hover:text-text-primary">ورود</Link>
          <Link href="/register" className="hover:text-text-primary">ثبت‌نام</Link>
        </div>
      </div>
    </footer>
  );
}
