---
title: 后台作业
description: TKWF 后台作业：IBackgroundJobManager、[BackgroundJob] 特性、SystemActor 自动绑定、租户上下文恢复
---

# 后台作业

> TKWF 提供框架级后台作业基础设施（内置轻量调度 + Hangfire/Quartz Provider 三实现可选），替代各宿主自行集成 Hangfire 的现状。
> 设计依据：[ADR23](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR23-后台作业基础设施.md) · D15 §5.4 · G15 §4.6/5.2 · G15B（后台任务使用指南）· V4.9.64-66/103-105

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
A[EnqueueAsync] --> B[内置 BackgroundJobWorker]
B --> C{延迟?}
C -- 是 --> D[JobRecord ScheduledAt 到点]
C -- 否 --> E[写 JobRecord Pending + Channel 信号]
E --> F[worker 取 Pending + 到点]
F --> G[CreateScope]
G --> H[SystemActor 自动绑定]
H --> I[租户上下文恢复 ITenantScopeRestorer]
I --> J[ExecuteAsync 执行]
J --> J1[成功 → Succeeded / 失败 → 重试 or Failed]
J --> G1[事件派发：非 AOP 路径立即派发]
```

### 核心特性

| 特性 | 说明 |
|:--|:--|
| **SystemActor 自动绑定** | `BeginSystemScopeAsync` 零配置，退出时清理 AsyncLocal 防泄漏 |
| **租户上下文恢复** | `EnqueueAsync(..., tenantId)` → 执行时 `ITenantScopeRestorer.BeginTenantScopeAsync` 恢复租户上下文；V4.10.15 起 **ambient 租户自动捕获**——未显式传 `tenantId` 时自动捕获当前 ambient 租户上下文 |
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
| `IBackgroundJobManager` | 可替换实现（三选一：内置/Hangfire/Quartz Provider，V4.9.103-105） |
| `IAdvancedBackgroundJobManager` | 扩展接口——状态查询（`GetJobStatusAsync`）/取消（`CancelAsync`），与 `IBackgroundJobManager` 同实例注册 |
| `ITenantScopeRestorer` | 租户上下文恢复策略（默认 `TenantScopeRestorer`） |
| `IDistributedLock` | 多实例部署防重复执行（默认 `NullDistributedLock`；多实例调 `AddDbDistributedLock()` 覆盖） |
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

## Provider 三实现（V4.9.103-105）

| Provider | 包 | 定位 | 持久化 | 重试 | 集群 | 适用场景 |
|:--|:--|:--|:--|:--|:--|:--|
| **内置轻量**（默认） | `TKWF.BackgroundJobs`（随框架） | 进程内 DB 队列 + worker（`BackgroundJobWorker` 常驻轮询） | JobRecord 表（FreeSql/EF Core 自动建） | ✅ `MaxRetryCount` + 指数退避 | `IDistributedLock` | **默认首选**——零第三方依赖，SB 场景（定时报表/邮件队列/指标重算）足够 |
| **Hangfire** | `TKWF.BackgroundJobs.Hangfire` | 作业平台（storage/worker/dashboard） | SQL Server/Redis/InMemory | ✅ AutomaticRetry | storage 分布式锁 | **重运维需求**——集群/仪表盘/复杂调度管理 |
| **Quartz** | `TKWF.BackgroundJobs.Quartz` | 调度器（trigger 驱动） | AdoJobStore 12 表 / RAMJobStore | ❌（无内置，RetryPolicy trigger 级） | AdoJobStore + clustering | **调度/触发需求**——cron 周期任务（消费方直接 Quartz API） |

> **设计原则**（用户 2026-09-06 裁定）：框架先提供轻量内置，Provider 对接增强。**默认零依赖**；重需求才引第三方（Hangfire/Quartz 的运维/许可负担见各自对接指南）。
>
> ⚠️ **三实现"二选一"互斥**：`AddBackgroundJobs` / `AddHangfireBackgroundJobs` / `AddQuartzBackgroundJobs` **只调一个**（各自以 `AddSingleton` 注册 `IBackgroundJobManager`，解析取最后注册——混调以最后一个为准，不推荐）。

### 接线（内置轻量实现）

```csharp
// DomainInitializer.ConfigureServices 或 Program.cs
services.AddBackgroundJobs<MyUserInfo>(o =>
{
    o.MaxRetryCount = 3;                          // 重试上限（默认 3）
    o.PollingInterval = TimeSpan.FromSeconds(5);  // worker 轮询间隔
    o.BatchSize = 10;                             // 每批处理数
});
```

- `IBackgroundJobManager` / `IAdvancedBackgroundJobManager` 同实例注册（注入任一均可）
- `BackgroundJobWorker`（IHostedService）常驻轮询 JobRecord 队列
- `[BackgroundJob]` 作业经 SG 清单（`ProjectMetaContextBase.BackgroundJobTypeNames`）**自动注册 DI**——零手动 AddTransient

### 状态查询与取消（IAdvancedBackgroundJobManager）

```csharp
public class JobMonitor(IAdvancedBackgroundJobManager jobs)
{
    // Pending / Running / Succeeded / Failed / Cancelled；未知 JobId → null
    public async Task<BackgroundJobStatus?> GetStatusAsync(string jobId, CancellationToken ct)
        => await jobs.GetJobStatusAsync(jobId, ct);

