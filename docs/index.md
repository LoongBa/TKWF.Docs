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
    <strong>开发者思考意图 → AI 辅助实现 → 框架约束保障</strong>
  </p>

#### 开发者是灵魂，TKWF 是法宝，AI 是器灵。

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

```mermaid
graph LR
    A["👤 开发者<br/>提供需求文档"] --> B["🤖 AI Agent<br/>编写 Entity/Service"]
    B --> C["⚙️ TKW.Framework<br/>编译期生成"]
    C --> D["Controller + AOP 装饰器"]
    C --> E["GraphQL / REST 端点"]
    C --> F["强类型客户端代理"]
    C --> G["知识文档 + Mock 数据"]
    D --> H["🔄 人机协同<br/>完善细节"]
    E --> H
    F --> H
    G --> H
    H -. 迭代：增量开发、维护和扩展 .-> A
```

框架将每一部分分解为**最小粒度**交给 Agent 编写——一个用例 = 一个 Service 方法，Agent 无需理解全局架构、DI 配置、路由注册、序列化细节。

> **粒度细分 = 更少模型思考 = 更高可控性和可靠性 = 更低上下文依赖和 Token 消耗。**

```csharp
// 开发者 + Agent 只写这一份
[GenerateController]
public class OrderService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    [AuthorityFilter(Roles = "Admin")]
    [Transactional]
    public async Task<Order> CreateAsync(string title) { ... }
}

// 编译期自动产出 5 份（开发者不用写，Agent 也不用写）：
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

## Talk is Cheap, Show me the Code

> 每个场景都是痛点 + 亮点 + 代码——三层分别自动完成、高度一致。

<div class="scenario-card">
  <div class="scenario-card-header">1️⃣ 编写 Entity → 自动建表建视图 + 自动生成 Dto/DataService/Conditions</div>
  <div class="scenario-card-body">
    <p>定义实体字段 + ORM 注解，xCodeGen 自动生成 DTO、DataService（CRUD）、Conditions（查询条件）、Dto 映射代码。</p>
    <p>无需手写样板。</p>

```csharp
[DomainGenerateCode(IsView = true, AutoQuery = true)]
public class OrderView : VEntity
{
    [Column(Name = "order_id")]      public long OrderId { get; set; }
    [Column(Name = "amount")]        public decimal Amount { get; set; }
    [Column(Name = "status")]        public string Status { get; set; }
}
// xCodeGen 自动生成：OrderViewDto / OrderViewDataService / OrderViewConditions / 映射代码
// ViewSql 编译期列名校验——列名不匹配直接 warning + 运行时启动阻断
```

同样，定义普通 Entity 也自动生成 CRUD 的 DataService + Conditions + Dto——查询/更新直接链式调用，返回强类型 Dto：

```csharp
// 自动生成的 OrderDataService + OrderConditions —— 直接链式使用
var ds = User.Use<OrderDataService>();
var list = await ds.Query
    .Where(OrderConditions.Status.Eq("Paid"))        // Conditions 链式条件
    .And(o => o.Amount >= 100)
    .OrderByDescending(o => o.CreateTime)
    .Page(1, 20)
    .ToListAsync()
    .ToDtoList<OrderDto>();                            // 自动映射 DTO

