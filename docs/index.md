---
_layout: landing
---

<!-- ===== 区块 1: Hero ===== -->
<div class="hero-section">
  <div class="hero-badges">
    <img src="https://img.shields.io/badge/.NET-10-blue" alt=".NET 10" />
    <img src="https://img.shields.io/badge/version-4.9.45-green" alt="Version 4.9.45" />
    <img src="https://img.shields.io/badge/Agentic-Engineering-purple" alt="Agentic Engineering" />
  </div>
<h1>TKW.Framework — 让 Agentic Engineering 更可控、更可靠的软件开发框架</h1>
  <p class="lead">
    开发者提供需求文档 → Agent 调用框架编写 Entity/Service → 框架编译期生成代码、API 接口、知识文档和 Mock 数据 → 人机协同完善和增量开发。<br>
    <strong>开发者思考意图 → AI 辅助实现 → 框架约束保障</strong><br>
    开发者是灵魂，TKWF 是法宝，AI 是器灵。
  </p>
  <div class="hero-cta">
    <a href="articles/getting-started.md" class="btn btn-primary">🚀 5 分钟快速开始</a>
    <a href="articles/intro.md" class="btn btn-outline-light">📖 框架概览</a>
    <a href="articles/agentic/quick-start-for-ai.md" class="btn btn-outline-light">🤖 AI 快速上手</a>
  </div>
</div>

---

<!-- ===== 区块 2: Agentic Engineering 三方分工 ===== -->
## Agentic Engineering：三方分工，各司其职

> **Agentic Engineering** — 你不直接写代码 99% 的时间，你在编排 Agent 并充当监督者。
> —— Andrej Karpathy, 2026

传统开发中，人包揽意图、业务、管道代码。TKWF 把这三件事拆开：

```
  你（人）              AI Agent             TKW.Framework
  ────────             ──────────           ──────────────
  声明意图       →     写 Service      →     编译期生成
  [GenerateController]   业务逻辑              Controller + AOP 装饰器
  [AuthorityFilter]      领域规则              GraphQL Resolver
  [Transactional]        状态流转              REST 端点
                                               客户端代理
  ────────             ──────────           ──────────────
  你只写标注             Agent 只写业务        框架管全部管道
```

**你写的**：一个 `[GenerateController]` 标注 + Service 业务方法。
**框架生成的**：Controller 接口、AOP 装饰器、GraphQL Resolver、REST 端点、强类型客户端代理。
**Agent 写的**：Service 里的业务逻辑——无需理解 DI 配置、路由注册、序列化细节。

```csharp
// 你 + Agent 只写这一份
[GenerateController]
public class OrderService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    [AuthorityFilter(Roles = "Admin")]
    [Transactional]
    public async Task<Order> CreateAsync(string title) { ... }
}

// 编译期自动产出 5 份（你不用写，Agent 也不用写）：
// → IOrderServiceController.g.cs         (契约接口)
// → OrderServiceControllerDecorator.g.cs  (AOP 装饰器)
// → OrderServiceResolver.g.cs            (GraphQL Resolver)
// → OrderServiceEndpoints.g.cs           (REST 端点)
// → OrderServiceClient.g.cs              (客户端代理)
```

---

<!-- ===== 区块 3: AI-Assisted vs Agentic Engineering ===== -->
## 为什么不是 AI-Assisted？

> Gartner 预测：到 2028 年，Agentic 工作流将提升团队生产力 30%-50%，远超 AI-Assisted 的 0%-20%。

AI-Assisted（Copilot 模式）和 Agentic Engineering 是两种完全不同的范式：

<table class="comparison-table">
  <thead>
    <tr>
      <th>维度</th>
      <th>AI-Assisted（Copilot 模式）</th>
      <th>Agentic Engineering（TKWF）</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>人类角色</td>
      <td>驾驶员，逐行审查补全建议</td>
      <td><strong>委派者 + 验证者</strong>，声明意图后由 Agent 写业务</td>
    </tr>
    <tr>
      <td>Agent 自主性</td>
      <td>被动响应，只补全当前光标处</td>
      <td><strong>端到端写 Service</strong>，从 Entity 到业务规则</td>
    </tr>
    <tr>
      <td>代码生成</td>
      <td>IDE 内补全片段</td>
      <td><strong>编译期 SG 全自动生成</strong> Controller/端点/客户端</td>
    </tr>
    <tr>
      <td>约束机制</td>
      <td>人工审查每行 diff</td>
      <td><strong>编译期硬约束</strong>——不合规代码直接报错</td>
    </tr>
    <tr>
      <td>协议暴露</td>
      <td>手写 Controller + 路由注册</td>
      <td>一份 Service → <strong>GraphQL + REST + RPC 三端自动暴露</strong></td>
    </tr>
    <tr>
      <td>AI 门槛</td>
      <td>需顶级模型长上下文推理整个架构</td>
      <td><strong>7 个框架级 Skills</strong> 分步引导 + 活文档替代源码阅读，架构降低上下文加载</td>
    </tr>
  </tbody>
