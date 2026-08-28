---
title: 事件机制使用指南
description: TKWF 事件机制实用指南：三种派发模式、领域事件、Outbox/Inbox、后台作业、实体历史、最佳实践与反模式
---

# 事件机制使用指南

> **事件机制已全面实施**（V4.9.64/66）。本文面向开发者，提供从快速入门到高级用法的完整实操指南。设计原理见 [D15](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D15-%E4%BA%8B%E4%BB%B6%E6%80%BB%E7%BA%BF%E4%B8%8E%E6%B6%88%E6%81%AF%E5%9F%BA%E7%A1%80%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) + ADR21-26。

---

## 一、核心概念速览

| 概念 | 说明 |
|:--|:--|
| **领域事件** | 业务上有意义的"某事发生了"——订单已创建、状态已变更、库存已扣减 |
| **本地事件** | 进程内派发，Handler 在同一应用内执行 |
| **分布式事件** | 跨进程派发，通过消息队列（RabbitMQ/Kafka）或 Outbox 转发 |
| **处理器** | 订阅事件并执行副作用的类——刷新缓存、发邮件、更新投影 |
| **Outbox** | 事务性发件箱——事件与业务数据在同一 DB 事务中写入，后台发送器异步消费 |

---

## 二、三种派发模式选型（核心决策）

| 模式 | API | 时机 | 阻塞请求 | 事务一致 | 适用场景 |
|:--|:--|:--|:--|:--|:--|
| **① 阻塞 post-commit** | `PublishAsync` | commit 后串行 await | 是 | 是 | 快 handler（缓存、审计、规则校验） |
| **② 异步持久化** | `[DistributedEvent]` + Outbox | commit 前写表，后台异步派发 | 否 | 是 | 慢 handler（邮件、跨服务、外部 API） |
| **③ Fire-and-forget** | `PostAsync` | 调用即派发 | 否 | 否 | 非关键旁路操作（指标、日志） |

**选型一句话**：快 handler 用 ①，慢 handler 用 ②，不重要的用 ③。

> **决策树**：handler 需要事务一致吗？→ 是 → handler 慢吗？→ 是 → 模式 ② → 否 → 模式 ① → 不需要事务一致 → 模式 ③

---

## 三、快速入门：3 步用起领域事件

### 1. 启用事件派发（Program.cs + 初始化器）

```csharp
// Program.cs —— 初始化器中注册
public class MyDomainInitializer : DomainHostInitializerBase<MyUserInfo>
{
    protected override void Initialize(FilterBuilder<MyUserInfo> filters)
    {
        filters
            .AddAuthority()           // S 级：权限
            .AddEventDispatch()        // F 级：事件派发（必须 opt-in）
            .AddTransactional();       // O 级：事务
    }
}
```

> `AddEventDispatch()` 是 opt-in 的——不调用则 AOP 路径不会收集事件（非 AOP 路径仍立即派发）。

### 2. 定义事件

```csharp
// 本地事件——无需任何特性，普通 record 即可
public record OrderCreatedEvent(long OrderId, string CustomerName, decimal TotalAmount);

// 分布式事件——标记 [DistributedEvent]，字段必须可 JSON 序列化
[DistributedEvent]
public record OrderConfirmedEvent(long OrderId, string CustomerName, decimal TotalAmount);
```

### 2.3 发布事件

**方式 A：从聚合根发布（推荐）**

```csharp
public class Order : AggregateRoot<MyUserInfo>
{
    public void Confirm()
    {
        Status = "Confirmed";
        // AddEvent 只收集——真正派发在事务提交后由 EventDispatchFilter 自动完成
        AddEvent(new OrderConfirmedEvent(Id, OrderNumber, Amount));
    }
}
```

**方式 B：从领域服务发布**

```csharp
public class OrderService : DomainDataServiceBase<MyUserInfo>
{
    private readonly ILocalEventBus _eventBus;

    public async Task<Order> CreateOrderAsync(string customer, decimal amount)
    {
        var order = new Order { OrderNumber = "ORD-" + Guid.NewGuid(), Amount = amount };
        await CreateAsync(order);
        // AOP 路径：收集到 Bag，commit 后统一派发
        await _eventBus.PublishAsync(new OrderCreatedEvent(order.Id, customer, amount));
        return order;
    }
}
```

