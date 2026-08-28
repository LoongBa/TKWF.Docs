---
title: 事件的表现层消费
description: TKWF 事件在表现层的三种消费路径：运行时订阅（Blazor 刷新）、RPC 事件侧信道、SignalR 实时推送
---

# 事件的表现层消费

> ⚠️ 本文为规划占位（设计方案 §3.2.1-B2，从 event-bus.md 拆出）。内容待补，将覆盖：运行时订阅（`Subscribe<T>` + Blazor 组件刷新模式 + 测试断言）、RPC 事件侧信道（`X-TKWF-Events` / `extensions.tkwf.events` / 4KB 截断 / envelope 契约）、SignalR 实时推送（V5 规划）、三路径选型 + 纠正 G15 §5.6 与 v4.9.69 的 `[DistributedEvent]` 双路不一致。
> 引用源文档：ADR33 · v4.9.69 · G15 §4.7/5.6