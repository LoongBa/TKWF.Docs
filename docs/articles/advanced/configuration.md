---
title: 配置参考
description: 配置参考：ConfigWebAppDomain 配置项完整说明
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
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(options =>
{
    // ── Session ──
    options.Session = new SessionOptions
    {
        Expiration = TimeSpan.FromHours(8),
        RefreshOnActivity = true,
        SlidingExpiration = TimeSpan.FromHours(1),
        TokenSource = TokenSource.BearerHeader,
    };

    // ── 认证 ──
    options.Authentication = new AuthenticationOptions
    {
        ChallengeExpiration = TimeSpan.FromMinutes(5),
        SessionExpiration = TimeSpan.FromHours(8),
    };

    // ── 授权 ──
    options.Authorization = new AuthorizationOptions();
    options.Authorization.Policies.Add("OrderApproval",
        new OrderApprovalPolicy());

    // ── AOP ──
    options.Aop = new AopOptions
    {
        EnableGlobalFilters = true,
    };
    options.Aop.Filters.Add(new LoggingFilter());

    // ── GraphQL ──
    options.GraphQL = new GraphQLOptions
    {
        EnablePlayground = true,
        MaxComplexity = 100,
    };

    // ── REST ──
    options.Rest = new RestApiOptions
    {
        RoutePrefix = "api/v1",
        EnableOpenApi = true,
    };

    // ── Web ──
    options.Web = new WebOptions
    {
        CorsOrigins = new[] { "https://app.example.com" },
        CorsAllowCredentials = true,
    };

    // ── 数据层 ──
    options.Data.UseFreeSql(fsql =>
    {
        fsql.ConnectionString = "...";
        fsql.Provider = FreeSqlProvider.SqlServer;
    });
});
```

## 配置项速查表

| 配置节点 | 选项 | 说明 |
|:---------|:-----|:-----|
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
| **Data** | `UseFreeSql(...)` | FreeSql 配置 |

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

- [最佳实践](best-practices.md)
- [Web 集成](../integration/web.md)
- [AOP 管线](../core-concepts/aop-pipeline.md)