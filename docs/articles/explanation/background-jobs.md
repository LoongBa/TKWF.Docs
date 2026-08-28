---
title: 后台作业
description: TKWF 后台作业：IBackgroundJobManager、[BackgroundJob] 特性、SystemActor 自动绑定、租户上下文恢复
---

# 后台作业

> TKWF 提供框架级后台作业基础设施，替代各宿主自行集成 Hangfire 的现状。
> 设计依据：[ADR23](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR23-后台作业基础设施.md) · D15 §5.4 · G15 §4.6/5.2 · V4.9.64-66

---

## 为什么需要框架级后台作业

传统 .NET 应用中，后台作业通常由各团队自行集成 Hangfire/Quartz，导致：
- 重复造轮子（队列、重试、监控、租户隔离）
- 与框架的 SystemActor/租户/事件机制不兼容
- 测试困难（无统一抽象）

TKWF 提供框架级抽象：**`IBackgroundJobManager` + `[BackgroundJob]` 特性**，统一接入、自动注册、内置 SystemActor/租户/事件派发支持。

---

## 核心 API

### IBackgroundJobManager

```csharp
public interface IBackgroundJobManager
{
    /// <summary>
    /// 入队作业（支持延迟执行 + 租户上下文）
    /// </summary>
    Task<string> EnqueueAsync<TJob>(object? args = null, TimeSpan? delay = null, long? tenantId = null)
        where TJob : IBackgroundJob;

    /// <summary>
    /// 立即执行（不经过队列，适合测试）
    /// </summary>
    Task ExecuteAsync<TJob>(object? args = null, CancellationToken ct = default)
        where TJob : IBackgroundJob;
}
```

### IBackgroundJob

```csharp
public interface IBackgroundJob
{
    Task ExecuteAsync(object? args, CancellationToken ct = default);
}
```

### [BackgroundJob] 特性

```csharp
[AttributeUsage(AttributeTargets.Class)]
public class BackgroundJobAttribute : Attribute
{
    public string DisplayName { get; set; }
}
```

> **SG 自动注册**：标注 `[BackgroundJob]` 的类在编译期被 SG 扫描，自动 `AddTransient<IBackgroundJob, TJob>()` 注册到 DI 容器。
> V4.9.70+ ADR35：未注册 `IBackgroundJobManager` 时生成 Warning 级门控警告。

---

## 快速开始

### 1. 定义作业

```csharp
[BackgroundJob(DisplayName = "取消过期订单")]
public class CancelExpiredOrdersJob : IBackgroundJob
{
    private readonly IOrderService _orderService;

    public CancelExpiredOrdersJob(IOrderService orderService) => _orderService = orderService;

    public async Task ExecuteAsync(object? args, CancellationToken ct)
    {
        var orderId = (long)(args ?? throw new ArgumentNullException(nameof(args)));
        await _orderService.CancelExpiredAsync(ct);
    }
}
```

### 2. 注册（零配置，SG 自动）

```csharp
// DomainInitializer - 自动扫描 [BackgroundJob] 注册 DI
protected override void Initialize(FilterBuilder<MyUserInfo> filters)
{
    filters
        .AddAuthority()
        .AddEventDispatch()           // 事件派发（作业内发事件需开启）
        .AddTransactional();           // 事务
}
```

> 无需手动 `services.AddTransient<CancelExpiredOrdersJob>()`，SG 编译期扫描 `[BackgroundJob]` 自动注册。

### 3. 入队执行

```csharp
public class OrderService : DomainDataServiceBase<MyUserInfo>
{
    private readonly IBackgroundJobManager _jobManager;

    public OrderService(IBackgroundJobManager jobManager, ...) 
        => _jobManager = jobManager;

    public async Task CreateAsync(OrderDto dto)
    {
        var order = await CreateOrderInternal(dto);
        
        // 30 分钟后检查是否支付，未支付则取消
        await _jobManager.EnqueueAsync<CancelExpiredOrdersJob>(order.Id, delay: TimeSpan.FromMinutes(30));
    }
}
```

