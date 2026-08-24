import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // GitHub Pages 项目页部署在 https://loongba.github.io/TKWF.Docs/ 子路径下，
    // 生产构建需声明 basepath 才能匹配 /nuget 等路由；本地 dev 保持根路径。
    basepath: import.meta.env.MODE === "production" ? "/TKWF.Docs" : "/",
    // 未匹配路由（含 404.html 兜底进来的坏链）统一渲染，避免空白页
    notFoundMode: "fuzzy",
    defaultNotFoundComponent: () => (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-6xl font-bold tracking-tight">404</p>
        <p className="text-lg text-muted-foreground">页面不存在或已被移动</p>
        <div className="flex gap-3">
          <a
            href="./"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            返回首页
          </a>
          <a
            href="./articles/intro.html"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            浏览文档
          </a>
        </div>
      </div>
    ),
  });

  return router;
};
