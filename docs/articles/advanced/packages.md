---
title: NuGet 包索引
description: TKWF.Framework 全部 NuGet 包清单，按职责分层组织。
---
# NuGet 包索引

> 按职责分层组织的全部 NuGet 包。安装核心包 `TKWF.Domain` 即可开始。

## 核心框架

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain` | 领域框架核心（DomainUser、AOP、`[GenerateController]`） |
| `TKWF.Core` | 核心基础设施 |
| `TKWF.Abstractions` | 共享抽象层 |
| `TKWF.Utility` | 运行时工具库（含 `TKWF.Utility.Cryptography` 密码学工具——AES-GCM、RSA、HMAC、SecurePassword；`TKW.Framework.Utility.Tags` 标签算法；ADR52 收纳） |

## 基础设施集成

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain.Web` | Web 集成（Session 中间件、HttpContext 适配） |
| `TKWF.Domain.Blazor` | Blazor 集成（Server + WASM） |
| `TKWF.Domain.Maui` | MAUI 集成 |
| `TKWF.Domain.FreeSql` | FreeSql ORM 适配 |

## 传输层

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain.ApiService.HotChocolate` | GraphQL 传输层（HotChocolate 16） |
| `TKWF.Domain.ApiService.MinimalApi` | REST 传输层（Minimal API） |

## 客户端 SDK

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain.ApiClient` | RPC 客户端核心 |
| `TKWF.Domain.ApiClient.GraphQL` | GraphQL 客户端 |
| `TKWF.Domain.ApiClient.Rest` | REST 客户端 |

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
dotnet add package TKWF.Domain.ApiService.HotChocolate

# REST 传输层
dotnet add package TKWF.Domain.ApiService.MinimalApi

# FreeSql ORM 适配
dotnet add package TKWF.Domain.FreeSql

# 前端 TS 客户端
npm install @tkwf/tsclient
```

> → 详见 [快速开始](../getting-started.md) · [配置参考](configuration.md)
