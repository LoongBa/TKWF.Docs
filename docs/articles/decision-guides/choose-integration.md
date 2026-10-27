---
title: 集成形态选型：Web / Blazor / MAUI / Testing
description: 在 Web/Blazor/MAUI/Testing 四种宿主集成形态间选型的决策指南
---
# 集成形态选型：Web / Blazor / MAUI / Testing

> 源文档：[D05](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D05-%E5%A4%9A%E5%BD%A2%E6%80%81%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%9B%86%E6%88%90%E6%9E%B6%E6%9E%84.md) · [G05](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G05-%E9%85%8D%E7%BD%AE%E9%A1%B9%E4%BD%93%E7%B3%BB%E4%BD%BF%E7%94%A8%E8%A7%84%E8%8C%83.md) · V4.9.10

---

## 一句话总结

**Web** 适合服务端渲染 / API 服务；**Blazor Server** 适合企业内网应用；**Blazor WASM** 适合 SPA + 后端分离；**MAUI** 适合移动端 / 桌面端；**Testing** 适合单元测试 / 集成测试。

---

## 四种形态对比

| 维度 | Web (ASP.NET Core) | Blazor Server | Blazor WASM | MAUI | Testing |
|:--|:--|:--|:--|:--|:--|
| **运行位置** | 服务端 | 服务端（SignalR） | 客户端（浏览器） | 客户端（设备） | 测试进程 |
| **用户上下文** | `DomainUser` | `DomainUser` + `DomainClientUser` | `DomainClientUser` | `DomainClientUser` | `DomainUser`（TestSession） |
| **通信方式** | GraphQL/REST（HTTP，SG2 生成端点） | SignalR（进程内） | GraphQL/REST（HTTP） | GraphQL/REST（HTTP） | 进程内调用 |
| **认证形态** | ② 进程内+RPC | ② 进程内+RPC | ③ 进程外+RPC | ③ 进程外+RPC | ① 进程内 |
| **AOP 拦截器** | 全部生效 | 全部生效 | 客户端无 AOP | 客户端无 AOP | 全部生效 |
| **事务管理** | 服务端事务 | 服务端事务 | 客户端无事务 | 客户端无事务 | 可 Mock |
| **适用场景** | API 服务、SSR | 企业内网、管理后台 | SPA、移动端 API | 移动端、桌面端 | 单元测试、集成测试 |

---

## 决策树

```
你的应用是什么类型？
├─ 纯 API 服务（无 UI）──────────→ Web（ASP.NET Core）
├─ 服务端渲染（SSR）──────────────→ Web（ASP.NET Core + Razor）
├─ 企业内网应用 ──────────────────→ Blazor Server
├─ SPA + 后端分离 ────────────────→ Blazor WASM
├─ 移动端 / 桌面端 ──────────────→ MAUI
├─ 小程序 / React / Vue ────────→ Web API + TS 客户端
└─ 单元测试 / 集成测试 ──────────→ Testing
```

---

## 各形态详解

### Web（ASP.NET Core）

最通用的宿主形态，支持 API 服务和 SSR：

```csharp
// 脚手架真实接线（以 _xCodeGen/xCodeGen.Cli/scaffolding/webapi/Program.cs 为准，按需简化）
var builder = WebApplication.CreateBuilder(args);

var app = builder.ConfigWebAppDomain<DmpUserInfo, MyDomainInitializer, DomainWebOptions>(
        "DomainOptions", cfg =>
        {
            cfg.UseWebExceptionMiddleware = true;
            cfg.UseFreeSqlEntityDAC(); // 或 EFCore（见文末数据访问小节）
        })
    .RegisterServices((services, cfg) => { /* ... */ })
    .UseWebSession(o => { /* 会话配置 */ })
    .UseApiService(opt =>
    {
        opt.UseGraphQL("/graphql"); // GraphQL 端点（SG2 生成 Resolver）
        opt.UseRest("/api");        // REST 端点（SG2 生成）
    })
    .Build(app => { /* 中间件（CORS 等） */ });

await app.RunWithGraphQLCommandsAsync(args);
```

### Blazor Server

服务端渲染，SignalR 实时通信：

```csharp
// Program.cs
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();

var app = builder.ConfigWebAppDomain<DmpUserInfo, MyDomainInitializer, DomainWebOptions>(
        "DomainOptions", cfg => { /* ... */ })
    .Build(...);

app.MapBlazorHub();
app.MapFallbackToPage("/_Host");
```

