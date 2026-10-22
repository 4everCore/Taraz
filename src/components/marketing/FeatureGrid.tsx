import { Wallet, PieChart, Target, Repeat, HandCoins, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: Wallet,
    title: "مدیریت چند حساب مالی",
    description: "حساب بانکی، نقد، کیف پول و پس‌انداز را جدا از هم ثبت و موجودی هرکدام را دقیق پیگیری کنید.",
  },
  {
    icon: PieChart,
    title: "گزارش‌های مالی دقیق",
    description: "روند درآمد و هزینه، توزیع دسته‌بندی‌ها و جریان نقدی را با نمودارهای واضح بررسی کنید.",
  },
  {
    icon: HandCoins,
    title: "بودجه‌بندی هوشمند",
    description: "برای هر دسته‌بندی سقف هزینه تعیین کنید و پیش از عبور از بودجه هشدار بگیرید.",
  },
  {
    icon: Repeat,
    title: "تراکنش‌های تکرارشونده",
    description: "حقوق، اجاره، قبض و اقساط را زمان‌بندی کنید تا بدون فراموشی ثبت شوند.",
  },
  {
    icon: Target,
    title: "اهداف پس‌انداز",
    description: "برای خریدهای بزرگ هدف بگذارید و پیشرفت واقعی پس‌انداز خود را ببینید.",
  },
  {
    icon: ShieldCheck,
    title: "امنیت در طراحی",
    description: "هر رکورد مالی فقط برای صاحب آن قابل مشاهده است؛ رمز عبور هرگز به‌صورت خام ذخیره نمی‌شود.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-brand">امکانات اصلی</p>
        <h2 className="mt-2 text-3xl font-bold text-text-primary">هر آنچه برای مدیریت مالی شخصی لازم دارید</h2>
        <p className="mt-3 text-text-secondary">
          تراز تمام جریان مالی شما را از ثبت یک هزینه ساده تا تحلیل بلندمدت در یک تجربه منسجم جمع کرده است.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="card-surface p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand">
              <feature.icon size={20} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-text-primary">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
