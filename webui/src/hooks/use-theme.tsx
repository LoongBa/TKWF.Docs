import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // 从 localStorage 读取保存的主题；DocFX 兼容：'auto' 视同 'system'
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme | "auto" | null;
      return saved === "auto" ? "system" : saved || "system";
    }
    return "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    // 同步 data-bs-theme，与 DocFX(Bootstrap) 契约一致
    root.setAttribute("data-bs-theme", resolved);
    root.setAttribute("data-theme", resolved);

    // 存储契约（与 DocFX modern 模板共用键 'theme'）：
    //   light/dark → 写入显式值；system → 移除键（双方缺省即跟随系统，
    //   避免 DocFX 读到无法识别的 'system' 而回落亮色）
    if (theme === "system") {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      const newTheme = mediaQuery.matches ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(newTheme);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return { theme, setTheme };
}
