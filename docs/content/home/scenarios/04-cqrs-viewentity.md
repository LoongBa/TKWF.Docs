---
order: 4
badge: "4️⃣"
title: CQRS 读写分离 — VEntity 强大查询 + 统计聚合
description: Entity 写模型 / VEntity 读模型，table/view 底层分离。VEntity + IQueryable + GraphQL 提供强大查询和统计。
language: csharp
---

VEntity 专用读模型——框架阻止写操作。

```csharp
// VEntity 专用读模型——框架阻止写操作
var list = await User.Query<OrderSummaryView>()
    .Where(v => v.Status == "Paid")
    .OrderByDescending(v => v.Amount)
    .Page(1, 10)
    .ToListAsync();

// ViewSql 含 SUM/COUNT → xCodeGen 自动生成 StatsDto
var statsDs = User.Use<OrderViewDataService>();
var stats = await statsDs.GetAsync<OrderSummaryStatsDto>();
// stats.TotalAmount / stats.OrderCount / stats.AvgAmount
```
