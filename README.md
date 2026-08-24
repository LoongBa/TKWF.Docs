# TKWF Framework Documentation

> TKWF 领域自治框架的官方文档站点 —— 为 **Agentic Engineering** 时代设计。

[![Build and Deploy Docs](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml/badge.svg)](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml)

**当前同步版本：V4.9.61**（文档与框架 [LoongBa/TKW.Framework](https://github.com/LoongBa/TKW.Framework) 保持同步）

---

## 最近版本动态

| 版本 | 日期 | 核心内容 |
|:-----|:-----|:---------|
| **4.9.61** | 2026-08-23 | 多 ORM 表结构同步门控分层（ADR30）：SyncTables 从 opt-in 改为固定流程 + AutoMigrateDatabase 转正为生产放行开关 |
| **4.9.60** | 2026-08-23 | SG 生成代码编译修复：枚举特性参数完整表达式生成 + `[Service]`/`Filter` 命名空间修正（消费项目 DMP-Lite 199 错误全归零） |
| **4.9.59** | 2026-08-22 | DatabaseProvider 枚举 + ViewSql 方言兼容性检查（覆盖 FreeSql + EF Core 全部数据库类型 26 值枚举） |

> 完整变更历史见 [TKWF CHANGELOG](https://github.com/LoongBa/TKW.Framework/blob/master/docs/CHANGELOG.md)。

## 关于 TKWF

**TKWF.Domain** 是一个面向 Agentic Engineering 的 .NET 10 领域驱动设计框架：

- **领域自治** — DomainUser 自持实例化，不依赖 DI 容器，杜绝串号
- **编译期 AOP** — Source Generator 编译期生成装饰器，零运行时反射
- **代码生成** — `[GenerateController]` → SG 自动生成控制器/接口/Resolver
- **多协议** — 一份 Service → GraphQL + REST + RPC 三端自动暴露
- **框架级 CQRS** — Entity 写模型 / VEntity 读模型类型级分离，EQR 统一查询入口，AutoQuery 消除 80% 查询 Service
- **REST 投影** — `?fields=User.Name` 嵌套属性选择，返回树形原结构（V4.9.12+）
- **安全体系** — AuthorityFilter + Role-based + Challenge-Response 登录
- **系统角色** — SystemActor 体系 + `scope.System` 系统作用域 API（V4.9.9+）
- **Agentic Skills** — 7 个框架级 Skills（设计→实体→业务→测试→前端→Mock），Agent 按 skill 分步完成开发
- **前后端一致** — ts-client（TS SDK）+ ts-client-mock（两级 Mock），C# 与 TS API 形态完全镜像

## V5.0 路线图

> V4.9.x 聚焦 Agentic Engineering 基础设施完善。V5.0 将在以下方向增强：

| 方向 | 状态 | 说明 |
|:--|:--|:--|
| 领域事件 + 扩展/插件机制 | 🔬 设计中 | 适配 .NET 10+ 及成熟项目经验，含动态加载。当前版本有 Tools 扩展概念但未框架级支持，将升级为完整机制 |
| 分布式 / 微服务 | 💬 讨论中 | 老版本基于自有架构，V5.0 将基于成熟项目重新设计实现 |
| Agent UI 组件库 | 📋 规划中 | MVC / Blazor WASM / HTML 三端 UI 组件，方便 Agent 提高 UI 开发效率 |

## 文档站点

在线文档：**[https://tkwf.loongba.cn](https://tkwf.loongba.cn)**（自定义域，经 Cloudflare；旧地址 loongba.github.io/TKWF.Docs 自动重定向）

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