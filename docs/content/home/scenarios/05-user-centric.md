---
order: 5
badge: "5️⃣"
title: 以 User 为中心 + 多租户支持
description: User.Query<T>()、User.Use<TService>() 统一入口——业务类不需要修改构造器，需要什么通过 User 获取。
language: csharp
---

不需要构造器注入——User 统一入口。

```csharp
// 不需要构造器注入——User 统一入口
var ds = User.Use<OrderDataService>();        // 数据服务：CRUD
var productService = User.Use<ProductService>(); // 其他服务
var repo = User.Use<IEntityDAC<Order>>();       // 原始 DAC

// 多租户——IEntityTenant 自动过滤，无需手写 WHERE TenantId
// IGlobalQueryFilter 策略：软删除 + 多租户 + 审计自动应用
// User.TenantId / User.UserId / User.Roles 全部由框架填充
```
