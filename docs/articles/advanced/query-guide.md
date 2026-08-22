---
title: 增强查询 QueryBuilder
description: 增强查询 QueryBuilder 的使用指南，链式查询构造、分页排序、聚合查询（V4.9.53 VEntity 聚合）
---
# 增强查询 QueryBuilder

> `User.Query<T>()` 是 TKWF 唯一统一的查询入口（V4.9.28 起 `QueryApi`/`QueryGraphQL` 合并至此），返回 `QueryableBuilder<TEntity>`，支持链式查询构造。本文覆盖基础查询、V4.9.42 增强（CountAsync/Clone/OrderByField）与 V4.9.53 聚合查询（Aggregate/ToAggregateAsync）。

---

## 快速入门

### 基础链式查询

```csharp
// 在 Blazor Page / ViewModel 中
public class PaymentLogListModel
{
    private DomainClientUser _user;

    public async Task LoadDataAsync()
    {
        var query = _user.Query<PaymentLogDto>()
            .Where(x => x.Amount > 100)                          // 过滤：金额 > 100
            .OrderByDescending(x => x.CreateTime)                // 排序：创建时间降序
            .Select(x => new { x.Id, x.BillNumber, x.Amount })   // 字段裁剪：仅请求 3 个字段
            .Page(1, 20);                                        // 分页：第 1 页，每页 20 条

        var result = await query.ToPageAsync();                  // 执行：返回分页结果（含 TotalCount）
    }
}
```

### 核心特征

| 特征 | 说明 |
|:--|:--|
| **类型安全** | 字段名、枚举值、类型全部由 C# 编译器检查，拼写错误在编译期暴露 |
| **LINQ 风格** | `Where` / `OrderBy` / `Select` / `Page` 链式调用 |
| **延迟执行** | 仅描述查询条件，真正的查询在 `ToListAsync()` / `ToPageAsync()` 时在服务端执行 |
| **字段级裁剪** | `Select` 投影仅请求需要的字段，减少网络带宽 |
| **服务端白名单** | 字段过滤受服务端 `FilterType.BindFieldsExplicitly()` 约束，安全可控 |

---

## 查询方法一览

| 方法 | 返回 | 说明 |
|:--|:--|:--|
| `Where(predicate)` | `QueryableBuilder<T>` | 过滤条件（可多次链式叠加，AND 语义） |
| `OrderBy/OrderByDescending(expr)` | `QueryableBuilder<T>` | 依据表达式排序 |
| `ThenBy/ThenByDescending` | `QueryableBuilder<T>` | 追加次级排序 |
| `Select(expr)` | `QueryableBuilder<T>` | 字段投影裁剪（仅请求需要的字段） |
| `Page(page, pageSize)` | `QueryableBuilder<T>` | 页码分页 |
| `ToPageAsync()` | `PageResult<T>` | 执行分页查询（含 TotalCount） |
| `ToListAsync()` | `List<T>` | 执行列表查询 |
| `SingleAsync()` | `T` | 执行单条查询 |
| `CountAsync()` | `int` | **仅计数**（V4.9.42） |
| `Clone()` | `QueryableBuilder<T>` | **克隆构建器**（V4.9.42） |
| `OrderByField(fieldName)` | `QueryableBuilder<T>` | **运行时字符串排序**（V4.9.42） |
| `Aggregate(expr)` | `QueryableBuilder<T>` | **进入聚合模式**（V4.9.53） |
| `ToAggregateAsync()` | `AggregateResponse` | **执行聚合查询**（V4.9.53） |

---

## 增强功能（V4.9.42）

### CountAsync — 仅计数，节省带宽

`CountAsync()` 编译为 `first: 1 { totalCount }`，**省略 `nodes`/`pageInfo`/`order`/`after` 字段**——只需要"有多少条"时不传输数据行。

```csharp
int total = await _user.Query<OrderDto>()
    .Where(x => x.Status == OrderStatus.Paid)
    .CountAsync();
```

### Clone — 并行查询

`Clone()` 深拷贝过滤/排序/字段/分页/游标状态，**共享 `_client`/`_user`/`_resolverField` 引用**。用于同一基查询的并行变体。

```csharp
var baseQuery = _user.Query<OrderDto>().Where(x => x.Status == OrderStatus.Paid);

// 并行：一个计数、一个分页
var totalTask  = baseQuery.Clone().CountAsync();
var pageTask   = baseQuery.Clone().OrderByDescending(x => x.CreateTime).ToPageAsync();

await Task.WhenAll(totalTask, pageTask);
```

