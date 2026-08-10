---
title: 配置参考
description: 配置参考：ConfigWebAppDomain 配置项完整说明，cfg 强契约、上下文提取、多租户连接串
---

# 配置参考

TKWF 通过 `ConfigWebAppDomain` 方法提供统一的配置入口。

---

## 快速配置

```csharp
// 最简配置
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>()
    .UseWebSession()
    .UseGraphQLApiService<AppUserInfo>()
    .Build();
```

## 完整配置选项

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(cfg =>
{
    // ── Host 配置 ──
    cfg.SetExcludedPathPrefixes("/scalar", "/public");
    // 框架生命线前缀（/api/auth/login, /logout, /health, /healthz, /Setup）强制追加

    cfg.UseHostContextExtraction<AppUserInfo>();

    // ── Session ──
    cfg.Session = new SessionOptions
    {
        Expiration = TimeSpan.FromHours(8),
        RefreshOnActivity = true,
        SlidingExpiration = TimeSpan.FromHours(1),
        TokenSource = TokenSource.BearerHeader,
    };

    // ── 认证 ──
    cfg.Authentication = new AuthenticationOptions
    {
        ChallengeExpiration = TimeSpan.FromMinutes(5),
        SessionExpiration = TimeSpan.FromHours(8),
    };

    // ── 授权 ──
    cfg.Authorization = new AuthorizationOptions();
    cfg.Authorization.Policies.Add("OrderApproval",
        new OrderApprovalPolicy());

    // ── AOP ──
    cfg.Aop = new AopOptions
    {
        EnableGlobalFilters = true,
    };
    cfg.Aop.Filters.Add(new LoggingFilter());

    // ── GraphQL ──
    cfg.GraphQL = new GraphQLOptions
    {
        EnablePlayground = true,
        MaxComplexity = 100,
    };

    // ── REST ──
    cfg.Rest = new RestApiOptions
    {
        RoutePrefix = "api/v1",
        EnableOpenApi = true,
    };

    // ── Web ──
    cfg.Web = new WebOptions
    {
        CorsOrigins = new[] { "https://app.example.com" },
        CorsAllowCredentials = true,
    };

    // ── 数据层 ──
    cfg.UseFreeSqlEntityDAC(
        "Host=localhost;Port=5432;Database=mydb;Username=postgres",
        isDevelopment: true,
        DataType.PgSql);
});
```

## cfg 强契约（V4.9.21+）

从 V4.9.21 起，所有 Entity DAC 配置统一为 `Use*` 前缀的强契约方法，
替代旧版 `Set*` 扩展方法：

| 旧版（废弃） | 新版（V4.9.21+） | 说明 |
|:-----------|:-----------------|:-----|
| `SetEntityDAC` | `UseEntityDAC` | 通用 Entity DAC 注册 |
| `SetNoEntityDAC` | `UseNoEntityDAC` | 无 Entity DAC（纯逻辑项目） |
| `SetFreeSqlEntityDAC` | `UseFreeSqlEntityDAC` | FreeSql + 连接串模板 |
| `SetTestingEntityDAC` | `UseTestingEntityDAC` | 测试环境 Entity DAC |

### UseFreeSqlEntityDAC

```csharp
cfg.UseFreeSqlEntityDAC(
    connectionStringTemplate: "Host={0};Port=5432;Database=db_{1};Username=postgres",
    isDevelopment: true,
    DataType.PgSql);
```

- **连接串模板**：配合 `OnResolveTenantConnectionString` 钩子实现多租户逐请求解析
- **`IFreeSqlCache` 缓存**：按解析后连接串缓存，多租户场景高效复用连接
- **未注册解析委托**：回退模板原样（单租户兼容）

## 上下文提取配置

### UseHostContextExtraction

```csharp
cfg.UseHostContextExtraction<AppUserInfo>();
```

在表现层接线上下文提取中间件。配合初始化器钩子 `GetHostContextExtractors()` 返回提取器类型集合。

> **门控校验**：检测到 `GetHostContextExtractors()` 返回非空但 `UseHostContextExtraction` 未调用时，
> 配置阶段抛 `DomainException` 引导接线。

### SetExcludedPathPrefixes

```csharp
cfg.SetExcludedPathPrefixes("/scalar", "/public");
// 最终排除集: /scalar, /public + 5 个强制生命线前缀
// /api/auth/login, /api/auth/logout, /health, /healthz, /Setup
```

控制哪些路径跳过 HTTP 层快速认证：

- 整体替换语义：先清空默认集，再添加业务前缀
- 框架生命线前缀强制追加（不可删除）
- GraphQL 路由由 `UseApiService()` 阶段自动追加

## 配置项速查表

| 配置节点 | 选项 | 说明 |
|:---------|:-----|:-----|
| **Host** | `SetExcludedPathPrefixes` | 排除路径前缀（V4.9.21+） |
| | `UseHostContextExtraction` | 上下文提取中间件（V4.9.21+） |
| **Session** | `Expiration` | Session 有效期，默认 8h |
| | `RefreshOnActivity` | 活跃时自动续期，默认 true |
| | `SlidingExpiration` | 滑动过期窗口，默认 1h |
| | `TokenSource` | Token 来源（Header/Cookie） |
| **Authentication** | `ChallengeExpiration` | Challenge 有效期，默认 5min |
| **Authorization** | `Policies` | 自定义策略注册 |
| **AOP** | `EnableGlobalFilters` | 启用全局 Filter |
| | `Filters` | 全局 Filter 列表 |
| **GraphQL** | `EnablePlayground` | 启用 Playground |
| | `MaxComplexity` | 查询复杂度上限 |
| **REST** | `RoutePrefix` | 路由前缀 |
| | `EnableOpenApi` | 自动生成 OpenAPI |
| **Web** | `CorsOrigins` | 允许的 CORS 来源 |
| **Data** | `UseFreeSqlEntityDAC` | FreeSql + 连接串模板（V4.9.21+） |

## 环境配置

支持通过 `appsettings.json` 配置：

```json
{
  "TKWF": {
    "Session": {
      "Expiration": "08:00:00",
      "RefreshOnActivity": true
    },
    "GraphQL": {
      "EnablePlayground": true
    }
  }
}
```

## 参考

- [Web 集成](../integration/web.md)
- [AOP 管线](../core-concepts/aop-pipeline.md)
- [数据层架构](../explanation/data-layer-architecture.md)
- [最佳实践](best-practices.md)