var orderDto = await ds.GetAsync(1L).ToDto<OrderDto>();  // 单条转 DTO
var count = await ds.Query.CountAsync();                  // 计数
```

  </div>
</div>

<div class="scenario-card">
  <div class="scenario-card-header">2️⃣ 编写 Service → 自动生成 Controller + 自动暴露 WebApi</div>
  <div class="scenario-card-body">
    <p>标注 <code>[GenerateController]</code>，SG 编译期生成 Controller + AOP 装饰器 + GraphQL/REST 端点。</p>
    <p>业务方法用 <code>User.Use&lt;T&gt;()</code> 获取 DataService，Conditions 链式查询，声明式认证/审计/事务。</p>

```csharp
[GenerateController]
public class OrderService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    [AuthorityFilter(Roles = "Admin")]   // ← 声明式权限
    [Transactional]                       // ← 声明式事务
    public async Task<OrderDto> CreateAsync(string title)
    {
        var ds = User.Use<OrderDataService>();           // 获取 DataService
        var order = new Order { Title = title, UserId = User.UserId };
        await ds.InsertAsync(order);                        // 自动审计 CreateBy/CreateTime
        return order.ToDto<OrderDto>();                     // 自动映射 DTO
    }

    public async Task<List<OrderDto>> QueryAsync(string keyword)
    {
        var ds = User.Use<OrderDataService>();
        var list = await ds.Query                          // Conditions 链式查询
            .Where(o => o.Title.Contains(keyword))
            .OrderByDescending(o => o.CreateTime)
            .ToListAsync();
        return list.ToDtoList<OrderDto>();
    }

}
// 编译期自动生成 5 份：Controller / AOP Decorator / GraphQL Resolver / REST Endpoint / Client
```

  </div>

</div>

<div class="scenario-card">
  <div class="scenario-card-header">3️⃣ 客户端 Wasm → 自动调用 WebApi + 增强查询</div>
  <div class="scenario-card-body">
    <p>Wasm 端 <code>User.Use&lt;T&gt;()</code> 调用 Service，<code>User.Query&lt;T&gt;()</code> 链式查询——与进程内 C# API 表面同构，查询能力一致。</p>

```csharp
// Wasm 客户端——与进程内 API 形态一致
var svc = User.Use<IOrderServiceController>();
var order = await svc.CreateAsync("买咖啡");        // → GraphQL mutation

var list = await User.Query<Order>()               // 增强查询
    .Where(o => o.Status == "Paid")
    .OrderBy(o => o.CreatedAt)
    .Page(1, 20)
    .ToPageAsync();                                  // → GraphQL connection

var count = await User.Query<Order>()
    .Where(o => o.Status == "Paid")
    .CountAsync();                                   // 仅计数不请求 nodes，省带宽
```

→ [客户端 SDK 文档](articles/client/api-client.md)
  </div>

</div>

<div class="scenario-card">
  <div class="scenario-card-header">4️⃣ CQRS 读写分离 — VEntity（View Entity）强大查询 + 统计聚合</div>
  <div class="scenario-card-body">
    <p>Entity 写模型 / VEntity 读模型，table/view 底层分离。</p>
    <p>VEntity + IQueryable + GraphQL 提供强大查询、统计和聚合能力（StatsDto 自动生成），直接发挥 EF 和数据库视图的优势。</p>

```csharp
// VEntity 专用读模型——框架阻止写操作
var list = await User.Query<OrderSummaryView>()     // EQR 统一入口 3 跳零反射
    .Where(v => v.Status == "Paid")
    .OrderByDescending(v => v.Amount)
    .Page(1, 10)
    .ToListAsync();

// ViewSql 含 SUM/COUNT → xCodeGen 自动生成 StatsDto
var statsDs = User.Use<OrderViewDataService>();
var stats = await statsDs.GetAsync<OrderSummaryStatsDto>();
// stats.TotalAmount / stats.OrderCount / stats.AvgAmount
```
 
> **注**：JS 表现层暂时部分聚合能力受限于 HotChocolate GraphQL 实现限制，可编写特化查询方法变通（增强功能近期实现中）。
  </div>

</div>

<div class="scenario-card">
  <div class="scenario-card-header">5️⃣ 以 User 为中心 + 多租户支持</div>
  <div class="scenario-card-body">
    <p><code>User.Query&lt;Entity&gt;()</code>、<code>User.Use&lt;TService&gt;()</code> 搞定一切——业务类不需要修改构造器，需要什么通过 User 获取，减少运行时错误。</p>
    <p>User 自动完成认证验证、权限、日志、租户隔离。</p>
    <p>业务领域、WebApi 接入层、表现层 Wasm/TypeScript 三层调用体验统一。</p>

```csharp
// 不需要构造器注入——User 统一入口
var ds = User.Use<OrderDataService>();        // 数据服务
var productService = User.Use<ProductService>(); // 其他服务
var repo = User.Use<IEntityDAC<Order>>();       // 原始 DAC

