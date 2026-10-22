export type DefaultCategorySeed = {
  name: string;
  kind: "income" | "expense";
  icon: string;
  color: string;
};

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: "حقوق و دستمزد", kind: "income", icon: "wallet", color: "#16A34A" },
  { name: "درآمد جانبی", kind: "income", icon: "sparkles", color: "#16A34A" },
  { name: "فروش و سود", kind: "income", icon: "trending-up", color: "#16A34A" },
  { name: "غذا و خوراک", kind: "expense", icon: "utensils", color: "#2563EB" },
  { name: "مسکن و اجاره", kind: "expense", icon: "home", color: "#2563EB" },
  { name: "حمل‌ونقل", kind: "expense", icon: "car", color: "#2563EB" },
  { name: "خرید روزمره", kind: "expense", icon: "shopping-cart", color: "#2563EB" },
  { name: "سلامت و درمان", kind: "expense", icon: "heart-pulse", color: "#DC2626" },
  { name: "آموزش", kind: "expense", icon: "graduation-cap", color: "#2563EB" },
  { name: "تفریح", kind: "expense", icon: "ticket", color: "#F59E0B" },
  { name: "قبوض و خدمات", kind: "expense", icon: "receipt", color: "#64748B" },
  { name: "اشتراک‌ها", kind: "expense", icon: "repeat", color: "#64748B" },
  { name: "اقساط و بدهی", kind: "expense", icon: "credit-card", color: "#DC2626" },
  { name: "پس‌انداز", kind: "expense", icon: "piggy-bank", color: "#16A34A" },
  { name: "سایر موارد", kind: "expense", icon: "more-horizontal", color: "#64748B" },
];
