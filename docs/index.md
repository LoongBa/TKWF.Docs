---
_layout: landing
---

<!-- ===== 区块 1: Hero ===== -->
<div class="hero-section">
  <div class="hero-badges">
    <img src="https://img.shields.io/badge/.NET-10-blue" alt=".NET 10" />
    <img src="https://img.shields.io/badge/version-4.9.22-green" alt="Version 4.9.22" />
    <img src="https://img.shields.io/badge/AI-Agentic_Ready-purple" alt="AI-Agentic Ready" />
  </div>
  <h1>TKWF.Domain — 让 AI 写 Service，框架负责剩下的</h1>
  <p class="lead">
    .NET 10 领域自治框架。标注 <code>[GenerateController]</code>，
    编译期自动生成 Controller + AOP 装饰器 + GraphQL/REST 端点 + 客户端代理。<br>
    零运行时反射，零 DI 串号，代码行为对 AI 完全可预测。
  </p>
  <div class="hero-cta">
    <a href="articles/getting-started.md" class="btn btn-primary">🚀 5 分钟快速开始</a>
    <a href="articles/intro.md" class="btn btn-outline-light">📖 框架概览</a>
    <a href="articles/agentic/quick-start-for-ai.md" class="btn btn-outline-light">🤖 AI 快速上手</a>
  </div>
</div>

---

<!-- ===== 区块 2: 对比表 ===== -->
## 为什么 TKWF？

<table class="comparison-table">
  <thead>
    <tr>
      <th>维度</th>
      <th>传统 DI 框架</th>
      <th>TKWF.Domain</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>AOP 实现</td>
      <td>运行时动态代理（反射 + IL Emit）</td>
      <td>编译期 SG 生成装饰器，零运行时反射</td>
    </tr>
    <tr>
      <td>DI 依赖</td>
      <td>Service 依赖容器注入 DomainUser，存在串号风险</td>
      <td>DomainUser 自持实例化，<code>User.Use&lt;T&gt;()</code> 显式传递，物理隔离</td>
    </tr>
    <tr>
      <td>API 暴露</td>
      <td>手写 Controller + 手动注册路由</td>
      <td><code>[GenerateController]</code> 一标注，SG 自动生成 GraphQL + REST 端点</td>
    </tr>
    <tr>
      <td>客户端生成</td>
      <td>手写或用 NSwag / Swagger 生成</td>
      <td>SG#3 编译期生成强类型客户端代理，与服务端同源</td>
    </tr>
    <tr>
      <td>AI 可预测性</td>
      <td>DI 生命周期、动态代理行为难以预测</td>
      <td>编译期生成，代码可见可调试，AI 生成结果与手写一致</td>
    </tr>
    <tr>
      <td>带宽优化</td>
      <td>需手写 DTO 或 GraphQL field selection</td>
      <td>REST <code>?fields=User.Name</code> 原生投影 + GraphQL selection 自动裁剪</td>
    </tr>
  </tbody>
</table>

---

<!-- ===== 区块 3: Agentic Banner ===== -->
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

<!-- ===== 区块 4: 路径卡片 ===== -->
## 从这里开始

<div class="path-grid">
  <a href="articles/getting-started.md" class="path-card">
    <h3>🚀 快速探索</h3>
    <p><strong>5 分钟感受"标注即生成"</strong></p>
    <p>安装 NuGet → 写 Service → 标注 → 编译即得 GraphQL + REST 端点</p>
  </a>
  <a href="articles/tutorials/30-min-todo-part1.md" class="path-card">
    <h3>📋 实战学习</h3>
    <p><strong>30 分钟构建完整 CRUD</strong></p>
    <p>从 Entity 到数据层、认证授权、多协议暴露，跟着教程走一遍</p>
  </a>
  <a href="articles/explanation/why-domain-autonomy.md" class="path-card">
    <h3>🔬 深度理解</h3>
    <p><strong>为什么这样设计？</strong></p>
    <p>领域自治 vs DI 容器、编译期 AOP 原理、三层 SG 管线解剖</p>
  </a>
  <a href="articles/decision-guides/choose-transport.md" class="path-card">
    <h3>🧭 决策指南</h3>
    <p><strong>该怎么选？</strong></p>
    <p>GraphQL vs REST vs RPC、Path A vs Path B、Web vs Blazor vs MAUI</p>
  </a>
</div>

---

<!-- ===== 区块 5: 场景卡片 ===== -->
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

<!-- ===== 区块 6: 核心特性 ===== -->
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

<!-- ===== 区块 7: 版本动态 ===== -->
## 最近版本动态

| 版本 | 日期 | 核心内容 |
|:-----|:-----|:---------|
| **4.9.22** | 2026-08-10 | xCodeGen 文档模板修复 + AGENTS.cshtml 移除。 |
| **4.9.21** | 2026-08-10 | 初始化器优化（D04 v1.3 实施）：钩子收敛 12→9、`IDatabaseInitializer` 直接移除、上下文提取内置能力、`SetExcluded… |
| **4.9.20** | 2026-08-09 | V4.9.20 — ts-domain-client 查询构建器 QueryBuilder。 为 IQueryable 实体查询提供链式 LINQ 风格 API… |


> 完整变更历史见 [TKWF CHANGELOG](https://github.com/LoongBa/TKW.Framework/blob/master/docs/CHANGELOG.md)

---

<!-- ===== 区块 8: NuGet 包 ===== -->
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

<!-- ===== 区块 9: 链接 ===== -->
## 链接

- GitHub: [LoongBa/TKW.Framework](https://github.com/LoongBa/TKW.Framework)
- 许可证: MIT
- 构建状态: [![Build and Deploy Docs](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml/badge.svg)](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml)



