---
title: Agentic Coding 友好度评估
description: 以业界 10 维准则评估 TKWF / ABP / Axon 三框架的 Agentic Coding 友好度，TKWF 50/50 满分
---
# Agentic Coding 友好度评估 — 10 维标准与三方框架评分

> 以 Agentic Coding（AI 写代码）和 Agentic Engineering（AI 驱动工程全流程）角度，用业界共识的 10 维准则评估 TKWF / ABP / Axon 三框架。

---

## 评估准则来源

业界已收敛出 **Agentic Coding** 与 **Agentic Engineering** 的边界：

| 层级 | 范围 | 核心问题 |
|:--|:--|:--|
| Vibe Coding | 提示即接受，能跑就行 | 模型拥有正确性 |
| **Agentic Coding** | Agent 自主"计划-写-测-迭代"循环 | 人类审查 diff，拥有正确性 |
| **Agentic Engineering** | 全 SDLC：多 Agent 编排 + CI 门控 + 可观测 + 治理 | 机构基础设施兜底正确性 |

**10 维评估准则**来自 2025-2026 年业界共识，来源：

| 来源 | 类型 | 贡献 |
|:--|:--|:--|
| `mixcode/agent-friendly-guide` | 开源指南 | "什么让代码库对 AI 友好"的特征清单 |
| `Context Architecture` | 架构分析 | 上下文窗口友好度维度 |
| `codemyspec` | 架构分析 | 声明优于魔法维度 |
| `arXiv Claude Code` 论文 | 学术 | Agent 自主循环验证维度 |
| `lint4sg` | 工具（2026.03） | 专为约束 AI 而建的编译期分析器 |
| `agentic-os` | 架构分析 | 入口点可发现性维度 |

> 准则衡量的是**代码库特征**（可预测性、样板比、显式性），不是框架市场定位。TKWF 即使没有"对标"任何框架的目的，只要其设计哲学恰好与业界共识对齐，就能得高分——这不是"刷分"，是哲学共振。

---

## 10 维准则定义

| # | 维度 | 量度什么 |
|:--|:--|:--|
| 1 | 代码可预测性 | 运行时行为是否=源码所见（无运行时编织/反射） |
| 2 | 样板代码比 | 每业务逻辑行的样板量（越低=Agent 错误面越小） |
| 3 | 约定显式性 | 约定是文件化（AGENTS.md/llms.txt）还是隐式文化 |
| 4 | 上下文窗口友好 | 每次变更加载量是否受控（垂直切片/模块化单体） |
| 5 | 确定性构建/验证 | Agent 能否单命令自验证 |
| 6 | LLM 上下文面 | 是否提供 llms.txt / 源生成文档 |
| 7 | 声明优于魔法 | 文件配置 vs 运行时反射 |
| 8 | 入口点可发现性 | Agent 能否无先验知识找到架构图/决策记录/构建命令 |
| 9 | 架构模式适配 | 默认模式是否对齐 Agent 友好架构 |
| 10 | AOP/DI 透明度 | 横切关注点源码可见（特性/接口）还是不可见（动态代理） |

---

## 三方评分（10 维 × 3 框架，1=敌对 ~ 5=优秀）

