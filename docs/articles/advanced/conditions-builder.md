---
title: 条件表达式构建器
description: 条件表达式构建器（Conditions）的使用指南，链式构建动态查询条件
---
# 条件表达式构建器

> 源文档：[D06B](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D06B-%E6%9D%A1%E4%BB%B6%E8%A1%A8%E8%BE%BE%E5%BC%8F%E6%9E%84%E5%BB%BA%E5%99%A8%E8%AE%BE%E8%AE%A1.md) · [G06B](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G06B-%E6%9D%A1%E4%BB%B6%E8%A1%A8%E8%BE%BE%E5%BC%8F%E6%9E%84%E5%BB%BA%E5%99%A8%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · V4.7.3

---

## 一句话总结

Conditions Builder 提供**链式 API** 构建动态查询条件，支持精确匹配、模糊查询、范围查询、OR 分支、动态拼接——比手写 `Expression.AndAlso` 更简洁、更安全。

---

## 快速速查

```
Entity.Conditions.ByXxx(val)     → 单个条件，直接返回 Expression
Entity.Where.ByXxx(a).ByYyy(b)   → 链式组合，自动 AND，隐式转换
Entity.Where.ByXxx(a).If(cond,b) → 条件拼接，动态查询
Entity.Where.ByXxx(a).Or(b=>...) → OR 分支
```

**DO**：
- ✅ 优先用 `Entity.Where.ByXxx()` 链式
- ✅ 多个条件直接链：`Entity.Where.ByMemberId(123).ByStatus(1)`
- ✅ 动态拼接用 `If()`：`Entity.Where.If(search != null, b => b.LikeName(search))`
- ✅ OR 分支用 `Or()`：`Entity.Where.ByMemberId(123).Or(b => b.ByStatus(1))`
- ✅ 无条件时用 `Entity.Where`（隐式转换到 `x => true`）

**DON'T**：
- ❌ 不要写 `x => true` 或 `x => false`——用 `None` / 直接删除条件
- ❌ 不要手动 `Expression.AndAlso` + `ParameterRebinder`——用 `.And()` 扩展方法
- ❌ 不要 `new Entity.PredicateBuilder()`——用 `Entity.Where` 入口

---

## 三种使用方式

### 方式 A：单条件

```csharp
// 最简形式，直接返回 Expression
var predicate = Entity.Conditions.ByMemberId(123);
await svc.GetAsync(predicate, ...);
```

| 方法 | 说明 | 参数 |
|:--|:--|:--|
| `ByXxx(value)` | 精确匹配（`==`） | 必填 |
| `LikeXxx(keyword)` | 模糊匹配（`Contains`） | 可选，为空返回 `None` |
| `ByXxxRange(begin, end)` | 时间范围 | begin/end 可选 |
| `None` | 恒真表达式（`x => true`） | — |
| `All(predicates[])` | 多个条件 AND 组合 | — |
| `Any(predicates[])` | 多个条件 OR 组合 | — |

### 方式 B：组合条件

```csharp
// 两个条件 AND
var predicate = Entity.Conditions.ByMemberId(123)
    .And(Entity.Conditions.ByStatus(1));

// 两个条件 OR
var predicate = Entity.Conditions.ByMemberId(123)
    .Or(Entity.Conditions.ByMemberId(456));

// 三个条件 AND
var predicate = Entity.Conditions.All(
    Entity.Conditions.ByMemberId(123),
    Entity.Conditions.ByStatus(1),
    Entity.Conditions.LikeName("test"));
```

需要 `using TKW.Framework.Extensions;`。

### 方式 C：链式（推荐）

```csharp
// 单条件，隐式转换到 Expression
await svc.GetAsync(Entity.Where.ByMemberId(123), ...);

// 多条件自动 AND
await svc.GetAsync(Entity.Where.ByMemberId(123).ByStatus(1), ...);

// 混入自定义条件
await svc.GetAsync(Entity.Where.ByMemberId(123).Where(x => x.Amount > 1000), ...);

// OR 分支
await svc.GetAsync(Entity.Where.ByMemberId(123).Or(b => b.ByStatus(1).LikeName("test")), ...);

// 条件拼接
await svc.GetAsync(Entity.Where
    .If(searchText != null, b => b.LikeName(searchText))
    .If(status.HasValue, b => b.ByStatus(status.Value)), ...);

// 无条件
await svc.GetAsync(Entity.Where, ...);  // 等价于 x => true
```

---

## 完整示例

### 基础查询

```csharp
// 按会员 ID 查询
var member = await _memberSvc.GetAsync(
    Entity.Where.ByMemberId(123), e => new { e.Id, e.Name });

// 按状态查询活跃会员
var activeMembers = await _memberSvc.SelectAsync(
    Entity.Where.ByStatus(1).ByIsDeleted(false));

// 分页查询
var page = await _memberSvc.SelectPageAsync(
    Entity.Where.ByStatus(1),
    e => e.OrderByDescending(m => m.CreateTime),
    page: 1,
    pageSize: 20);
```

### 动态查询

```csharp
public async Task<List<OrderDto>> SearchOrdersAsync(
    long? memberId, int? status, string? keyword, DateTime? startDate)
{
    var query = Entity.Where
        .If(memberId.HasValue, b => b.ByMemberId(memberId.Value))
        .If(status.HasValue, b => b.ByStatus(status.Value))
        .If(!string.IsNullOrEmpty(keyword), b => b.LikeOrderNo(keyword))
        .If(startDate.HasValue, b => b.ByCreateTimeRange(startDate.Value, DateTime.UtcNow));

    return await orderService.SelectAsync(query, e => new OrderDto
    {
        Id = e.Id,
        OrderNo = e.OrderNo,
        TotalAmount = e.TotalAmount
    });
}
```

### OR 分支

```csharp
// 查询"张三的订单"或"金额大于1万的订单"
var query = Entity.Where
    .ByMemberName("张三")
    .Or(b => b.ByTotalAmountRange(10000, null));

var results = await orderService.SelectAsync(query);
```

### 与 IQueryable 组合

```csharp
// Conditions Builder + IQueryable 链式组合
var query = Entity.Where
    .ByStatus(1)
    .ByCreateTimeRange(lastWeek, DateTime.UtcNow);

// 追加排序和分页
var page = await orderService.SelectPageAsync(
    query,
    e => e.OrderByDescending(o => o.CreateTime),
    page: 1,
    pageSize: 20);
```

---

## 进一步阅读

- [增强查询 QueryBuilder](./query-guide.md) — User.Query\<T\>() 客户端远程查询
- [领域数据服务](../core-concepts/data-services.md) — DataService 基类体系
- [30 分钟实战 Part 1](../tutorials/30-min-todo-part1.md) — Entity + DataService + CRUD