### 2.4 编写处理器

```csharp
[DomainEventHandler]  // SG 编译期扫描自动注册，无需手动 DI 注册
public class OrderCreatedCacheHandler : ILocalEventHandler<OrderCreatedEvent>
{
    private readonly ICacheProvider _cache;

    public OrderCreatedCacheHandler(ICacheProvider cache) => _cache = cache;

    public async Task HandleEventAsync(OrderCreatedEvent eventData)
    {
        // 刷新缓存
        await _cache.RemoveAsync($"order:{eventData.OrderId}");
    }
}
```

> `[DomainEventHandler]` + SG 编译期注册 + 编译期派发表生成——零运行时反射，handler 顺序编译期确定。

---

## 四、API 参考

### 3.1 发布接口

| 接口 | 方法 | 说明 |
|:--|:--|:--|
| `ILocalEventBus` | `PublishAsync<TEvent>(TEvent)` | AOP 路径：收集到 Bag，commit 后派发；非 AOP 路径：立即派发 |
| `ILocalEventBus` | `PostAsync<TEvent>(TEvent)` | Fire-and-forget：立即派发，绕过 Bag，异常不传播，Task 永远 RanToCompletion |
| `ILocalEventBus` | `PublishAsync(Type, object)` | 运行时类型派发（EventDispatchFilter 内部使用） |
| `ILocalEventBus` | `Subscribe<TEvent>(ILocalEventHandler<TEvent>)` | 运行时订阅（Blazor/测试/插件），返回 IDisposable |
| `IDistributedEventBus` | `PublishAsync<TEvent>(TEvent, bool useOutbox = true)` | `useOutbox = true`（默认）走 Outbox 表；`false` 直接发布到 broker |
| `IDistributedEventBus` | `Subscribe<TEvent>(IDistributedEventHandler<TEvent>)` | 运行时订阅分布式事件 |

### 3.2 处理器接口

| 接口 | 方法 | 生命周期 | 说明 |
|:--|:--|:--|:--|
| `ILocalEventHandler<in TEvent>` | `HandleEventAsync(TEvent)` | Transient | 本地事件处理器（逆变——基类 handler 可处理派生事件） |
| `IDistributedEventHandler<in TEvent>` | `HandleEventAsync(TEvent)` | Transient | 分布式事件处理器（MQ 消费者侧） |

### 3.3 特性

| 特性 | 标注位置 | 作用 | SG 行为 |
|:--|:--|:--|:--|
| `[DomainEventHandler]` | handler 类 | 标记为处理器，SG 编译期注册 + 生成静态派发表 | 未标注的 handler 不会被 SG 注册（仍可手动 DI 注册） |
| `[DistributedEvent]` | 事件 record/class | 标记为跨进程事件，路由到 `IDistributedEventBus` + Outbox | 字段必须可序列化（EVT004 编译错误） |
| `[EventName("custom.name")]` | 事件 record/class | 覆盖默认事件名（默认去 `Event`/`Eto` 后缀） | RabbitMQ routing key / Outbox EventName 列 |
| `[BackgroundJob]` | 作业类 | 标记为后台作业，SG 自动注册 | —— |

### 3.4 聚合根

| 方法 | 说明 |
|:--|:--|
| `AddEvent<TEvent>(TEvent)` | 收集事件到内部列表（不立即派发）。`EventDispatchFilter.PostProceed` 在 commit 后统一排空 |
| `GetEvents()` | 获取已收集事件（只读） |
| `ClearEvents()` | 清空事件列表 |

### 3.5 事件基类

```csharp
// DomainEvent（abstract record）——上下文字段由 EventDispatchFilter 自动填充
public abstract record DomainEvent
{
    public string? TriggeredBy { get; init; }      // 触发者用户名
    public DateTimeOffset Timestamp { get; init; } // 派发时间戳
    public string? CorrelationId { get; init; }    // 关联 ID（请求追踪）
}

// EntityChangedEvent——EntityHistoryFilter 自动生成
public sealed record EntityChangedEvent
{
    public string EntityType { get; init; }
    public string EntityId { get; init; }
    public string OperationType { get; init; }     // Create / Update / Delete
    public string? ChangesJson { get; init; }      // 属性级 diff（JSON）
    public string ChangedBy { get; init; }
    public DateTimeOffset ChangedAt { get; init; }
}
```

