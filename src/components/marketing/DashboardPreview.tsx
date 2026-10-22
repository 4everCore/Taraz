const BAR_HEIGHTS = [38, 52, 44, 68, 58, 74, 50, 80, 62, 70, 90, 66];

export function DashboardPreview() {
  return (
    <div className="card-surface w-full max-w-xl p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary">موجودی کل حساب‌ها</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">۱۲۴,۸۵۰,۰۰۰ تومان</p>
        </div>
        <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">+۸.۲٪ نسبت به ماه قبل</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface-muted p-3">
          <p className="text-xs text-text-secondary">درآمد این ماه</p>
          <p className="mt-1 text-lg font-bold text-success">۴۲,۰۰۰,۰۰۰</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-muted p-3">
          <p className="text-xs text-text-secondary">هزینه این ماه</p>
          <p className="mt-1 text-lg font-bold text-danger">۲۶,۴۰۰,۰۰۰</p>
        </div>
      </div>
      <div className="mt-5 flex h-28 items-end gap-1.5">
        {BAR_HEIGHTS.map((height, index) => (
          <div key={index} className="flex-1 rounded-t-md bg-brand/70" style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">۷۸٪</span>
          <div>
            <p className="text-sm font-medium text-text-primary">بودجه خوراک و غذا</p>
            <p className="text-xs text-text-secondary">۳,۹۰۰,۰۰۰ از ۵,۰۰۰,۰۰۰ تومان</p>
          </div>
        </div>
      </div>
    </div>
  );
}
