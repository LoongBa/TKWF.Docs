---
title: 事件的表现层消费
description: TKWF 事件在表现层的三种消费路径：运行时订阅（Blazor 刷新）、RPC 事件侧信道、SignalR 实时推送
---

# 事件的表现层消费

> TKWF 事件机制在表现层提供三种消费路径，覆盖进程内/跨进程/实时推送全场景。
> 设计依据：[ADR33](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR33-RPC响应携带事件-领域事件同步传播.md) · [v4.9.69](https://github.com/LoongBa/TKW.Framework/blob/master/docs/CHANGELOG.md#4968) · [D15](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D15-事件总线与消息基础设施-设计方案.md) · [G15](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G15-事件机制-使用指南.md) · V4.9.64/66

---

## 概述：三种消费路径

| 路径 | 场景 | 核心 API | 特点 |
|:--|:--|:--|:--|
| **① 运行时订阅** | 进程内 Blazor/测试/插件 | `ILocalEventBus.Subscribe<T>()` | 进程内、零延迟、零配置 |
| **② RPC 事件侧信道** | 跨进程（Wasm/TS/移动端） | `X-TKWF-Events` / `extensions.tkwf.events` | 跨进程、随 RPC 响应、Base64Url、4KB限制 |
| **③ SignalR 实时推送** | 实时协作/通知/仪表盘 | `IRealTimeClientMessageSender` + SignalR | 实时、双向、V5.0 规划 |

> ⚠️ **文档不一致提示**：G15 §5.6 注释称"RPC 侧信道仅携带非 [DistributedEvent] 的本地事件"，但 v4.9.69 开发方案 §2.4 + 测试矩阵明确 **[DistributedEvent] 事件同时进 envelope 且走分布式双路**。以 v4.9.69 + ADR33 为准。

---

## 一、运行时订阅（进程内）

### API

```csharp
// 唯一入口
IDisposable Subscribe<TEvent>(ILocalEventHandler<TEvent> handler);

// 处理器接口（逆变——基类 handler 可处理派生事件）
public interface ILocalEventHandler<in TEvent>
{
    Task HandleEventAsync(TEvent eventData);
}
```

### 使用场景

| 场景 | 示例 |
|:--|:--|
| Blazor 组件刷新 | 仪表盘 Widget 实时更新 |
| 测试断言 | 捕获事件断言业务流程 |
| 运行时插件 | 热插拔事件响应 |

### Blazor 组件刷新模式

```csharp
@implements IDisposable
@inject ILocalEventBus EventBus

<div>订单总数: @_count</div>

@code {
    private int _count;
    private IDisposable? _subscription;

    protected override void OnInitialized()
    {
        _subscription = EventBus.Subscribe<OrderCreatedEvent>(new Handler(this));
    }

    public void Dispose() => _subscription?.Dispose();

    private class Handler(OrderList parent) : ILocalEventHandler<OrderCreatedEvent>
    {
        public Task HandleEventAsync(OrderCreatedEvent eventData)
        {
            parent._count++;
            parent.StateHasChanged();
            return Task.CompletedTask;
        }
    }
}
```

> **生命周期**：组件 `OnInitialized` 订阅，`Dispose` 释放订阅，防止内存泄漏。

### 测试中的事件消费

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

> **AOP 路径 vs 非 AOP 路径**：
> - AOP 路径（`AddEventDispatch()`）：事件收集到 Bag，`commit` 后才派发
> - 非 AOP 路径：`PublishAsync` 立即派发
> - 测试中需注册 `AddEventDispatch()` 才走 AOP 路径

---

## 二、RPC 事件侧信道（跨进程同步消费）

### 架构原理

```
服务端                          调用方
┌─────────────────┐            ┌─────────────────┐
│ EventDispatchFilter.PostProceed │  HTTP Response
│   ↓                    │  →   │  Header: X-TKWF-Events
│ IRpcEventCollector      │      │  Body: { data }
│   ↓                    │      │  GraphQL: extensions.tkwf.events
│ RpcEventHeaderWriter    │      │
└─────────────────┘            └─────────────────┘
```

### 载体对比

| 协议 | 载体 | 格式 | 限制 |
|:--|:--|:--|:--|
| **REST** | HTTP Header `X-TKWF-Events` | Base64Url(UTF-8 JSON) | 4KB 截断 + `X-TKWF-Events-Truncated: true` |
| **GraphQL** | `extensions.tkwf.events` | JSON 数组 | 同 4KB 限制 |

### Envelope 契约

```json
{
  "events": [
    {
      "name": "OrderCreatedEvent",
      "type": "OrderCreatedEvent",
      "data": { "orderId": 123, "amount": 99.99 },
      "triggeredBy": "user123",
      "timestamp": "2026-08-28T10:30:00Z",
      "correlationId": "req-abc-123"
    }
  ],
  "truncated": false
}
```

| 字段 | 说明 |
|:--|:--|
| `name` | 事件名（类型名去 `Event`/`Eto` 后缀） |
| `type` | CLR 类型全名 |
| `data` | 事件数据（JSON 序列化） |
| `triggeredBy` | 触发者用户名 |
| `timestamp` | 派发时间戳 |
| `correlationId` | 关联 ID（请求追踪） |

### `[DistributedEvent]` 双路语义

| 事件类型 | 本地派发 | Outbox 分布式 | RPC 侧信道 |
|:--|:--:|:--:|:--:|
| 无 `[DistributedEvent]` | ✅ 是 | ❌ 否 | ✅ 是（同步） |
| 带 `[DistributedEvent]` | ❌ 否（Outbox 导出后跳过） | ✅ 是 | ✅ 是（同步 + 异步双路） |

> **⚠️ G15 §5.6 注释与实现不一致**：
> - G15 §5.6 注释："RPC 侧信道仅携带非 [DistributedEvent] 的本地事件"
> - v4.9.69 开发方案 §2.4 + 测试矩阵：**[DistributedEvent] 事件同时进 envelope 且走分布式双路**
> - **以 v4.9.69 + ADR33 为准**，新文章以此为准。

### 消费端现状

| 端 | 状态 | 说明 |
|:--|:--|:--|
| **TS 前端** (`@tkwf/tsclient`) | 📋 规划 | `onEvent(eventName, handler)` 契约待实施（v1.0.8） |
| **.NET Wasm 客户端** | 📋 规划 | 需自建 `FullName→Type` 注册表 |
| **C# 进程内** | ✅ 已实现 | `ILocalEventBus.Subscribe` 直接消费 |

---

## 三、SignalR 实时推送（V5.0 规划）

> **状态**：纯规划（V5.0 通知系统），框架代码无 SignalR 实现文件。

### 架构规划

| 组件 | 说明 |
|:--|:--|
| `INotificationPublisher` | 统一通知发布入口 |
| `INotificationStore` | 通知持久化（未读/已读/分组） |
| `IRealTimeClientMessageSender` | `SendAsync(action, userId, argument)` |
| tkwf-tsclient | 实时接收组件 |

### 与运行时订阅的协同

D15 §5.2：运行时订阅场景表把"SignalR 推送"列为 `Subscribe<T>` 的适用场景——即订阅 API 可支撑 SignalR，集成未实施。

```csharp
// 未来规划
public interface IRealTimeClientMessageSender
{
    Task SendAsync(string action, long userId, object argument);
}

// tkwf-tsclient 端
const socket = new TkwfRealTimeClient();
socket.on("OrderCreated", (data) => { /* UI 刷新 */ });
```

---

## 三条路径选型指南

| 场景 | 推荐路径 | 理由 |
|:--|:--|:--|
| 进程内组件刷新/测试 | **运行时订阅** | 零延迟、零配置、同进程 |
| 跨服务/跨进程调用 | **RPC 事件侧信道** | 随 RPC 响应同步、4KB 限制、自动 Base64Url |
| 实时协作/通知/仪表盘 | **SignalR** | 实时、双向、非请求响应模式 |

> **关键区别**：
> - `PublishAsync`（本地/分布式）= 命令式"发送"
> - `Subscribe` = 声明式"监听"
> - SignalR = 服务端主动推送（非请求响应模式）

---

## 常见问题与避坑

### Q: handler 执行顺序由什么决定？
**A**：SG 编译期派发表按 `[DomainEventHandler]` 类的声明顺序生成。同一事件类型的多个 handler 按编译期顺序串行执行。运行时订阅的 handler 排在 SG 编译期 handler 之后。

### Q: handler 抛异常会怎样？
**A**：`per-handler try/catch` 捕获，log + `IEventDispatchDiagnostics.OnDispatchFailed` 记录，**不重抛**（Oracle P0-4）。后续 handler 继续执行。事务已 commit，不会回滚。

### Q: 如何让 handler 在事务回滚时不执行？
**A**：使用 `PublishAsync`（模式 ①）。AOP 路径下，事件收集到 Bag，commit 失败 → `PostProceedOnException` 检测异常 → `ClearCollectedEvents()` → 事件丢弃。`PostAsync`（模式 ③）绕过 Bag，**不受事务保护**。

### Q: `UseApi<T>()` vs `UseNoAop<T>()` vs `Query<T>()` 有什么区别？
| API | 适用场景 | 事务一致 |
|:--|:--|:--|
| `Use<T>()` | 进程内 AOP 调用 | ✅（AOP 管线） |
| `UseNoAop<T>()` | 绕过 AOP 直连 | ❌ |
| `Query<T>()` | 只读查询（EQR） | ❌ 只读无事务 |

### Q: 如何让 handler 在事务回滚时不执行？
**A**：使用 `PublishAsync`（模式 ①）。AOP 路径下，事件收集到 Bag，commit 失败 → `PostProceedOnException` 检测异常 → `ClearCollectedEvents()` → 事件丢弃。`PostAsync`（模式 ③）绕过 Bag，**不受事务保护**。

### Q: Outbox 和直接发布有什么区别？
`IDistributedEventBus.PublishAsync(event, useOutbox: true)`（默认）：事件先写入 `OutboxEventRecord` DB 表（与业务数据同事务），`OutboxSender` 后台异步消费。事务一致 + 不阻塞请求。
`useOutbox: false`：直接调用 broker publish。如果 broker 不可用，事件丢失。仅在容忍丢失的场景使用。

### Q: 一个事件可以有本地和分布式两个 handler 吗？
可以。标 `[DistributedEvent]` 的事件在 `EventDispatchFilter.PostProceed` 时路由到 `IDistributedEventBus`，`IDistributedEventBus` 的默认实现 `LocalDistributedEventBus` 委托给 `ILocalEventBus`——所以 `IDistributedEventHandler<T>` 和 `ILocalEventHandler<T>` 都会收到。当 RabbitMQ 注册时，`IDistributedEventHandler<T>` 在消费端进程执行，`ILocalEventHandler<T>` 在生产端进程不执行（Outbox 导出后跳过本地派发）。

---

## 版本演进

| 版本 | 关键变更 |
|:--|:--|
| V4.9.64 | 事件机制全链路落地（W2-W10） |
| V4.9.66 | 事件机制 V2 增强（DbDistributedLock + Inbox 清理 + 跨租户事件传播） |
| V4.9.68 | 双场景完善（三态作用域/授权读写分离/客户端租户传播） |
| V4.9.69 | RPC 侧信道（ADR33） |
| V4.9.70 | ADR35 统一门控体系 |

---

## 参考

- [ADR33](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR33-RPC响应携带事件-领域事件同步传播.md) — RPC 事件侧信道架构决策
- [v4.9.69](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/V4/v4.9.69-RPC响应携带事件-开发方案.md) — 服务端实现细节
- [D15](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D15-事件总线与消息基础设施-设计方案.md) §5.2/5.6/10.2
- [G15](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G15-事件机制-使用指南.md) §4.7/5.5/5.6
- [ADR33](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR33-RPC响应携带事件-领域事件同步传播.md) — RPC 侧信道架构决策
- [ADR33](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR33-RPC响应携带事件-领域事件同步传播.md) — RPC 侧信道架构决策

---

> **下一步**：阅读 [后台作业](background-jobs.md) 了解事件在后台作业中的派发模式。