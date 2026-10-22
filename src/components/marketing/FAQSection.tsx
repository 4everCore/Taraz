const FAQS = [
  {
    question: "آیا استفاده از تراز رایگان است؟",
    answer: "بله. در نسخه فعلی، تمام امکانات ثبت تراکنش، بودجه‌بندی، گزارش‌گیری و اهداف پس‌انداز بدون هزینه در دسترس است.",
  },
  {
    question: "آیا اطلاعات مالی من با دیگران به اشتراک گذاشته می‌شود؟",
    answer: "خیر. داده‌های هر کاربر فقط برای همان کاربر قابل مشاهده است و برای تبلیغات یا فروش به شخص ثالث استفاده نمی‌شود.",
  },
  {
    question: "آیا می‌توانم واحد پول خود را تغییر دهم؟",
    answer: "بله. در تنظیمات حساب می‌توانید واحد پیش‌فرض خود را از میان تومان، ریال، دلار و یورو انتخاب کنید و برای هر حساب مالی نیز ارز جداگانه تعیین کنید.",
  },
  {
    question: "آیا خروجی گرفتن از تراکنش‌ها امکان‌پذیر است؟",
    answer: "بله. از صفحه مدیریت داده می‌توانید خروجی CSV از تراکنش‌ها یا نسخه پشتیبان کامل از حساب خود دریافت کنید.",
  },
  {
    question: "اگر رمز عبورم را فراموش کنم چه کار کنم؟",
    answer: "از صفحه ورود روی «فراموشی رمز عبور» بزنید تا لینک بازنشانی امن برای ایمیل شما ارسال شود.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold text-brand">پرسش‌های رایج</p>
        <h2 className="mt-2 text-3xl font-bold text-text-primary">پاسخ سوالات متداول</h2>
      </div>
      <div className="mt-10 flex flex-col gap-3">
        {FAQS.map((faq) => (
          <details key={faq.question} className="card-surface group p-5 open:shadow-none">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-text-primary">
              {faq.question}
              <span className="text-text-secondary transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
