---
title: 60 分钟进阶：完整业务系统（下）
description: 60 分钟进阶教程：SystemActor 系统角色、条件表达式构建器与增强查询 QueryBuilder
---
# 60 分钟进阶：完整业务系统（下）

> 源文档：[D11](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D11-%E7%B3%BB%E7%BB%9F%E8%A7%92%E8%89%B2-SystemActor-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) · [G06B](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G06B-%E6%9D%A1%E4%BB%B6%E8%A1%A8%E8%BE%BE%E5%BC%8F%E6%9E%84%E5%BB%BA%E5%99%A8%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · [G07B-Query](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G07B-RPC-%E8%BF%9C%E7%A8%8B%E8%BF%87%E7%A8%8B%E8%B0%83%E7%94%A8-Wasm%E5%AE%A2%E6%88%B7%E7%AB%AF%E5%A2%9E%E5%BC%BA%E6%9F%A5%E8%AF%A2-QueryBuilder-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · V4.9.41

---

## 本节目标

在 Part 1 的订单系统基础上，掌握三个进阶能力：SystemActor 无人操作、Conditions Builder 动态查询、QueryBuilder 客户端远程查询。

---

## Step 1：SystemActor 系统角色（15 分钟）

### 1.1 问题：无人类用户的领域操作

订单系统中常见"无人类用户"场景：
- **后台对账**：定时任务扫描未结算订单
- **OAuth 回调**：外部支付平台通知支付结果
- **健康检查**：探针定期检测服务状态

这些场景的共同特征：**有操作需要执行，但没有人类用户在操作**。

### 1.2 TKWF 的解法：系统身份

TKWF 选择"非空上下文 + 系统身份"——`DomainUser` 永远不为 null，系统身份是独立概念（service account），不与人类用户混用。

```csharp
// 后台 Job 中
await domainHost.BeginSystemScopeAsync(async scope =>
{
    // scope.System = true（系统身份）
    // 审计写 ActorType=System, ActorId="BackgroundJob"

    var orderService = scope.ServiceProvider.GetRequiredService<OrderService>();
    await orderService.ReconcileUnsettledOrdersAsync();
});
```

### 1.3 审计区分

系统操作与人类操作在审计日志中自动区分：

| 操作者 | ActorType | ActorId | 审计行为 |
|:--|:--|:--|:--|
| 人类用户张三 | `User` | `"zhangsan"` | 记录完整审计 |
| 后台 Job | `System` | `"BackgroundJob"` | 记录审计（可选） |
| 健康检查 | `None` | — | `[NoAuditFlag]` 跳过审计 |

### 1.4 健康检查：跳过审计

```csharp
[NoAuditFlag]  // 跳过 IEntityAuditable 字段，IEntityActorAuditable 始终写入
public async Task HealthCheckAsync()
{
    // 高频探针不污染审计日志
    _ = await _dac.CountAsync(_dac.Query.Where(e => e.Id > 0));
}
```

### 1.5 权限最小化

系统身份**不继承人类角色**，敏感操作需显式标注：

```csharp
[DenySystemActor]  // 禁止系统身份调用（V4.9.10）
public async Task SensitiveOperationAsync() { /* ... */ }
```

---

## Step 2：Conditions Builder 动态查询（20 分钟）

### 2.1 三种使用方式

Conditions Builder 提供三种构建动态查询条件的方式：

```csharp
// 方式 A：单条件
var predicate = Entity.Conditions.ByMemberId(123);

// 方式 B：组合条件
var predicate = Entity.Conditions.ByMemberId(123)
    .And(Entity.Conditions.ByStatus(1));

// 方式 C：链式（推荐）
await svc.GetAsync(
    Entity.Where.ByMemberId(123).ByStatus(1), ...);
```

### 2.2 动态查询拼接

实际业务中，查询条件往往是动态的（用户输入可选）：

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

### 2.3 OR 分支

```csharp
// 查询"张三的订单"或"金额大于1万的订单"
var query = Entity.Where
    .ByMemberName("张三")
    .Or(b => b.ByTotalAmountRange(10000, null));

var results = await orderService.SelectAsync(query);
```

### 2.4 与 IQueryable 组合

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

## Step 3：QueryBuilder 客户端远程查询（15 分钟）

### 3.1 User.Query\<T\>() 入口

`User.Query<T>()` 是客户端（Blazor WASM / MAUI）的类型安全查询入口——纯 C# Lambda 表达式自动翻译为 GraphQL 请求：

```csharp
// Blazor WASM 客户端
public class OrderListPage
{
    private DomainClientUser _user;

    public async Task LoadDataAsync()
    {
        var result = await _user.Query<OrderDto>()
            .Where(x => x.Status == OrderStatus.Pending)
            .OrderByDescending(x => x.CreateTime)
            .Select(x => new { x.Id, x.OrderNo, x.TotalAmount })
            .Page(1, 20)
            .ToPageAsync();

        // result.Items — 当前页数据
        // result.TotalCount — 总记录数
    }
}
```

### 3.2 与直接调用 Service 的区别

| 调用方式 | 适用场景 | 特点 |
|:--|:--|:--|
| `User.Use<TService>()` | 服务端域内调用 | 直接执行，无网络开销 |
| `User.Use<IController>()` | 跨进程 RPC 调用 | 完整契约调用 |
| `User.Query<T>()`（客户端） | 远程复杂查询 | 组合过滤/排序/分页，自动生成 GraphQL |
| `User.Query<T>()`（服务端） | 域内直接查询 | 经 EQR 直连 IEntityReadOnlyDAC |

### 3.3 字段裁剪（Select 投影）

```csharp
// 只请求需要的字段——减少网络带宽
var result = await _user.Query<OrderDto>()
    .Select(x => new { x.Id, x.OrderNo })  // 仅 2 个字段
    .Page(1, 10)
    .ToPageAsync();
```

### 3.4 实体连接查询（V4.9.35+）

对于启用了 `IsGraphQLQueryable` 的实体，`User.Query<T>()` 自动映射到实体连接查询：

```csharp
// 查询 Order 实体连接（HC 标准 Connection 类型）
var result = await _user.Query<Order>()
    .Where(x => x.Status == OrderStatus.Pending)
    .Page(1, 20)
    .ToPageAsync();

// 返回 OrderConnection
result.Items        // Order[] — 当前页数据
result.TotalCount   // int — 总记录数
```

---

## 完整架构图

```
┌─────────────────────────────────────────────────────────┐
│                    客户端（Blazor WASM）                   │
│                                                          │
│  User.Query<Order>().Where(...).Page(1,20)              │
│       ↓ GraphQL 表达式树编译                              │
│  HTTP POST /graphql                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│                    服务端（WebApi）                        │
│                                                          │
│  ContextExtractionMiddleware → SessionKey 提取           │
│       ↓                                                  │
│  BeginSessionScopeAsync → DomainUser 绑定                │
│       ↓                                                  │
│  SG2 GraphQL Resolver → EQR → IEntityReadOnlyDAC         │
│       ↓                                                  │
│  OrderService → User.Use<InventoryService>()             │
│       ↓                                                  │
│  IEntityDAC<Order> → FreeSql → PostgreSQL               │
│                                                          │
│  [Transactional] AOP 拦截 → 事务管理                      │
│  [AuthorityFilter] 权限检查                                │
│  [EntityHistoryFilter] 审计日志                            │
└─────────────────────────────────────────────────────────┘
```

---

## 进一步阅读

- [SystemActor 系统角色解析](../explanation/system-actor-explained.md) — 设计原理与多模型评审综述
- [条件表达式构建器](../advanced/conditions-builder.md) — Conditions Builder 完整 API 参考
- [增强查询 QueryBuilder](../advanced/query-guide.md) — User.Query\<T\>() 完整指南
- [为什么领域自治](../explanation/why-domain-autonomy.md) — DomainUser 设计原理
