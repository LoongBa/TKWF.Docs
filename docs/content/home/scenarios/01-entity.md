---
order: 1
badge: "1️⃣"
tab: Agent 编写实体
title: Agent 编写 Entity → 自动建表建视图 + 自动生成 Dto/DataService/Conditions
description: 定义实体字段 + ORM 注解，xCodeGen 自动生成 DTO、DataService、Conditions、Dto 映射代码。
language: csharp
---

定义实体字段 + ORM 注解，xCodeGen 自动生成 DTO、DataService（CRUD）、Conditions（查询条件）、Dto 映射代码。无需手写样板。

```csharp
[DomainGenerateCode(IsView = true, AutoQuery = true)]
public class OrderView : VEntity
{
    [Column(Name = "order_id")]      public long OrderId { get; set; }
    [Column(Name = "amount")]        public decimal Amount { get; set; }
    [Column(Name = "status")]        public string Status { get; set; }
}
// xCodeGen 自动生成：OrderViewDto / OrderViewDataService / OrderViewConditions / 映射代码
// ViewSql 编译期列名校验——列名不匹配直接 warning + 运行时启动阻断
```

同样，定义普通 Entity 也自动生成 CRUD 的 DataService + Conditions + Dto——查询/更新直接链式调用，返回强类型 Dto：

```csharp
// 自动生成的 OrderDataService + OrderConditions —— 直接链式使用
var ds = User.Use<OrderDataService>();
var list = await ds.Query
    .Where(OrderConditions.Status.Eq("Paid"))
    .And(o => o.Amount >= 100)
    .OrderByDescending(o => o.CreateTime)
    .Page(1, 20)
    .ToListAsync()
    .ToDtoList<OrderDto>();

var orderDto = await ds.GetAsync(1L).ToDto<OrderDto>();
var count = await ds.Query.CountAsync();
```
