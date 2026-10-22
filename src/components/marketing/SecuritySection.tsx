import { Lock, Eye, DatabaseZap, KeyRound } from "lucide-react";

const POINTS = [
  { icon: Lock, text: "رمز عبور با الگوریتم استاندارد هش می‌شود و هرگز به‌صورت خام ذخیره نمی‌شود." },
  { icon: Eye, text: "هر کاربر فقط به داده‌های مالی خودش دسترسی دارد؛ حتی با تغییر شناسه در آدرس." },
  { icon: DatabaseZap, text: "تمام محاسبات مالی در سرور و با اعداد دقیق انجام می‌شود، نه در مرورگر." },
  { icon: KeyRound, text: "نشست‌های ورود قابل مدیریت و خروج از دستگاه‌های دیگر در هر زمان امکان‌پذیر است." },
];

export function SecuritySection() {
  return (
    <section id="security" className="bg-surface-muted py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-brand">امنیت و حریم خصوصی</p>
          <h2 className="mt-2 text-3xl font-bold text-text-primary">اطلاعات مالی شما فقط متعلق به خودتان است</h2>
          <p className="mt-3 text-text-secondary">
            تراز از ابتدا با رویکرد امنیت‌محور ساخته شده است. داده‌های شما هرگز برای تبلیغات یا اشخاص ثالث استفاده نمی‌شود.
          </p>
        </div>
        <div className="grid gap-4">
          {POINTS.map((point) => (
            <div key={point.text} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                <point.icon size={16} />
              </span>
              <p className="text-sm leading-6 text-text-primary">{point.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
