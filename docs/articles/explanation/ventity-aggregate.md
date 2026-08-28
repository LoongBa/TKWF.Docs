---
title: VEntity 统计与聚合
description: TKWF VEntity 统计聚合能力：ViewSql 自动聚合（StatsDto）、Hasura 风格聚合 GraphQL 自动生成、AutoQuery 消除 80% 查询代码
---

# VEntity 统计与聚合

> 框架级 CQRS 的核心卖点：VEntity 不只是"读模型"——它还自带**统计与聚合能力**。ViewSql 中的 `SUM/COUNT/AVG/MIN/MAX` 被 SG 自动识别，生成聚合 GraphQL 类型 + 统计 Dto，AutoQuery 消除 80% 查询 Service 代码。
> 设计依据：[ADR20](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR20-VEntity聚合GraphQL自动生成.md) · V4.9.38/53

---

## 为什么需要自动聚合

传统框架中，统计和聚合查询是最**消耗开发成本**的部分——每个统计页面都需要手写 Service 方法、手写 SQL、手写 Dto、手写 Controller 端点。

| 统计场景 | 传统框架（手写） | TKWF（自动生成） |
|:--|:--|:--|
| 订单总金额 | 手写 `GetTotalAmountAsync()` + SQL `SUM` + Dto | ViewSql 写 `SUM(amount) AS total` → **StatsDto 自动生成** |
| 活跃用户数 | 手写 `CountActiveUsersAsync()` + SQL `COUNT` + Dto | ViewSql 写 `COUNT(*) AS active_count` → **StatsDto 自动生成** |
| 日均销售额 | 手写 `GetDailyAvgAsync()` + SQL `AVG` + Dto | ViewSql 写 `AVG(amount) AS daily_avg` → **StatsDto 自动生成** |
| 三端聚合查询 | 每端各写一套 | `.Aggregate().ToAggregateAsync()` **三端 API 等价** |

**核心价值**：开发者只需在 VEntity 的 ViewSql 中写聚合 SQL，框架自动完成——生成 Dto、生成 GraphQL 类型、生成 resolver、生成三端查询入口。

---

## 三层自动聚合能力

TKWF 的聚合能力分三层，逐层递进：

| 层 | 能力 | 自动化 | 版本 |
|:--|:--|:--|:--|
| **① StatsDto 自动生成** | ViewSql 中的聚合函数 → 自动生成 `{VEntity}StatsDto`（partial record） | xCodeGen `AggregationDetector` 扫描 ViewSql | V4.9.38 |
| **② AutoQuery 自动查询** | `[DomainGenerateCode(AutoQuery = true)]` → 自动生成 List + Count 查询 Controller | SG1b `ControllerGenerator` 生成 | V4.9.38 |
| **③ 聚合 GraphQL 自动生成** | VEntity → Hasura 风格 `{entity}_aggregate` GraphQL 字段 + QueryBuilder `.Aggregate()` 链 | SG2 扩展（ADR20） | V4.9.53 |

---

## ① StatsDto 自动生成

### 原理

xCodeGen 的 `AggregationDetector` 扫描 VEntity 的 `ViewSql`，识别 `SUM/COUNT/AVG/MIN/MAX` 聚合函数，自动生成统计 Dto。

### 使用方式

**第 1 步：在 VEntity 的 ViewSql 中写聚合 SQL**

```csharp
[DomainGenerateCode(IsView = true, ViewSql = @"
    SELECT
        merchant_id,
        COUNT(*)          AS order_count,
        SUM(amount)        AS total_amount,
        AVG(amount)        AS avg_amount,
        MAX(amount)        AS max_amount,
        MIN(amount)        AS min_amount
    FROM orders
    GROUP BY merchant_id
")]
public class MerchantOrderStatsView : IDomainEntity
{
    public long Id { get; set; }           // GROUP BY 锚点（ROW_NUMBER 或 GROUP BY 列）
    public long MerchantId { get; set; }
    public long OrderCount { get; set; }   // ← 对应 COUNT(*)
    public decimal TotalAmount { get; set; }  // ← 对应 SUM(amount)
    public decimal AvgAmount { get; set; }    // ← 对应 AVG(amount)
    public decimal MaxAmount { get; set; }    // ← 对应 MAX(amount)
    public decimal MinAmount { get; set; }    // ← 对应 MIN(amount)
}
```

**第 2 步：编译 → 自动生成 StatsDto**

