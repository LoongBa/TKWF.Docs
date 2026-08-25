---
order: 1
badge: "1️⃣"
tab: Agent 编写实体
title: Agent 使用 Skill 编写 Entity → 自动建表建视图 + 自动生成 Dto/DataService/Conditions
description: 只需定义实体字段 + ORM 注解，自动建表建视图，并自动生成 DTO、支持 CRUD 和 Query 的 DataService、方便编写业务查询的 Conditions，无需手写代码。
language: csharp
---

A. Agent 自动定义 Entity

```csharp
[DomainGenerateCode(IsView = Auto, AutoQuery = true)]
public class OrderView : VEntity
{
    [Column(Name = "order_id")]      public long OrderId { get; set; }
    [Column(Name = "amount")]        public decimal Amount { get; set; }
    [Column(Name = "status")]        public string Status { get; set; }
    [Column(Name = "created_at")]    public DateTime CreateTime { get; set; }
}
// xCodeGen 自动生成：OrderViewDto / OrderViewDataService / OrderViewConditions / 映射代码
// 编译期自动校验 ViewSql 列名——列名不匹配直接 warning + 运行时启动阻断，避免 Agent 犯错
```

B. 为方便编写业务代码而生成的 DataService 和 Conditions

```csharp
// 强大的链式查询
var result = await User.Query<OrderView>()
    .Where(x => !x.IsDeleted)
    .Where(x => x.Status == "Paid")
    .OrderByDescending(x => x.CreateTime)
    .Page(1, 20)
    .ToPageAsync();
```

C. 还有更强大的 `IQueryable<TEntity>` 和 Linq，充分发挥数据库延迟查询能力，配合 GraghQL 为表现层提供强大的查询支持。

```csharp
// 强大的 Linq 查询
var users = User.Query<OrderView>().Where(m => m.Amount > 100)
    .OrderByDescending(m => m.CreateTime)
    .Take(10).ToList();
```
