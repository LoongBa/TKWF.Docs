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
  });

  return router;
};
