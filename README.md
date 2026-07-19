# TKWF Framework Documentation

> TKWF 领域自治框架的官方文档站点 —— 为 **Agentic Coding** 时代设计。

[![Build and Deploy Docs](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml/badge.svg)](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml)

---

## 关于 TKWF

**TKWF.Domain** 是一个面向 Agentic Coding 的 .NET 10 领域驱动设计框架：

- **领域自治** — DomainUser 自持实例化，不依赖 DI 容器，杜绝串号
- **AOP 静态拦截** — 编译期 Source Generator 生成装饰器，零运行时反射
- **代码生成** — `[GenerateController]` → SG 自动生成控制器/接口/Resolver
- **多协议** — 一份 Service → GraphQL + REST + RPC 三端自动暴露
- **安全体系** — AuthorityFilter + Role-based + Challenge-Response 登录

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

MIT