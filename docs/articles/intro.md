---
title: 框架概览
description: TKWF.Domain — 为 Agentic Engineering 时代设计的 .NET 10 领域自治框架。声明式标注，编译期全自动生成 Controller、AOP 装饰器、GraphQL/REST 端点、强类型客户端代理。
---
# 框架概览

> **TKWF.Domain** — 让 AI 写 Service，框架负责剩下的。

一个 `[GenerateController]` 标注，编译期自动生成 Controller + AOP 装饰器 + GraphQL/REST 端点 + 强类型客户端代理。零运行时反射，零 DI 串号，代码行为对 AI 完全可预测。

---

## 💭 设计哲学："思想件"

**TKW = Thinking Ware，"思想件"**——开发者是软件开发的灵魂，框架是服务于灵魂的"件"。哪怕 AI 时代亦不曾、不会改变。

TKWF 经历了四个时代的演进，一条主线贯穿始终——**让框架越来越不挡路**：

| 版本 | 时代 | 哲学 | 手段 |
|:--|:--|:--|:--|
| V1 | 2006 | 分离 | 表现层与逻辑分离 |
| V2 | — | 去臃肿 | partial 特性替代继承体系 |
| V3 | — | 自治 | 动态代理实现领域自治 |
| V4 | 2024+ | 可靠 | 编译期约束让 AI 代码天然可靠 |

V4 是最彻底的一步：恰逢 VibeCoding 流行，但选择了工程化约束——在人编程时代太重，在人机协同时代反而是优势。**AI 不需要自由，需要可靠的护栏。**

> 框架不做思考，但让思考有器可依。编译期约束是渠，AI 思考是水，水入渠则不泛滥。

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

同一个 Service，无需修改一行代码，同时暴露三种协议。**默认三协议，可扩展**（如 OData）：

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

## 📊 框架级 CQRS：Entity 写模型 / VEntity 读模型

TKWF 在类型系统级实现读写分离——Entity 负责写，VEntity 专用于查询、统计和聚合：

```csharp
// 写模型 — Entity
public class Order : Entity { ... }

// 读模型 — VEntity（专用于查询，框架阻止写操作）
[DomainGenerateCode(IsView = true, AutoQuery = true)]
public class OrderSummaryView : VEntity
{
    // ViewSql 定义 SQL 视图 + 编译期列名校验
    // AutoQuery 自动生成 QueryController（消除 80% 手写查询 Service）
}
```

**读写分离是类型级强制的**：VEntity 不生成 DataService、不允许写操作、默认暴露 GraphQL。这不是约定，是框架级硬约束。

### EQR 统一查询入口

`User.Query<T>()` → EQR → `IEntityReadOnlyDAC` → `IQueryable`，3 跳零反射。V4.9.40 将原 8 跳路径重构为 3 跳，消除反射和死代码。

### 三端统一查询 API

无论进程内还是进程外，开发体验保持一致：

```csharp
// C# 进程内（完整 LINQ）
var list = await User.Query<Order>()
    .Where(o => o.Status == "Paid")
    .OrderBy(o => o.CreatedAt)
    .Page(1, 20)
    .ToPageAsync();
```

```typescript
// TS 前端（API 表面同构）
const list = await Tkwf.User.Query<Order>()
    .where(f => f.status.eq("Paid"))
    .orderBy(f => f.createdAt)
    .page(1, 20)
    .toPageAsync();
```

### AutoQuery + ViewSql + StatsDto

- **AutoQuery**：`[DomainGenerateCode(AutoQuery=true)]` → SG 自动生成 QueryController（List + Count），消除 80% 手写查询 Service
- **ViewSql**：SQL 视图定义 + **编译期列名校验**（SG1a warning + 运行时启动阻断）
- **StatsDto**：xCodeGen自动从 ViewSql 的 `SUM/COUNT/AVG` 生成统计 DTO

> → 深入了解：[数据服务](core-concepts/data-services.md) · [查询指南](advanced/query-guide.md)

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
- **SystemActor** — 系统角色体系，区分人/系统写入审计（`IEntityActorAuditable` + `ISystemActorService`）。后台 Job / OAuth 回调 / AI Agent 调用均有可审计的系统身份
- **错误码全栈统一** — 16 码四端一致（GraphQL / REST / .NET / TS）

> → 深入了解：[认证与授权](security/authentication.md) · [异常处理](advanced/error-handling.md)

