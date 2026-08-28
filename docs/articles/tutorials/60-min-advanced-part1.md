---
title: 60 分钟进阶：完整业务系统（上）
description: 60 分钟进阶教程：构建订单系统，学习 DomainUser 运行时上下文、AOP 事务拦截与多 Service 协作
---
# 60 分钟进阶：完整业务系统（上）

> 源文档：[D01](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D01-Domain%E8%BF%90%E8%A1%8C%E6%97%B6%E4%B8%8A%E4%B8%8B%E6%96%87.md) · [D04](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D03-AOP%E6%8B%A6%E6%88%AA%E4%B8%8E%E4%BA%8B%E5%8A%A1%E4%B8%8E%E9%AA%8C%E8%AF%81.md) · [D05](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D05-%E5%A4%9A%E5%BD%A2%E6%80%81%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%9B%86%E6%88%90%E6%9E%B6%E6%9E%84.md) · V4.9.10

---

## 本节目标

构建一个订单系统，深入理解 TKWF 的三大核心概念：DomainUser 运行时上下文、AOP 事务拦截、多 Service 协作。完成后你将具备设计复杂业务系统的能力。

---

## 前置知识

- 完成 [30 分钟实战系列](./30-min-todo-part1.md)（Entity / DataService / 认证授权 / 多协议暴露）
- 理解 DI 容器基本用法

---

## Step 1：DomainUser 运行时上下文（15 分钟）

### 1.1 DomainUser 是什么

`DomainUser<TUserInfo>` 是领域自治的核心执行单元——它**不注册到 DI 容器**，而是通过 `AsyncLocal<IServiceProvider?>` 在执行流中流转，确保服务实例始终与当前用户绑定。

```
用户请求进入
  → ContextExtractionMiddleware 提取 SessionKey
  → BeginSessionScopeAsync() 创建作用域
  → BindScope() 绑定 AsyncLocal
  → GetOrRestoreUserAsync() 恢复/创建 DomainUser
  → 业务代码通过 User.Use<T>() 获取服务
```

### 1.2 Use\<T\>() 显式注入

`User.Use<T>()` 是获取领域服务的唯一正确入口——它控制 AOP 拦截器的激活和作用域绑定：

```csharp
public class OrderService : DomainServiceBase<DmpUserInfo>
{
    public OrderService(DomainUser<DmpUserInfo> user) : base(user) { }

    public async Task CreateOrderAsync(OrderDto dto)
    {
        // 正确：通过 User.Use<T>() 获取服务（AOP 生效）
        var memberSvc = User.Use<MemberService>();
        var member = await memberSvc.EntityGetAsync(dto.MemberId);

        // 错误：直接 new 或从 DI 解析（AOP 不生效）
        // var wrong = new MemberService(...);
    }
}
```

### 1.3 运行时上下文透传

DomainUser 通过 `AsyncLocal` 自动在异步调用链中传播：

```csharp
public async Task ProcessOrderAsync(long orderId)
{
    // DomainUser 自动传播到下游调用
    var order = await orderService.EntityGetAsync(orderId);
    await inventoryService.ReserveStockAsync(order.Items);  // 自动继承用户上下文
    await paymentService.ChargeAsync(order.TotalAmount);    // 自动继承用户上下文
}
```

### 1.4 系统角色（SystemActor）

无人类用户的操作（后台 Job、OAuth 回调、健康检查）通过 `BeginSystemScopeAsync` 创建系统作用域：

```csharp
// 后台 Job 中
await domainHost.BeginSystemScopeAsync(async scope =>
{
    // scope.System 表示系统身份
    // 领域服务可用，审计写 ActorType=System
    await orderService.ReconcileOrdersAsync();
});
```

> 详细设计见 [SystemActor 系统角色解析](../explanation/system-actor-explained.md)

---

## Step 2：AOP 事务拦截（15 分钟）

### 2.1 编译期 AOP 原理

TKWF 使用 **Source Generator（SG）在编译期生成 AOP 代码**——不是运行时动态代理。SG1 扫描 `[Transactional]` / `[AuthorityFilter]` 等标记，生成装饰器类（Decorator），在运行时拦截方法调用。

```
编译期：
  SG1 扫描标记 → 生成 Decorator 类（事务/权限/日志拦截）
  → 注册到 DI 容器

运行时：
  请求进入 → DI 解析 Decorator → 执行拦截逻辑 → 调用真实方法
```

