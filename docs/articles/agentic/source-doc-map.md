---
title: 源文档映射表
description: TKWF 源文档 D/G/T/xCodeGen 系列与公开文章的完整映射表
---
# 源文档映射表

> 本文档建立 TKWF 源文档（`_TKWF/docs/`）与公开文档站文章的对应关系，
> 便于 Agent 与贡献者定位权威来源。
> 源文档体系以 `_TKWF/docs/00-文档体系说明.md` 为准（v4.8，D 系列 30 份）。

---

## 核心概念

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `D00-TKWF.Domain-领域自治框架-V4-白皮书.md` | [框架概览](../intro.md) | 领域自治核心设计、六大工程原则（含 SystemActor 系统角色） |
| `D00-TKWF.Domain-领域自治框架-V4-设计方案.md` | [框架概览](../intro.md) | 架构决策（Autofac 弃用、装饰器模式、AsyncLocal、宿主适配器） |
| `D01-Domain运行时上下文.md` | [DomainUser 详解](../core-concepts/domain-user.md) | 初始化生命周期 + DomainUser + 会话管理 + 客户端认证架构（合并 D01/D02-核心/D03） |
| `D03-AOP拦截与事务.md` | [AOP 管线详解](../core-concepts/aop-pipeline.md) | AOP 静态拦截 + 事务横切关注。V2.1 补充短接机制、Bag 通信、过滤器组合策略 |
| `D03A-缓存框架-设计方案.md` | — | 缓存策略：ContentCacheFilter AOP 方法级缓存（ICacheProvider 抽象、短接集成、缓存键设计）、HybridCache 会话后端缓存 |
| `D04-领域初始化器设计-模板方法体系与内置能力.md` | [Web 集成](../integration/web.md) | 初始化器钩子体系（V4.9.21+） |
| `D05-宿主集成与配置V2-Web-Blazor-MAUI-Testing.md` | [配置参考](../advanced/configuration.md) | 宿主集成与 cfg 强契约 |
| `D06-领域数据服务与数据存取设计.md` | [数据层架构](../explanation/data-layer-architecture.md) | DataService 数据存取 |
| `D06B-条件表达式构建器设计.md` | [条件构建器](../advanced/conditions-builder.md) | PredicateBuilderBase、Entity.Conditions 静态类、xCodeGen + SG1 双重生成 |
| `D06C-Entity映射与DB Schema-设计方案.md` | — | Entity 映射策略：ORM 特性体系（Table/Column/Index/Navigate）、接口标记 vs 基类继承、查询条件生成管线（三阶段 SearchGroup 提取） |
| `D07-三层SG-原则和设计方案.md` | [代码生成管线](../core-concepts/code-generation.md) | 三层 SG 管线：SG1 元数据提取 → SG2 服务端生成 → SG3 客户端生成；ProjectMetaContext 唯一元数据源 |
| `D08-框架CI-CD与脚本架构.md` | — | 三仓库 CI/CD 管线、三引用模式（NuGet/DLL/Project）、MSBuild 基础设施、§九 Schema 导出管线（buildSchema.ps1） |

