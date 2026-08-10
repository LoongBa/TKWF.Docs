---
title: Web 集成
description: Web 集成：ContextExtractionMiddleware 两阶段管线、SetExcludedPathPrefixes 生命线防护、UseHostContextExtraction 上下文提取
---

# Web 集成

`TKWF.Domain.Web` 提供中间件管线、HttpContext 适配等 Web 环境集成。

---

## 安装

```shell
dotnet add package TKWF.Domain.Web
```

## 基础配置

```csharp
// Program.cs
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>()
    .UseWebSession()
    .UseGraphQLApiService<AppUserInfo>()  // 或 UseRestApiService
    .Build();
```

## 中间件管线（V4.9.21+）

从 V4.9.21 起，`ContextExtractionMiddleware` 替代 `SessionUserMiddleware`，
采用**两阶段架构**解决上下文提取与会话解析的时序耦合：

```
HTTP Request
    ↓
阶段 1：上下文提取（ContextExtractionMiddleware）
    ├── 提取请求上下文（路径/查询参数/Header）
    ├── 写入 IAmbientContext（Scoped，实时读写）
    └── 每个提取器（IContextExtractor）独立处理
    ↓
阶段 2：会话解析（可选，同一中间件内顺序执行）
    ├── 从 IAmbientContext 读取 SessionKey（提取器产出）
    ├── 回退请求解析（Header > Cookie > Query > Form）
    ├── 验证 Token → 绑定 DomainUser
    └── 注入 HttpContext.Items
    ↓
HttpAuthenticationMiddleware（排除路径快速放过）
    ↓
AOP 边界 → Controller / Service 执行
    ↓
HTTP Response
```

### 核心变化

| 旧版（V4.9.20 及之前） | 新版（V4.9.21+） |
|:-----------------------|:-----------------|
| `SessionUserMiddleware` 独立中间件 | 功能合并进 `ContextExtractionMiddleware` 阶段 2 |
| 上下文提取手动注册 `AddContextExtractor<T>()` | 初始化器钩子 `GetHostContextExtractors()` 统一注册 |
| 提取/会话双中间件时序耦合 | 单中间件两阶段顺序执行 |
| 非 Web 宿主无 `IAmbientContext` 兜底 | `NullAmbientContext` 单例兜底 |

## 上下文提取（Context Extraction）

### 声明提取器

在初始化器中覆写 `GetHostContextExtractors()` 返回提取器类型：

```csharp
public class AppDomainInitializer : DomainHostInitializerBase<AppUserInfo>
{
    protected override IReadOnlyList<Type> GetHostContextExtractors()
        => [typeof(MerchantIdExtractor), typeof(TenantHeaderExtractor)];
}
```

基类自动将提取器注册为 `IContextExtractor` 服务。

### 接线中间件

在表现层 `Program.cs` 调用 `UseHostContextExtraction<T>()`：

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(cfg =>
{
    cfg.UseHostContextExtraction<AppUserInfo>()
       .UseWebSession();
});
```

> **门控机制**：配置阶段自动校验——检测到提取器但宿主未接线中间件时，在 `AddDomain` 末抛 `DomainException` 引导接线。仅 Web 宿主校验，Console/Test 不参与。

### IAmbientContext

`IAmbientContext` 提供请求级别的上下文存取：

```csharp
// 写入（提取器内）
context.Set("TenantId", "tenant_abc");

// 读取（Service/DataService 内）
var tenantId = ambient.Get<string>("TenantId");
```

- **Web 宿主**：`ScopedHttpContextAmbientContext` 惰性包装器，每次读写实时重读 `HttpContext.Items`。中间件之前被解析也能看到中间件后续写入。
- **非 Web 宿主**：`NullAmbientContext` 单例，所有操作无副作用。

## 排除路径前缀（SetExcludedPathPrefixes）

`SetExcludedPathPrefixes` 控制哪些路径跳过 HTTP 层快速认证：

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(cfg =>
{
    cfg.SetExcludedPathPrefixes("/scalar", "/public");
    // 最终排除集：/scalar, /public + 5 个框架生命线前缀（强制追加）
    // /api/auth/login, /api/auth/logout, /health, /healthz, /Setup
});
```

框架生命线前缀**强制追加**，不可被 `SetExcludedPathPrefixes` 删除，防止 `/Setup` 初始化死锁。GraphQL 路由由 `UseApiService()` 阶段自动追加。

> **双层防御**：排除路径只跳过 HTTP 层快速认证。到达 Controller 的请求仍由 AOP 层 `AuthorityFilterAttribute` 在 `HttpAuthCheckPerformed=false` 时重新检查。

## 多租户连接串解析

在初始化器中覆写 `OnResolveTenantConnectionString` 钩子实现多租户支持：

```csharp
protected override string OnResolveTenantConnectionString(
    string template, IAmbientContext context)
{
    var tenantId = context.Get<string>("TenantId");
    var builder = new NpgsqlConnectionStringBuilder(template)
    {
        Database = $"db_{tenantId}"
    };
    return builder.ConnectionString;
}
```

配合 `UseFreeSqlEntityDAC` 使用：

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(cfg =>
{
    cfg.UseFreeSqlEntityDAC(
        "Host=localhost;Port=5432;Database={0};Username=postgres",
        isDevelopment: true,
        DataType.PgSql);
});
```

连接串模板 + 逐请求解析 → `IFreeSqlCache` 按解析后连接串缓存。未注册解析委托时回退模板原样（单租户兼容）。

## 配置选项

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(cfg =>
{
    cfg.Web = new WebOptions
    {
        CorsOrigins = new[] { "https://app.example.com" },
        CorsAllowCredentials = true,
        RoutePrefix = "api/v1",
    };

    cfg.SetExcludedPathPrefixes("/scalar", "/public");
    cfg.UseHostContextExtraction<AppUserInfo>();
    cfg.UseFreeSqlEntityDAC("...", true, DataType.PgSql);
});
```

## 初始化器钩子速查（V4.9.21+）

V4.9.21 将初始化器钩子收敛为 **9 个**：

| 钩子 | 用途 |
|:-----|:------|
| `OnPreInitialize` | 最早执行，配置阶段 |
| `OnRegisterInfrastructureServices` | 注册基础设施服务（抽象） |
| `OnRegisterDomainServices` | 注册领域服务（抽象） |
| `OnResolveTenantConnectionString` | **新增**：多租户连接串解析 |
| `GetHostContextExtractors` | **新增**：返回上下文提取器类型集合 |
| `OnEnsureSystemReadyAsync` | 签名升级：`(sp, syncedTables, syncedViews)` |
| `ConfigRateLimiting` | 限流配置 |
| `GetGlobalFilters` | 全局 Filter 返回 |
| `OnServiceProviderBuilt` | 容器构建完成，最后执行 |

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
- [数据层架构](../explanation/data-layer-architecture.md)