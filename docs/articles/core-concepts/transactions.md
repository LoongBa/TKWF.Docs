---
title: 事务管理
description: TKWF 事务管理：声明式 [Transactional] 到 ORM 无关的 ITransactionManager 抽象，Linux 兼容的事务边界
---

# 事务管理

> 事务是数据一致性的基石。TKWF 提供从声明式 `[Transactional]` 到编程式 `ITransactionManager` 的多层事务抽象，在保证原子性的同时消除跨平台兼容风险。

---

## 为什么需要事务管理

在领域驱动设计中，一个业务操作往往涉及多个写入——创建订单、扣减库存、记录日志。任何一个步骤失败，都需要回滚全部变更，否则数据处于不一致状态。

```csharp
[Transactional]
public async Task CreateOrderAsync(CreateOrderDto dto)
{
    var order = await _orderRepo.InsertAsync(orderEntity);
    await _inventoryRepo.UpdateAsync(stockEntity); // 如果这里失败，order 应回滚
    AddLocalEvent(new OrderCreatedEvent(order.Id));
}
```

### 三层事务体系

TKWF 在三个层面提供事务支持，它们可以**嵌套协作**：

| 层级 | 机制 | 定位 |
|:-----|:------|:------|
| **AOP 声明式** | `[Transactional]` + `ITransactionManager.Begin()` | 跨多个 Service 方法的复杂业务流程 |
| **DataService 内置** | `BeginTxScope()`——经 `User.GetService<ITransactionManager>()` | 单次写入操作的默认原子性保障 |
| **手动** | 注入 `ITransactionManager` | 批处理、后台作业等特殊场景 |

三层机制通过 `UnitOfWorkManager.Begin(Propagation.Required)` 协作——有外层事务则加入（`UnitOfWorkVirtual`），无则新建（`UnitOfWorkOrginal`）。无论从哪一层进入，最终都共享同一个 UoW 实例。

### 旧方案的问题

TKWF 早期使用 .NET 内置的 `System.Transactions.TransactionScope` 管理事务边界。这在 Windows 上工作正常，但在 Linux/Docker 环境下存在致命问题：

**根因**：FreeSql 不参与 `System.Transactions` 体系。经源码级验证，FreeSql 使用自有 `ConcurrentDictionary<int, Transaction2>` 管理线程局部事务，**从不调用** `Transaction.Current`、`EnlistTransaction` 或不实现 `IPromotableSinglePhaseNotification`。

**触发场景**：
1. `[Transactional]` 标记的方法执行多个 FreeSql 操作（如 `InsertAsync` + `UpdateAsync`）
2. 连接池返回**不同物理连接**（取决于池大小、时序）
3. `Microsoft.Data.SqlClient` 的 `EnlistNonNull` 自动将第二个连接登记到 ambient TransactionScope
4. 第二个 `IPromotableSinglePhaseNotification` 枚举触发**分布式事务升级（MSDTC）**
5. Linux 上没有 MSDTC 协调器 → **`PlatformNotSupportedException` 崩溃**

```csharp
// 旧方案——看似正常，实则 Linux 崩溃
using var ts = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
await fsql.Insert(entity).ExecuteAffrowsAsync();  // 连接 A
await fsql.Update(other).ExecuteAffrowsAsync();    // 连接 B → MSDTC 升级 → Linux 崩溃！
ts.Complete();
```

**V4.9.52 迁移方案**：将 `TransactionScope` 替换为 FreeSql 原生 `UnitOfWorkManager`，经 `ITransactionManager` 抽象暴露给核心层，消费层 `[Transactional]` 用法不变。

---

## 声明式事务 `[Transactional]`

### 基本用法

`[Transactional]` 是 TKWF 中最常用的事务声明方式——标注在方法上，AOP 拦截器自动在方法执行前开启事务，异常时自动回滚：

```csharp
[GenerateController]
public class OrderService(DomainUser<AppUserInfo> user) : DomainServiceBase<AppUserInfo>(user)
{
    [Transactional]
    public async Task<Order> CreateAsync(CreateOrderDto dto)
    {
        // 方法进入时已开启事务
        // 方法正常退出时自动提交
        // 方法抛出异常时自动回滚
        var order = await User.GetEntityDAC<Order>().InsertAsync(new Order
        {
            Title = dto.Title,
            UserId = User.UserId
        });
        AddLocalEvent(new OrderCreatedEvent(order.Id));
        return order;
    }
}
```

### 隔离级别

`[Transactional]` 默认使用 `IsolationLevel.Serializable`（序列化），与 .NET `TransactionScope` 的默认隔离级别一致：

```csharp
[Transactional(IsolationLevel = IsolationLevel.ReadCommitted)]
public async Task<Order> ReadCommittedExampleAsync() { ... }

[Transactional(IsolationLevel = IsolationLevel.RepeatableRead)]
public async Task<Order> RepeatableReadExampleAsync() { ... }
```

