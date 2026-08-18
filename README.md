# TKWF Framework Documentation

> TKWF 领域自治框架的官方文档站点 —— 为 **Agentic Coding** 时代设计。

[![Build and Deploy Docs](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml/badge.svg)](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml)

**当前同步版本：V4.9.41**（文档与框架 [LoongBa/TKW.Framework](https://github.com/LoongBa/TKW.Framework) 保持同步）

---

## 最近版本动态

| 版本 | 日期 | 核心内容 |
|:-----|:-----|:---------|
| **4.9.41** | 2026-08-18 | 文档同步：EntityQuery→Query + AdminHardDelete→AdminDelete + DefaultOrder 安全默认（Id 倒序，不抛异常）+ ADR15 Phase 2 删除过期方法 shim |
| **4.9.40** | 2026-08-18 | VEntity 查询架构简化：EQR 统一入口 + 直连 DAC（8跳→3跳）+ IGlobalQueryFilter 策略 + AutoQuery 委托 EQR + xCodeGen VEntity 跳过 DataService/Conditions |
| **4.9.39** | 2026-08-18 | V4.9.38 后修复批：SyncViewsAsync 作用域 bug + StatsDto Razor 括号边界 + ViewSql 校验器完整化（聚合别名提取 + 双向检测） |
| **4.9.38** | 2026-08-17 | VEntity 深度增强：ViewSql 编译期列名校验 + AutoQuery 自动查询 + 聚合 Dto 自动生成 + 轻量 VEntity（InlineSelectSql） |
| **4.9.37** | 2026-08-17 | IsGraphQLQueryable 默认值变更（Entity false / VEntity true）+ IsComputed 全链路一致性修复 |
| **4.9.36** | 2026-08-17 | VEntity 增强：IsComputed 计算字段 + DynamicSelector 投影跳过 + Dto.cshtml 三处跳过（ADR11） |
| **4.9.35** | 2026-08-16 | Entity IQueryable 主路径 Phase-C：连接 resolver + 字段命名统一 + IsGraphQLQueryable 三侧落实 |

> 完整变更历史见 [TKWF CHANGELOG](https://github.com/LoongBa/TKW.Framework/blob/master/docs/CHANGELOG.md)。

## 关于 TKWF

**TKWF.Domain** 是一个面向 Agentic Coding 的 .NET 10 领域驱动设计框架：

- **领域自治** — DomainUser 自持实例化，不依赖 DI 容器，杜绝串号
- **AOP 静态拦截** — 编译期 Source Generator 生成装饰器，零运行时反射
- **代码生成** — `[GenerateController]` → SG 自动生成控制器/接口/Resolver
- **多协议** — 一份 Service → GraphQL + REST + RPC 三端自动暴露
- **REST 投影** — `?fields=User.Name` 嵌套属性选择，返回树形原结构（V4.9.12+）
- **安全体系** — AuthorityFilter + Role-based + Challenge-Response 登录
- **系统角色** — SystemActor 体系 + `scope.System` 系统作用域 API（V4.9.9+）

## 文档站点

在线文档：**[https://loongba.github.io/TKWF.Docs](https://loongba.github.io/TKWF.Docs)**（GitHub Pages）

### 文档章节

| 章节 | 说明 |
|:----|:------|
| [🚀 入门指南](docs/articles/getting-started.md) | 5 分钟创建第一个领域服务 |
| [🏗️ 框架概览](docs/articles/intro.md) | 核心概念与架构设计 |
| [🧩 DomainUser 详解](docs/articles/core-concepts/domain-user.md) | 领域自治核心机制 |
| [🪄 AOP 管线](docs/articles/core-concepts/aop-pipeline.md) | AOP 静态拦截与自定义 Filter |
| [⚙️ 代码生成](docs/articles/core-concepts/code-generation.md) | SG#1~#4 管线详解 |
| [🔐 认证与授权](docs/articles/security/authentication.md) | Challenge-Response 登录 + AuthorityFilter |
| [🌐 GraphQL 传输](docs/articles/transport/graphql.md) | HotChocolate 16 集成 |
| [🔗 REST 传输](docs/articles/transport/rest-minimal-api.md) | Minimal API 集成 |
| [📡 RPC 远程调用](docs/articles/transport/rpc.md) | ApiClient 远程过程调用 |
| [🔌 集成指南](docs/articles/integration/web.md) | Web / Blazor / MAUI / FreeSql |
| [📦 客户端 SDK](docs/articles/client/api-client.md) | 强类型 RPC 客户端 |
| [⚙️ 配置参考](docs/articles/advanced/configuration.md) | 完整配置选项 |
| [✨ 最佳实践](docs/articles/advanced/best-practices.md) | 架构建议与反模式 |
| [📚 API 参考](docs/api/TKWF.Domain.yml) | 自动从 XML 注释生成 |

## 本地构建

```shell
# 1. 获取源码（需要 PAT 或从本地复制）
git clone https://github.com/LoongBa/TKW.Framework.git src/TKW.Framework
dotnet build src/TKW.Framework/TKW.Framework.sln

# 2. 安装 DocFX
dotnet tool install -g docfx

# 3. 构建文档
docfx docs/docfx.json

# 4. 预览
docfx docs/docfx.json --serve
```

## 部署

GitHub Actions 自动部署到 `gh-pages` 分支。每次推送 `main` 时自动构建并发布到 GitHub Pages。

## 贡献

文档内容位于 `docs/articles/` 目录，欢迎提交 PR 改进文档质量。

## 许可证

**文档内容**采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)（署名-非商业性使用 4.0 国际）——允许免费学习、引用、翻译、做衍生，但须署名，且禁止商业性使用。

**代码示例**（`docs/articles/` 中的 C#/TS 代码片段）为 TKWF 框架使用演示，框架本身遵循 TKW.Framework 仓库的许可条款。

© LoongBa / TKWF 团队