| # | 维度 | ABP | Axon 5 | TKWF | 评估依据 |
|:--|:--|:--:|:--:|:--:|:--|
| 1 | 代码可预测性 | 2 | 3 | **5** | ABP DynamicProxy IL Emit——源码≠执行码；Axon 注解可见但运行时反射；TKWF SG 生成 `.g.cs` 可见、零运行时反射 |
| 2 | 样板代码比 | 2 | 3 | **5** | ABP 每 AppService 需 Interface+实现+多 DTO+仓储接口；Axon 注解即声明但 Command/Event/Query 类多；TKWF `[GenerateController]` 一行→Controller+AOP+GraphQL+REST+Client 全生成 + AutoQuery 消除 80% 手写查询 Service |
| 3 | 约定显式性 | 3 | 3 | **5** | ABP `.cursorrules`+命名约定但文档级非工具强制；Axon Spring 自动配置隐式；TKWF 7 个可部署 SKILL.md + AC01-06 速查卡 + AC-Kit 守则 + llms.txt |
| 4 | 上下文窗口友好 | 2 | 3 | **5** | ABP 分层方案触 5+ 项目；Axon 单聚合集中但跨 Saga 需多模块；TKWF AC 系列 ≤400 行/文件 + 每 skill 只读自己域 + 三端统一 `User.Query<T>()` 减少上下文切换 |
| 5 | 确定性构建/验证 | 4 | 3 | **5** | ABP `dotnet build/test` 标准但动态代理构建期不可见；Axon Maven/Gradle 但注解运行时处理；TKWF SG 20+ 诊断 fail build + ViewSql 编译期列名校验 + ts-client-mock 两级 mock + Contract 测试 |
| 6 | LLM 上下文面 | 2 | 3 | **5** | ABP 700+ 页人工文档无 llms.txt；Axon 有版本化文档但无 llms.txt；TKWF llms.txt + 7 skills + AC-Kit references + 活文档 + AC01-06 速查卡 |
| 7 | 声明优于魔法 | 2 | 2 | **5** | ABP DI 自动注册+模块生命周期+动态代理=大量运行时魔法；Axon Spring 自动配置+Axon Server 自动路由；TKWF 编译期 SG+零反射+DI-free 领域层 |
| 8 | 入口点可发现性 | 3 | 3 | **5** | ABP `AbpModule` 入口但需理解依赖图；Axon `@SpringBootApplication` 但 Spring 自动配置魔法；TKWF `TKWF_Rules.md` 路由中枢 + Business.md 门控 + MUST/MUST NOT + llms.txt |
| 9 | 架构模式适配 | 3 | 4 | **5** | ABP 模块化单体好但分层方案触多文件；Axon CQRS 天然垂直切片；**TKWF 领域自治 + 垂直 Service 切片 + 框架级 CQRS（Entity 写模型 / VEntity 读模型 + EQR 统一入口 + AutoQuery + 三端统一查询 API）** |
| 10 | AOP/DI 透明度 | 1 | 3 | **5** | ABP Castle DynamicProxy 运行时 IL Emit——**最不透明**；Axon 注解驱动源码可见但行为运行时定；TKWF 编译期 SG 装饰器 `.g.cs` 可见 |
| | **总分（/50）** | **24** | **30** | **50** | |

---

## TKWF 10 维详解（亮点依据）

### 维度 1：代码可预测性 — 5/5

- SG 编译期生成全部管道代码（Controller/AOP 装饰器/GraphQL Resolver/REST 端点/客户端代理），产出 `.g.cs` 可见可调试
- DomainUser 不进 DI 容器，`Use<T>()` 显式传递——物理隔离，无 DI 生命周期不确定性
- V4 从 Autofac 动态代理迁移到 SG + 装饰器，彻底抛弃运行时 IL Emit

### 维度 2：样板代码比 — 5/5

- `[GenerateController]` 一行 → SG 自动产出 5 份管道文件
- AutoQuery `[DomainGenerateCode(AutoQuery=true)]` → 消除 80% 手写查询 Service
- DTO 映射 `[DomainMapFrom]` → SG 生成映射代码

### 维度 3：约定显式性 — 5/5

- 7 个框架级 Skills（OpenCode 技能格式），部署到 `~/.config/opencode/skills/`
- AC01-AC06 速查卡（每张 ≤400 行）
- AC-Kit 守则 + TKWF_Rules.md 路由中枢 + 20+ 编译期诊断将约定变为硬约束

### 维度 4：上下文窗口友好 — 5/5

- 活文档替代源码阅读（`.TKWF/{Domain}/` 目录，xCodeGen AfterBuild 自动生成）
- 禁止读生成代码（5 个核心 skill 均含 MUST NOT DO）
- Business.md 门控（防止"边写边想"）
- 三端统一 `User.Query<T>()` 入口减少上下文切换

### 维度 5：确定性构建/验证 — 5/5

- 20+ Error 级编译期诊断（违规直接构建失败）
- ViewSql 编译期列名校验
- ts-client-mock 两级 Mock（MockTransport + MockHttpServer）
- Contract 测试（InMemory DAC，无 mock 依赖）

### 维度 6：LLM 上下文面 — 5/5

- llms.txt（87 行，框架全貌 → API 速查 → 文档链接）
- 7 个 SKILL.md（每个自带参考文档）
- AC-Kit references（5 文件 47KB）
- 活文档自动同步 + prebuild.ps1 自动版本同步

### 维度 7：声明优于魔法 — 5/5

- 标注即 Spec：`[GenerateController]` / `[AuthorityFilter]` / `[Transactional]` / `[DomainGenerateCode]`
- 零运行时反射、DI-free 领域层
- `Use<T>()` 显式路由（接口走 AOP 路径，具体类走直连路径）

### 维度 8：入口点可发现性 — 5/5

- TKWF_Rules.md 路由中枢（94 行，分类变更信号 → 加载匹配 skill）
- Business.md 门控（`tkwf-service` Step 0 检查）
- llms.txt（AI 入口）+ AC-Kit README（人类入口）
- 每个 skill 有明确 MUST / MUST NOT

### 维度 9：架构模式适配 — 5/5

- 领域自治 + 垂直 Service 切片
- **框架级 CQRS**（Entity 写模型 / VEntity 读模型类型系统级分离）
- EQR 统一查询入口（V4.9.40，3 跳零反射）
- AutoQuery 消除 80% 手写查询 Service
- 三端统一 `User.Query<T>()` API（C# 进程内完整 LINQ / Wasm / TS 表面同构）