**特点**：
- UI 在服务端渲染，通过 SignalR 推送到浏览器
- 可直接访问 `DomainUser`（进程内）
- 适合企业内网（延迟低、安全要求高）

### Blazor WASM

客户端渲染，独立部署：

```csharp
// Program.cs（客户端）
builder.Services.AddScoped(sp =>
    new HttpClient { BaseAddress = new Uri("https://api.example.com") });

builder.Services.AddBlazoredLocalStorage();

// 认证：DomainClientUser 通过 HTTP 调用服务端
```

**特点**：
- UI 在浏览器中运行（WebAssembly）
- 通过 GraphQL/REST 调用服务端
- 适合 SPA + 后端分离架构

### MAUI

移动端 / 桌面端：

```csharp
// MauiProgram.cs
builder.Services.AddMauiBlazorWebView();

var app = builder.ConfigMauiAppDomain<DmpUserInfo, MyDomainInitializer, DomainOptions>( // 选项类型以源码为准（DomainMauiOptions 不存在）
        "DomainOptions", cfg => { /* ... */ })
    .Build(...);
```

**特点**：
- 跨平台（iOS / Android / Windows / macOS）
- 可选本地存储（SecureStorage）
- 适合移动端 + 后端分离架构

### Testing

单元测试 / 集成测试：

```csharp
// xUnit 测试（标准形态：测试类继承 DomainXunitTestBase<TUserInfo, TFixture>）
public sealed class OrderServiceFixture : DomainXunitTestFixtureBase
{
    // InitializeAsync 内调用 ConfigTestDomainAsync 建立 DomainHost.Root（详见 tkwf-test skill / G6b）
    public override async ValueTask InitializeAsync()
    {
        var services = new ServiceCollection();
        await services.ConfigTestDomainAsync<DmpUserInfo, MyDomainInitializer, DomainWebOptions>(
            options => { /* ... */ }); // 选项类型以源码为准（DomainTestOptions 不存在）
    }
}

public sealed class OrderServiceTests : DomainXunitTestBase<DmpUserInfo, OrderServiceFixture>
{
    public OrderServiceTests(OrderServiceFixture fixture, ITestOutputHelper output)
        : base(fixture, output) { }

    [Fact]
    public async Task CreateOrder_ShouldSucceed()
    {
        // 基类 InitializeAsync → host.CreateSessionScopeAsync() → User（测试用户上下文）
        var orderService = User.Use<OrderService>();
        var orderId = await orderService.CreateAsync(new CreateOrderDto { /* ... */ });
        Assert.True(orderId > 0);
    }
}
```

**特点**：
- 进程内调用（无网络开销）
- `TestSessionManager` 提供测试用户上下文
- 可 Mock 任意 Service

---

## 混合架构（推荐）

实际项目通常混合多种形态：

```
┌─────────────────────────────────────────────────┐
│                  Web API 服务                     │
│  ASP.NET Core + DomainUser + AOP + 事务          │
└──────────────────────┬──────────────────────────┘
                       │ GraphQL/REST
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Blazor   │  │ React    │  │ MAUI     │
  │ WASM     │  │ SPA      │  │ 移动端    │
  └──────────┘  └──────────┘  └──────────┘
```

---

## 数据访问与引用模式

- **FreeSql / EFCore**：Web / Blazor / Testing 宿主通过配置选项接入 ORM，如 `cfg.UseFreeSqlEntityDAC()`（FreeSql）；EFCore 有对应接入形态（以源码为准）。ORM 选择不影响领域层——数据访问统一收敛在 SG1 生成的 DataService 层，见架构笔记 06「数据访问与测试分层」。
- **三种引用模式**：消费方项目引用 TKWF 框架有三种方式——**Project**（`ProjectReference`，默认，可断点调试 / 与框架同构开发）、**Dll**（`<Reference HintPath>`，由 `build/TKWF.Domain.targets` 按 `TKWFRole` 注入，离线 / 验证发布一致性）、**NuGet**（`PackageReference`，标准分发）。详见架构笔记 01 §五「双仓 + 三引用模式」。

> 接线事实来源：`_xCodeGen/xCodeGen.Cli/scaffolding/` 下各宿主（webapi / blazorweb / blazorwasm）的 `Program.cs` 与 `.csproj` 模板。

---

## 进一步阅读

- [传输协议选型](./choose-transport.md) — GraphQL vs REST vs RPC 选型
- [控制器路径选型](./choose-controller-path.md) — 自动生成 vs 手写 Controller
- [多形态客户端认证架构](../security/authentication.md) — 三种认证形态详解
