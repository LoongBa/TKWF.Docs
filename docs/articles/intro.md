---
title: 框架概览
description: TKWF.Domain — 为 Agentic Coding 时代设计的 .NET 10 领域自治框架。声明式标注，编译期全自动生成 Controller、AOP 装饰器、GraphQL/REST 端点、强类型客户端代理。
---
# 框架概览

> **TKWF.Domain** — 让 AI 写 Service，框架负责剩下的。

一个 `[GenerateController]` 标注，编译期自动生成 Controller + AOP 装饰器 + GraphQL/REST 端点 + 强类型客户端代理。零运行时反射，零 DI 串号，代码行为对 AI 完全可预测。

---

## ✨ 为什么是 TKWF？

传统 .NET 框架的痛点：DI 容器串号、动态代理不确定性、手写 Controller 重复劳动、协议迁移成本高。TKWF 从第一性原理出发，用**编译期 Source Generator** 替代运行时反射，用**领域自治**替代 DI 容器注入。

| 维度 | 传统 DI 框架 | TKWF.Domain |
|:-----|:------------|:------------|
| AOP 实现 | 运行时动态代理（反射 + IL Emit） | 编译期 SG 生成装饰器，零运行时反射 |
| DI 依赖 | Service 依赖容器注入 DomainUser，存在串号风险 | DomainUser 自持实例化，`Use<T>()` 显式传递，物理隔离 |
| API 暴露 | 手写 Controller + 手动注册路由 | `[GenerateController]` 一标注，SG 自动生成 GraphQL + REST 端点 |
| 客户端生成 | 手写或用 NSwag/Swagger 生成 | SG#3 编译期生成强类型客户端代理，与服务端同源 |
| AI 可预测性 | DI 生命周期、动态代理行为难以预测 | 编译期生成，代码可见可调试，AI 生成结果与手写一致 |
| 带宽优化 | 需手写 DTO 或 GraphQL field selection | REST `?fields=User.Name` 原生投影 + GraphQL selection 自动裁剪 |

---

## 🧩 领域自治：消灭 DI 不确定性

DomainUser **不进 DI 容器**，而是通过 `Use<T>()` 显式传递。调用方的 User 就是 Service 的 User，物理隔离，不可能串号。

```csharp
[GenerateController]
public class OrderService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    public async Task<Order> CreateAsync(string title)
    {
        // User 就是当前请求的用户，确定性的
        return await Repository.InsertAsync(new Order
        {
            Title = title,
            UserId = User.UserId  // ← 不依赖任何外部状态
        });
    }
}
```

> → 深入了解：[DomainUser 详解](core-concepts/domain-user.md)

---

## 🪄 声明式标注 → 全自动生成

写一个 Service，标注 `[GenerateController]`，编译期 SG 自动产出：

```
你的代码                    编译期自动生成
───────────               ─────────────────────────
GreetingService.cs    →    IGreetingServiceController.g.cs   (契约接口)
                       →    GreetingServiceControllerDecorator.g.cs  (AOP 装饰器)
                       →    GreetingServiceResolver.g.cs     (GraphQL Resolver)
                       →    GreetingServiceEndpoints.g.cs    (REST 端点)
                       →    GreetingServiceClient.g.cs       (客户端代理)
```

**你只写业务逻辑。** 权限拦截、事务管理、路由注册、序列化、客户端代理——全部编译期生成，零手写样板。

> → 深入了解：[代码生成管线](core-concepts/code-generation.md) · [AOP 管线详解](core-concepts/aop-pipeline.md)

---

## 🔌 一份 Service，三端自动暴露

同一个 Service，无需修改一行代码，同时暴露三种协议：

```csharp
// 你只写这一份
[GenerateController]
public class TodoService(DomainUser<AppUserInfo> user) : DomainServiceBase<AppUserInfo>(user)
{
    public async Task<Todo> CreateAsync(string title) { ... }
    public async Task<List<Todo>> GetMyTodosAsync() { ... }
}
```

```graphql
# GraphQL 自动暴露
mutation { createTodo(title: "买咖啡") { id title } }
query { myTodos { id title } }
```

```
# REST 自动暴露
POST   /api/todo/create?title=买咖啡
GET    /api/todo/my-todos?fields=Id,Title
```

REST 端点原生支持 `?fields=` 投影——嵌套属性树形裁剪，按需返回，减少带宽。

> → 深入了解：[GraphQL 传输](transport/graphql.md) · [REST 传输](transport/rest-minimal-api.md) · [RPC 远程调用](transport/rpc.md)

---

## 🔐 安全体系：声明式权限 + Challenge-Response

权限控制不需要手写 `if`，一个标注搞定：

