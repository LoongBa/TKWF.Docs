---
title: VEntity 读写分离（CQRS）
description: TKWF 架构级 CQRS：Entity 写模型 / VEntity 读模型类型级分离，ViewSql 声明式视图，EQR 统一查询入口
---

# VEntity 读写分离（CQRS）

> TKWF 的 CQRS 不是传统"写模型/读模型分表"，而是**类型级分离**：Entity 只负责写（持久化、事务、业务规则），VEntity 只负责读（ViewSql 声明式视图 + 自动聚合 + EQR 统一入口）。三端 `User.Query<T>()` 统一查询入口，进程内/Was/TS 等价。

> 设计依据：ADR14（EQR 统一入口）、V4.9.36-40 · D06C/G06C · D07A §查询架构简化

---

## 为什么需要类型级 CQRS

传统 CQRS 通常指"写库/读库分离"或"写模型/读模型分表"，带来大量样板代码：

| 传统 CQRS 痛点 | TKWF 类型级 CQRS 解决 |
|:--|:--|
| 写模型/读模型双份实体定义 | **类型级分离**：Entity 只写、VEntity 只读，编译期区分 |
| 手写查询 Service + Controller | **EQR + GraphQL Connection**：标准查询零代码 |
| 视图层手写 SQL + Dto | **ViewSql 声明式**：SQL 即 Dto，编译期生成 Dto |
| 进程内/外查询 API 不等价 | **EQR 统一入口**：`User.Query<T>()` 三端等价 |

**核心洞察**：写和读的关注点本质不同——写需要事务/业务规则/领域约束；读只需投影、过滤、聚合。TKWF 在类型系统层面彻底分离二者，编译期保证各司其职。

---

## 核心概念

| 概念 | 角色 | 关键特征 |
|:--|:--|:--|
| **Entity** | 写模型 | 持久化、事务、业务规则、领域逻辑、`[Transactional]`、`AuthorityFilter` |
| **VEntity** | 读模型 | 只读、ViewSql 声明式视图、自动聚合、自动查询、只读优化 |
| **EQR** | 统一查询入口 | `User.Query<T>()` → `IEntityReadOnlyDAC.Query` → `IQueryable` |

---

## 核心机制

### 1. 类型级分离：Entity vs VEntity

```csharp
// 写模型 —— 持久化实体
[DomainGenerateCode]
public class Order : IDomainEntity
{
    public long Id { get; set; }
    public string OrderNo { get; set; } = "";
    public long UserId { get; set; }
    public decimal Amount { get; set; }
    public OrderStatus Status { get; set; }
    // 业务方法：下单、取消、支付...
    public void Confirm() { Status = OrderStatus.Confirmed; }
}

// 读模型 —— VEntity（只读视图）
[DomainGenerateCode(IsView = true, ViewSql = @"
    SELECT 
        o.Id,
        o.OrderNo,
        o.UserId,
        o.Amount,
        o.Status,
        u.Name AS UserName,
        ROW_NUMBER() OVER (PARTITION BY o.UserId ORDER BY o.CreateTime DESC) AS UserOrderRank
    FROM orders o
    JOIN users u ON o.UserId = u.Id
    WHERE o.IsDeleted = 0
")]
public class OrderView : IDomainEntity
{
    public long Id { get; set; }
    public string OrderNo { get; set; } = "";
    public long UserId { get; set; }
    public decimal Amount { get; set; }
    public OrderStatus Status { get; set; }
    public string UserName { get; set; } = "";
    public int UserOrderRank { get; set; }
}
```

| 特性 | Entity（写） | VEntity（读） |
|:--|:--|:--|
| 标注 | `[DomainGenerateCode]` | `[DomainGenerateCode(IsView = true, ViewSql = "...")]` |
| 基类 | `DomainServiceBase<T>` / `DomainControllerBase<T>` | `IDomainEntity`（只读接口） |
| 生成物 | Controller + AOP 装饰器 + DataService | ViewSql 视图 + EQR 入口 + GraphQL Connection |
| 业务逻辑 | 有（Add/Update/Delete/业务方法） | 无（纯投影/查询/聚合） |
| 事务 | 有（`[Transactional]`） | 无（只读） |

> **关键点**：VEntity 必须实现 `IDomainEntity`；ViewSql 中的聚合函数会触发 StatsDto 自动生成（ADR13/ADR20）。

---

### 2. ViewSql 声明式视图

VEntity 的核心是 **ViewSql** —— 在编译期声明 SQL 视图，编译期生成：