> **为什么默认 Serializable？** FreeSql 的 `UnitOfWork` 默认隔离级别为 `IsolationLevel.Unspecified`，在 SQL Server 上会降级为 `ReadCommitted`——与原 `TransactionScope` 的 `Serializable` 默认行为不一致。框架显式指定 `Serializable` 保留了旧行为的语义，防止静默回归。

### 嵌套事务

多个 `[Transactional]` 方法可嵌套调用——内层方法自动加入外层事务（`Propagation.Required` 语义），共享同一个数据库连接，一起提交或回滚：

```csharp
[Transactional]
public async Task<Order> CreateOrderAsync(CreateOrderDto dto)
{
    var order = await _orderRepo.InsertAsync(orderEntity);
    await DeductStockAsync(order); // 内层方法加入外层事务
    return order;
}

[Transactional]  // 不新建事务，加入外层
private async Task DeductStockAsync(Order order)
{
    // 与 CreateOrderAsync 在同一事务内
    await _inventoryRepo.UpdateAsync(stockEntity);
}
```

> **注意**：嵌套 `[Transactional]` 方法抛异常时，`UnitOfWorkVirtual.Rollback()` 会**立即回滚并释放连接**（vs `TransactionScope` 的延迟 abort）。如果外层方法在外层 `catch`/`finally` 块中执行数据库操作，将在无活动事务下运行——请确保异常处理不依赖活动事务。

---

## 事务抽象层

TKWF 在核心层定义了 ORM 无关的事务抽象，`_Framework` 核心项目不依赖任何具体 ORM：

### ITransactionManager

```csharp
// _Framework/Domain/Transactions/ITransactionManager.cs
public interface ITransactionManager
{
    ITransactionScope Begin(IsolationLevel isolationLevel = IsolationLevel.Serializable);
    bool IsActive { get; }
}
```

### ITransactionScope

```csharp
// _Framework/Domain/Transactions/ITransactionScope.cs
public interface ITransactionScope : IAsyncDisposable, IDisposable
{
    bool IsActive { get; }
    Task CommitAsync(CancellationToken ct = default);
    Task RollbackAsync(CancellationToken ct = default);
    void Commit();
    void Rollback();
}
```

**设计要点**：
- `IsolationLevel` 使用 `System.Data` 命名空间（BCL 内置），核心层不引用 FreeSql
- `ITransactionScope` 同时实现 `IAsyncDisposable` 和 `IDisposable`，支持 `using` 语法
- `Dispose()` 时未提交自动回滚——与 `TransactionScope` 语义一致
- `BeginAsync` 通过 DIM 默认委托同步（V4.9.54+），FreeSql 实现透明使用默认实现

---

## FreeSql 实现

`FreeSqlTransactionManager` 是 `ITransactionManager` 的 FreeSql 实现，位于 `_Domain.Infrastructure/FreeSql/` 适配层：

```csharp
// 简化示意
public sealed class FreeSqlTransactionManager(UnitOfWorkManager uowManager) : ITransactionManager
{
    public ITransactionScope Begin(IsolationLevel isolationLevel = IsolationLevel.Serializable)
    {
        var uow = uowManager.Begin(Propagation.Required, isolationLevel);
        return new FreeSqlTransactionScope(uow);
    }

    public bool IsActive => uowManager.Current?.GetOrBeginTransaction(false) != null;
}
```

`FreeSqlTransactionScope` 封装 `IUnitOfWork`，处理提交、回滚和释放的防重入逻辑：

```csharp
// 简化示意
internal sealed class FreeSqlTransactionScope(IUnitOfWork uow) : ITransactionScope
{
    private bool _committed;
    private bool _disposed;

    public bool IsActive => !_disposed && !_committed;

    public void Commit()
    {
        if (!_committed && !_disposed)
        {
            uow.Commit();
            _committed = true;
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            if (!_committed) uow.Rollback(); // 未提交 → 自动回滚
            uow.Dispose();
            _disposed = true;
        }
    }
}
```

### async 安全的设计

`UnitOfWorkManager` 的事务解析通过**实例字段**（`_allUows` List）+ **委托闭包**（`() => this.Current`），而非线程本地存储。`await` 切换线程后，委托依然指向同一个 `UnitOfWorkManager` 实例——**与线程无关，天然 async 安全**：

```csharp
// DbContextScopedFreeSql 的委托解析机制
// 每次 CRUD 操作：
// .WithTransaction(_resolveUnitOfWork?.Invoke()?.GetOrBeginTransaction())
// └─ 委托 () => this.Current → _allUows.Last() → GetOrBeginTransaction()
//    └─ 实例字段，不依赖 ThreadLocal

await SomeAsync();         // ← 切换到线程 B
fsql.Insert(entity)        // ← 委托依然指向同一个 manager 实例，正确解析！
```

### 关键约束：使用 uowManager.Orm

事务性 CRUD **必须**通过 `uowManager.Orm`（scoped `DbContextScopedFreeSql`）执行——委托解析仅在 scoped 实例上生效。裸 `IFreeSql`（Singleton）无此委托，**绝不用于事务 CRUD**：

