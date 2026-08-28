---
title: 为什么领域自治（vs DI 容器）
description: 深度理解 TKWF 为什么选择 DomainUser 自持实例化而非传统 DI 容器，领域自治的设计原理与收益
---
# 为什么领域自治（vs DI 容器）

> 源文档：D00-白皮书 · D00-设计方案 · V4.9.10

---

## 一句话总结

TKWF 选择 **DomainUser 自持实例化**（通过 `Use<T>()`）而非传统 DI 容器直接解析——这不是"重新发明 DI"，而是**在 DI 之上构建领域执行上下文**，让 AOP 拦截器、事务、审计、权限等横切关注点在领域层自动生效。

---

## 传统 DI 容器的问题

### 典型 DI 用法

```csharp
// 传统 DI：从容器直接解析服务
public class OrderService
{
    private readonly IRepository<Order> _repo;
    private readonly IAuditLogger _audit;

    public OrderService(IRepository<Order> repo, IAuditLogger audit)
    {
        _repo = repo;
        _audit = audit;
    }

    public async Task CreateOrderAsync(OrderDto dto)
    {
        var order = new Order { /* ... */ };
        await _repo.InsertAsync(order);
        await _audit.LogAsync("Order created", order.Id);  // 手动审计
    }
}
```

### 问题

| 问题 | 说明 |
|:--|:--|
| **横切关注点泄露** | 审计、权限、事务等逻辑混入业务代码 |
| **AOP 不生效** | 直接 `new` 或从 DI 解析的服务，AOP 拦截器不生效 |
| **用户上下文丢失** | 无法知道"谁在执行这个操作" |
| **事务边界模糊** | 手动管理事务，容易遗漏或嵌套错误 |

---

## TKWF 的解法：DomainUser + Use\<T\>()

### 核心设计

```csharp
public class OrderService : DomainServiceBase<DmpUserInfo>
{
    public OrderService(DomainUser<DmpUserInfo> user) : base(user) { }

    public async Task CreateOrderAsync(OrderDto dto)
    {
        // 通过 User.Use<T>() 获取服务（AOP 生效）
        var repo = User.Use<Repository<Order>>();
        var audit = User.Use<IAuditLogger>();

        var order = new Order { /* ... */ };
        await repo.InsertAsync(order);
        await audit.LogAsync("Order created", order.Id);  // 自动审计
    }
}
```

### Use\<T\>() 做了什么

```
User.Use<T>()
  ↓
1. 从当前作用域解析 T（DI 容器）
  ↓
2. 检查 T 是否有 AOP 标记（[Transactional] / [AuthorityFilter] 等）
  ↓
3. 如果有 → 返回 Decorator（拦截器包裹）
  ↓
4. 如果没有 → 返回原始实例
  ↓
5. 绑定到当前 DomainUser 上下文（AsyncLocal）
```

**关键区别**：
- 传统 DI：`services.GetRequiredService<T>()` → 直接返回实例，AOP 不生效
- TKWF：`User.Use<T>()` → 返回 Decorator，AOP 自动生效

---

## 三层架构对比

### 传统三层架构

```
┌─────────────────────────────────────────┐
│ 表现层（Controller）                      │
│  ↓ 直接从 DI 解析领域服务                  │
├─────────────────────────────────────────┤
│ 领域层（Service）                         │
│  ↓ 手动管理审计/权限/事务                  │
├─────────────────────────────────────────┤
│ 基础设施层（Repository）                  │
│  → ORM / 数据库                          │
└─────────────────────────────────────────┘
```

**问题**：领域层直接依赖基础设施，横切关注点混入业务逻辑。

### TKWF 领域自治架构

```
┌─────────────────────────────────────────┐
│ 表现层（Controller）                      │
│  ↓ User.Use<T>()（AOP 生效）             │
├─────────────────────────────────────────┤
│ AOP 拦截器层（编译期生成）                 │
│  ↓ 事务 / 权限 / 审计 / 日志             │
├─────────────────────────────────────────┤
│ 领域层（Service）                         │
│  ↓ 只关注业务逻辑                         │
├─────────────────────────────────────────┤
│ 抽象层（IEntityDAC / IRepository）       │
│  → ORM 无关                             │
└─────────────────────────────────────────┘
```

**优势**：
- 领域层**零横切关注点**（审计/权限/事务由 AOP 自动处理）
- AOP **编译期生成**（不是运行时动态代理）
- 用户上下文**自动传播**（AsyncLocal）

---

## 领域自治的收益

### 1. 业务代码纯净

```csharp
// TKWF：业务代码只关心业务逻辑
public async Task TransferFundsAsync(Account from, Account to, decimal amount)
{
    from.Balance -= amount;
    to.Balance += amount;
    // 事务、审计、权限 → AOP 自动处理
}

// 传统：业务代码混入横切关注点
public async Task TransferFundsAsync(Account from, Account to, decimal amount)
{
    using var tx = _txManager.Begin();  // 手动事务
    try
    {
        from.Balance -= amount;
        to.Balance += amount;
        await _audit.LogAsync("Transfer", from.Id, to.Id, amount);  // 手动审计
        await _repo.UpdateAsync(from);
        await _repo.UpdateAsync(to);
        tx.Commit();
    }
    catch { tx.Rollback(); throw; }
}
```

### 2. AOP 编译期生成

```csharp
// SG1 编译期生成 Decorator（不是运行时反射）
[Transactional]  // 标记
public async Task TransferFundsAsync(...) { /* ... */ }

// SG1 生成：
public class OrderServiceDecorator : IOrderService
{
    private readonly OrderService _inner;
    private readonly ITransactionManager _tx;

    public async Task TransferFundsAsync(...)
    {
        using var scope = _tx.Begin();
        await _inner.TransferFundsAsync(...);
        scope.Commit();
    }
}
```

### 3. 用户上下文自动传播

```csharp
public async Task ProcessOrderAsync(long orderId)
{
    // DomainUser 自动传播到下游调用
    var order = await orderService.EntityGetAsync(orderId);
    await inventoryService.ReserveStockAsync(order.Items);  // 自动继承用户上下文
    await paymentService.ChargeAsync(order.TotalAmount);    // 自动继承用户上下文
    // 审计日志自动记录"谁执行了什么操作"
}
```

---

## 与传统 DI 的关系

TKWF **不替代 DI 容器**，而是在 DI 之上构建领域执行上下文：

```
DI 容器（Microsoft.Extensions.DependencyInjection）
  ↓ 提供基础服务解析
DomainUser + Use<T>()
  ↓ 在 DI 之上构建领域上下文
AOP 拦截器（编译期生成）
  ↓ 自动处理横切关注点
领域服务（纯净业务逻辑）
```

**本质**：TKWF 的 `Use<T>()` 是 DI 容器的**领域层包装**，不是替代品。

---

## 进一步阅读

- [DomainUser 运行时上下文](../tutorials/60-min-advanced-part1.md) — Use\<T\>() 详解
- [AOP 为什么编译期生成](./aop-by-design.md) — 编译期 vs 运行时 AOP 对比
- [SystemActor 系统角色解析](./system-actor-explained.md) — 无人类用户的领域操作