### OrderByField / ThenByField — 运行时动态排序

排序字段名在运行时才知道（如用户点击表格列头）时使用，自动 camelCase 归一（`"CreateTime"` → `"createTime"`，`"Category.Name"` → `"category.name"`）。

```csharp
var query = _user.Query<OrderDto>()
    .OrderByField(sortField, descending: true)   // sortField = "Amount" 等运行时值
    .ThenByField("CreateTime");
```

---

## 聚合查询 VEntity（V4.9.53）

> 对应 ADR20（VEntity 聚合 GraphQL 自动生成）。SG2 为 VEntity 自动生成聚合 resolver（Hasura 风格 `{entity}_aggregate`），`QueryableBuilder` 提供 `.Aggregate()` 链。**让进程外（Wasm/TS）聚合查询与进程内对齐**。

### 用法

```csharp
// 声明聚合字段：Sum + Count + Avg
var result = await _user.Query<OrderViewDto>()
    .Where(x => x.Status == "Paid")                       // 聚合尊重过滤条件
    .Aggregate(a => a.Sum(x => x.Amount).Count().Avg(x => x.Quantity))
    .ToAggregateAsync();

result._count;    // 总数
result._sum;      // { "amount": 12345.67 }（Dictionary<string, object?>）
result._avg;      // { "quantity": 12.5 }
```

### 编译的 GraphQL

```graphql
query {
  orderView_aggregate(where: {status: {eq: "Paid"}}) {
    _count
    _sum { amount }
    _avg { quantity }
  }
}
```

### AggregateResponse

| 字段 | 类型 | 说明 |
|:--|:--|:--|
| `_count` | `int` | 记录数 |
| `_sum` / `_avg` / `_min` / `_max` | `Dictionary<string, object?>?` | 对应聚合维度（nullable，无数值字段时为空） |

> `_sum` 等用 `Dictionary<string, object?>` 而非强类型——灵活适配不同实体的数值字段名，客户端不需为每个实体定义强类型。字段名自动 camelCase（`Amount` → `amount`）。

### 服务端生成（SG2）

为每个 VEntity 自动生成：
- **聚合 resolver**：`[ExtendObjectType("Query")]` + `[GraphQLName("{entity}_aggregate")]` + `[UseFiltering(typeof(FilterType))]`
- **聚合类型**：`{Entity}Aggregate` + `{Entity}SumFields`/`AvgFields`/`MinFields`/`MaxFields`
- **数值字段提取**：仅 int/long/decimal/double/float/short/byte（含 nullable 共 14 种）；无数值字段的实体仅生成 `_count`

### 覆盖环境

| 环境 | 支持 |
|:--|:--|
| C# Wasm/Console/MAUI 客户端 | ✅ `QueryableBuilder.Aggregate()` |
| 服务端进程内 | ✅ 同 API |
| TS 前端（@tkwf/tsclient） | 🚚 已转交 ts-client 组独立迭代 |

---

## 行为补充

### 聚合查询注意事项

- 必须**先调用 `.Aggregate()`** 再 `ToAggregateAsync()`，否则抛 `InvalidOperationException`
- 聚合查询尊重既有 `Where` 过滤与 `WithArgument` 业务参数
- `Clone()` 会拷贝 `_aggregateFields`（链式调用产生的字段列表不可变）

### 服务端 vs 客户端

`User.Query<T>()` 在客户端（`DomainClientUser`）与服务端（`DomainUser`）**同名同签名，但行为不同**：

| 调用方 | 路径 |
|:--|:--|
| 客户端 | `QueryableBuilder` 将表达式树编译为 GraphQL 请求发送到服务端 |
| 服务端 | 经 EQR 直连 `IEntityReadOnlyDAC<T>` + `IGlobalQueryFilter` 策略（V4.9.40 起） |

---

## 源文档参考

| 源文档编号 | 标题 | 与本文的关系 |
|:--|:--|:--|
| G07B-QueryBuilder | Wasm客户端增强查询-QueryBuilder-使用指南 | 本文基础用法完整版参考（v2.7，1042 行） |
| G07 | 查询执行路径总览 | 三环境 × 双模式完整对比 |
| G06B | 条件表达式构建器使用指南 | 服务端业务方法内构造查询条件 |
| ADR20 | VEntity聚合GraphQL自动生成 | 聚合查询设计决策（内部 ADR） |