```csharp
[GenerateController]
public class ReportService(DomainUser<AppUserInfo> user) : DomainServiceBase<AppUserInfo>(user)
{
    [AuthorityFilter(Roles = "Admin")]           // ← 声明式权限
    [Transactional]                               // ← 声明式事务
    public async Task<Report> GenerateReportAsync() { ... }
}
```

- **Challenge-Response 登录** — 防重放、防密码泄露
- **AuthorityFilter** — 声明式方法级权限，AOP 管线自动拦截
- **SystemActor** — 系统角色体系，`DomainUser` 永不为空（后台 Job / OAuth 回调不再 null-check 泛滥）
- **错误码全栈统一** — 8 码四端一致（GraphQL / REST / .NET / TS）

> → 深入了解：[认证与授权](security/authentication.md) · [异常处理](advanced/error-handling.md)

---

## 🤖 为 Agentic Coding 而生

TKWF 的架构约束让 AI 生成代码**天然可靠**：

- **编译期约束** — SG 在编译时验证所有契约，AI 生成的不合规代码直接报错
- **粒度细分** — 元数据管线分三层（SG1→SG2→SG3），每层职责单一，AI 无需理解全局架构
- **零歧义契约** — `[GenerateController]` 标注即完整契约，AI 只需写 Service，框架约束剩余全部
- **轻量模型可用** — DeepSeek V4 Flash 级模型即可高质量完成，Token 消耗与成本大幅降低

```
人定意图（声明式标注）
    → AI 写实现（Service 业务逻辑）
    → 框架管生成（Controller + AOP + 端点 + 客户端）
    → 编译期验证（不合规直接报错）
```

> → 深入了解：[AI 快速上手](agentic/quick-start-for-ai.md) · [源文档映射表](agentic/source-doc-map.md)

---

## 🏗️ 三层职责边界

```
                         领域层（包含全部业务）
                ┌─────────────────────────────────────────────┐
                │ Entity / Dto          — 数据模型 + 内联验证     │
                │ DataService            — CRUDQ + IQueryable   │
                │ Service               — 业务规则 + 状态机      │
                │ Controller            — 编排入口（AOP 标注）    │
                └───────┬──────────────────────────┬───────────┘
                        │ Domain 内部               │
                        ▼                          │
                   SG 生成（编译期）                  │
                ┌───────────────────────────┐        │
                │ AOP 装饰器（PreFilter →     │        │
                │   Proceed → PostFilter）    │        │
                └───────────┬───────────────┘        │
                            │                          ▼
                接入层（SG2 自动生成，零业务代码）         
                ┌────────────────────────────────────┐
                │ GraphQL Resolver                   │
                │ REST 端点 (Minimal API)            │
                └──────┬─────────────────────────────┘
                       │ GraphQL / REST over HTTP
                       ▼
                表现层（SG3 自动生成，声明式消费）
                ┌─────────────────────────────────────┐
                │ C# 客户端代理  → User.Use<T>()       │
                │ TS 客户端 SDK  → Tkwf.Use<T>()      │
                └─────────────────────────────────────┘
```

**领域层是业务的唯一载体。** 接入层和表现层代码全部由 SG 自动生成，不包含任何业务判断。

---

## 📦 NuGet 包

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain` | 领域框架核心（DomainUser、AOP、`[GenerateController]`） |
| `TKWF.Domain.Web` | Web 集成（Session 中间件、HttpContext 适配） |
| `TKWF.Domain.ApiService.HotChocolate` | GraphQL 传输层（HotChocolate 16） |
| `TKWF.Domain.ApiService.MinimalApi` | REST 传输层（Minimal API） |
| `TKWF.Domain.ApiClient` | RPC 客户端核心 |
| `TKWF.Domain.FreeSql` | FreeSql ORM 适配 |
| `TKWF.Domain.Maui` / `TKWF.Domain.Blazor` | MAUI / Blazor 集成 |

---

## 🚀 继续探索

| 我想... | 去哪里 |
|:-------|:-------|
| 5 分钟跑通第一个 Service | [快速开始](getting-started.md) |
| 理解 DomainUser 为什么不串号 | [DomainUser 详解](core-concepts/domain-user.md) |
| 看 AOP 管线怎么拦截 | [AOP 管线详解](core-concepts/aop-pipeline.md) |
| 了解三层 SG 生成什么 | [代码生成管线](core-concepts/code-generation.md) |
| 配置认证和授权 | [认证与授权](security/authentication.md) |
| 选 GraphQL 还是 REST | [传输协议选型](decision-guides/choose-transport.md) |
| 让 AI 帮我写 Service | [AI 快速上手](agentic/quick-start-for-ai.md) |
| 看全部源文档索引 | [源文档映射表](agentic/source-doc-map.md) |