### 3.6 注册方法

| 方法 | 位置 | 说明 |
|:--|:--|:--|
| `FilterBuilder<TUserInfo>.AddEventDispatch()` | `DomainInitializer.Initialize` | 注册 `EventDispatchFilter`（F 级），opt-in |
| `services.AddOutbox()` | `DomainHost.ConfigureServices` | 注册 `OutboxSender`/`InboxProcessor`/`IOutboxExportHook` 等 |
| `services.AddRabbitMqEventBus(...)` | `DomainHost.ConfigureServices` | 覆盖默认 `IDistributedEventBus` 为 RabbitMQ 实现 |

---

## 五、使用示例（按场景）

### 4.1 缓存刷新（模式 ① — 阻塞 post-commit）

```csharp
// 事件
public record ProductPriceChangedEvent(long ProductId, decimal OldPrice, decimal NewPrice);

// 处理器——快操作，阻塞可接受
[DomainEventHandler]
public class ProductPriceCacheHandler : ILocalEventHandler<ProductPriceChangedEvent>
{
    private readonly ICacheProvider _cache;
    public ProductPriceCacheHandler(ICacheProvider cache) => _cache = cache;

    public async Task HandleEventAsync(ProductPriceChangedEvent eventData)
    {
        await _cache.SetAsync($"product:price:{eventData.ProductId}", eventData.NewPrice);
    }
}

// 发布——领域服务内
public async Task UpdatePriceAsync(long productId, decimal newPrice)
{
    var product = await _productDAC.GetByIdAsync(productId);
    var oldPrice = product.Price;
    product.Price = newPrice;
    await UpdateAsync(product);  // commit 后自动派发
    await _eventBus.PublishAsync(new ProductPriceChangedEvent(productId, oldPrice, newPrice));
}
```

### 4.2 邮件通知（模式 ② — 异步持久化 Outbox）

```csharp
// 标记为分布式事件——走 Outbox，不阻塞请求
[DistributedEvent]
public record OrderConfirmedEvent(long OrderId, string CustomerEmail, decimal Amount) : DomainEvent;

// 处理器——慢操作（SMTP 调用），在 OutboxSender 后台线程执行
[DomainEventHandler]
public class OrderConfirmedEmailHandler : IDistributedEventHandler<OrderConfirmedEvent>
{
    private readonly IEmailService _email;
    public OrderConfirmedEmailHandler(IEmailService email) => _email = email;

    public async Task HandleEventAsync(OrderConfirmedEvent eventData)
    {
        await _email.SendAsync(eventData.CustomerEmail, "订单确认",
            $"您的订单 {eventData.OrderId} 已确认，金额 {eventData.Amount:C}");
    }
}

// 发布——聚合根内
public class Order : AggregateRoot<MyUserInfo>
{
    public void Confirm()
    {
        Status = "Confirmed";
        AddEvent(new OrderConfirmedEvent(Id, CustomerEmail, Amount));
        // EventDispatchFilter 检测 [DistributedEvent] → OutboxExportHook 写入 Outbox 表
        // OutboxSender 后台异步消费 → IDistributedEventBus.PublishAsync(useOutbox: false) → handler
    }
}
```

### 4.3 实体变更审计（内置 EntityChangedEvent）

```csharp
// 启用 EntityHistoryFilter——自动生成属性级 diff + 发布 EntityChangedEvent
filters.AddEntityHistory<MyUserInfo>(trackCreations: true, trackUpdates: true, trackDeletions: true);

// 处理器——订阅内置事件
[DomainEventHandler]
public class EntityChangeAuditHandler : ILocalEventHandler<EntityChangedEvent>
{
    private readonly IEntityDAC<AuditLog> _auditDAC;
    public EntityChangeAuditHandler(IEntityDAC<AuditLog> auditDAC) => _auditDAC = auditDAC;

    public async Task HandleEventAsync(EntityChangedEvent eventData)
    {
        await _auditDAC.InsertAsync(new AuditLog
        {
            EntityType = eventData.EntityType,
            EntityId = eventData.EntityId,
            Operation = eventData.OperationType,
            Changes = eventData.ChangesJson,
            ChangedBy = eventData.ChangedBy,
            ChangedAt = eventData.ChangedAt
        });
    }
}
```

