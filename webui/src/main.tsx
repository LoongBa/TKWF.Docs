import "@fontsource-variable/inter";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

// 初始化主题 - localStorage 优先，未设置或 'system' 时跟随系统
// 与 index.html 内联脚本同策略（内联脚本已先行应用，此处做一致性兜底）
(function initTheme() {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const theme = !savedTheme || savedTheme === "system" ? systemTheme : savedTheme;

  // 先移除再添加，避免与内联脚本残留类冲突
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.setAttribute("data-theme", theme);
})();

// 归一化 /index.html 结尾路径 → 目录路径
// DocFX 模板左上角"返回首页"链接为 index.html；SPA router 无该路由，
// 不归一化会落入 notFound 页面
if (window.location.pathname.endsWith("/index.html")) {
  const p = window.location.pathname.replace(/\/index\.html$/, "/");
  window.history.replaceState(null, "", p + window.location.search + window.location.hash);
}

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);