---
title: 后台作业
description: TKWF 后台作业：IBackgroundJobManager、[BackgroundJob] 特性、SystemActor 自动绑定、租户上下文恢复
---

# 后台作业

> ⚠️ 本文为规划占位（设计方案 §3.2.1-B1，从 event-bus.md 拆出）。内容待补，将覆盖：`[BackgroundJob]` + `IBackgroundJobManager` 入门、SystemActor 自动绑定、租户上下文恢复（tenantId）、事件派发非 AOP 路径、现状边界（进程内立即执行、JobRecord 持久化未接线）、Hangfire/Quartz Provider 扩展点。
> 引用源文档：ADR23 · D15 §5.4 · G15 §4.6/5.2