### 4.4 Fire-and-forget（模式 ③ — 非关键通知）

```csharp
// 不需要事务一致——即使回滚也无所谓
public record MetricCollectedEvent(string MetricName, double Value);

// 发布——后台作业内，无事务边界
public async Task RunHeartbeatJobAsync()
{
    // ... 心跳逻辑 ...
    _ = _eventBus.PostAsync(new MetricCollectedEvent("heartbeat", 1.0));  // 不 await
}
```

### 4.5 跨服务集成（RabbitMQ + Outbox + Inbox）

```csharp
// 消费端——订阅 RabbitMQ 消息
[DistributedEvent]
public record InventoryDeductedEvent(long OrderId, string Sku, int Quantity);

[DomainEventHandler]
public class InventoryDeductedHandler : IDistributedEventHandler<InventoryDeductedEvent>
{
    private readonly IInventoryService _inventory;
    public InventoryDeductedHandler(IInventoryService inventory) => _inventory = inventory;

    public async Task HandleEventAsync(InventoryDeductedEvent eventData)
    {
        await _inventory.DeductAsync(eventData.Sku, eventData.Quantity);
        // InboxProcessor 保证幂等——重复消费不会扣两次
    }
}

// 生产端——注册 RabbitMQ
services.AddRabbitMqEventBus(options =>
{
    options.ConnectionString = "amqp://...";
    options.ExchangeName = "tkwf.events";
    options.MaxRetryCount = 5;
});
```

### 4.6 后台作业内的事件派发

```csharp
[BackgroundJob]
public class OrderTimeoutJob : IBackgroundJob
{
    private readonly ILocalEventBus _eventBus;

    public async Task ExecuteAsync(object args, CancellationToken ct)
    {
        var orderId = (long)args;
        // 非 AOP 路径：AopContextAccessor.Current == null → 立即派发
        // 如需事务一致，标注 [Transactional] 让 AOP 管线接管
        await _eventBus.PublishAsync(new OrderTimeoutEvent(orderId));
    }
}

// 入队——延迟 30 分钟执行
await _jobManager.EnqueueAsync<OrderTimeoutJob>(orderId, delay: TimeSpan.FromMinutes(30));
```

### 4.6 运行时订阅（Blazor / 测试 / SignalR）

```csharp
// Blazor 组件——订阅事件刷新 UI
@code {
    private IDisposable? _subscription;

    protected override void OnInitialized()
    {
        _subscription = LocalEventBus.Subscribe<OrderCreatedEvent>(new Handler(this));
    }

    public void Dispose() => _subscription?.Dispose();

    private class Handler(OrderList parent) : ILocalEventHandler<OrderCreatedEvent>
    {
        public Task HandleEventAsync(OrderCreatedEvent eventData)
        {
            parent.StateHasChanged();
            return Task.CompletedTask;
        }
    }
}
```

### 4.7 多 handler 处理同一事件

```csharp
// 一个事件可以有多个 handler——全部串行执行，互不影响
public record OrderShippedEvent(long OrderId, string TrackingNumber);

[DomainEventHandler]
public class OrderShippedCacheHandler : ILocalEventHandler<OrderShippedEvent>
{
    public async Task HandleEventAsync(OrderShippedEvent eventData)
    {
        await _cache.RemoveAsync($"order:status:{eventData.OrderId}");
    }
}

[DomainEventHandler]
public class OrderShippedAuditHandler : ILocalEventHandler<OrderShippedEvent>
{
    public async Task HandleEventAsync(OrderShippedEvent eventData)
    {
        await _auditDAC.InsertAsync(new AuditLog { /* ... */ });
    }
}

// 执行顺序由 SG 编译期派发表确定——CacheHandler 先于 AuditHandler（编译期声明顺序）
// 单个 handler 抛异常 → log + IEventDispatchDiagnostics，后续 handler 继续执行（永不重抛）
```

---

## 六、高级主题

### 5.1 AOP 派发时序

`[Transactional]` 方法内的事件派发完整时序：

