---
order: 3
badge: "3️⃣"
tab: Wasm 客户端
title: 客户端 Wasm → 自动调用 WebApi + 增强查询
description: Wasm 端 User.Use<T>() 调用 Service，User.Query<T>() 链式查询——与进程内 C# API 表面同构。
language: csharp
---

Wasm 客户端——与进程内 API 形态一致。

```csharp
// Wasm 客户端——与进程内 API 形态一致
var svc = User.Use<IOrderServiceController>();
var order = await svc.CreateAsync("买咖啡");        // → GraphQL mutation

var list = await User.Query<Order>()
    .Where(o => o.Status == "Paid")
    .OrderBy(o => o.CreatedAt)
    .Page(1, 20)
    .ToPageAsync();                                  // → GraphQL connection

var count = await User.Query<Order>()
    .Where(o => o.Status == "Paid")
    .CountAsync();                                   // 仅计数不请求 nodes，省带宽
```
