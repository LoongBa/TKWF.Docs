---
title: API 参考
description: TKWF 框架 API 参考总览——按程序集分组的命名空间导航（构建期由源码 XML 注释生成）
---

# API 参考

> 本区内容由 DocFX **metadata** 在构建期从框架源码 XML 注释自动生成（`docs/api/*.yml` 不入库，仅本页与 `toc.yml` 为手写入口）。
> 覆盖范围：`_Framework`（Domain / Core / Abstractions / Utility / BackgroundJobs / Localization / Outbox / EventBus）、`_Domain.Api`（ApiClient）、`_Domain.ApiService`（MinimalApi / HotChocolate / Hosting）、`_Domain.Infrastructure`（Web / Blazor / MAUI / FreeSql / EFCore）。

左侧导航按命名空间展开完整树；下表给出常用入口。

## 核心

| 命名空间 | 说明 |
|:---|:---|
| <xref:TKW.Framework.Domain> | 领域层核心——`DomainServiceBase`、`DomainUser`、`IDomainUser`、`DomainControllerBase`、AOP 过滤器选项 |
| <xref:TKW.Framework.Core> | 内核——认证/授权、相关 ID、限流、特性开关等横切能力 |
| <xref:TKW.Framework.Abstractions> | 契约与诊断——`TKWFDiagnostic`、数据库提供程序与严重级标注 |
| <xref:TKW.Framework.Domain.Interfaces> | 数据访问契约——`IEntityDAC`、`IDataService` 等 |
| <xref:TKW.Framework.Domain.Query> | EQR 查询入口与条件构造 |
| <xref:TKW.Framework.Domain.Session> | 会话上下文与作用域 |
| <xref:TKW.Framework.Domain.Ticket> | 票据契约（赎回上下文与消费配额） |

## 传输与集成

| 命名空间 | 说明 |
|:---|:---|
| <xref:TKW.Framework.Domain.Web> | ASP.NET Core 集成——`Use<T>()`、中间件管线、异常边界 |
| <xref:TKW.Framework.Domain.Web.Authentication> | 认证管线与 HttpAuth 锚点 |
| <xref:TKW.Framework.Domain.Web.Pages> | 表现层页面装配（PageAssembly） |
| <xref:TKW.Framework.Domain.ApiService.HotChocolate> | GraphQL 通道（HotChocolate 16） |
| <xref:TKW.Framework.Domain.ApiService.MinimalApi.Hosting> | REST 通道（Minimal API） |
| <xref:TKW.Framework.Domain.ApiClient> | RPC 客户端基座 |
| <xref:TKW.Framework.Domain.ApiClient.Rest> | REST 客户端实现 |

## 基础设施

| 命名空间 | 说明 |
|:---|:---|
| <xref:TKW.Framework.Domain.FreeSql> | FreeSql 数据访问实现 |
| <xref:TKW.Framework.Domain.EFCore> | EF Core 数据访问实现 |
| <xref:TKW.Framework.Domain.Blazor.Abstractions.Extensions> | Blazor 抽象（Server / WASM 共用） |
| <xref:TKW.Framework.Domain.Blazor.Server.Extensions> | Blazor Server 集成 |
| <xref:TKW.Framework.Domain.Blazor.Wasm.Extensions> | Blazor WASM 集成 |
| <xref:TKW.Framework.Domain.Maui.Hosting> | MAUI 宿主集成 |
| <xref:TKW.Framework.BackgroundJobs> | 周期/后台作业（含 Hangfire / Quartz 提供程序） |
| <xref:TKW.Framework.Localization> | 国际化（resx → JSON 发射与贡献者） |
| <xref:TKW.Framework.EventBus.RabbitMQ> | 事件总线（RabbitMQ） |
| <xref:TKW.Framework.Domain.Events.Outbox> | Outbox 跨进程投递 |

## 代码生成

| 命名空间 | 说明 |
|:---|:---|
| <xref:TKW.Framework.CodeGeneration> | xCodeGen / SG 生成期契约 |

> 使用说明见 [入门指南](../articles/getting-started.md) 与 [框架概览](../articles/intro.md)。