```
PreProceed (EventDispatchFilter)
  → Bag["__pendingEvents"] = new List<object>()
proceed()  ← 业务逻辑执行
  → PublishAsync(event)        → 事件收集到 Bag（不派发）
  → AddEvent(event)            → 事件收集到实体 _events 列表（不派发）
OutboxExportHook.ExportPending → [DistributedEvent] 事件写入 Outbox 表（同事务）
txScope.CommitAsync()          ← DB 事务提交（业务 + Outbox 原子）
PostProceed (EventDispatchFilter)
  → 双源排空：实体 GetEvents() + Bag["__pendingEvents"]
  → 逐事件判断 [DistributedEvent] 属性
    ├── 是 + 已 Outbox 导出 → 跳过
    ├── 是 + 未导出         → IDistributedEventBus.PublishAsync
    └── 否                  → ILocalEventBus.PublishAsync → DispatchAsync
  → DispatchAsync: 串行 await handler.HandleEventAsync()（per-handler try/catch）
```

**关键约束**：
- `PublishAsync` 在 AOP 路径返回 `Task.CompletedTask`——事件未真正派发，只是收集
- `PostProceed` 在 `CommitAsync` **之后**执行——handler 跑在事务之外
- handler 异常 → 永不重抛（Oracle P0-4），仅 log + `IEventDispatchDiagnostics`

### 5.2 非 AOP 路径

后台作业、MQ 消费者、测试代码中 `AopContextAccessor.Current == null`：

| 调用 | 行为 |
|:--|:--|
| `PublishAsync` | 立即派发（不收集到 Bag） |
| `PostAsync` | 立即派发（与 `PublishAsync` 行为一致——都同步派发） |
| `AddEvent`（聚合根） | 事件留在 `_events` 列表，需手动调用 `ILocalEventBus` 派发 |

> 后台作业内如需事务一致的事件派发，在作业方法上标注 `[Transactional]`，AOP 管线接管收集与 post-commit 派发。

### 5.3 Outbox 启用与配置

```csharp
// DomainHost.ConfigureServices
services.AddOutbox(options =>
{
    options.PollInterval = TimeSpan.FromSeconds(10);   // 兜底轮询间隔
    options.MaxRetryCount = 10;                        // 最大重试次数
    options.RetryDelayBase = TimeSpan.FromSeconds(10); // 指数退避基数（10s × 2^retryCount）
});

// 可选：分布式锁（多实例部署时必须）
services.AddSingleton<IDistributedLock, DbDistributedLock>();
```

Outbox 流程：
1. `OutboxExportHook` 在 commit 前将 `[DistributedEvent]` 事件写入 `OutboxEventRecord` 表（共享业务事务）
2. `OutboxSender`（IHostedService）通过 Channel push 信号 + 兜底轮询拉取待发记录
3. 分布式锁保证单实例发送
4. 发送成功 → 删除 Outbox 记录；失败 → 指数退避重试

### 5.4 事件名自定义

```csharp
// 默认：类型名去 Event/Eto 后缀 → "OrderConfirmed"
public record OrderConfirmedEvent(...);

// 显式覆盖
[EventName("order.confirmed.v2")]
public record OrderConfirmedEvent(...);
```

事件名用于：RabbitMQ routing key、Outbox 表 `EventName` 列、Inbox 幂等匹配。

### 5.5 事件名自定义

### 5.5 测试事件

```csharp
[Fact]
public async Task CreateOrder_PublishesOrderCreatedEvent()
{
    // 安排——注册运行时订阅
    var captured = new List<OrderCreatedEvent>();
    using var subscription = LocalEventBus.Subscribe<OrderCreatedEvent>(
        new CaptureHandler(captured));

    // 执行
    await OrderService.CreateOrderAsync("Alice", 99.99m);

    // 断言——AOP 路径需 commit 后才有事件
    Assert.Single(captured);
    Assert.Equal("Alice", captured[0].CustomerName);
}

private class CaptureHandler(List<OrderCreatedEvent> captured) : ILocalEventHandler<OrderCreatedEvent>
{
    public Task HandleEventAsync(OrderCreatedEvent eventData)
    {
        captured.Add(eventData);
        return Task.CompletedTask;
    }
}
```

> 测试中 AOP 过滤器是否注册取决于测试 Fixture。若未注册 `AddEventDispatch()`，`PublishAsync` 走非 AOP 路径——立即派发。

### 5.6 RPC 事件侧信道

RPC 调用时，服务端事件通过 RPC 响应体自动携带回调用方（ADR33）：

