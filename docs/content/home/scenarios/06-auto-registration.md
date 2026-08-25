---
order: 6
badge: "6️⃣"
tab: 自动注册
title: 自动注册服务和控制器 — 无需复杂容器配置
description: 配置简单，BlazorWeb/WebApi/Wasm 等项目一行配置，自动注册全部。
language: csharp
---

一行注册全部——自动扫描注册所有 DomainService / DataService。

```csharp
// 一行注册全部——自动扫描注册所有 DomainService / DataService
builder.Services.AddTKWFDomain<AppUserInfo, AppDomainInitializer>();

// SG 生成的 _GeneratedControllerRegistrations.g.cs 自动挂载全部 Controller
// 无需 services.AddScoped<OrderService>() — 框架自动注册
// 无需 app.MapControllers() — Minimal API 端点由 SG2 自动生成
```
