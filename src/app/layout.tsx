import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeScript } from "@/components/ThemeScript";
import { THEME_COOKIE_NAME, isValidTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "تراز | مدیریت مالی شخصی",
  description: "تراز، سامانه مدیریت هزینه‌ها، درآمدها، بودجه و اهداف پس‌انداز شما.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563EB",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME)?.value;
  const initialThemeClass = isValidTheme(themeCookie) && themeCookie === "dark" ? "dark" : "";

  return (
    <html lang="fa" dir="rtl" className={initialThemeClass} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-bg text-text-primary antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