```csharp
// 服务端——正常发布事件
public async Task<Order> CreateOrderAsync(...)
{
    await _eventBus.PublishAsync(new OrderCreatedEvent(...));
    return order;
}

// 调用方（Wasm/TS 客户端）——自动接收并本地派发
// 无需额外代码，DomainClient RPC 管线自动处理
```

> RPC 侧信道仅携带非 `[DistributedEvent]` 的本地事件——分布式事件走 Outbox/broker，不走 RPC。

---

## 七、最佳实践

```csharp
// ① handler 应快速完成——阻塞 post-commit 模式下，请求延迟 = Σ handler 耗时
[DomainEventHandler]
public class FastCacheHandler : ILocalEventHandler<OrderCreatedEvent>
{
    private readonly ICacheProvider _cache;
    public FastCacheHandler(ICacheProvider cache) => _cache = cache;

    public async Task HandleEventAsync(OrderCreatedEvent eventData)
    {
        await _cache.RemoveAsync($"order:{eventData.OrderId}");  // < 10ms，可接受
    }
}

// ② 慢 handler 应标为分布式事件，走 Outbox
[DistributedEvent]                                          // ② 标记为分布式
public record OrderConfirmedEvent(...) : DomainEvent;

[DomainEventHandler]
public class SlowEmailHandler : IDistributedEventHandler<OrderConfirmedEvent>
{
    private readonly IEmailService _email;
    public SlowEmailHandler(IEmailService email) => _email = email;

    public async Task HandleEventAsync(OrderConfirmedEvent eventData)
    {
        await _email.SendAsync(...);  // SMTP 调用慢，但走 Outbox 后台线程，不阻塞请求
    }
}

// ③ 事件应只携带必要数据——不要传整个实体
public record OrderCreatedEvent(long OrderId, string CustomerName, decimal Total);  // ③ 精简字段

// ④ handler 不应依赖其他 handler 的执行顺序

// ⑤ handler 内不应抛异常（会被吞掉）——应 try-catch 内部处理
[DomainEventHandler]
public class SafeHandler : ILocalEventHandler<OrderCreatedEvent>
{
    public async Task HandleEventAsync(OrderCreatedEvent eventData)
    {
        try
        {
            await DoWorkAsync(eventData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "handler failed for order {OrderId}", eventData.OrderId);
            // 不 rethrow——框架也会吞，但显式 catch 更清晰
        }
    }
}
```

---

## 八、反模式

```csharp
// ① 不要在 handler 里做慢操作还用 PublishAsync（阻塞 post-commit）
[DomainEventHandler]
public class BadSlowHandler : ILocalEventHandler<OrderCreatedEvent>
{
    public async Task HandleEventAsync(OrderCreatedEvent eventData)
    {
        // ❌ 5 秒 SMTP 调用阻塞请求线程
        await _email.SendAsync(eventData.CustomerEmail, ...);
    }
}
// ✅ 正确：标为 [DistributedEvent]，走 Outbox 后台派发

// ② 不要在 handler 里依赖另一个 handler 已执行
[DomainEventHandler]
public class BadDependentHandler : ILocalEventHandler<OrderCreatedEvent>
{
    public async Task HandleEventAsync(OrderCreatedEvent eventData)
    {
        // ❌ 假设 CacheHandler 已刷新缓存——顺序不保证（虽然当前是串行）
        var cached = await _cache.GetAsync($"order:{eventData.OrderId}");
    }
}
// ✅ 正确：handler 应自包含——不依赖其他 handler 的副作用

// ③ 不要传整个实体作为事件
public record BadOrderEvent(Order FullOrder);  // ❌ 实体可能被修改、含敏感字段
// ✅ 正确：传必要字段（投影为 record）

// ④ 不要在非 AOP 路径用 PostAsync（与 PublishAsync 行为一致）
public async Task RunInJobAsync()
{
    // ❌ 非 AOP 路径 PostAsync 和 PublishAsync 都是立即派发——没有区别
    _ = _eventBus.PostAsync(new SomeEvent());
}
// ✅ 正确：非 AOP 路径直接用 PublishAsync；需要事务一致就标 [Transactional]

// ⑤ 不要用 PostAsync 发布需要事务一致的事件
public async Task CreateOrderAsync(...)
{
    await _eventBus.PostAsync(new OrderCreatedEvent(...));  // ❌ commit 回滚后事件已发
    // ... 可能抛异常 → 事务回滚 → 但事件已发出（幻象事件）
}
// ✅ 正确：用 PublishAsync（AOP 收集到 Bag，commit 成功才派发）

// ⑥ 不要忘记 Dispose 运行时订阅（Blazor 组件）
@code {
    // ❌ 未 Dispose → 内存泄漏 + 组件销毁后仍被回调
    protected override void OnInitialized()
    {
        LocalEventBus.Subscribe<OrderCreatedEvent>(new Handler(this));
    }
}
// ✅ 正确：保存 IDisposable 引用，Dispose 时释放
```