```csharp
// ✅ 正确：通过 uowManager.Orm（委托解析绑定 UoW 事务）
await uowManager.Orm.Insert<TEntity>().AppendData(entity).ExecuteAffrowsAsync(ct);

// ❌ 错误：裸 IFreeSql（Singleton）无委托解析，autocommit 不参与 UoW
// 即使外层有事务，此操作也会立即持久化，破坏原子性
await _fsql.Insert<TEntity>().AppendData(entity).ExecuteAffrowsAsync(ct);
```

### DI 注册

```csharp
// 适配层注册
services.AddScoped<UnitOfWorkManager>();
services.AddScoped<ITransactionManager, FreeSqlTransactionManager>();
```

`IFreeSql` 保持 Singleton 注册（仅用于 Schema/CodeFirst），`UnitOfWorkManager` 和 `ITransactionManager` 为 Scoped 注册。

---

## DataService 自动事务

`DomainDataServiceBase` 的 CRUD 方法内建事务包裹——即使在非 `[Transactional]` 路径下（如后台作业），每次写入操作也会自动开启事务：

```csharp
public abstract class DomainDataServiceBase<TDto, TEntity> : ...
{
    // 每个 CRUD 方法自动调用 BeginTxScope()
    public async Task<TDto> CreateAsync(TDto dto, CancellationToken ct = default)
    {
        using var tx = BeginTxScope();  // 自动开启事务
        // ... 业务逻辑
        if (tx?.IsActive == true)
            await tx.CommitAsync();
        return result;
    }
}
```

`BeginTxScope()` 内部通过 `User.GetService<ITransactionManager>()` 获取事务管理器。当 `ITransactionManager` 未注册时（如 InMemory DAC 测试场景），返回 `null`，跳过事务包裹——**安全降级，无需修改测试代码**：

```csharp
// 简化示意
protected ITransactionScope? BeginTxScope()
{
    var txManager = User.GetService<ITransactionManager>();
    return txManager?.Begin(IsolationLevel.Serializable);
}
```

---

## 自定义事务作用域

### 推荐方式：注入 ITransactionManager

在需要手动管理事务边界的场景（如批处理、后台作业），直接注入 `ITransactionManager` 使用：

```csharp
public class BatchJob(ITransactionManager txManager)
{
    public async Task ExecuteAsync()
    {
        using var tx = txManager.Begin();
        try
        {
            // 手动控制事务的写入操作
            await DoWritesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
```

### 旧方式：DomainUser.BeginTransaction()（已废弃）

`DomainUser.BeginTransaction()` 已标记 `[Obsolete]`，委托给 `ITransactionManager`：

```csharp
// 旧方式——仍然可用，但 IDE 会提示警告
using var tx = User.BeginTransaction();

// 推荐方式——注入 ITransactionManager
using var tx = _txManager.Begin();
```

---

## 兼容性说明

### 消费层零改动

`[Transactional]` 的使用方式**完全不变**——无参调用 `[Transactional]` 默认 `Serializable`，与旧 `TransactionScope` 行为一致：

```csharp
// V4.9.52 之前——使用 TransactionScope
[Transactional]
public async Task FooAsync() { ... }

// V4.9.52 之后——使用 ITransactionManager（代码不变）
[Transactional]
public async Task FooAsync() { ... }
```

### Linux 兼容

`ITransactionManager` + `UnitOfWorkManager` 方案不依赖 `System.Transactions`，**不再触发 MSDTC 升级**，在 Linux/Docker 容器中运行稳定。

### 迁移收益

| 维度 | 旧方案 | 新方案 |
|:-----|:-------|:-------|
| 底层机制 | `TransactionScope` + SqlClient 自动登记 | `UnitOfWorkManager` 委托解析 |
| Linux 兼容 | ❌ 多连接 MSDTC 崩溃 | ✅ 原生支持 |
| async 安全 | `AsyncLocal` 传播 | 实例字段 + 委托闭包 |
| 消费层 API | `[Transactional]` | `[Transactional]`（不变） |
| 默认隔离级别 | `Serializable` | `Serializable`（显式指定） |
| ORM 耦合 | 核心层引用 `System.Transactions` | 核心层纯抽象，ORM 实现解耦 |
| 测试友好 | 需 Mock TransactionScope | 未注册 `ITransactionManager` 时自动跳过 |

---

## 源文档参考

| 文档 | 说明 |
|:-----|:------|
| [D06-领域数据服务与数据存取设计](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D06-领域数据服务与数据存取设计.md) §3 | 事务架构设计（v1.4，ITransactionManager 抽象） |
| [ADR26-UoW事务迁移](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR26-UoW事务迁移.md) | 架构决策记录：TransactionScope → FreeSql UnitOfWorkManager |
| [G06-领域数据服务与数据存取使用指南](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G06-领域数据服务与数据存取使用指南.md) | 注册配置、事务操作、最佳实践 |