### 2.2 三层事务体系

| 层级 | 机制 | 适用场景 | 嵌套行为 |
|:--|:--|:--|:--|
| **AOP 声明式** | `[Transactional]` | 跨多个 Service 方法的复杂流程 | `Propagation.Required`：有外层则加入 |
| **DataService 内置** | `BeginTxScopeAsync()` | 单次写入的原子性保障 | 自动嵌套 |
| **手动** | `ITransactionManager` | 批处理等特殊场景 | 显式控制 |

```csharp
// AOP 声明式事务
[Transactional]
public async Task TransferFundsAsync(long fromId, long toId, decimal amount)
{
    // 以下所有操作在同一个事务内
    await accountService.DebitAsync(fromId, amount);
    await accountService.CreditAsync(toId, amount);
    await ledgerService.RecordAsync(fromId, toId, amount);
    // 成功 → 自动提交；异常 → 自动回滚
}
```

### 2.3 AuthorityFilter 权限拦截

```csharp
// 全局注册
services.AddGlobalFilter<AuthorityFilterAttribute<DmpUserInfo>>();

// 控制器级
[AuthorityFilter]
public class OrderController : DomainControllerBase<DmpUserInfo>(User)
{
    [RequireRoleFlag("Admin", "Finance", Match = MultiRoleMatch.Any)]
    public async Task RefundAsync(long orderId) { /* ... */ }
}
```

---

## Step 3：多 Service 协作（20 分钟）

### 3.1 Service 依赖注入模式

TKWF 中 Service 之间通过构造函数注入协作：

```csharp
public class OrderService : DomainServiceBase<DmpUserInfo>
{
    private readonly MemberService _memberSvc;
    private readonly InventoryService _inventorySvc;

    public OrderService(
        DomainUser<DmpUserInfo> user,
        MemberService memberSvc,
        InventoryService inventorySvc)
        : base(user)
    {
        _memberSvc = memberSvc;
        _inventorySvc = inventorySvc;
    }

    public async Task CreateOrderAsync(CreateOrderDto dto)
    {
        // 1. 验证会员
        var member = await _memberSvc.EntityGetAsync(dto.MemberId)
            ?? throw new DomainException("会员不存在");

        // 2. 检查库存
        var available = await _inventorySvc.CheckStockAsync(dto.ProductId, dto.Quantity);
        if (!available) throw new DomainException("库存不足");

        // 3. 创建订单
        var order = new Order
        {
            MemberId = dto.MemberId,
            ProductId = dto.ProductId,
            Quantity = dto.Quantity,
            TotalAmount = dto.Quantity * dto.UnitPrice
        };
        await EntityAddAsync(order);

        // 4. 扣减库存
        await _inventorySvc.ReserveStockAsync(dto.ProductId, dto.Quantity);
    }
}
```

### 3.2 跨 Service 事务

```csharp
[Transactional]  // 所有 Service 调用在同一个事务内
public async Task CompleteOrderAsync(long orderId)
{
    var order = await EntityGetAsync(orderId);

    // 跨 Service 调用——事务自动加入
    await paymentService.ChargeAsync(order.MemberId, order.TotalAmount);
    await inventoryService.ConfirmStockAsync(order.ProductId, order.Quantity);
    await notificationService.SendOrderCompleteAsync(order.MemberId, orderId);

    // 更新订单状态
    order.Status = OrderStatus.Completed;
    await EntityUpdateAsync(order);
}
```

### 3.3 错误处理与回滚

```csharp
[Transactional]
public async Task BatchProcessAsync(List<OrderDto> orders)
{
    foreach (var dto in orders)
    {
        try
        {
            await CreateOrderAsync(dto);
        }
        catch (DomainException ex)
        {
            // 单条失败不影响其他——但事务会回滚整个批次
            Logger.LogWarning("Order failed: {Message}", ex.Message);
            throw;  // 抛出 → 事务回滚
        }
    }
}
```

---

## 下一步

- [60 分钟进阶 Part 2：SystemActor + Conditions Builder + QueryBuilder](./60-min-advanced-part2.md)
- [全局过滤器体系](../core-concepts/filters.md) — FilterTier / AuthorityFilter / EntityHistoryFilter
- [事务管理](../core-concepts/transactions.md) — ITransactionManager / 三层事务体系