| 产物 | 生成者 | 说明 |
|:--|:--|:--|
| SQL 视图创建脚本 | xCodeGen | `SyncViewsAsync` 自动执行 |
| 统计 Dto | xCodeGen `AggregationDetector` | ViewSql 中聚合函数 → StatsDto |
| GraphQL Connection | SG2 `ApiServiceGenerator` | 列表/分页/过滤/排序零代码（`ExposeGraphqlQuery` 默认 true） |
| GraphQL 聚合 | SG2 `ApiServiceGenerator` | Hasura 风格 `{entity}_aggregate` |
| EQR 入口 | SG1b `EntityQueryRoot` | `User.Query<T>()` 统一入口 |

```csharp
// 完整示例：订单列表视图（含聚合字段）
[DomainGenerateCode(
    IsView = true,
    ViewSql = @"
        SELECT 
            o.Id,
            o.OrderNo,
            o.UserId,
            o.Amount,
            o.Status,
            u.Name AS UserName,
            COUNT(o2.Id) OVER (PARTITION BY o.UserId) AS UserOrderCount,
            SUM(o.Amount) OVER (PARTITION BY o.UserId) AS UserTotalAmount
        FROM orders o
        JOIN users u ON o.UserId = u.Id
        WHERE o.IsDeleted = 0
")]
public class OrderListView : IDomainEntity
{
    public long Id { get; set; }
    public string OrderNo { get; set; } = "";
    public long UserId { get; set; }
    public decimal Amount { get; set; }
    public OrderStatus Status { get; set; }
    public string UserName { get; set; } = "";
    public long UserOrderCount { get; set; }      // 窗口函数 COUNT
    public decimal UserTotalAmount { get; set; }   // 窗口函数 SUM
}
```

**关键点**：
- ViewSql 支持任意合法 SQL（JOIN、窗口函数、子查询、CTE）
- 列名 → C# 属性名自动映射（`snake_case` → `PascalCase`）
- `[DtoField(IsComputed = true)]` 标记计算字段（如窗口函数），跳过 SQL 列校验

---

### 3. EQR 统一查询入口（8跳→3跳）

**V4.9.40 之前（8 跳）**：
```
User.Use<IOrderService>() 
  → OrderService.GetListAsync() 
    → OrderDataService.GetListAsync() 
      → OrderDAC.GetListAsync() 
        → FreeSql.Select<T>().Where(...).ToListAsync()
```

**V4.9.40+ EQR（3 跳）**：
```csharp
// 统一入口：User.Query<T>()
var orders = await User.Query<OrderView>()
    .Where(o => o.Status == OrderStatus.Paid)
    .Page(1, 20)
    .ToListAsync();
```

| 层级 | 旧路径 | EQR 新路径 |
|:--|:--|:--|
| 1 | Service 方法 | `User.Query<T>()` 统一入口 |
| 2 | DataService | `EQR` 统一入口 → `IEntityReadOnlyDAC.Query` |
| 3 | DAC/Repository | `IEntityReadOnlyDAC.Query<T>()` → `IQueryable` |
| 4 | ORM | FreeSql `IQueryable` / EF Core `IQueryable` |

> **核心洞察**：EQR 不是新 API，而是**消除了中间层**。`User.Query<T>()` 直接返回 `IQueryable<T>`，LINQ 表达式树经 `FilterExpressionCompiler` 编译为 GraphQL/REST/SQL，三端零差异。

---

### 4. 三端统一查询 API

```csharp
// C# 进程内 / Wasm 客户端
var orders = await User.Query<OrderView>()
    .Where(o => o.Status == OrderStatus.Paid)
    .OrderByDescending(o => o.CreateTime)
    .Page(1, 20)
    .ToListAsync();

// TS 前端（API 表面同构）
const orders = await Tkwf.User.Query<OrderView>()
    .where(f => f.status.eq("Paid"))
    .page(1, 20)
    .toListAsync();

// GraphQL 原生
query {
  orderView(where: {status: {eq: "Paid"}}, page: {page: 1, pageSize: 20}) {
    edges { node { id orderNo amount status } }
    pageInfo { hasNextPage }
  }
```

| 端 | API 入口 | 实现 |
|:--|:--|:--|
| C# 进程内 | `User.Query<T>()` → `IQueryable` | EQR → `IQueryable` → FreeSql |
| C# Wasm | `User.Query<T>()` → `QueryableBuilder` | EQR → GraphQL 表达式树编译 |
| TS 前端 | `Tkwf.User.Query<T>()` | `QueryBuilder` → GraphQL 变量 |

> **三端等价**：同一 LINQ 表达式 → 编译期生成三端等价查询。Agent 不需区分"进程内能做什么、进程外不能做什么"。

---

## 5. 标准查询（EQR + GraphQL Connection）

