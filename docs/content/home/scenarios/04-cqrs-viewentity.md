---
order: 4
badge: "4️⃣"
tab: CQRS 读写分离
title: 框架底层支持 CQRS 读写分离，并提供强大的查询、统计聚合能力。
description: Entity 写模型 / VEntity 读模型分离，底层基于数据库 table/view，无需手写代码实现 VEntity + IQueryable + GraphQL，发挥强大的查询、统计和延迟查询特性。
language: csharp
---

VEntity 专用读模型——框架底层不提供写操作，更能发挥数据库 View 强大索引/聚合/统计/分组能力、IQueryable 强大的延迟查询能力、GraghQL 强大的字段选择能力。

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
