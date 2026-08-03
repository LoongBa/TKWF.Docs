---
title: 框架概览
description: TKWF.Domain 框架概览：领域自治、编译期 AOP、代码生成管线、多协议传输等核心概念
---
# 框架概览

TKWF.Domain 是一个面向 **Agentic Coding** 时代的 .NET 10 领域驱动设计框架。
核心理念是"声明式标注 → 全自动生成"——让 AI 专注于业务逻辑，框架负责管道代码。

---

## 核心理念：领域自治

传统 DI 容器模式中，Service 依赖的 DomainUser 来自容器，可能与其他请求"串号"：

```text
传统模式：
  DI 容器 → 创建 Service(DomainUser User, ...)
  → DomainUser 来自 DI
  → Service 与 User 连接池中随机一个，可能"串号"

领域自治模式：
  User.UseNoAop<TService>() → 显式传入 this（当前 User）
  → Service 的 User 就是调用方的 User，不可能串号
```

**这对 AI 意味着什么？**
- 不需要理解复杂的 DI 注册流程
- 代码行为完全可预测
- 结果可验证，不存在隐式依赖

## 三层架构

```text
┌─────────────────────────────────────────────┐
│             Controller / API 层              │ ← AOP 边界
│  [AuthorityFilter] [Transactional] [...]     │
│  User.Use<IAopContract>() ───→ AOP 管线     │
├─────────────────────────────────────────────┤
│              Service / 业务层                │
│  User.UseNoAop<TService>() ─→ 域内调用      │
├─────────────────────────────────────────────┤
│              DataService / 数据层            │
│  CRUD + Conditions 查询                     │
└─────────────────────────────────────────────┘
```

## 代码生成管线

框架内置 4 个 Source Generator，在编译期自动生成代码：

| SG | 职责 | 生成物 |
|:---|:-----|:-------|
| SG#1 | 扫描框架内置 Controller | API 表面元数据 |
| SG#2 | 生成 GraphQL Resolver / REST 端点 | `*Resolver.g.cs`, `*RestEndpoints.g.cs` |
| SG#3 | 生成客户端代理 | `*Client.g.cs` |
| SG#4 | 为 `[GenerateController]` 生成 AOP 控制器 | `I*Controller.g.cs`, `*ControllerDecorator.g.cs` |

## 两条控制器路径

| 路径 | 模式 | 适用场景 |
|:----|:-----|:---------|
| **A — 契约先行** | 手写 Controller + IAopContract 接口 | 复杂业务、需要精细控制 AOP 拦截 |
| **B — 标注驱动** | `[GenerateController]` 标注 Service | 简单 CRUD、AI 生成场景 |

两条路径均为一等公民。SG#2 统一为它们生成 Resolver，无需手写。

## 安全体系

- **Challenge-Response 登录** — 防重放、防密码泄露
- **AuthorityFilter** — 声明式方法级权限控制
- **Role-based 访问控制** — 基于角色判断是否授权
- **Session 管理** — WebSession 中间件，自动绑定 DomainUser

## 多协议传输

一份 Service 定义，自动暴露三种协议：

| 协议 | 实现 | 包 |
|:-----|:-----|:---|
| GraphQL | HotChocolate 16 | `TKWF.Domain.ApiService.HotChocolate` |
| REST | Minimal API | `TKWF.Domain.ApiService.MinimalApi` |
| RPC | ApiClient | `TKWF.Domain.ApiClient` |

## 继续阅读

- [深入 DomainUser 机制](core-concepts/domain-user.md)
- [AOP 管线详解](core-concepts/aop-pipeline.md)
- [代码生成管线](core-concepts/code-generation.md)
- [认证与授权](security/authentication.md)
- [配置参考](advanced/configuration.md)