```csharp
// xCodeGen 自动生成（MerchantOrderStatsViewStatsDto.g.cs）
public partial record MerchantOrderStatsViewStatsDto
{
    public long OrderCount { get; init; }
    public decimal TotalAmount { get; init; }
    public decimal AvgAmount { get; init; }
    public decimal MaxAmount { get; init; }
    public decimal MinAmount { get; init; }
}
```

**第 3 步：在 Service 中使用**

```csharp
public async Task<MerchantOrderStatsViewStatsDto> GetMerchantStatsAsync(long merchantId)
{
    return await Query<MerchantOrderStatsView>()
        .Where(s => s.MerchantId == merchantId)
        .FirstOrDefaultAsync();  // 查询 ViewSql 对应的数据库视图
}
```

### 聚合类型自动推断

`AggregationDetector` 根据 SQL 聚合函数 + C# 属性类型自动推断 Dto 字段类型：

| SQL 聚合函数 | C# 属性类型 | Dto 推断类型 |
|:--|:--|:--|
| `SUM(amount)` | `decimal` | `decimal` |
| `COUNT(*)` | `long` | `long` |
| `AVG(amount)` | `decimal` | `decimal` |
| `MAX(create_time)` | `DateTime` | `DateTime` |
| `MIN(id)` | `long` | `long` |

> **IsComputed 计算字段**：ViewSql 中非聚合的派生列（如 `ROW_NUMBER() OVER(...) AS "Id"`）标注 `[DtoField(IsComputed = true)]`，DynamicSelector 投影跳过该列的 SQL 列校验（V4.9.36）。

---

## ② AutoQuery 自动查询

### 原理

`[DomainGenerateCode(AutoQuery = true)]` 让 SG 自动生成标准的 List + Count 查询 Controller——无需手写查询 Service。

```csharp
[DomainGenerateCode(IsView = true, AutoQuery = true, ViewSql = "...")]
public class OrderListView : IDomainEntity
{
    public long Id { get; set; }
    public string OrderNo { get; set; } = "";
    public string Status { get; set; } = "";
    public decimal Amount { get; set; }
}
```

### 自动生成的 Controller

```csharp
// SG 自动生成（OrderListViewQueryController.g.cs）
// 含 List + Count 标准查询方法，ct 参数全链路自动追加
public class OrderListViewQueryController
{
    public Task<PagedResult<OrderListView>> ListAsync(
        string? status, int page, int pageSize, CancellationToken ct) { ... }

    public Task<int> CountAsync(string? status, CancellationToken ct) { ... }
}
```

**消除 80% 查询 Service**：标准列表查询 + 分页 + 计数全部自动生成，SG2 自动转 REST + GraphQL 端点。

> V4.9.40 起，AutoQuery 委托 EQR（EntityQueryRoot）统一入口——`User.Query<T>()` → EQR → `IEntityReadOnlyDAC.Query` → `IQueryable`，3 跳零反射。

---

## ③ 聚合 GraphQL 自动生成（ADR20）

### 原理

SG2 为 VEntity 自动生成 **Hasura 风格**的聚合 GraphQL 类型——当 ViewSql 包含 `SUM/COUNT/AVG/MIN/MAX` 时，在 connection resolver 旁自动生成 `{entity}_aggregate` 字段。

### 自动生成的 GraphQL Schema

```graphql
# SG2 自动生成
type OrderViewAggregate {
    _count: Int!
    _sum: OrderViewSumFields!
    _avg: OrderViewAvgFields
}

type OrderViewSumFields {
    amount: Float
    quantity: Float
}

extend type Query {
    orderView_aggregate(where: OrderViewFilterInput): OrderViewAggregate
}
```

resolver 委托 EQR → `IEntityReadOnlyDAC` → `IQueryable` → FreeSql 扩展方法（`SumAsync`/`CountAsync`/`AvgAsync`）。

### 三端查询 API

**C# Wasm 客户端**（`QueryableBuilder.Aggregate()` 链）：

```csharp
var agg = await User.Query<OrderView>()
    .Where(o => o.Status == "Paid")
    .Aggregate(a => a.Sum(f => f.Amount).Count())
    .ToAggregateAsync();
// → GraphQL: orderView_aggregate(where: {status: {eq: "Paid"}}) { _sum { amount } _count }

Console.WriteLine($"总金额: {agg.Sum.Amount}");
Console.WriteLine($"订单数: {agg.Count}");
```