| 参数 | 说明 |
|:--|:--|
| `args` | 作业参数（反序列化为 `TJob.ExecuteAsync` 的 `args`） |
| `delay` | 延迟执行时间（默认立即） |
| `tenantId` | V4.9.66+ 租户上下文（执行时自动恢复） |

---

## 执行语义与架构

### 执行模型

```
A[EnqueueAsync] --> B[DefaultBackgroundJobManager]
B --> C{延迟?}
C -- 是 --> D[Task.Delay]
C -- 否 --> E[创建 Scope]
E --> F[SystemActor 自动绑定]
F --> G[租户上下文恢复 ITenantScopeRestorer]
G --> H[ExecuteAsync 执行]
H --> G1[事件派发：非 AOP 路径立即派发]
```

### 核心特性

| 特性 | 说明 |
|:--|:--|
| **SystemActor 自动绑定** | `BeginSystemScopeAsync` 零配置，退出时清理 AsyncLocal 防泄漏 |
| **租户上下文恢复** | `EnqueueAsync(..., tenantId)` → 执行时 `ITenantScopeRestorer.BeginTenantScopeAsync` 恢复租户上下文 |
| **事件派发** | 非 AOP 路径（`AopContextAccessor.Current == null`）→ `PublishAsync` 立即派发；需事务一致请标 `[Transactional]` |
| **AsyncLocal 隔离** | 作业执行结束必须清理 AsyncLocal（防线程池复用串号）——框架自动清理 |

---

## API 参考

### IBackgroundJobManager

| 方法 | 说明 |
|:--|:--|
| `EnqueueAsync<TJob>(args, delay?, tenantId?)` | 入队作业，返回作业 ID；支持延迟 + 租户上下文 |
| `ExecuteAsync<TJob>(args, ct)` | 立即执行（不经队列，适合测试） |

### IBackgroundJob

| 方法 | 说明 |
|:--|:--|
| `ExecuteAsync(args, ct)` | 作业执行入口，`args` 为入队时传入的参数 |

### [BackgroundJob] 特性

| 属性 | 说明 |
|:--|:--|
| `DisplayName` | 作业显示名称（用于日志/监控） |

### 扩展点

| 扩展点 | 说明 |
|:--|:--|
| `IBackgroundJobManager` | 可替换实现（Hangfire/Quartz Provider） |
| `ITenantScopeRestorer` | 租户上下文恢复策略（默认 `TenantScopeRestorer`） |
| `IEventDispatchDiagnostics` | 事件派发诊断（handler 耗时/异常记录） |

---

## 与事件机制协作

### 作业内派发事件

```csharp
[BackgroundJob("sync-inventory")]
public class SyncInventoryJob : IBackgroundJob
{
    private readonly ILocalEventBus _eventBus;

    public async Task ExecuteAsync(object? args, CancellationToken ct)
    {
        var result = await _inventoryService.SyncAsync(ct);
        
        // 非 AOP 路径 → 立即派发（非 AOP 路径无事务边界）
        await _eventBus.PublishAsync(new InventorySyncedEvent { ... });
        
        // 如需事务一致，标注 [Transactional]（作业方法标注）
    }
}
```

| 场景 | API | 行为 |
|:--|:--|:--|
| 需要事务一致 | `[Transactional]` + `PublishAsync` | AOP 管线 post-commit 派发 |
| 无需事务 / 后台作业 | `PublishAsync` / `PostAsync` | 非 AOP 路径，立即派发 |
| 火并忘记 | `PostAsync` | 绕过 Bag，异常不传播，Task 永远 RanToCompletion |

> `PostAsync` = Fire-and-forget（绕过 Bag，异常不传播，Task 永远 RanToCompletion）。

---

## Provider 扩展（规划）

| Provider | 状态 | 说明 |
|:--|:--|:--|
| `DefaultBackgroundJobManager` | ✅ 已实现 | 进程内立即执行（`Task.Delay` 模拟延迟） |
| `HangfireBackgroundJobManager` | 📋 规划中 | Hangfire 持久化队列 + Dashboard |
| `QuartzBackgroundJobManager` | 📋 规划中 | Quartz 分布式调度 |