</table>

---

<!-- ===== 区块 4: 四大设计支柱 ===== -->
## 为什么 TKWF 让 Agentic Engineering 可靠？

<div class="agentic-banner">
  <div class="banner-icon">⚙️</div>
  <div class="banner-content">
    <h3>编译期静态装配 — AI 生成代码与手写行为一致</h3>
    <p>V4 从 Autofac 动态代理迁移到 SG + 装饰器。AOP 拦截在编译期完成，零运行时反射、零 IL Emit。<br>AI 生成的代码可见、可调试、可预测——不存在"运行时才暴露的惊喜"。</p>
  </div>
</div>

<div class="agentic-banner">
  <div class="banner-icon">📐</div>
  <div class="banner-content">
    <h3>零歧义契约 — 标注即 Spec，编译期验证</h3>
    <p><code>[GenerateController]</code> 标注就是完整契约——不只是一个标记，而是一份可执行的规范。<br><strong>结构性不合规编译期直接报错</strong>（20+ 诊断）。行为合规（授权/验证/事务）由运行时 AOP 兜底。</p>
  </div>
</div>

<div class="agentic-banner">
  <div class="banner-icon">🧩</div>
  <div class="banner-content">
    <h3>领域自治 — 结构上不可能串号</h3>
    <p>DomainUser 不进 DI 容器，<code>Use&lt;T&gt;()</code> 显式传递。调用方的 User 就是 Service 的 User，物理隔离。<br>AI 生成的代码无需理解 DI 生命周期——结构本身就消灭了整类缺陷。</p>
  </div>
</div>

<div class="agentic-banner">
  <div class="banner-icon">🔬</div>
  <div class="banner-content">
    <h3>粒度细分管线 — Agent 聚焦眼前工作</h3>
    <p>SG1（元数据提取）→ SG2（服务端生成）→ SG3（客户端生成），三层各司其职。<br>7 个框架级 Skills 分步引导，活文档替代源码阅读，Agent 只加载当前域薄索引——无需理解全局架构。</p>
  </div>
</div>

<div class="agentic-banner">
  <div class="banner-icon">🤖</div>
  <div class="banner-content">
    <h3>Agentic Skills + Mock — 端到端 Agent 工作流</h3>
    <p>自带 <strong>7 个框架级 Skills</strong>（设计→实体→业务→测试→前端→Mock），将需求文档交给 Agent 按 skill 编写即可完成开发。<br><strong>ts-client</strong> 确保前后端开发体验一致（C# 与 TS API 形态完全镜像），<strong>ts-client-mock</strong> 两级 mock（离线 + HTTP 模拟）让 Agent 无需运行后端即可自验证全栈。</p>
  </div>
</div>

---

<!-- ===== 区块 5: 路径卡片 ===== -->
## 从这里开始

<div class="path-grid">
  <a href="articles/getting-started.md" class="path-card">
    <h3>🚀 快速探索</h3>
    <p><strong>5 分钟感受"标注即生成"</strong></p>
    <p>安装 NuGet → 写 Service → 标注 → 编译即得 GraphQL + REST 端点</p>
  </a>
  <a href="articles/intro.md" class="path-card">
    <h3>📖 框架概览</h3>
    <p><strong>Agentic Engineering 全景</strong></p>
    <p>三方分工、代码生成管线、多协议暴露、安全体系——每段都带代码示例</p>
  </a>
  <a href="articles/explanation/why-domain-autonomy.md" class="path-card">
    <h3>🔬 深度理解</h3>
    <p><strong>为什么这样设计？</strong></p>
    <p>领域自治 vs DI 容器、编译期 AOP 原理、三层 SG 管线解剖</p>
  </a>
  <a href="articles/agentic/quick-start-for-ai.md" class="path-card">
    <h3>🤖 AI 快速上手</h3>
    <p><strong>给 Agent 的速查卡</strong></p>
    <p>框架规则、Prompt 模板、源文档映射表——让 AI 高质量生成 Service</p>
  </a>
