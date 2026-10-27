---
title: NuGet 包索引
description: TKWF.Framework 主要 NuGet 包清单，按职责分层组织。
---
# NuGet 包索引

> 按职责分层组织的**主要 NuGet 包**（完整清单以仓库 csproj 为准：框架内 `_Framework/`、`_Domain.Api/`、`_Domain.ApiService/`、`_Domain.Infrastructure/` 等目录下的项目皆发布为独立包）。安装核心包 `TKWF.Domain` 即可开始。

## 核心框架

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain` | 领域框架核心（DomainUser、AOP、`[GenerateController]`） |
| `TKWF.Core` | 核心基础设施（netstandard2.1） |
| `TKWF.Abstractions` | 共享抽象层（netstandard2.0） |
| `TKWF.CodeGeneration` / `TKWF.CodeGeneration.Abstractions` | 编译期生成器 + 契约（netstandard2.0） |
| `TKWF.Utility` | 运行时工具库（含 `TKWF.Utility.Cryptography` 密码学工具——AES-GCM、RSA、HMAC、SecurePassword；`Utility.DataPort`/`MiniExcel`；`TKW.Framework.Utility.Tags` 标签算法；ADR52 收纳） |
| `TKWF.Framework.Localization` | i18n 本地化（V4.10.33+） |

## 基础设施集成

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain.Web` | Web 集成（Session 中间件、HttpContext 适配） |
| `TKWF.Domain.Blazor.Server` | Blazor Server 集成 |
| `TKWF.Domain.Blazor.Wasm` | Blazor WASM 集成 |
| `TKWF.Domain.Blazor.Abstractions` | Blazor 共享抽象（页面装配等） |
| `TKWF.Domain.Maui` | MAUI 集成 |
| `TKWF.Domain.FreeSql` | FreeSql ORM 适配（主 ORM） |
| `TKWF.Domain.EFCore` | EF Core ORM 适配（备选） |

## 传输层

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain.Api.HotChocolate` | GraphQL 传输层（HotChocolate 16） |
| `TKWF.Domain.Api.MinimalApi` | REST 传输层（Minimal API） |
| `TKWF.Domain.ApiService.Hosting` | 服务端宿主装配（流式配置链） |

## 客户端 SDK

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain.Api` | RPC 客户端核心（**含 GraphQL 传输**，基座包） |
| `TKWF.Domain.Api.Rest` | REST 客户端 |

> **注**：不存在独立的 `TKWF.Domain.ApiClient.GraphQL` 包——GraphQL 客户端能力包含在基座包 `TKWF.Domain.Api` 内（csproj 项目名 `ApiClient`，发布包名 `TKWF.Domain.Api`）。

## 后台作业 / 事件总线

| 包名 | 说明 |
|:----|:-----|
| `TKWF.BackgroundJobs` | 后台作业内置轻量实现（进程内 DB 队列） |
| `TKWF.BackgroundJobs.Hangfire` | Hangfire Provider |
| `TKWF.BackgroundJobs.Quartz` | Quartz Provider |
| `TKWF.EventBus.RabbitMQ` | 分布式事件总线（RabbitMQ） |
| `TKWF.Outbox` | Outbox-Inbox 可靠投递 |

## 测试辅助

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain.Testing.xUnit` | 测试宿主与容器辅助（`DomainXunitTestBase`） |
| `TKWF.Domain.Testing.Mock` | `MockDbEntityDAC`（唯一内存 DAC）+ Bogus 数据 |

## 前端 TypeScript 客户端

> 独立 npm 包，不在 NuGet 体系内。

| 包名 | npm | 说明 |
|:----|:----|:-----|
| `@tkwf/tsclient` | [npm](https://www.npmjs.com/package/@tkwf/tsclient) | TS 客户端 SDK，API 形态与 C# ApiClient 完全镜像 |
| `@tkwf/tsclient-mock` | [npm](https://www.npmjs.com/package/@tkwf/tsclient-mock) | 两级 Mock 测试（离线 MockTransport + HTTP MockHttpServer） |

## 快速安装

```shell
# 后端核心
dotnet add package TKWF.Domain

# GraphQL 传输层
dotnet add package TKWF.Domain.Api.HotChocolate

# REST 传输层
dotnet add package TKWF.Domain.Api.MinimalApi

# FreeSql ORM 适配
dotnet add package TKWF.Domain.FreeSql

# 前端 TS 客户端
npm install @tkwf/tsclient
```

> → 详见 [快速开始](../getting-started.md) · [配置参考](configuration.md)