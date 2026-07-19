# Web 集成

`TKWF.Domain.Web` 提供 Session 中间件、HttpContext 适配等 Web 环境集成。

---

## 安装

```shell
dotnet add package TKWF.Domain.Web
```

## 配置

```csharp
// Program.cs
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>()
    .UseWebSession()           // Session 中间件
    .UseGraphQLApiService<AppUserInfo>()  // 或 UseRestApiService
    .Build();
```

## 中间件管线

```
HTTP Request
    ↓
Session 中间件 (.UseWebSession())
    ├── 提取 Token（Header/Cookie）
    ├── 验证 Token → 绑定 DomainUser
    └── 注入 HttpContext
    ↓
AOP 边界
    ↓
Controller / Service 执行
    ↓
HTTP Response
```

## 配置选项

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(options =>
{
    options.Web = new WebOptions
    {
        // CORS 配置
        CorsOrigins = new[] { "https://app.example.com" },
        CorsAllowCredentials = true,

        // 全局路由前缀
        RoutePrefix = "api/v1",
    };
});
```

## 错误处理

Web 集成内置全局异常处理中间件，自动将领域异常映射为 HTTP 状态码：

| 异常类型 | HTTP 状态码 |
|:---------|:------------|
| `UnauthorizedAccessException` | 401 Unauthorized |
| `ForbiddenAccessException` | 403 Forbidden |
| `EntityNotFoundException` | 404 Not Found |
| `ValidationException` | 422 Unprocessable Entity |
| 其他 | 500 Internal Server Error |

## 参考

- [Session 管理](../security/session.md)
- [GraphQL 传输](../transport/graphql.md)
- [REST 传输](../transport/rest-minimal-api.md)
- [配置参考](../advanced/configuration.md)