</div>

---

<!-- ===== 区块 6: 场景卡片 ===== -->
## 经典场景快速体验

<div class="scenario-card">
  <div class="scenario-card-header">🤖 场景一：Agentic Engineering 完整闭环</div>
  <div class="scenario-card-body">
    <p>
      人标注 <span class="highlight">[GenerateController]</span>，Agent 写 Service 业务逻辑，
      框架编译期生成 Controller + AOP + GraphQL/REST 端点 + 客户端代理。
      <strong>三方分工，一个编译期完成。</strong>
    </p>
    <pre><code class="lang-csharp">// 人：标注意图
[GenerateController]
// Agent：写业务逻辑
public class TodoService(DomainUser&lt;AppUserInfo&gt; user)
    : DomainServiceBase&lt;AppUserInfo&gt;(user)
{
    public async Task&lt;Todo&gt; CreateAsync(string title, string content)
    {
        var todo = new Todo { Title = title, Content = content, UserId = User.UserId };
        return await Repository.InsertAsync(todo);
    }
}
// 框架：编译期生成 5 份代码（你不用写，Agent 也不用写）</code></pre>
    <p><a href="articles/getting-started.md">→ 完整教程</a></p>
  </div>
</div>

<div class="scenario-card">
  <div class="scenario-card-header">🔐 场景二：声明式权限 + 事务控制</div>
  <div class="scenario-card-body">
    <p>
      用 <span class="highlight">[AuthorityFilter]</span> + <span class="highlight">[Transactional]</span>
      声明横切关注点，AOP 管线编译期织入。不写一行 <code>if</code> 判断。
    </p>
    <pre><code class="lang-csharp">[AuthorityFilter(Roles = "Admin")]    // ← 声明式权限
[Transactional]                        // ← 声明式事务
public async Task&lt;Report&gt; GenerateReportAsync() { ... }</code></pre>
    <p><a href="articles/security/authorization.md">→ 了解安全体系</a></p>
  </div>
</div>

<div class="scenario-card">
  <div class="scenario-card-header">🌐 场景三：一份 Service → GraphQL + REST</div>
  <div class="scenario-card-body">
    <p>
      同一个 Service，框架自动生成 GraphQL 和 REST 双协议端点。
      REST 原生支持 <code>?fields=</code> 投影——嵌套属性树形裁剪。
    </p>
    <pre><code class="lang-csharp">// 只需配置宿主
builder.ConfigWebAppDomain&lt;AppUserInfo, AppDomainInitializer&gt;()
    .UseGraphQLApiService&lt;AppUserInfo&gt;()   // GraphQL 自动暴露
    .UseRestApiService&lt;AppUserInfo&gt;();      // REST 自动暴露</code></pre>
    <p><a href="articles/transport/graphql.md">→ 查看传输协议文档</a></p>
  </div>
</div>

<div class="scenario-card">
  <div class="scenario-card-header">🧩 场景四：领域自治 — 不可能串号</div>
  <div class="scenario-card-body">
    <p>
      DomainUser 不进 DI 容器，<code>Use&lt;T&gt;()</code> 显式传递。
      请求 A 的 User 和请求 B 的 User <strong>物理隔离</strong>，结构上消灭整类串号缺陷。
    </p>
    <pre><code class="lang-csharp">// 请求 A：User.UserId = "Alice"
// 请求 B：User.UserId = "Bob"
// 两个请求的 Service 完全隔离，不可能串号

var service = User.Use&lt;OrderService&gt;();
// service 的 User 就是当前请求的 User，确定性的</code></pre>
    <p><a href="articles/core-concepts/domain-user.md">→ DomainUser 详解</a></p>
  </div>
</div>

---

<!-- ===== 区块 7: 核心特性 ===== -->
## 核心特性