// 多租户——IEntityTenant 自动过滤，无需手写 WHERE TenantId
// IGlobalQueryFilter 策略：软删除 + 多租户 + 审计自动应用
// User.TenantId / User.UserId / User.Roles 全部由框架填充
```

→ [DomainUser 详解](articles/core-concepts/domain-user.md)
  </div>

</div>

<div class="scenario-card">
  <div class="scenario-card-header">6️⃣ 自动注册服务和控制器 — 无需复杂容器配置</div>
  <div class="scenario-card-body">
    <p>一行 <code>AddTKWFDomain</code> 注册全部。</p>
    <p>Service/DataService 自动发现注册，Controller 由 SG 生成自动挂载。</p>
    <p>无 <code>services.AddScoped&lt;T&gt;()</code> 模板代码。</p>

```csharp
// 一行注册全部——自动扫描注册所有 DomainService / DataService
builder.Services.AddTKWFDomain<AppUserInfo, AppDomainInitializer>();

// SG 生成的 _GeneratedControllerRegistrations.g.cs 自动挂载全部 Controller
// 无需 services.AddScoped<OrderService>() — 框架自动注册
// 无需 app.MapControllers() — Minimal API 端点由 SG2 自动生成
```

  </div>

</div>

<div class="scenario-card">
  <div class="scenario-card-header">7️⃣ 自动更新业务领域知识文档 — Agent 无需读代码</div>
  <div class="scenario-card-body">
    <p><code>dotnet build</code> → AfterBuild → xCodeGen 自动生成 <code>.TKWF/{Domain}/</code> 活文档。</p>
    <p>Agent 开发 Service/Test 不读代码、开发 UI 不读接口契约——只读薄索引，<strong>减少上下文依赖和 Token 消耗</strong>。</p>

```csharp
// dotnet build 后自动生成（Agent 读这些，不读 .g.cs）：
// .TKWF/Order/
//   ├── DOMAIN_MAP.md          // 领域实体/服务全貌
//   ├── DataService_API.md     // 每个 DataService 的方法签名速查
//   └── Business.md            // 业务规则物化（tkwf-business skill 产出）

// Agent 守则："❌ 不读 *.g.cs / *.biz.cs / DataServices/*.cs"
```

  </div>

</div>

<div class="scenario-card">
  <div class="scenario-card-header">8️⃣ 网页端 ts-client — 自动生成的强类型客户端</div>
  <div class="scenario-card-body">
    <p>TS 客户端由 <code>schema.graphql</code> <strong>自动生成强类型定义</strong>——无需手写接口、字段名或请求构造，拼错即编译报错。</p>
    <p>API 与 C# Wasm 完全镜像：<code>Tkwf.User.Use&lt;T&gt;()</code> / <code>Tkwf.User.Query&lt;T&gt;()</code>。错误码、认证流程、查询链全部一致。</p>

```typescript
// 由 gen-domain-client 从 schema.graphql 自动生成 ts-client.g.ts：
// interface OrderService { createAsync(args): Promise<Order>; ... }   // 强类型签名
// interface OrderQueryBuilder { where(f): ...; orderBy(f): ... }       // 字段代理类型

// 无需手写任何接口/请求构造——类型即契约，拼错字段编译期报错
const svc = Tkwf.User.Use<OrderService>();          // 强类型服务代理
const order = await svc.createAsync("买咖啡");

const list = await Tkwf.User.Query<Order>()
    .where(f => f.status.eq("Paid"))                // f.status 字段由类型限定，拼错即报错
    .orderBy(f => f.createdAt)
    .page(1, 20)
    .toPageAsync();                                  // 返回强类型 Order[]
```
// TS 前端——与 C# Wasm API 形态完全一致
const svc = Tkwf.User.Use<OrderService>();
const order = await svc.createAsync("买咖啡");

const list = await Tkwf.User.Query<Order>()
    .where(f => f.status.eq("Paid"))
    .orderBy(f => f.createdAt)
    .page(1, 20)
    .toPageAsync();
```

  </div>

</div>

<div class="scenario-card">
  <div class="scenario-card-header">9️⃣ 测试支持 — ts-client-mock 自动生成测试接口 + 语义化测试数据</div>
  <div class="scenario-card-body">
    <p><code>@tkwf/tsclient-mock</code> <strong>自动生成测试接口</strong>（<code>gen-mock-handlers</code> 从 schema 生成 handler 骨架 + <code>satisfies</code> 编译时守卫生成补全），<strong>基于语义描述生成测试数据</strong>（MockDataSpec 规则而非手写死数据）。</p>
    <p>两级 Mock：离线 <code>MockTransport</code>（零依赖单元测试）+ <code>MockHttpServer</code>（HTTP 模拟集成测试）。C# 端 <code>MockEntityDac</code>（InMemory DAC Contract 测试）。</p>

