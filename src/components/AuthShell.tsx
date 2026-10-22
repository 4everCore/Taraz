import Link from "next/link";
import type { ReactNode } from "react";
import { Wallet } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Wallet size={24} />
          تراز
        </Link>
        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-snug">کنترل کامل امور مالی شخصی، در یک جا</h2>
          <p className="mt-4 text-sm leading-7 text-blue-100">
            حساب‌ها، تراکنش‌ها، بودجه‌ها و اهداف پس‌انداز خود را با یک داشبورد دقیق و امن مدیریت کنید.
          </p>
        </div>
        <p className="text-xs text-blue-100">© {new Date().getFullYear()} تراز. تمامی حقوق محفوظ است.</p>
      </div>
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-brand lg:hidden">
            <Wallet size={22} />
            تراز
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="mt-1.5 text-sm text-text-secondary">{description}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-text-secondary">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
