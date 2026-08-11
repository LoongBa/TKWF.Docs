---
title: 源文档映射表
description: TKWF 源文档 D/G/T/xCodeGen 系列与公开文章的完整映射表
---
# 源文档映射表

> 本文档建立 TKWF 源文档（`_TKWF/docs/`）与公开文档站文章的对应关系，
> 便于 Agent 与贡献者定位权威来源。

---

## 核心概念

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `D00-TKWF.Domain-领域自治框架-V4-设计方案.md` | [框架概览](../intro.md) | 领域自治核心设计 |
| `D01-Domain运行时上下文.md` | [DomainUser 详解](../core-concepts/domain-user.md) | 运行时上下文机制 |
| `D03-AOP拦截与事务.md` | [AOP 管线详解](../core-concepts/aop-pipeline.md) | AOP 静态拦截 |
| `D04-领域初始化器设计-模板方法体系与内置能力.md` | [Web 集成](../integration/web.md) | 初始化器钩子体系（V4.9.21+） |
| `D05-宿主集成与配置V2-Web-Blazor-MAUI-Testing.md` | [配置参考](../advanced/configuration.md) | 宿主集成与 cfg 强契约 |
| `D06-领域数据服务与数据存取设计.md` | [数据层架构](../explanation/data-layer-architecture.md) | DataService 数据存取 |
| `D07-三层SG-原则和设计方案.md` | [代码生成管线](../core-concepts/code-generation.md) | 三层 SG 管线 |

## 传输与客户端

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `D07A-RPC-远程过程调用-设计方案V2.md` | [RPC 传输](../transport/rpc.md) | RPC 远程调用 |
| `G07F-RPC-前端客户端-ts-client-使用指南.md` | — | TypeScript 客户端（独立仓库 tkwf-tsclient，V4.9.22+） |
| `D02-多形态客户端认证架构.md` | [认证与授权](../security/authentication.md) | 客户端认证架构总览（V4.9.26 起拆分：D02A 进程内 Console/CLI/后台/测试、D02B 进程内 WebServer/BlazorServer/MAUI、D02C 进程外 Wasm/BlazorWasm、D02D 进程外 ts-client/React/Vue/小程序） |

## 安全与会话

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `D11-系统角色-SystemActor-设计方案.md` | [SystemActor 体系](../explanation/system-actor-explained.md) | 系统角色 |
| `G05-宿主集成与配置V2指南.md` | [Web 集成](../integration/web.md) | 宿主集成指南 |

## 数据与查询

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `G06-领域数据服务与数据存取使用指南.md` | [DataService](../core-concepts/data-services.md) | 数据服务使用 |
| `G06B-条件表达式构建器使用指南.md` | [条件构建器](../advanced/conditions-builder.md) | 条件表达式 |
| `G07Q-增强查询-QueryApi-使用指南.md` | [查询指南](../advanced/query-guide.md) | QueryApi 增强查询 |

## Agentic 专用

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `AC-Kit/guides/Agent-TKWF使用行为守则.md` | [AI 快速上手](../agentic/quick-start-for-ai.md) | 框架级 Agent 行为守则（V4.9.22+） |
| `AC-Kit/guides/SG架构规则.md` | [SG 管线解剖](../explanation/sg-pipeline-anatomy.md) | SG 架构规则 |
| `AC-Kit/guides/生成代码防绕过规则.md` | [AI 快速上手](../agentic/quick-start-for-ai.md) | 生成代码防绕过 |

---

> 对齐 TKWF：V4.9.26 · 2026-08-10