---

## 九、FAQ

**Q1：handler 执行顺序由什么决定？**

SG 编译期派发表按 `[DomainEventHandler]` 类的声明顺序生成。同一事件类型的多个 handler 按编译期顺序串行执行。运行时订阅的 handler 排在 SG 编译期 handler 之后。

**Q2：handler 抛异常会怎样？**

handler 异常被 per-handler try/catch 捕获，log + `IEventDispatchDiagnostics.OnDispatchFailed` 记录，**不重抛**（Oracle P0-4）。后续 handler 继续执行。事务已 commit，不会回滚。

**Q3：如何让 handler 在事务回滚时不执行？**

使用 `PublishAsync`（模式 ①）。AOP 路径下，事件收集到 Bag，commit 失败 → `PostProceedOnException` 检测异常 → `ClearCollectedEvents()` → 事件丢弃。`PostAsync`（模式 ③）绕过 Bag，不受事务保护。

**Q4：Outbox 和直接发布有什么区别？**

`IDistributedEventBus.PublishAsync(event, useOutbox: true)`（默认）：事件先写入 `OutboxEventRecord` DB 表（与业务数据同事务），`OutboxSender` 后台异步消费。事务一致 + 不阻塞请求。

`useOutbox: false`：直接调用 broker publish。如果 broker 不可用，事件丢失。仅在容忍丢失的场景使用。

**Q5：一个事件可以有本地和分布式两个 handler 吗？**

可以。标 `[DistributedEvent]` 的事件在 `EventDispatchFilter.PostProceed` 时路由到 `IDistributedEventBus`，`IDistributedEventBus` 的默认实现 `LocalDistributedEventBus` 委托给 `ILocalEventBus`——所以 `IDistributedEventHandler<T>` 和 `ILocalEventHandler<T>` 都会收到。当 RabbitMQ 注册时，`IDistributedEventHandler<T>` 在消费端进程执行，`ILocalEventHandler<T>` 在生产端进程不执行（Outbox 导出后跳过本地派发）。

**Q6：后台作业内怎么发事件？**

直接调 `PublishAsync`——非 AOP 路径立即派发。如需事务一致，在作业方法上标注 `[Transactional]`，AOP 管线接管收集与 post-commit 派发。

**Q7：实体不继承 AggregateRoot 怎么发事件？**

直接调 `ILocalEventBus.PublishAsync`。`AggregateRoot` 只是提供 `AddEvent` 收集的便捷基类——任何服务方法内都可以直接调 `PublishAsync`。

**Q8：`EntityChangedEvent` 是什么？**

`EntityHistoryFilter` 自动生成的实体变更事件（ADR25），包含属性级 diff（`ChangesJson`）。标注了 `[EntityHistory]` 的控制器/服务自动触发。handler 订阅 `ILocalEventHandler<EntityChangedEvent>` 即可消费。

**Q9：如何查看派发表？**

SG 生成的静态派发表在编译产物中。运行时通过 `IEventDispatchTableProvider.GetDispatchers(eventType)` 获取。未注册 `IEventDispatchTableProvider` 时，`LocalEventBus` 回退到运行时 DI 解析 + 反射（有性能开销）。

---

## 十、附录

### 10.1 派发模式选型决策树

```
handler 需要事务一致吗？（commit 失败时事件不能发）
├── 是 → handler 慢吗？（>100ms 或含外部 I/O）
│       ├── 是 → 模式 ②：[DistributedEvent] + Outbox（异步 + 持久）
│       └── 否 → 模式 ①：PublishAsync（阻塞 post-commit）
└── 否 → 模式 ③：PostAsync（fire-and-forget）
```