> 当前 `DefaultBackgroundJobManager` 为**进程内立即执行**（`Task.Delay` 模拟延迟），不持久化。`JobRecord`（`IDomainEntity` 持久化实体）**已定义未接入**——W9 持久化队列为未来项。

---

## 适用 / 不适用场景

| ✅ 适用 | ❌ 不适用 |
|:--|:--|
| 定时任务（定时清理、报表生成） | HTTP 请求内异步操作（AOP 已覆盖） |
| MQ 消费者（配合 `IBackgroundJobManager.EnqueueAsync`） | 用户交互式操作（需用户身份） |
| 异步长任务（数据迁移、批量处理） | 事件溯源（用 Outbox/Inbox） |
| 异步长任务（数据迁移、批量处理） | 需用户身份的交互操作 |

---

## 最佳实践

| 实践 | 说明 |
|:--|:--|
| 作业参数只传基元类型/DTO | 避免循环引用，序列化安全 |
| 延迟执行用 `delay` | 避免阻塞线程 |
| 租户隔离用 `tenantId` | 多租户场景必须显式传递 |
| handler 异常 try-catch | handler 异常框架吞掉，建议内部 try-catch + log |
| 测试用 `ExecuteAsync` | 绕过队列，直接验证业务逻辑 |

---

## 现状边界（必须知晓）

| 能力 | 状态 | 说明 |
|:--|:--|:--|
| 接口/特性/SG注册 | ✅ 完成 | V4.9.64 ADR23 |
| SystemActor 自动绑定 | ✅ | `BeginSystemScopeAsync` 零配置 |
| 租户上下文恢复 | ✅ | `tenantId` 参数 + `ITenantScopeRestorer` |
| 事件派发（非 AOP） | ✅ | 立即派发，`[Transactional]` 可切换事务 |
| JobRecord 持久化 | 📋 规划 | W9 待接线，当前 `EnqueueAsync` 立即执行 |
| 持久化队列 | 📋 规划 | W9 JobRecord + Hangfire/Quartz Provider |
| Hangfire Provider | 📋 规划 | V5.0+ 规划 |

> ⚠️ **边界提示**：当前 `EnqueueAsync` 为**进程内立即执行**（`Task.Delay` 模拟延迟），重启丢失。生产环境关键任务建议配合外部队列（Hangfire/自建）或等待 W9。

---

## 相关文档

- [ADR23 后台作业基础设施](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-%E8%BF%AD%E4%BB%A3%E5%BC%80%E5%8F%91/ADR/ADR23-%E5%90%8E%E5%8F%B0%E4%BD%9C%E4%B8%9A%E5%9F%BA%E7%A1%80%E8%AE%BE%E6%96%BD.md)
- [D15 §5.4](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D15-%E4%BA%8B%E4%BB%B6%E6%80%BB%E7%BA%BF%E4%B8%8E%E6%B6%88%E6%81%AF%E5%9F%BA%E7%A1%80%E8%AE%BE%E6%96%BD-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md#54-%E5%90%8E%E5%8F%B0%E4%BD%9C%E4%B8%9A)
- [G15 §4.6](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G15-%E4%BA%8B%E4%BB%B6%E6%9C%BA%E5%88%B6-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md#46-%E5%90%8E%E5%8F%B0%E4%BD%9C%E4%B8%9A%E5%86%85%E7%9A%84%E4%BA%8B%E4%BB%B6%E6%B4%BE%E5%8F%91)
- [G15 §5.2](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G15-%E4%BA%8B%E4%BB%B6%E6%9C%BA%E5%88%B6-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md#52-%E9%9D%9E-aop-%E8%B7%AF%E5%BE%84)

---

## 变更记录

| 版本 | 变更 |
|:--|:--|
| v1.0 | 初版（基于 ADR23 + v4.9.64/66 实施） |

---

> **下一步**：阅读 [事件的表现层消费](event-consumption.md) 了解事件如何在表现层被消费。