**TS 前端**（API 表面同构）：

```typescript
const agg = await Tkwf.User.Query<OrderView>()
    .where(f => f.status.eq("Paid"))
    .aggregate(a => a.sum(f => f.amount).count())
    .toAggregateAsync();
```

**GraphQL 原生**（直接查询）：

```graphql
query {
  orderView_aggregate(where: { status: { eq: "Paid" } }) {
    _count
    _sum { amount }
    _avg { amount }
  }
}
```

> **三端 API 等价**：进程内、C# Wasm、TS 前端走同一 GraphQL 字段——Agent 不需区分"进程内能做什么、进程外不能做什么"。

---

## 完整流程：从 ViewSql 到三端聚合查询

```
开发者写 ViewSql（含 SUM/COUNT/AVG/MIN/MAX）
  ↓ 编译
  ├─ xCodeGen AggregationDetector → 扫描聚合函数 → 生成 StatsDto（partial record）
  ├─ SG1b ControllerGenerator → AutoQuery 生成 List + Count Controller
  ├─ SG2 → 生成 connection resolver + _aggregate GraphQL 字段
  └─ SG3 → 生成客户端代理（含 .Aggregate() 链支持）
  ↓ 运行时
  ├─ 进程内：User.Query<T>() → EQR → IQueryable → FreeSql SumAsync/CountAsync
  ├─ C# Wasm：User.Query<T>().Aggregate(...).ToAggregateAsync() → GraphQL _aggregate
  └─ TS：Tkwf.User.Query<T>().aggregate(...).toAggregateAsync() → 同上
```

---

## 两种聚合模式对比

| 维度 | StatsDto（V4.9.38） | 聚合 GraphQL（V4.9.53 ADR20） |
|:--|:--|:--|
| **适用场景** | 复杂多表 JOIN + 聚合 | 简单单表标量聚合 |
| **生成方式** | xCodeGen 扫描 ViewSql → partial record | SG2 自动生成 GraphQL 类型 + resolver |
| **查询方式** | Service 方法返回 `StatsDto` | `.Aggregate().ToAggregateAsync()` |
| **三端等价** | 需手写 Service 方法暴露 | 三端 API 自动等价 |
| **可否共存** | ✅ 是——StatsDto 不废弃 | ✅ 是——复杂聚合走 StatsDto，简单聚合走自动生成 |

---

## 适用与不适用场景

### ✅ 适用

- VEntity 单表聚合查询（Sum/Count/Avg/Max/Min）
- 统计仪表盘 / 报表页面
- 前端列表页面的"总数"徽章（AutoQuery CountAsync）
- 三端等价的聚合查询 API

### ❌ 不适用

| 场景 | 替代方案 |
|:--|:--|
| 多表 JOIN + 聚合 | 走特化 Service 方法 + 手写 StatsDto（AggregationDetector 产出仍可复用） |
| 普通 Entity 聚合 | 需先配置 `[DomainGenerateCode(IsView=true)]` 成为 VEntity |
| Join / Any / Exists 查询 | 进程内用完整 LINQ；进程外通过 ViewSql 的 SQL JOIN 实现；Any/Exists 通过 `Count > 0` 变通 |
| 分组聚合（GroupBy） | Phase 2 评估中（需额外 schema 设计，参考 PostGraphile 模式） |

---

## 版本演进

| 版本 | 能力 | ADR |
|:--|:--|:--|
| V4.9.5 | VEntity + ViewSql 统一设计（声明式视图实体） | — |
| V4.9.36 | IsComputed 计算字段 + DynamicSelector 投影跳过 | ADR11 |
| V4.9.38 | AutoQuery 自动查询 + 聚合 Dto 自动生成（AggregationDetector）+ 轻量 VEntity（InlineSelectSql） | ADR13 |
| V4.9.40 | EQR 统一入口（8跳→3跳）+ AutoQuery 委托 EQR + IGlobalQueryFilter | ADR14 |
| V4.9.53 | 聚合 GraphQL 自动生成（Hasura 风格）+ QueryBuilder `.Aggregate()` 链 | ADR20 |

---

## 继续阅读

- [VEntity 读写分离（CQRS）](cqrs-read-write.md) — Entity 写 / VEntity 读的类型级分离
- [数据层架构](data-layer-architecture.md)
- [增强查询 QueryBuilder](../advanced/query-guide.md)
- [数据服务与数据存取](../core-concepts/data-services.md)