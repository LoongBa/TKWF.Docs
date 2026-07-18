# TKWF — 领域自治框架

> **TKW.Framework.Domain** — .NET 10 领域驱动设计框架，支持 AOP 静态拦截、代码生成（Source Generator）、多传输协议（GraphQL / REST / RPC）。

---

## ✨ 特性

| 特性 | 说明 |
|:----|:-----|
| 🧩 **领域自治** | DomainUser 自持实例化，不依赖 DI 容器，杜绝串号 |
| 🪄 **AOP 静态拦截** | 编译期 Source Generator 生成装饰器，零运行时反射 |
| 🚀 **代码生成** | `[GenerateController]` → SG 自动生成控制器/接口/Resolver |
| 🔌 **多协议** | 一份 Service → GraphQL + REST + RPC 三端自动暴露 |
| 🎯 **安全体系** | AuthorityFilter + Role-based + Challenge-Response 登录 |

---

## 📖 内容

| 章节 | 说明 |
|:----|:-----|
| [入门指南](articles/getting-started.md) | 5 分钟创建一个带 AOP 的领域服务 |
| [框架概览](articles/intro.md) | 核心概念：DomainUser、AOP 管线、代码生成 |
| [API 参考](api/TKWF.Domain.yml) | 完整 API 文档（自动从 XML 注释生成） |

---

## 📦 NuGet 包

| 包名 | 说明 |
|:----|:-----|
| `TKWF.Domain` | 领域框架核心（DomainUser、AOP、`[GenerateController]`） |
| `TKWF.Domain.Web` | Web 集成（Session 中间件、HttpContext 适配） |
| `TKWF.Domain.Maui` | MAUI 集成 |
| `TKWF.Domain.Blazor` | Blazor 集成 |
| `TKWF.Domain.FreeSql` | FreeSql ORM 适配 |
| `TKWF.Domain.ApiService.HotChocolate` | GraphQL 传输层（HotChocolate 16） |
| `TKWF.Domain.ApiService.MinimalApi` | REST 传输层（Minimal API） |
| `TKWF.Domain.ApiClient` | RPC 客户端核心 |
| `TKWF.Domain.ApiClient.GraphQL` | GraphQL 客户端 |
| `TKWF.Domain.ApiClient.Rest` | REST 客户端 |
| `TKWF.Cryptography` | 密码学工具 |
| `TKWF.Core` | 核心基础设施 |
| `TKWF.Abstractions` | 共享抽象层 |

---

## 🔗 链接

- GitHub: [LoongBa/TKW.Framework](https://github.com/LoongBa/TKW.Framework)
- 许可证: MIT
