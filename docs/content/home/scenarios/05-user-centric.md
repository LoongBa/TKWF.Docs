---
order: 5
badge: "5️⃣"
tab: User 为中心
title: 以 User 为中心 + 多租户支持
description: 前后端统一的用户模型和使用方法：User.Query<TEntity>()，天然避免串号，支持多租户。
language: csharp
---

以 User 为统一入口，不需要构造器注入，无需修改构造器，避免运行时才能发现的错误。

```csharp
// 不需要构造器注入——User 统一入口
var ds = User.Use<OrderDataService>();        // 数据服务：CRUD
var productService = User.Use<ProductService>(); // 其他服务
var repo = User.Use<IEntityDAC<Order>>();       // 获取原始 DAC，特殊场景需要执行 Sql 语句

// 多租户——IEntityTenant 自动过滤，无需手写 WHERE TenantId
// IGlobalQueryFilter 策略：软删除 + 多租户 + 审计自动应用
// User.TenantId / User.UserId / User.Roles 全部由框架填充
```