```bash
# 自动生成测试接口骨架——从 schema.graphql 生成 handler + db + 场景
npx gen-mock-handlers --mock-spec spec.json
# 生成 ts-client.mock.g.ts：createMockDb + handlers + scenarios（缺 handler 编译报错）
```

```typescript
// MockDataSpec——语义化描述测试数据，非手写死数据
const spec: MockDataSpec = {
  scenarios: {                        // 场景化数据：默认/空/错误/加载
    "default": { order: { count: 20, fields: { amount: { strategy: "number", min: 10, max: 9999 } } } },
    "empty":   { order: { count: 0 } },
    "error":   { order: { strategy: "throw", errorCode: "OrderLocked" } }
  }
};
const data = generateFromSpec(spec);  // LCG 确定性种子——测试可复现
```

```typescript
// 两级 Mock——开发/测试无需后端
// Level 1: 离线 Mock（零依赖，单机测试）
Tkwf.configure("default", { transport: createMockTransport(handlers) });
// Level 2: HTTP Mock Server（模拟 WebApi，集成测试）
const server = new MockHttpServer(handlers);
await server.listen(4000);
```

  </div>

</div>

<div class="scenario-card">
  <div class="scenario-card-header">🔟 Agentic Skills + 人机友好文档</div>
  <div class="scenario-card-body">
    <p>7 个框架级 Skills（设计→实体→业务→测试→前端→Mock），Agent 按 skill 分步完成开发。</p>
    <p>llms.txt + AC01-06 速查卡 + 活文档 + 编译错误速查——给 Agent 的"指南针而非百科全书"。</p>

```text
tkwf-design    → 设计阶段（需求→R/S/DS/U 文档）
tkwf-business  → 业务规则物化（Business.md 门控）
tkwf-entity    → Entity/VEntity 编写
tkwf-service   → DomainService 编写
tkwf-test      → Contract 测试（InMemory DAC）
tkwf-tsclient  → 前端 RPC 调用
tkwf-tsclient-mock → Mock 数据生成

每个 skill ≤400 行：骨架 → 参数规则 → ✅/❌ 清单 → 编译错误速查
```

→ [AI 快速上手](articles/agentic/quick-start-for-ai.md)
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
    <p>Entity 写 / VEntity（View Entity）读，table/view 底层分离。IQueryable + GraphQL 提供强大查询/统计/聚合（JS 表现层暂时部分受限）。</p>
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

| 版本       | 日期       | 核心内容                                                                                                           |
|:---------- |:---------- |:------------------------------------------------------------------------------------------------------------------ |
| **4.9.45** | 2026-08-21 | 全局过滤器体系修正（ADR18）：移除 SG 安全核心特性重复声明（`[AuthorityFilter]` + `[ValidateParametersFilt…         |
| **4.9.44** | 2026-08-21 | Mock 数据基础设施 C# 版（ADR09 实施）：内存 `MockDbEntityDAC` + Bogus 驱动规则化数据生成（`BogusDataGene…          |
| **4.9.43** | 2026-08-20 | 代码质量修复（ADR 外评审发现）：安全（异常消息不泄漏客户端）+ 资源泄漏（HttpRequestMessage using + GraphQLClient … |

> 完整变更历史见 [TKWF CHANGELOG](https://github.com/LoongBa/TKW.Framework/blob/master/docs/CHANGELOG.md)

---

<!-- ===== 区块 8.5: V5.0 路线图 ===== -->

## 🗺️ V5.0 路线图

> V4.9.x 聚焦 Agentic Engineering 基础设施完善。V5.0 将在以下方向增强：

| 方向                     | 状态      | 说明                                                                                                |
|:------------------------ |:--------- |:--------------------------------------------------------------------------------------------------- |
| 领域事件 + 扩展/插件机制 | 🔬 设计中 | 适配 .NET 10+ 及成熟项目经验，含动态加载。当前版本有 Tools 扩展概念但未框架级支持，将升级为完整机制 |
| 分布式 / 微服务          | 💬 讨论中 | 老版本基于自有架构，V5.0 将基于成熟项目重新设计实现                                                 |
| Agent UI 组件库          | 📋 规划中 | MVC / Blazor WASM / HTML 三端 UI 组件，方便 Agent 提高 UI 开发效率                                  |

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

