import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { SecuritySection } from "@/components/marketing/SecuritySection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg">
      <MarketingHeader />
      <main>
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-medium text-brand-dark">
              <Sparkles size={14} />
              مدیریت مالی شخصی، ساده و دقیق
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-text-primary sm:text-5xl">
              درآمد، هزینه و بودجه‌تان را با خیال راحت بسنجید
            </h1>
            <p className="mt-5 text-base leading-8 text-text-secondary">
              تراز یک سامانه واقعی برای ثبت تراکنش‌ها، پیگیری حساب‌های مالی، تعیین بودجه و رسیدن به اهداف پس‌انداز است؛
              با محاسبات سرور-محور دقیق و بدون هیچ داده نمایشی ساختگی.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn-brand flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold">
                ساخت حساب رایگان
                <ArrowLeft size={16} />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary hover:bg-surface-muted"
              >
                ورود به حساب
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-text-secondary">
              <ShieldCheck size={16} className="text-success" />
              داده مالی شما فقط در اختیار خودتان است.
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <DashboardPreview />
          </div>
        </section>

        <FeatureGrid />
        <SecuritySection />
        <FAQSection />

        <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
          <div className="card-surface flex flex-col items-center gap-4 p-10 text-center">
            <h2 className="text-2xl font-bold text-text-primary">همین حالا شروع کنید</h2>
            <p className="max-w-md text-sm text-text-secondary">
              ثبت‌نام کمتر از یک دقیقه طول می‌کشد و بلافاصله می‌توانید اولین تراکنش خود را ثبت کنید.
            </p>
            <Link href="/register" className="btn-brand px-6 py-3 text-sm font-semibold">
              ساخت حساب رایگان
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