## 传输与客户端

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `D02-多形态客户端认证架构.md` | [认证与授权](../security/authentication.md) | 客户端认证架构总览（V4.9.26 起拆分 D02A-D02D） |
| `D02A-多形态客户端认证-进程内(Console-CLI-后台-测试)认证.md` | — | ① 进程内认证：Console/CLI/后台任务/单元测试、LoginAsUserAsync 重载、LocalSessionManager/TestSessionManager |
| `D02B-多形态客户端认证-进程内WebServer(BlazorServer-MAUI)认证.md` | — | ② 进程内+RPC：Blazor Server/MAUI 混合、双通道认证（HTTP + 非 HTTP） |
| `D02C-多形态客户端认证-进程外Wasm(BlazorWasm)认证.md` | — | ③ 进程外+RPC（C#）：Blazor WASM 认证组件（WasmAuthenticationStateProvider/AuthRoutes/UseWasmAuth） |
| `D02D-多形态客户端认证-进程外ts-client(React-Vue-小程序)认证.md` | — | ③ 进程外+RPC（TS）：@tkwf/tsclient DomainHostClient（init/GetUser/GetGuest/loginSecure/registerSecure） |
| `D07A-RPC-远程过程调用-设计方案V2.md` | [RPC 传输](../transport/rpc.md) | RPC 主文档：SG 管线、IAopContract、A/B 控制器路径、DataService 方法提取规则、ExcludeMethods |
| `D07B-C#客户端SDK架构-设计方案.md` | [客户端 SDK](../client/api-client.md) | C# 客户端 SDK：DomainClientUser 架构、IApiClient 双协议传输层、表达式树→GraphQL 查询管线、Wasm 管道。V4.9.28 起 Use<T>() 客户端服务端统一命名 |
| `D07C-TS客户端SDK架构-设计方案.md` | — | TS 客户端 SDK（@tkwf/tsclient）：两层架构（SDK 层 vs 消费端集成层）、Tkwf 门面工厂、Transport 抽象、ServiceProxy JS Proxy 引擎、ChainablePromise |
| `D07M-RPC-前端客户端-ts-client-mock-设计方案.md` | — | TS 前端 mock 运行时：MockTransport 注入、内存数据库、策略化工厂、录制回放、HTTP mock server |
| `G07A-RPC-远程过程调用-WebApi服务端使用指南.md` | — | C# 服务端：[GenerateController] 标注 Service，SG 自动生成 WebApi 端点 + V2 管道配置 |
| `G07B-RPC-远程过程调用-Wasm客户端使用指南.md` | — | Blazor Wasm 客户端：ConfigWasmClient 管道、User.Query<T> 实体查询、User.Use<IController> 调用、认证与会话管理 |
| `G07B-RPC-远程过程调用-Wasm客户端增强查询-Query-使用指南.md` | [查询指南](../advanced/query-guide.md) | Wasm 客户端增强查询：User.Query<T> 统一查询入口（合并原 QueryApi/QueryGraphQL） |
| `G07C-RPC-远程过程调用-TS前端-ts-client-使用指南.md` | — | TS 前端 @tkwf/tsclient 客户端（独立仓库 tkwf-tsclient，V1.0.5：Tkwf 门面工厂入口，transport 注入点，移除 Call()/ChainableBuilder） |
| `G07C-RPC-远程过程调用-TS前端增强查询-QueryBuilder-使用指南.md` | — | TS 前端增强查询：QueryBuilder 链式查询（where/orderBy/select/page/toPageAsync） |
| `G07C-ts-client-优势分析.md` | — | ts-client 优势分析：为何选择 @tkwf/tsclient 而非传统 fetch/axios/graphql-codegen |
| `G07D-RPC-远程过程调用-TS前端测试-ts-client-mock-使用指南.md` | — | TS 前端 Mock 测试：@tkwf/tsclient-mock（v1.2.2：MockTransport 注入、createMockDb、场景切换、策略化数据生成、录制回放、HTTP server） |
| `G07E-RPC-远程过程调用-错误处理指南.md` | [异常处理](../advanced/error-handling.md) | 异常映射表、Middleware、Problem Details |

## 安全、限流与多租户

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `D10-TKWF框架异常处理机制-设计方案.md` | [异常处理](../advanced/error-handling.md) | 全栈异常处理：FrameworkErrorCodes 8 码统一、IErrorFilter（GraphQL）/ ProblemDetails RFC 9457（REST）、5 平台处理矩阵 |
| `D10A-Wasm客户端异常处理机制-设计方案.md` | — | （D10 子方案）Blazor Wasm 客户端三层错误处理模型、DomainClientUser 事件、SendWithAuthGuardAsync |
| `D10B-ts-client异常处理机制-设计方案.md` | — | （D10 子方案）TS 前端异常处理：@tkwf/tsclient 错误映射、静态事件、重试策略 |
| `D10C-Web服务端错误处理机制-设计方案.md` | — | （D10 子方案）ASP.NET Core 服务端错误输出：DomainErrorFilter、WebExceptionMiddleware、IErrorScope |
| `D10D-限流架构-设计方案.md` | — | 限流架构：V4.9.26 退役自定义 IRateLimiter → 官方 System.Threading.RateLimiting。PartitionedRateLimiter 分区限流、EnforceAsync 扩展方法、AOP 集成、429 错误码映射 |
| `D11-系统角色-SystemActor-设计方案.md` | [SystemActor 体系](../explanation/system-actor-explained.md) | 系统角色：BeginSystemScopeAsync、scope.System/scope.IsSystem、IEntityActorAuditable、[DenySystemActor]、StandaloneDomainUserAccessor（ADR 14/15/16） |
| `D13-多租户架构-设计方案.md` | — | 多租户架构：租户识别与上下文传播（IAmbientContext）、数据库级隔离（FreeSqlCloud 分库）、连接串解析模板方法、IEntityTenant 接口标记 |

