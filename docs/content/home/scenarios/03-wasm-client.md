---
order: 3
badge: "3️⃣"
tab: Wasm 客户端
title: 客户端 Wasm → 自动调用 WebApi + 增强查询
description: 进程外 Wasm 端同样使用 User.Use<T>() 调用 Service，使用 User.Query<T>() 链式查询 Entity/VEntity，与进程内调用方式相同，不必学习。
language: csharp
---

Wasm 客户端使用方法与进程内体验一致，无需额外学习。仅泛型改为对控制器的接口 IOrderServiceController。

```csharp
// Wasm 客户端——与进程内 API 形态一致
var svc = User.Use<IOrderServiceController>();     // OrderService 对应控制器接口 IOrderServiceController
var order = await svc.CreateAsync("买咖啡");        // → GraphQL mutation

var list = await User.Query<Order>()
    .Where(o => o.Status == "Paid")
    .OrderBy(o => o.CreateTime)
    .Page(1, 20)
    .ToPageAsync();                                  // → GraphQL connection

var count = await User.Query<Order>()
    .Where(o => o.Status == "Paid")
    .CountAsync();                                   // 仅计数不请求 nodes，省带宽
```