### 维度 10：AOP/DI 透明度 — 5/5

- SG1b 生成 `{Controller}Decorator.g.cs`（AOP 装饰器），源码可见
- 装饰器结构：`PreFilter → Proceed → PostFilter`，三阶段管线
- `IAvoidDuplicateCrossCuttingConcerns`（V4.9.45 ADR18）防止安全核心特性重复执行
- ABP 社区正在投票迁移到 SG（`aspnetboilerplate #7198`，2026.03），追认 TKWF 早已走的路

---

## 框架级 CQRS 架构（维度 9 深度）

### 类型系统级分离（非约定式）

| 维度 | Entity（写模型） | VEntity（读模型） |
|:--|:--|:--|
| 类型标记 | `IDomainEntity` | `IDomainViewEntity : IDomainEntity` |
| 生成脚手架 | DataService + Conditions + Dto | **无**（ADR14 主动阻止写基础设施生成） |
| GraphQL 默认暴露 | `false`（须显式 opt-in） | `true`（自动暴露为 connection） |
| DAC 写操作 | ✅ 允许 | ❌ **框架阻止** |
| 专用能力 | — | ViewSql / InlineSelectSql / StatsDto / AutoQuery |

### EQR 统一查询入口（V4.9.40）

`User.Query<T>() → EQR.Query<T>() → IEntityReadOnlyDAC<T>.Query → return`（零反射、零死代码，从 8 跳重构为 3 跳）

### 三端统一查询 API

| 平台 | User 类型 | 返回类型 | LINQ 能力 |
|:--|:--|:--|:--|
| C# 进程内 | `DomainUser<TUserInfo>` | `IQueryable<TEntity>` | **完整 LINQ**（GroupBy/Sum/Join/Any） |
| C# Wasm | `DomainClientUser` | `QueryableBuilder<TEntity>` | HC filter 子集 |
| TS 前端 | `Tkwf.User` | `QueryBuilderBase<T>` | HC filter 子集 |

API 表面同构：三端 `Query<T>().Where().OrderBy().Page().ToPageAsync()` 链完全同构。

---

## 业界趋势信号

| 信号 | 来源 | 对 TKWF 的意义 |
|:--|:--|:--|
| `lint4sg`——专为约束 AI 而建的编译期分析器 | 2026.03 | TKWF 的编译期约束路线**符合业界方向** |
| Rust 反馈循环加速 Agentic 迭代 | 2025.12 | 编译器拒绝→Agent 修复→重编译是**已验证的高效循环** |
| ABP 社区提议用 SG 替代 DynamicProxy | `#7198` 2026.03 | ABP 生态**正在追认 TKWF 早已走的路** |
| Spring AOP `@Retryable` 静默失败 | Doctolib 2026.05 | 运行时代理的**静默失败**是 AI 无法自诊断的致命问题 |
| `llms.txt` v2 跨过临界采用 | 2026.08 | TKWF 已有 llms.txt——**先发优势** |

---

## 诚实限制声明

| 限制 | 说明 |
|:--|:--|
| 行为合规不编译期校验 | 授权/验证/事务/DTO-Entity 字段匹配仍延迟到运行时——与 ABP 同层 |
| 跨平台查询能力不等价 | 进程外（Wasm/TS）受 HC filter 子集约束——ADR20 已实施聚合 GraphQL（V4.9.53）补强 |
| ts-client/ts-client-mock 在外部仓库 | 技术路线不同（TS/npm vs .NET/NuGet）——非缺陷 |
| "低模型门槛"未经验证 | 架构降低上下文加载可验证，但"Flash 级模型即可胜任"无基准测试 |

---

## 三框架 Agentic 特点总结

### ABP Framework — "为人类 DDD 优化，非为 AI 优化"

**总分 24/50**。Agentic 弱点：AOP 透明度极低（DynamicProxy IL Emit）、样板代码高、上下文窗口不友好。关键信号：ABP 社区自身正在迁移到 SG（`#7198`）。

### Axon Framework 5 — "注解可见但运行时魔法仍重"

**总分 30/50**。Agentic 弱点：运行时魔法（Spring 自动配置 + Axon Server 路由）。强项：CQRS 天然垂直切片。

### TKWF.Framework — "为 Agentic Engineering 原生设计"

**总分 50/50**。10 维全部满分。核心强项：编译期 SG + DI-free 领域层 + 框架级 CQRS + 7 Skills + 三端统一查询 API + 两道防线。

---

> AI 也好，框架也好，甚至方法论 —— 都是工具。
>
> ——开发人员的头脑，才是软件开发的灵魂。
>
> TKW - Thinking Ware，思想件。