| 场景 | 模式 | API |
|:--|:--|:--|
| 缓存刷新 | ① | `PublishAsync` |
| 审计日志 | ① | `PublishAsync` |
| 领域规则校验 | ① | `PublishAsync` |
| 邮件通知 | ② | `[DistributedEvent]` + Outbox |
| 跨服务集成 | ② | `[DistributedEvent]` + Outbox + RabbitMQ |
| 指标采集 | ③ | `PostAsync` |
| 报表生成 | — | `IBackgroundJobManager.EnqueueAsync`（不是事件） |

### 10.2 关键文件索引

| 文件 | 角色 |
|:--|:--|
| `_Framework/Core/Events/ILocalEventBus.cs` | 本地事件总线接口 |
| `_Framework/Core/Events/IDistributedEventBus.cs` | 分布式事件总线接口 |
| `_Framework/Core/Events/ILocalEventHandler.cs` | 本地处理器接口 |
| `_Framework/Core/Events/IDistributedEventHandler.cs` | 分布式处理器接口 |
| `_Framework/Core/Events/DomainEvent.cs` | 事件基类 |
| `_Framework/Core/Events/EntityChangedEvent.cs` | 实体变更事件 |
| `_Framework/Core/Events/DistributedEventAttribute.cs` | `[DistributedEvent]` 特性 |
| `_Framework/Core/Events/DomainEventHandlerAttribute.cs` | `[DomainEventHandler]` 特性 |
| `_Framework/Core/Events/EventNameAttribute.cs` | `[EventName]` 特性 |
| `_Framework/Core/Events/IEventDispatchTableProvider.cs` | SG 编译期派发表接口 |
| `_Framework/Domain/Events/LocalEventBus.cs` | 本地总线实现（`DispatchAsync` 串行派发） |
| `_Framework/Domain/Events/LocalDistributedEventBus.cs` | 默认分布式总线（委托 LocalEventBus） |
| `_Framework/Domain/Events/AggregateRoot.cs` | 聚合根（`AddEvent` 收集） |
| `_Framework/Domain/Interception/Filters/EventDispatchFilterAttribute.cs` | AOP 事件过滤器 |
| `_Framework/Domain/FilterBuilder.cs` | `AddEventDispatch()` 注册入口 |
| `_Framework/Outbox/OutboxExportHook.cs` | Outbox 提交前导出 |
| `_Framework/Outbox/OutboxSender.cs` | Outbox 后台发送器 |
| `_Framework/Outbox/OutboxServiceCollectionExtensions.cs` | `AddOutbox()` 注册入口 |
| `_Framework/EventBus.RabbitMQ/RabbitMqDistributedEventBus.cs` | RabbitMQ 传输实现 |

---

---

> **版本历史**
> - v1.1 (2026-08-28): 基于 G15 v1.0 重写为公开文档站文章，增加快速入门、API 参考、完整示例、最佳实践、反模式、FAQ、决策树
>
> ---
>
> **引用**
> - 设计方案：[D15-事件总线与消息基础设施-设计方案](../_TKWF/docs/D15-事件总线与消息基础设施-设计方案.md) §4.5（派发语义与设计取舍）
> - ADR21：[领域事件与本地事件总线](../_TKWF/docs/02-迭代开发/ADR/ADR21-领域事件与本地事件总线.md)
> - ADR22：[分布式事件总线抽象](../_TKWF/docs/02-迭代开发/ADR/ADR22-分布式事件总线抽象.md)
> - ADR23：[后台作业基础设施](../_TKWF/docs/02-迭代开发/ADR/ADR23-后台作业基础设施.md)
> - ADR24：[事务性 Outbox/Inbox 模式](../_TKWF/docs/02-迭代开发/ADR/ADR24-事务性OutboxInbox模式.md)
> - ADR25：[EntityHistory 属性级 Diff 与事件驱动](../_TKWF/docs/02-迭代开发/ADR/ADR25-EntityHistory属性级Diff与事件驱动.md)
> - ADR26：[UoW 事务迁移](../_TKWF/docs/02-迭代开发/ADR/ADR26-UoW事务迁移.md)
> - AOP 使用指南：[G04-AOP拦截器使用指南](./G04-AOP拦截器使用指南.md)