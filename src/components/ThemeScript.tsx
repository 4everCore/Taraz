const THEME_INIT_SCRIPT = `
(function () {
  try {
    var cookieMatch = document.cookie.match(/(?:^|; )taraz-theme=(light|dark)/);
    var theme = cookieMatch ? cookieMatch[1] : null;
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.cookie = "taraz-theme=" + theme + "; path=/; max-age=31536000; samesite=lax";
    }
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (error) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