---

## 🤖 为 Agentic Engineering 而生

TKWF 的架构约束让 AI 生成代码**结构性可靠**：

- **编译期约束** — SG 在编译时验证所有结构性契约（20+ 诊断），不合规直接报错
- **两道防线** — 编译器拦截结构性错误（接口/返回类型/命名/架构边界）；运行时拦截行为错误（授权/验证/事务）
- **粒度细分** — 元数据管线分三层（SG1→SG2→SG3），每层职责单一，Agent 无需理解全局架构
- **7 个框架级 Skills** — 设计→实体→业务→测试→前端→Mock，Agent 按 skill 分步完成开发
- **活文档替代源码** — Agent 读 `.TKWF/{Domain}/` 薄索引（DOMAIN_MAP / DataService_API / Business.md），不读 500+ 行生成代码

```
人定意图（声明式标注）
    → AI 按 skill 写实现（Service 业务逻辑）
    → 框架管生成（Controller + AOP + 端点 + 客户端）
    → 编译期验证（结构性不合规直接报错）
    → 运行时兜底（授权/验证/事务 AOP 拦截）
```

> 架构设计降低 Agent 上下文加载和推理复杂度——方向上支持轻量模型和 token 优化。

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

## 🤖 Agentic Engineering 基础设施

TKWF 不只是框架，还自带让 Agent 端到端完成开发的基础设施：

### 7 个框架级 Skills

将需求分析文档交给 Agent，按 skill 分步编写 Entity / Service / UI 即可完成开发：

| Skill | 职责 |
|:--|:--|
| `tkwf-design` | 设计阶段（需求→R/S/DS/U 文档 + HANDOVER） |
| `tkwf-business` | 业务规则物化（`.TKWF/{Domain}/Business.md`） |
| `tkwf-entity` | Entity / VEntity 编写 |
| `tkwf-service` | DomainService 编写 |
| `tkwf-test` | Contract 测试（InMemory DAC） |
| `tkwf-tsclient` | 前端 RPC 调用 |
| `tkwf-tsclient-mock` | Mock 数据生成 |

**增量变更路由**：`TKWF_Rules.md` 路由中枢分类变更信号 → 加载匹配 skill → `Business.md` 门控确保业务规则先物化。Agent 只加载当前域的薄索引，不读整个代码库。

### ts-client — 前后端开发体验一致

TS 客户端 SDK（`@tkwf/tsclient`），API 形态与 C# ApiClient **完全镜像**：

```typescript
// TS 前端（与 C# 后端相同形态）
const service = Tkwf.User.Use<OrderService>();
const todo = await service.createAsync("买咖啡");

const list = await Tkwf.User.Query<Todo>()
    .where(f => f.title.contains("买"))
    .orderBy(f => f.id)
    .page(1, 10)
    .toPageAsync();
```

### ts-client-mock — 两级 Mock 测试

`@tkwf/tsclient-mock` 提供两级 mock，Agent 无需运行后端即可自验证全栈：

| 级别 | 机制 | 场景 |
|:--|:--|:--|
| **离线 Mock** | `MockTransport`（Transport 接口注入，零依赖） | 单元测试，无需服务器 |
| **HTTP Mock** | `MockHttpServer`（node:http HTTP 服务器） | 集成测试，模拟 WebApi |

> → 深入了解：[AI 快速上手](agentic/quick-start-for-ai.md) · [源文档映射表](agentic/source-doc-map.md)

---

## 📦 包索引

核心包 `TKWF.Domain` 一行安装即可开始。完整 NuGet 包清单和 npm 前端包见二级页面。

→ [NuGet 包索引](advanced/packages.md)

---

## 🗺️ V5.0 路线图

> V4.9.x 聚焦 Agentic Engineering 基础设施完善。V5.0 将在以下方向增强：

| 方向 | 状态 | 说明 |
|:--|:--|:--|
| 领域事件 + 扩展/插件机制 | 🔬 设计中 | 适配 .NET 10+ 及成熟项目经验，含动态加载。当前版本有 Tools 扩展概念但未框架级支持，将升级为完整机制 |
| 分布式 / 微服务 | 💬 讨论中 | 老版本基于自有架构，V5.0 将基于成熟项目重新设计实现 |
| Agent UI 组件库 | 📋 规划中 | MVC / Blazor WASM / HTML 三端 UI 组件，方便 Agent 提高 UI 开发效率 |

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