VEntity 的标准查询（列表/分页/计数）通过 **EQR 统一入口 + GraphQL Connection** 提供，无需手写查询 Service：

```csharp
[DomainGenerateCode(IsView = true, ViewSql = "SELECT * FROM orders")]
public class OrderListView : IDomainEntity
{
    public long Id { get; set; }
    public string OrderNo { get; set; } = "";
    public OrderStatus Status { get; set; }
}
```

**查询方式（三端等价）**：

```csharp
// 进程内 / C# Wasm：EQR 统一入口
var page = await User.Query<OrderListView>()
    .Where(o => o.Status == OrderStatus.Paid)
    .OrderByDescending(o => o.Id)
    .Page(1, 20)
    .ToPageAsync();          // 分页 + 计数
```

```typescript
// TS 前端：QueryBuilder 链（API 表面同构）
const page = await Tkwf.User.Query<OrderListView>()
    .where(f => f.status.eq("Paid"))
    .orderByDescending(f => f.id)
    .page(1, 20)
    .toPageAsync();
```

**GraphQL 通道**：VEntity 默认 `ExposeGraphqlQuery = true`（V4.9.78 起 `QueryExposureDefaults` 统一推导），SG2 自动生成 Connection resolver（`UsePaging + UseProjection + UseFiltering + UseSorting`）——列表/分页/排序/过滤零代码。

**关键点**：
- **VEntity 仅支持 GraphQL 查询**（EQR 直连，`ExposeGraphqlQuery` 默认 true）；**不支持 REST 端点**（SG1b early-return 阻断，V4.9.102）
- REST 查询需通过 **Service 方法包装**——注入 `IEntityReadOnlyDAC<T>` 或 `User.Query<T>()` 手写查询方法（`[RestGet("list")]`）
- `AutoQuery`/`IsGraphQLQueryable` 旧属性已移除（V4.9.102），统一使用 `ExposeRestQuery`/`ExposeGraphqlQuery`

---

## 与传统 CQRS 对比

| 维度 | 传统 CQRS | TKWF 类型级 CQRS |
|:--|:--|:--|
| **分离粒度** | 表级/库级分离 | **类型级**（Entity vs VEntity） |
| **模型定义** | 手写两套 Dto/Entity | ViewSql 声明式 + 编译期生成 |
| **查询入口** | 手写 Repository/Service | `User.Query<T>()` 统一入口 |
| **三端一致性** | 需手写适配层 | EQR 编译期保证三端等价 |
| **聚合查询** | 手写 StatsDto + Service | ViewSql 聚合 → StatsDto + GraphQL 自动生成 |
| **样板代码** | 大量 | **消除 80% 以上** |

---

## 与标准查询 / VEntity 聚合的关系

| 能力 | 章节 | 核心价值 |
|:--|:--|:--|
| VEntity 读写分离 | 本文 | 类型级 CQRS 基础架构 |
| 标准查询（EQR + GraphQL Connection） | [VEntity 统计与聚合](ventity-aggregate.md) §② | 列表/分页/计数零代码生成 |
| VEntity 聚合 GraphQL | [VEntity 统计与聚合](ventity-aggregate.md) §③ | Hasura 风格 `.Aggregate()` 三端等价 |
| ViewSql 统计自动生成 | [VEntity 统计与聚合](ventity-aggregate.md) §① | StatsDto 自动生成 |

---

## 适用与不适用场景

### ✅ 适用

- 复杂查询（JOIN、窗口函数、聚合）→ ViewSql 声明
- 标准列表/详情/分页/计数 → EQR + GraphQL Connection 零代码
- 三端统一查询 API → EQR 统一入口
- 读写分离强需求（写路径走 Entity + AOP，读路径走 VEntity + EQR）

### ❌ 不适用

| 场景 | 替代方案 |
|:--|:--|
| 简单单表 CRUD | 直接用 Entity + `DomainDataServiceBase`（无需 VEntity） |
| 高频写入 + 强一致性事务 | Entity + `[Transactional]`（走写模型） |
| 复杂跨表事务 | Entity + `[Transactional]` + 手写 DAC |
| 实时订阅/推送 | 事件机制（Outbox/Inbox）+ SignalR（V5） |

---

## 继续阅读

- [VEntity 统计与聚合](ventity-aggregate.md) — StatsDto 自动生成 + 标准查询（EQR/GraphQL Connection）+ 聚合 GraphQL
- [数据层架构](data-layer-architecture.md) — Entity/VEntity/DAC/Repository 全景
- [增强查询 QueryBuilder](../advanced/query-guide.md) — `.Where()`/`.OrderBy()`/`.Aggregate()` 完整用法
- [数据服务与数据存取](../core-concepts/data-services.md) — DataService 完整用法