## 数据与查询

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `G06-领域数据服务与数据存取使用指南.md` | [DataService](../core-concepts/data-services.md) | 数据服务使用 |
| `G06B-条件表达式构建器使用指南.md` | [条件构建器](../advanced/conditions-builder.md) | Conditions 条件工厂 API、Expression 两阶段构建、并发隔离 |
| `G06C-Entity映射与查询条件配置指南.md` | — | 数据库映射（Table/Column/Index）+ Conditions 生成配置（DtoField/SearchGroup/Index 派生） |
| `G06C-Agentic-Entity映射与查询条件配置简明指南.md` | — | （Agent 版）Entity 映射与查询条件配置速查清单 |

## 测试基础设施

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `D09-测试基础设施-设计方案.md` | — | 三层测试模型（Domain 单元/集成/RPC 端到端）、DomainXunitTestBase 模板方法设计、TestSessionManager AsyncLocal 隔离、SG 生成器内存编译测试、DesignComplianceTests |

## 分发与生态

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `D12-TKWF分发架构-设计方案.md` | — | 分发架构：双轨消费（Dev ProjectRef + 分发 NuGet）、三通道分发（NuGet + dotnet tool + tkwf-skills）、TKWFRole 角色模型、CI 硬门禁、§十三 NuGet 包体系（合并自原 D10-NuGet） |
| `D12-TKWFRole-项目分发配置参考表.md` | — | （D12 附表）TKWFRole 角色注入清单、DLL 模式自动注入依赖链、各角色项目配置参考 |
| `D14-Agent开发生态-设计方案.md` | — | Agent 开发生态：tkwf-skills 体系（design/entity/service/test/business）、ADR 架构决策系统、迭代开发工作流、提交与 Tag 纪律 |

## Agentic 专用

| 源文档 | 公开文章 | 说明 |
|:-------|:---------|:-----|
| `AC-Docs/AC01-Domain业务领域开发简明指南.md` | [AI 快速上手](../agentic/quick-start-for-ai.md) | Entity 骨架 + 查询条件生成 + Conditions 链式 + DataService/Service 骨架 + 红线（对应 D06/D07/G06C/G06B） |
| `AC-Docs/AC02-WebApi服务端开发简明指南.md` | [AI 快速上手](../agentic/quick-start-for-ai.md) | [GenerateController] 参数速查 + 方法命名规则 + 编译错误速查（对应 G07A） |
| `AC-Docs/AC03-Wasm客户端开发简明指南.md` | — | 页面模板 + User.Query/Use 调用模式 + AntDesign 组件陷阱（对应 G07B-Wasm/G07B-Query） |
| `AC-Docs/AC04-TS前端开发简明指南.md` | — | Tkwf 门面初始化 + Use/QueryBuilder 调用 + 认证 + 错误处理（对应 G07C/G07C-Query） |
| `AC-Kit/guides/Agent-TKWF使用行为守则.md` | [AI 快速上手](../agentic/quick-start-for-ai.md) | 框架级 Agent 行为守则（V4.9.22+） |
| `AC-Kit/guides/SG架构规则.md` | [SG 管线解剖](../explanation/sg-pipeline-anatomy.md) | SG 架构规则 |
| `AC-Kit/guides/生成代码防绕过规则.md` | [AI 快速上手](../agentic/quick-start-for-ai.md) | 生成代码防绕过 |

---

> 对齐 TKWF：V4.9.28 · 2026-08-15


