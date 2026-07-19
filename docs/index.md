---
_layout: landing
---

<div class="hero-section">
  <div class="badge-agentic">🤖 为 Agentic Coding 时代而生</div>
  <h1>TKWF — 领域自治框架</h1>
  <p class="lead">
    .NET 10 领域驱动设计框架，专为<strong> AI 结对编程</strong>设计。<br>
    声明式标注 → 全自动生成 API / 客户端 / AOP 管线。<br>
    让 AI 写 Service，框架负责剩下的。
  </p>
  <p>
    <a href="articles/getting-started.md" class="btn btn-primary" style="margin-right:0.5rem;">🚀 5 分钟快速开始</a>
    <a href="articles/intro.md" class="btn btn-outline-light">📖 了解框架概览</a>
  </p>
</div>

---

## 为什么 TKWF 适合 Agentic Coding？

<div class="agentic-banner">
  <div class="banner-icon">🧩</div>
  <div class="banner-content">
    <h3>领域自治 — 消除 DI 不确定性</h3>
    <p>DomainUser 自持实例化，不依赖 DI 容器。<br>AI 生成的代码无需理解复杂的 DI 配置，结果可预测、可验证。</p>
  </div>
</div>

<div class="agentic-banner">
  <div class="banner-icon">⚡</div>
  <div class="banner-content">
    <h3>声明式标注 → 全自动生成</h3>
    <p><code>[GenerateController]</code> 一个标注，SG 自动生成控制器、接口、Resolver、客户端。<br>AI 只需要写业务逻辑，框架自动完成管道代码。</p>
  </div>
</div>

<div class="agentic-banner">
  <div class="banner-icon">🪄</div>
  <div class="banner-content">
    <h3>编译期 AOP — 零运行时反射</h3>
    <p>Source Generator 在编译期生成装饰器，没有运行时反射，没有 dynamic invocation。<br>AI 生成的行为与手写代码完全一致，性能无损。</p>
  </div>
</div>

<div class="agentic-banner">
  <div class="banner-icon">🔌</div>
  <div class="banner-content">
    <h3>多协议自动暴露 — 一次编写，三端可用</h3>
    <p>一份 Service → GraphQL + REST + RPC 三端自动生成端点。<br>AI 只需聚焦领域逻辑，暴露方式由框架决定。</p>
  </div>
</div>

---

## 经典场景快速体验

<div class="scenario-card">
  <div class="scenario-card-header">📋 场景一：5 分钟创建 CRUD 服务</div>
  <div class="scenario-card-body">
    <p>
      写一个带 <span class="highlight">DomainUser</span> 的领域服务，标注
      <span class="highlight">[GenerateController]</span>，框架自动生成
      GraphQL Resolver 和 REST 端点，无需手写 Controller。
    </p>
    <pre><code class="lang-csharp">[GenerateController]
public class TodoService(DomainUser&lt;AppUserInfo&gt; user)
    : DomainServiceBase&lt;AppUserInfo&gt;(user)
{
    public async Task&lt;Todo&gt; CreateAsync(string title, string content)
    {
        var todo = new Todo { Title = title, Content = content, UserId = User.UserId };
        return await Repository.InsertAsync(todo);
    }
}</code></pre>
    <p><a href="articles/getting-started.md">→ 完整教程</a></p>
  </div>
</div>

<div class="scenario-card">
  <div class="scenario-card-header">🔐 场景二：给 API 加上权限控制</div>
  <div class="scenario-card-body">
    <p>
      用 <span class="highlight">[AuthorityFilter]</span> 标注方法，
      框架自动拦截未授权调用。支持 Role-based 和自定义策略。
    </p>
    <pre><code class="lang-csharp">[AuthorityFilter(Roles = "Admin")]
public async Task&lt;Report&gt; GenerateReportAsync() { ... }</code></pre>
    <p><a href="articles/security/authorization.md">→ 了解安全体系</a></p>
  </div>
</div>

<div class="scenario-card">
  <div class="scenario-card-header">🌐 场景三：一份 Service → GraphQL + REST + RPC</div>
  <div class="scenario-card-body">
    <p>
      同一个 Service，框架自动生成三种协议的端点。
      客户端可以按需选择传输方式。
    </p>
    <pre><code class="lang-csharp">// 只需配置
builder.ConfigWebAppDomain&lt;AppUserInfo, AppDomainInitializer&gt;()
    .UseGraphQLApiService&lt;AppUserInfo&gt;()   // GraphQL
    .UseRestApiService&lt;AppUserInfo&gt;();      // REST</code></pre>
    <p><a href="articles/transport/graphql.md">→ 查看传输协议文档</a></p>
  </div>
</div>

<div class="scenario-card">
  <div class="scenario-card-header">📱 场景四：跨平台移动端集成</div>
  <div class="scenario-card-body">
    <p>
      TKWF.Domain.Maui 让 MAUI 应用无缝集成 DomainUser 体系，
      客户端调用远程服务如同调用本地方法。
    </p>
    <p><a href="articles/integration/maui.md">→ MAUI 集成指南</a></p>
  </div>