<div class="feature-grid">
  <div class="feature-card">
    <div class="card-icon">⚙️</div>
    <h3>编译期 AOP</h3>
    <p>Source Generator 编译期生成装饰器，零运行时反射。权限、事务、验证声明式标注。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">📐</div>
    <h3>声明式标注</h3>
    <p><code>[GenerateController]</code> → Controller + AOP + GraphQL/REST 端点 + 客户端代理全自动生成。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">🧩</div>
    <h3>领域自治</h3>
    <p>DomainUser 不进 DI 容器，<code>Use&lt;T&gt;()</code> 显式传递，物理隔离，杜绝串号。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">📊</div>
    <h3>框架级 CQRS</h3>
    <p>Entity 写 / VEntity 读类型级分离。ViewEntity + IQueryable + GraphQL 提供强大查询/统计/聚合（JS 表现层暂时部分受限）。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">🤖</div>
    <h3>Agentic Skills</h3>
    <p>7 个框架级 Skills（设计→实体→业务→测试→前端→Mock），Agent 按 skill 分步完成开发。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">📦</div>
    <h3>前后端一致</h3>
    <p>Blazor Web Server / Wasm / 网页（TS）开发体验统一。ts-client + ts-client-mock 两级 mock 自验证。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">🔌</div>
    <h3>多协议传输</h3>
    <p>一份 Service → GraphQL + REST + RPC 三端自动暴露。默认三协议，可扩展（如 OData）。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">🛡️</div>
    <h3>两道防线</h3>
    <p>编译期拦截结构性错误（20+ 诊断），运行时拦截行为错误（授权/验证/事务）。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">🔐</div>
    <h3>安全 + SystemActor</h3>
    <p>AuthorityFilter + Challenge-Response + <strong>SystemActor 区分人/系统写入审计</strong>。错误码全栈统一。</p>
  </div>
  <div class="feature-card">
    <div class="card-icon">🏗️</div>
    <h3>ORM 可扩展</h3>
    <p>内置 FreeSql + MockEntityDac（测试），<code>IEntityDAC</code> ORM 无关抽象，可扩展支持其它。</p>
  </div>
</div>

---

<!-- ===== 区块 8: 版本动态 ===== -->
## 最近版本动态

| 版本 | 日期 | 核心内容 |
|:-----|:-----|:---------|
| **4.9.45** | 2026-08-21 | 全局过滤器体系修正（ADR18）：移除 SG 安全核心特性重复声明（`[AuthorityFilter]` + `[ValidateParametersFilt… |
| **4.9.44** | 2026-08-21 | Mock 数据基础设施 C# 版（ADR09 实施）：内存 `MockDbEntityDAC` + Bogus 驱动规则化数据生成（`BogusDataGene… |
| **4.9.43** | 2026-08-20 | 代码质量修复（ADR 外评审发现）：安全（异常消息不泄漏客户端）+ 资源泄漏（HttpRequestMessage using + GraphQLClient … |


> 完整变更历史见 [TKWF CHANGELOG](https://github.com/LoongBa/TKW.Framework/blob/master/docs/CHANGELOG.md)

---

<!-- ===== 区块 8.5: V5.0 路线图 ===== -->
## 🗺️ V5.0 路线图

> V4.9.x 聚焦 Agentic Engineering 基础设施完善。V5.0 将在以下方向增强：

| 方向 | 状态 | 说明 |
|:--|:--|:--|
| 领域事件 + 扩展/插件机制 | 🔬 设计中 | 适配 .NET 10+ 及成熟项目经验，含动态加载。当前版本有 Tools 扩展概念但未框架级支持，将升级为完整机制 |
| 分布式 / 微服务 | 💬 讨论中 | 老版本基于自有架构，V5.0 将基于成熟项目重新设计实现 |
| Agent UI 组件库 | 📋 规划中 | MVC / Blazor WASM / HTML 三端 UI 组件，方便 Agent 提高 UI 开发效率 |

---

<!-- ===== 区块 9: 包索引 ===== -->
## 包索引

核心包 `TKWF.Domain` 一行安装即可开始。完整的 NuGet 包清单和 npm 前端包见二级页面。

→ [NuGet 包索引](articles/advanced/packages.md)

---

<!-- ===== 区块 10: 链接 ===== -->
## 链接

- GitHub: [LoongBa/TKW.Framework](https://github.com/LoongBa/TKW.Framework)
- 许可证: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)（署名-非商业性使用）
- 构建状态: [![Build and Deploy Docs](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml/badge.svg)](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml)