    // 仅 Pending/Running 可取消（Running 由作业内 CancellationToken 协作）；终态 → false
    public async Task<bool> CancelAsync(string jobId, CancellationToken ct)
        => await jobs.CancelAsync(jobId, ct);
}
```

> **Provider 切换**：三实现接口完全一致（`IAdvancedBackgroundJobManager`）——切换只改 DI 接线，业务代码零修改（Hangfire 见 G15B-A、Quartz 见 G15B-B）。状态映射差异见 G15B §四。

### 执行语义（内置实现）

1. **SystemActor 身份**：worker 线程无 `HttpContext`，框架自动 `CreateScope` → `BeginSystemScopeAsync` 绑定系统身份 → 恢复入队时携带的租户上下文 → 执行 `job.ExecuteAsync(args, ct)`
2. **队列与重试**：`EnqueueAsync` 写 JobRecord（Pending + ScheduledAt）+ Channel 信号即时唤醒 worker；失败且 `RetryCount <= MaxRetryCount` → 回 Pending + 指数退避（`2^RetryCount` 分钟）；超限 → 终态 Failed（LastError 记录）
3. **分布式锁**：多实例部署下 `IDistributedLock` 防重复执行（默认 `NullDistributedLock` 单实例；多实例调 `AddDbDistributedLock()` 覆盖）
4. **优雅停机**：`BackgroundJobWorker` 在宿主停机时传播 CancellationToken——Running 作业协作取消

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
| 作业参数只传基元类型/DTO（ID/简单类型） | `JobRecordJson` 序列化保证往返；复杂对象先落库再传 ID（对齐 Hangfire best-practices） |
| 延迟执行用 `delay` | 避免阻塞线程 |
| 租户隔离用 `tenantId` | 多租户场景必须显式传递 |
| 作业应幂等 | 重试/重放安全——重复执行不产生副作用 |
| 长时间作业协作响应 `CancellationToken` | 超时/停机可取消 |
| handler 异常 try-catch | 失败自动重试（MaxRetryCount 内）；重试耗尽框架标记 Failed 并记录 LastError |
| 测试用 `ExecuteAsync` | 同步执行（等待完成），绕过队列直接验证业务逻辑 |

---

## 现状边界（V4.9.103-105）

| 能力 | 状态 | 说明 |
|:--|:--|:--|
| 接口/特性/SG注册 | ✅ 完成 | V4.9.64 ADR23 + SG 清单自动注册 DI |
| SystemActor 自动绑定 | ✅ | `BeginSystemScopeAsync` 零配置 |
| 租户上下文恢复 | ✅ | `tenantId` 参数 + `ITenantScopeRestorer` |
| 事件派发（非 AOP） | ✅ | 立即派发，`[Transactional]` 可切换事务 |
| 内置轻量调度（JobRecord 持久化） | ✅ V4.9.103 | 进程内 DB 队列 + worker，重试 + 分布式锁 + 优雅停机 |
| Hangfire Provider | ✅ V4.9.104 | `TKWF.BackgroundJobs.Hangfire`（storage/worker/dashboard） |
| Quartz Provider | ✅ V4.9.105 | `TKWF.BackgroundJobs.Quartz`（AdoJobStore 封装 + clustering） |
| 状态查询/取消 | ✅ V4.9.103 | `IAdvancedBackgroundJobManager.GetJobStatusAsync/CancelAsync` |

> ⚠️ **边界提示**：内置实现为**进程内 DB 队列**（单实例 worker，多实例需配 `IDistributedLock`），重启不丢（JobRecord 持久化）。生产环境高并发/集群调度建议切 Hangfire/Quartz Provider。

---

## 相关文档

- [ADR23 后台作业基础设施](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-%E8%BF%AD%E4%BB%A3%E5%BC%80%E5%8F%91/ADR/ADR23-%E5%90%8E%E5%8F%B0%E4%BD%9C%E4%B8%9A%E5%9F%BA%E7%A1%80%E8%AE%BE%E6%96%BD.md)
- [G15B 后台任务使用指南](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G15B-%E5%90%8E%E5%8F%B0%E4%BB%BB%E5%8A%A1-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md)（三实现选型 + Provider 状态映射差异）
- [D15 §5.4](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D15-%E4%BA%8B%E4%BB%B6%E6%80%BB%E7%BA%BF%E4%B8%8E%E6%B6%88%E6%81%AF%E5%9F%BA%E7%A1%80%E8%AE%BE%E6%96%BD-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md#54-%E5%90%8E%E5%8F%B0%E4%BD%9C%E4%B8%9A)
- [G15 §4.6](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G15-%E4%BA%8B%E4%BB%B6%E6%9C%BA%E5%88%B6-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md#46-%E5%90%8E%E5%8F%B0%E4%BD%9C%E4%B8%9A%E5%86%85%E7%9A%84%E4%BA%8B%E4%BB%B6%E6%B4%BE%E5%8F%91)
- [G15 §5.2](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G15-%E4%BA%8B%E4%BB%B6%E6%9C%BA%E5%88%B6-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md#52-%E9%9D%9E-aop-%E8%B7%AF%E5%BE%84)

---

## 变更记录

| 版本 | 变更 |
|:--|:--|
| v1.0 | 初版（基于 ADR23 + v4.9.64/66 实施） |
| v1.1 | 同步 V4.9.103-105：内置轻量调度（JobRecord 持久化 + worker + 重试/分布式锁/优雅停机）+ Hangfire Provider + Quartz Provider 三实现落地；新增 `IAdvancedBackgroundJobManager` 状态查询/取消 |

---

> **下一步**：阅读 [事件的表现层消费](event-consumption.md) 了解事件如何在表现层被消费。