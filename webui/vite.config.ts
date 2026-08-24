import path from "path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

/**
 * React + Vite 构建配置
 *
 * 硬约束：
 * - dev server 必须监听 3015 + strictPort（沙箱只开放一个代理端口）
 * - outDir 'dist' / assetsDir 'assets' — 归一化产物目录
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.MEOO_PROXY_TARGET;

  return {
    resolve: {
      alias: {
        "@content": path.resolve(__dirname, "../docs/content"),
      },
    },
    plugins: [
      tailwindcss(),
      TanStackRouterVite(),
      viteReact(),
      tsConfigPaths(),
    ],
    server: {
      host: "0.0.0.0",
      port: 3015,
      strictPort: true,
      allowedHosts: true,
      // HMR 默认关闭：沙筆预览 iframe 下 HMR 的整页 reload 会放大任何 transform error
      // 如需热更，改为: hmr: { clientPort: 443, protocol: 'wss' }
      hmr: false,
      ...(proxyTarget ? {
        proxy: {
          '/sb-api': {
            target: proxyTarget,
            changeOrigin: true,
            secure: true,
            headers: { 'X-Meoo-Source': 'local-dev' },
          },
        },
      } : {}),
    },
    base: './',
    build: {
      outDir: "dist",
      assetsDir: "assets",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },
  };
});
