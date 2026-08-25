---
order: 6
badge: "6️⃣"
tab: 自动注册
title: 自动注册服务和控制器 — 无需配置，不会遗漏
description: 自动注册全部服务和控制器，减少运行时错误，不给 Agent 犯错误的机会。
language: csharp
---

项目配置简单、语义化，BlazorWeb/WebApi/Wasm/Console/Test 等项目一行配置。

```csharp
// 内部自动注册所有 Service / Controller
builder.Services.AddTKWFDomain<AppUserInfo, AppDomainInitializer>();

// 无需 services.AddScoped<OrderService>() — 框架自动注册
// 无需 app.MapControllers() — Minimal API 端点由 ApiService 自动生成、提供服务
```
