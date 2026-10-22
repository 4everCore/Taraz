export const THEME_COOKIE_NAME = "taraz-theme";
export type ThemePreference = "light" | "dark";

export function isValidTheme(value: string | undefined | null): value is ThemePreference {
  return value === "light" || value === "dark";
}