</div>

---

## 核心特性

<div class="feature-grid">
  <div class="feature-card">
    <div class="card-icon">🧩</div>
    <h3>领域自治</h3>
    <p>DomainUser 自持实例化，不依赖 DI 容器，杜绝串号问题。每个请求绑定独立的领域上下文。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">🪄</div>
    <h3>AOP 静态拦截</h3>
    <p>编译期 Source Generator 生成装饰器，零运行时反射。权限、事务、日志等横切关注点声明式处理。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">🚀</div>
    <h3>代码生成</h3>
    <p><code>[GenerateController]</code> 一个标注，SG 自动生成控制器、接口、Resolver、客户端代码。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">🔌</div>
    <h3>多协议传输</h3>
    <p>一份 Service → GraphQL (HotChocolate 16) + REST (Minimal API) + RPC 三端自动暴露。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">🎯</div>
    <h3>安全体系</h3>
    <p>AuthorityFilter + Role-based 授权 + Challenge-Response 登录，开箱即用的安全防护。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">📦</div>
    <h3>生态集成</h3>
    <p>Web / MAUI / Blazor / FreeSql 全方位集成，适配多种应用场景。</p>
  </div>
</div>

---

## 分章节阅读

<div class="chapter-grid">
  <a href="articles/getting-started.md" class="chapter-card">
    <div class="chapter-icon">🚀</div>
    <h4>入门指南</h4>
    <p>5 分钟创建第一个带 AOP 的领域服务，快速上手 TKWF。</p>
  </a>
  <a href="articles/intro.md" class="chapter-card">
    <div class="chapter-icon">🏗️</div>
    <h4>框架概览</h4>
    <p>核心概念：DomainUser、AOP 管线、代码生成管线 SG#1~#4。</p>
  </a>
  <a href="articles/core-concepts/domain-user.md" class="chapter-card">
    <div class="chapter-icon">🧩</div>
    <h4>DomainUser 详解</h4>
    <p>深入理解领域自治的核心机制与最佳实践。</p>
  </a>
  <a href="articles/core-concepts/aop-pipeline.md" class="chapter-card">
    <div class="chapter-icon">🪄</div>
    <h4>AOP 管线</h4>
    <p>AOP 静态拦截的工作原理、自定义 Filter、管线编排。</p>
  </a>
  <a href="articles/core-concepts/code-generation.md" class="chapter-card">
    <div class="chapter-icon">⚙️</div>
    <h4>代码生成</h4>
    <p>Source Generator 管线详解：SG#1~#4 的职责与扩展。</p>
  </a>
  <a href="articles/security/authentication.md" class="chapter-card">
    <div class="chapter-icon">🔐</div>
    <h4>认证与授权</h4>
    <p>Challenge-Response 登录、AuthorityFilter、Role-based 访问控制。</p>
  </a>
  <a href="articles/transport/graphql.md" class="chapter-card">
    <div class="chapter-icon">🌐</div>
    <h4>GraphQL 传输</h4>
    <p>基于 HotChocolate 16 的 GraphQL 端点配置与查询。</p>
  </a>
  <a href="articles/transport/rest-minimal-api.md" class="chapter-card">
    <div class="chapter-icon">🔗</div>
    <h4>REST 传输</h4>
    <p>基于 Minimal API 的 REST 端点配置与使用。</p>
  </a>
  <a href="articles/transport/rpc.md" class="chapter-card">
    <div class="chapter-icon">📡</div>
    <h4>RPC 远程调用</h4>
    <p>通过 ApiClient 实现远程过程调用。</p>
  </a>
  <a href="articles/integration/web.md" class="chapter-card">
    <div class="chapter-icon">🌍</div>
    <h4>Web 集成</h4>
    <p>Session 中间件、HttpContext 适配、Web 环境配置。</p>
  </a>
  <a href="articles/integration/blazor.md" class="chapter-card">
    <div class="chapter-icon">🖥️</div>
    <h4>Blazor 集成</h4>
    <p>在 Blazor Server / WASM 中使用 TKWF 领域框架。</p>
  </a>
  <a href="articles/integration/freesql.md" class="chapter-card">
    <div class="chapter-icon">🗄️</div>
    <h4>FreeSql ORM 适配</h4>
    <p>FreeSql 作为数据层的配置与使用。</p>
  </a>
  <a href="articles/advanced/configuration.md" class="chapter-card">
    <div class="chapter-icon">⚙️</div>
    <h4>配置参考</h4>
    <p>ConfigWebAppDomain 配置项完整说明。</p>
  </a>
  <a href="articles/advanced/best-practices.md" class="chapter-card">
    <div class="chapter-icon">✨</div>
    <h4>最佳实践</h4>
    <p>架构设计建议、常见反模式、性能优化。</p>
  </a>
</div>

---

## NuGet 包

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

## 链接

- GitHub: [LoongBa/TKW.Framework](https://github.com/LoongBa/TKW.Framework)
- 许可证: MIT
- 构建状态: [![Build and Deploy Docs](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml/badge.svg)](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml)