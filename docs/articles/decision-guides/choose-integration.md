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
| **通信方式** | HTTP/gRPC | SignalR（进程内） | GraphQL/REST（HTTP） | GraphQL/REST（HTTP） | 进程内调用 |
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
var app = builder.ConfigWebAppDomain<DmpUserInfo, MyDomainInitializer, DomainWebOptions>(
        "DomainOptions", cfg =>
        {
            cfg.UseWebExceptionMiddleware = true;
            cfg.UseFreeSqlEntityDAC();
        })
    .RegisterServices((services, cfg) => { /* ... */ })
    .Build(...);

// 标准 ASP.NET Core 路由
app.MapControllers();
app.Run();
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

var app = builder.ConfigMauiAppDomain<DmpUserInfo, MyDomainInitializer, DomainMauiOptions>(
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
// xUnit 测试
public class OrderServiceTests
{
    private readonly DomainTestHost<DmpUserInfo> _host;

    public OrderServiceTests()
    {
        _host = DomainTestHost<DmpUserInfo>.Create(builder =>
        {
            builder.ConfigTestDomainAsync<DmpUserInfo, MyDomainInitializer, DomainTestOptions>(
                    "DomainOptions", cfg => { /* ... */ })
                .Build(...);
        });
    }

    [Fact]
    public async Task CreateOrder_ShouldSucceed()
    {
        await _host.RunAsync(async user =>
        {
            var orderService = user.Use<OrderService>();
            var orderId = await orderService.CreateAsync(new CreateOrderDto { /* ... */ });
            Assert.True(orderId > 0);
        });
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

## 进一步阅读

- [传输协议选型](./choose-transport.md) — GraphQL vs REST vs RPC 选型
- [控制器路径选型](./choose-controller-path.md) — 自动生成 vs 手写 Controller
- [多形态客户端认证架构](../security/authentication.md) — 三种认证形态详解
