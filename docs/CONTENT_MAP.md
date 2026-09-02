# Content Map — 内容地图规范

> **版本**：V1.3 · 2026-08-24
> **对齐 TKWF**：V4.9.91
>
> 本文件是 **内容文件** 与 **渲染组件** 之间的接线契约。
>
> | 角色 | 职责 | 碰的文件 |
> |:---|:---|:---|
> | **内容维护者**（本项目） | 写/改内容、维护本文件 | `docs/content/**`、`CONTENT_MAP.md` |
> | **UI Agent** | 按本文件接线，组件纯渲染，零硬编码内容 | `src/components/**`、`src/routes/**`、`src/lib/**` |
>
> > **路径约定**：本文件中 UI Agent 的 `src/` 路径均相对于 `webui/` 项目根目录（即仓库中的 `webui/src/`）。内容文件的 `docs/content/` 路径均相对于仓库根目录。
>
> ### Source of Truth（UI Agent 读取策略）
>
> | 场景 | 需要读什么 | 理由 |
> |:---|:---|:---|
> | **首次任务** | 读本文件全文 + 读 `docs/content/` 下所有文件 | 建立完整的架构理解 |
> | **版本号变化**（V1.0 → V1.1） | 重读本文件全文 | 规范本身有变更（新规则/新 schema） |
> | **版本号不变，有新增内容** | 读 §八 映射表 + 对应新内容文件 | 结构没变，只加新区块 |
> | **版本号不变，内容微调** | 只读改过的内容文件 | 数据更新，组件不动 |
> | **UI Agent 不记得上次状态** | 读本文件 §一~§七 快速回顾 + 读 §八 映射表 | 重建上下文 |
>
> - **本文件位置**：`TKWF.Docs/docs/CONTENT_MAP.md`
> - **内容文件位置**：`TKWF.Docs/docs/content/`
> - **版本号说明**：大版本（V1 → V2）结构性重构，子版本（V1.0 → V1.1）新增/修改章节，修订（V1.0.1）错别字/格式
>
> ### UI Agent 本地预览工作流
>
> UI Agent 需要在本地 `src/content/` 保留一份内容文件副本用于 Vite HMR 实时预览：
>
> ```
> 1. cd webui
> 2. 从 GitHub 下载最新内容文件到本地 src/content/
>    curl -L https://api.github.com/repos/LoongBa/TKWF.Docs/contents/docs/content -o content.zip
>    或：git clone --depth 1 --filter=blob:none --sparse https://github.com/LoongBa/TKWF.Docs.git
> 3. pnpm dev  ← Vite HMR 热更新正常
> ```
>
> 交付包时 `src/content/` 会包含在内——**TKWF.Docs 维护者收到包后会删除该目录**，因为事实来源是 `docs/content/`。不影响编译（Vite 别名 `@content` 指向 `../docs/content/`）。

---

## 一、总则

### 1.1 格式选择规则

| 内容类型 | 格式 | 适用场景 | 理由 |
|:---|:---|:---|:---|
| 结构化卡片数据 | **JSON** | 特性列表、版本表、路径卡片、评估分数 | 类型安全、Vite 原生 import、非技术人员可编辑 |
| 长文本 + 代码 | **Markdown** | 代码场景（frontmatter + code fence） | 保留语法高亮、与 DocFX 文章格式一致 |
| 站点配置 | **JSON** | 版本号、URL、徽章 | 机器可读、prebuild.ps1 可自动更新 |
| 导航/页脚链接 | **JSON** | 链接列表 | 结构化、可区分链接类型 |

### 1.2 命名规则

| 项 | 规则 | 示例 |
|:---|:---|:---|
| JSON 文件名 | `kebab-case.json` | `features.json`、`versions.json` |
| MD 文件名 | `{两位序号}-{语义名}.md` | `01-entity.md`、`02-service.md` |
| JSON 字段名 | `camelCase` | `title`、`maxScore`、`isWinner` |
| 图标字段值 | `kebab-case` 字符串 | `"settings"`、`"bar-chart-3"` |
| Section key | `kebab-case` 单词 | `hero`、`features`、`code-examples` |

### 1.3 链接类型

所有包含链接的内容（hero CTAs、nav、paths 等）必须标注 `type` 字段：

| type 值 | 含义 | 组件渲染 |
|:---|:---|:---|
| `"spa"` | SPA 内部路由 | TanStack Router `<Link to={...}>` |
| `"docfx"` | DocFX 文档页面 | 普通 `<a href={...}>`（整页跳转） |
| `"external"` | 外部网站 | 普通 `<a href={...} target="_blank">` |

---

## 二、目录结构

```
docs/content/
├── site.json                      ← 站点级配置（版本、URL、许可证）
├── shared/
│   ├── nav.json                   ← 导航栏链接
│   └── footer.json                ← 页脚
├── home/
│   ├── sections.json              ← 首页 Section 顺序注册表（§六）
│   ├── hero.json                  ← Hero 区（徽章、标题、CTA）
│   ├── evaluation.json            ← Agentic 友好度评估
│   ├── workflow.json              ← 三方分工工作流
│   ├── pillars.json               ← 五大设计支柱
│   ├── paths.json                 ← 路径卡片
│   ├── features.json              ← 核心特性卡片
│   ├── versions.json              ← 版本动态（⚠ prebuild 自动同步）
│   ├── roadmap.json               ← V5.0 路线图
│   └── scenarios/                 ← 代码场景（10个 MD 文件）
│       ├── 01-entity.md
│       ├── 02-service.md
│       ├── 03-wasm-client.md
│       ├── 04-cqrs-viewentity.md
│       ├── 05-user-centric.md
│       ├── 06-auto-registration.md
│       ├── 07-knowledge-docs.md
│       ├── 08-ts-client.md
│       ├── 09-testing-mock.md
│       └── 10-agentic-skills.md
├── nuget/
│   └── packages.json              ← NuGet 包列表
├── architecture/
│   └── layers.json                ← 架构分层
└── best-practices/
    └── practices.json             ← 最佳实践条目
```

---

## 三、JSON Schema（逐文件）

### 3.1 `site.json` — 站点配置

```json
{
  "name": "TKW.Framework",
  "tagline": "让 Agentic Engineering 更可控、更可靠的软件开发框架",
  "version": "4.9.61",
  "dotnetVersion": "10",
  "repoUrl": "https://github.com/LoongBa/TKW.Framework",
  "docsRepoUrl": "https://github.com/LoongBa/TKWF.Docs",
  "license": "CC BY-NC 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by-nc/4.0/",
  "buildBadgeUrl": "https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml/badge.svg",
  "buildBadgeLink": "https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml"
}
```

### 3.2 `shared/nav.json` — 导航栏

```json
{
  "links": [
    { "label": "首页", "href": "/", "type": "spa" },
    { "label": "NuGet 包", "href": "/nuget", "type": "spa" },
    { "label": "架构详解", "href": "/architecture", "type": "spa" },
    { "label": "最佳实践", "href": "/best-practices", "type": "spa" },
    { "label": "文档", "href": "articles/intro.md", "type": "docfx" },
    { "label": "API 参考", "href": "api/TKWF.Domain.yml", "type": "docfx" }
  ],
  "externalLinks": [
    { "label": "GitHub", "href": "https://github.com/LoongBa/TKW.Framework", "icon": "github" }
  ]
}
```

### 3.3 `shared/footer.json` — 页脚

```json
{
  "copyright": "© LoongBa / TKWF 团队",
  "year": "dynamic",
  "tagline": "让 Agentic Engineering 更可控、更可靠",
  "links": [
    { "label": "GitHub", "href": "https://github.com/LoongBa/TKW.Framework", "type": "external", "icon": "github" },
    { "label": "许可证", "href": "https://creativecommons.org/licenses/by-nc/4.0/", "type": "external" },
    { "label": "构建状态", "href": "BUILD_BADGE", "type": "external", "isBadge": true }
  ]
}
```

> `"year": "dynamic"` → 组件中 `new Date().getFullYear()`
> `"isBadge": true` → 渲染为 `<img>` 而非文字链接
> `"href": "BUILD_BADGE"` → 从 `site.json` 的 `buildBadgeLink` 读取

### 3.4 `home/hero.json` — Hero 区

```json
{
  "badges": [
    { "label": ".NET", "value": "10", "color": "blue" },
    { "label": "version", "value": "4.9.61", "color": "green" },
    { "label": "Agentic", "value": "Engineering", "color": "purple" }
  ],
  "title": "TKW.Framework — 让 Agentic Engineering 更可控、更可靠的软件开发框架",
  "subtitle": "开发者思考意图 → AI 辅助实现 → 框架约束保障",
  "tagline": "Agent 思考越少越可控，框架支撑越多越可靠",
  "ctas": [
    { "label": "🚀 5 分钟快速开始", "href": "articles/getting-started.md", "variant": "primary", "type": "docfx" },
    { "label": "📖 框架概览", "href": "articles/intro.md", "variant": "outline", "type": "docfx" },
    { "label": "🤖 AI 快速上手", "href": "articles/agentic/quick-start-for-ai.md", "variant": "outline", "type": "docfx" }
  ]
}
```

> `variant` → 对应 shadcn Button variant：`"primary"` = `default`，`"outline"` = `outline`
> `color` → 徽章颜色主题：`blue`/`green`/`purple`/`orange` 等，映射到 Tailwind 色值

### 3.5 `home/evaluation.json` — Agentic 评估

```json
{
  "title": "Agentic Engineering 最友好的框架：TKW.Framework",
  "intro": "业界对 Agentic 友好度 10 维准则评估，TKWF 全维度满分：",
  "frameworks": [
    { "name": "ABP Framework", "score": 24, "maxScore": 50, "color": "orange" },
    { "name": "Axon Framework", "score": 30, "maxScore": 50, "color": "orange" },
    { "name": "TKW.Framework", "score": 50, "maxScore": 50, "color": "green", "isWinner": true }
  ],
  "trendSignals": [
    "ABP Framework 社区投票用 Source Generator 替代 DynamicProxy（issue #7198，2026.03）",
    "lint4sg（2026.03）——专为约束 AI 而建的编译期分析器，与 TKWF 编译期约束路线一致",
    "Spring AOP @Retryable 静默失败（Doctolib 2026.05）——运行时代理的静默失败是 AI 无法自诊断的致命问题"
  ],
  "detailLink": {
    "label": "完整评估报告（10 维逐条详解 + CQRS 架构 + 诚实限制）",
    "href": "articles/explanation/agentic-evaluation.md",
    "type": "docfx"
  }
}
```

### 3.6 `home/workflow.json` — 三方分工

```json
{
  "title": "TKW.Framework：合理分工，更可控、更可靠",
  "quote": "Agentic Engineering — 你不直接写代码 99% 的时间，你在编排 Agent 并充当监督者。",
  "quoteAuthor": "Andrej Karpathy, 2026",
  "intro": "TKWF 框架自动完成尽可能多，只需少量业务代码：",
  "steps": [
    { "icon": "user", "label": "👤 开发者", "subtitle": "提供需求文档", "color": "blue" },
    { "icon": "bot", "label": "🤖 AI Agent", "subtitle": "编写 Entity/Service", "color": "amber" },
    { "icon": "settings", "label": "⚙️ TKW.Framework", "subtitle": "编译期生成", "color": "purple" }
  ],
  "outputs": [
    "Controller + AOP 装饰器",
    "GraphQL / REST 端点",
    "强类型客户端代理",
    "知识文档 + Mock 数据"
  ],
  "collaborationStep": { "icon": "refresh-cw", "label": "🔄 人机协同", "subtitle": "完善细节" },
  "summary": "将需求分解为最小粒度交给 Agent：一个用例 = 一个 Service 方法，无需理解全局架构、DI 配置、路由注册、序列化细节，没有机会犯错。",
  "principle": "粒度细分 = 模型更少思考 = 更高可控性和可靠性 = 更低上下文依赖和 Token 消耗。",
  "codeExample": {
    "title": "开发者 + Agent 只写这一份",
    "language": "csharp",
    "code": "[GenerateController]\npublic class OrderService(DomainUser<AppUserInfo> user)\n    : DomainServiceBase<AppUserInfo>(user)\n{\n    [AuthorityFilter(Roles = \"Admin\")]\n    [Transactional]\n    public async Task<Order> CreateAsync(string title) { ... }\n}\n\n// 编译期自动产出 5 份（开发者不用写，Agent 也不用写）：\n// → IOrderServiceController.g.cs         (契约接口)\n// → OrderServiceControllerDecorator.g.cs  (AOP 装饰器)\n// → OrderServiceResolver.g.cs            (GraphQL Resolver)\n// → OrderServiceEndpoints.g.cs           (REST 端点)\n// → OrderServiceClient.g.cs              (客户端代理)"
  }
}
```

> `codeExample` 嵌入在 JSON 中因为代码较短且与工作流说明强耦合。长代码用 MD 场景文件（§五）。

### 3.7 `home/pillars.json` — 五大设计支柱

```json
[
  {
    "icon": "puzzle",
    "emoji": "🧩",
    "title": "领域自治",
    "subtitle": "编译即运行，零运行时惊喜",
    "description": "DomainUser 不进 DI 容器不会串号、不经动态代理、不被运行时反射——代码所写即所得，AI 和人类看到同一份可预测的执行流。20+ 编译期诊断直接 fail build，结构错误编译期暴露，不合规代码根本编译不过。"
  },
  {
    "icon": "zap",
    "emoji": "⚡",
    "title": "仅极少业务代码",
    "subtitle": "一行标注，编译期产出全部管道",
    "description": "无需手写 Controller/路由/DI 注册/客户端代理——传统样板代码占 70%。[GenerateController] 一行标注 → 编译期生成 5 份管道（Controller+AOP+GraphQL+REST+Client）+ AutoQuery 消除 80% 手写查询 Service。"
  },
  {
    "icon": "bar-chart-3",
    "emoji": "📊",
    "title": "架构级读写分离",
    "subtitle": "视图即统计，前后端配合更丝滑",
    "description": "传统痛点：前端需要各种复杂查询和统计，且经常因 UI 调整而更改——后端最大工作量在复杂查询类方法。Entity（写模型）/ VEntity（读模型）在类型系统级分离：只需调整视图（ViewSql），框架自动持久化 DB 视图 + 编译期列名校验，自动生成统计 Dto（扫描 SUM/COUNT/AVG/MIN/MAX 推断类型）+ AutoQuery 自动生成分页查询——几乎不需要编写代码。三端统一 User.Query<T>() 入口 + GraphQL 聚合查询。"
  },
  {
    "icon": "link",
    "emoji": "🔗",
    "title": "全栈一致",
    "subtitle": "C#/Wasm/TypeScript + 无后端自验证",
    "description": "避免前后端 API 不一致，测试无需运行后端——分工同步开发，各自验证。ts-client 与 C# API 形态完全镜像（Use<T>() / Query<T>()），ts-client-mock 两级 mock（离线 MockTransport + HTTP MockHttpServer）让 Agent 无需运行后端即可自验证全链路。"
  },
  {
    "icon": "book-open",
    "emoji": "📚",
    "title": "文档",
    "subtitle": "Agent 无需先验知识，按图索骥",
    "description": "AI 无需了解框架约定，无需读大量源码。7 个框架级 Skills 分步引导 + Domain Map/Api 文档 + 阅读活文档替代源码 + TKWF_Rules.md 路由中枢——Agent 只加载当前域薄索引，无需理解全局架构。"
  }
]
```

### 3.8 `home/paths.json` — 路径卡片

```json
[
  {
    "icon": "rocket",
    "emoji": "🚀",
    "title": "快速探索",
    "emphasis": "5 分钟感受\"标注即生成\"",
    "description": "安装 NuGet → 写 Service → 标注 → 编译即得 GraphQL + REST 端点",
    "href": "articles/getting-started.md",
    "type": "docfx"
  },
  {
    "icon": "book-open",
    "emoji": "📖",
    "title": "框架概览",
    "emphasis": "Agentic Engineering 全景",
    "description": "三方分工、代码生成管线、多协议暴露、安全体系——每段都带代码示例",
    "href": "articles/intro.md",
    "type": "docfx"
  },
  {
    "icon": "microscope",
    "emoji": "🔬",
    "title": "深度理解",
    "emphasis": "为什么这样设计？",
    "description": "领域自治 vs DI 容器、编译期 AOP 原理、三层 SG 管线解剖",
    "href": "articles/explanation/why-domain-autonomy.md",
    "type": "docfx"
  },
  {
    "icon": "bot",
    "emoji": "🤖",
    "title": "AI 快速上手",
    "emphasis": "给 Agent 的速查卡",
    "description": "框架规则、Prompt 模板、源文档映射表——让 AI 高质量生成 Service",
    "href": "articles/agentic/quick-start-for-ai.md",
    "type": "docfx"
  }
]
```

### 3.9 `home/features.json` — 核心特性

```json
[
  { "icon": "settings", "emoji": "⚙️", "title": "编译期 AOP", "description": "Source Generator 编译期生成装饰器，零运行时反射。权限、事务、验证声明式标注。" },
  { "icon": "file-code", "emoji": "📐", "title": "声明式标注", "description": "[GenerateController] → Controller + AOP + GraphQL/REST 端点 + 客户端代理全自动生成。" },
  { "icon": "puzzle", "emoji": "🧩", "title": "领域自治", "description": "DomainUser 不进 DI 容器，Use<T>() 显式传递，物理隔离，杜绝串号。" },
  { "icon": "bar-chart-3", "emoji": "📊", "title": "框架级 CQRS", "description": "Entity 写 / VEntity（View Entity）读，table/view 底层分离。IQueryable + GraphQL 提供强大查询/统计/聚合。" },
  { "icon": "bot", "emoji": "🤖", "title": "Agentic Skills", "description": "7 个框架级 Skills（设计→实体→业务→测试→前端→Mock），Agent 按 skill 分步完成开发。" },
  { "icon": "monitor", "emoji": "📦", "title": "前后端一致", "description": "Blazor Web Server / Wasm / 网页（TS）开发体验统一。ts-client + ts-client-mock 两级 mock 自验证。" },
  { "icon": "plug", "emoji": "🔌", "title": "多协议传输", "description": "一份 Service → GraphQL + REST + RPC 三端自动暴露。默认三协议，可扩展（如 OData）。" },
  { "icon": "shield", "emoji": "🛡️", "title": "两道防线", "description": "编译期拦截结构性错误（20+ 诊断），运行时拦截行为错误（授权/验证/事务）。" },
  { "icon": "lock", "emoji": "🔐", "title": "安全 + SystemActor", "description": "AuthorityFilter + Challenge-Response + SystemActor 区分人/系统写入审计。错误码全栈统一。" },
  { "icon": "database", "emoji": "🏗️", "title": "ORM 可扩展", "description": "内置 FreeSql + MockEntityDac（测试），IEntityDAC ORM 无关抽象，可扩展支持其它。" }
]
```

### 3.10 `home/versions.json` — 版本动态

```json
[
  { "version": "4.9.61", "date": "2026-08-23", "description": "多 ORM 表结构同步门控分层（ADR30）：SyncTables 固定流程 + AutoMigrateDatabase 转正为生产放行开关" },
  { "version": "4.9.60", "date": "2026-08-23", "description": "SG 生成代码编译修复：枚举特性参数完整表达式生成 + [Service]/Filter 命名空间修正（消费项目 199 错误全归零）" },
  { "version": "4.9.59", "date": "2026-08-22", "description": "DatabaseProvider 枚举 + ViewSql 方言兼容性检查（覆盖 FreeSql + EF Core 全部数据库类型 26 值枚举）" }
]
```

> **⚠ 此文件由 `prebuild.ps1` 从 `_TKWF/docs/CHANGELOG.md` 自动同步，不要手动修改版本数据。**
> 仅可修改字段结构（如新增列），数据内容由脚本写入。

### 3.11 `home/roadmap.json` — V5.0 路线图

```json
{
  "title": "🗺️ V5.0 路线图",
  "intro": "V4.9.x 聚焦 Agentic Engineering 基础设施完善。V5.0 将在以下方向增强：",
  "items": [
    { "direction": "领域事件 + 扩展/插件机制", "status": "🔬 设计中", "description": "适配 .NET 10+ 及成熟项目经验，含动态加载。当前版本有 Tools 扩展概念但未框架级支持，将升级为完整机制" },
    { "direction": "分布式 / 微服务", "status": "💬 讨论中", "description": "老版本基于自有架构，V5.0 将基于成熟项目重新设计实现" },
    { "direction": "Agent UI 组件库", "status": "📋 规划中", "description": "MVC / Blazor WASM / HTML 三端 UI 组件，方便 Agent 提高 UI 开发效率" }
  ]
}
```

### 3.12 `nuget/packages.json` — NuGet 包列表

```json
{
  "intro": "核心包 TKWF.Domain 一行安装即可开始。完整的 NuGet 包清单见二级页面。",
  "corePackage": {
    "name": "TKWF.Domain",
    "installCommand": "dotnet add package TKWF.Domain",
    "description": "核心领域框架包，包含 DomainUser、DomainService、AOP、代码生成等全部核心功能"
  },
  "packages": [
    { "name": "TKWF.Domain", "category": "core", "description": "核心领域框架" },
    { "name": "TKWF.Domain.Web", "category": "web", "description": "Web 项目集成" },
    { "name": "TKWF.Domain.FreeSql", "category": "orm", "description": "FreeSql ORM 适配" }
  ],
  "linkToFullList": { "label": "NuGet 包索引", "href": "articles/advanced/packages.md", "type": "docfx" }
}
```

> 此结构为初始模板，具体字段请根据 `/nuget` 页面实际内容补充。

### 3.13 `architecture/layers.json` — 架构分层

```json
{
  "intro": "TKWF.Framework 分层架构设计",
  "layers": [
    { "icon": "layers", "name": "表现层", "description": "Blazor / MVC / Wasm / TypeScript" },
    { "icon": "shield", "name": "传输层", "description": "GraphQL + REST + RPC 三协议" }
  ]
}
```

> 此结构为初始模板，具体字段请根据 `/architecture` 页面实际内容补充。

### 3.14 `best-practices/practices.json` — 最佳实践

```json
{
  "sections": [
    {
      "title": "推荐做法",
      "icon": "check-circle-2",
      "items": [
        { "title": "...", "description": "...", "code": "..." }
      ]
    },
    {
      "title": "反模式",
      "icon": "alert-triangle",
      "items": [
        { "title": "...", "description": "...", "code": "..." }
      ]
    }
  ]
}
```

> 此结构为初始模板，具体字段请根据 `/best-practices` 页面实际内容补充。

---

## 四、图标映射协议

### 4.1 规则

1. JSON 中 `"icon": "settings"` → 存 **kebab-case 字符串 key**
2. 组件中通过 `iconMap[key]` 取 lucide-react 图标组件
3. 新增图标：在 JSON 中用新 key + 在 `icon-map.ts` 中加映射

### 4.2 UI Agent 创建 `src/lib/icon-map.ts`

```ts
import {
  Settings, FileCode, Puzzle, Zap, BarChart3, Link, BookOpen,
  Bot, Monitor, Plug, Shield, Lock, Database, User, ArrowRight,
  ArrowDown, Github, ExternalLink, CheckCircle2, XCircle,
  CalendarDays, Clock, Rocket, Layers, Code2, GitBranch,
  Workflow, Copy, Check, Download, Package, Lightbulb,
  AlertTriangle, Microscope, RefreshCw, Menu, X, Sun, Moon
} from "lucide-react";

export const iconMap = {
  settings: Settings,
  "file-code": FileCode,
  puzzle: Puzzle,
  zap: Zap,
  "bar-chart-3": BarChart3,
  link: Link,
  "book-open": BookOpen,
  bot: Bot,
  monitor: Monitor,
  plug: Plug,
  shield: Shield,
  lock: Lock,
  database: Database,
  user: User,
  "arrow-right": ArrowRight,
  "arrow-down": ArrowDown,
  github: Github,
  "external-link": ExternalLink,
  "check-circle-2": CheckCircle2,
  "x-circle": XCircle,
  "calendar-days": CalendarDays,
  clock: Clock,
  rocket: Rocket,
  layers: Layers,
  "code-2": Code2,
  "git-branch": GitBranch,
  workflow: Workflow,
  copy: Copy,
  check: Check,
  download: Download,
  package: Package,
  lightbulb: Lightbulb,
  "alert-triangle": AlertTriangle,
  microscope: Microscope,
  "refresh-cw": RefreshCw,
  menu: Menu,
  x: X,
  sun: Sun,
  moon: Moon,
} as const;

export type IconKey = keyof typeof iconMap;
```

### 4.3 组件中使用

```tsx
import { iconMap } from "@/lib/icon-map";

// JSON: { "icon": "settings", ... }
const Icon = iconMap[feature.icon as IconKey];
return <Icon className="h-5 w-5" />;
```

---

## 五、Markdown 场景文件规范

### 5.1 文件命名

`{两位序号}-{语义名}.md`，序号决定默认渲染顺序。

### 5.2 Frontmatter Schema

```yaml
---
order: 1                    # 整数，排序用
badge: "1️⃣"                 # 场景编号徽章（显示在卡片头部）
title: Agent 编写 Entity     # 场景标题
description: 简短描述         # 一句话描述
language: csharp            # 代码语言：csharp / typescript / bash / text
---
```

### 5.3 正文规则

- Frontmatter 之后是正文
- 正文用标准 Markdown：说明文字 + code fence
- 多段代码用说明文字分隔，每段 code fence 可标注不同语言
- 组件解析时：提取所有 ```code fence``` 作为代码块，非代码文本作为说明段落

### 5.4 示例 (`home/scenarios/01-entity.md`)

实际文件内容（参见 `docs/content/home/scenarios/01-entity.md`）：

- **Frontmatter**：`order`、`badge`、`title`、`description`、`language` 五个字段
- **正文**：说明文字与代码块交替，代码块用标准 ```` ```csharp ```` 围栏
- **多个代码块**：用说明文字分隔，每段可标注不同语言

> UI Agent 实现时：用 `gray-matter` 解析 frontmatter，用正则提取 `` ``` `` 围栏内容作为代码块，围栏外文本作为说明段落。

### 5.5 Vite MD 加载方案

**方案 A（推荐）：`?raw` + 自定义 parser**

```ts
// src/lib/markdown.ts — UI Agent 创建
import matter from "gray-matter";

export function parseScenario(rawContent: string) {
  const { data: frontmatter, content } = matter(rawContent);
  const codeBlocks = extractCodeBlocks(content);  // 提取 ``` fence
  const descriptions = extractTextSegments(content); // 提取非代码文本
  return { frontmatter, codeBlocks, descriptions };
}
```

```tsx
// 组件中使用
import rawScenario from "@content/home/scenarios/01-entity.md?raw";
import { parseScenario } from "@/lib/markdown";

const scenario = parseScenario(rawScenario);
// scenario.frontmatter.title, scenario.codeBlocks[0].code, ...
```

**方案 B：`vite-plugin-markdown`**

```ts
// vite.config.ts
import markdownPlugin from "vite-plugin-markdown";
// plugins: [markdownPlugin({ mode: "html" })]
```

两种方案都构建时编译，零运行时性能开销。方案 A 更灵活（自定义解析），方案 B 更省事。

---

## 六、Section 注册表

### 6.1 `home/sections.json`

```json
[
  "hero",
  "evaluation",
  "workflow",
  "pillars",
  "scenarios",
  "paths",
  "features",
  "versions",
  "roadmap"
]
```

### 6.2 规则

| 操作 | 改什么 |
|:---|:---|
| 调整 Section 顺序 | 重排数组元素 |
| 新增 Section | 数组加 key + 创建内容文件 + 通知 UI Agent 建组件 |
| 删除 Section | 数组删 key（内容文件保留，不渲染） |

### 6.3 UI Agent 路由接线模式

```tsx
// routes/index.tsx — UI Agent 实现
import sectionOrder from "@content/home/sections.json";
import { HeroSection } from "@/components/sections/hero";
import { EvaluationSection } from "@/components/sections/evaluation";
import { WorkflowSection } from "@/components/sections/workflow";
import { PillarsSection } from "@/components/sections/pillars";
import { ScenariosSection } from "@/components/sections/scenarios";
import { PathsSection } from "@/components/sections/paths";
import { FeaturesSection } from "@/components/sections/features";
import { VersionsSection } from "@/components/sections/versions";
import { RoadmapSection } from "@/components/sections/roadmap";

const sectionMap: Record<string, React.FC> = {
  hero: HeroSection,
  evaluation: EvaluationSection,
  workflow: WorkflowSection,
  pillars: PillarsSection,
  scenarios: ScenariosSection,
  paths: PathsSection,
  features: FeaturesSection,
  versions: VersionsSection,
  roadmap: RoadmapSection,
};

function HomePage() {
  return (
    <>
      {sectionOrder.map(key => {
        const Section = sectionMap[key];
        return Section ? <Section key={key} /> : null;
      })}
    </>
  );
}
```

---

## 七、组件契约（UI Agent 必须遵守）

### 7.1 纯渲染原则

| 规则 | 说明 |
|:---|:---|
| ✅ 从 `@content/` 静态 import 内容文件 | `import features from "@content/home/features.json"` |
| ✅ 用 `iconMap` 映射图标字符串 | `const Icon = iconMap[feature.icon]` |
| ✅ 命名导出 | `export function FeaturesSection() { ... }` |
| ✅ 不接受 props | 内容自带，不需要传入 |
| ❌ 不硬编码任何文本/数据/代码 | 所有内容来自 content 文件 |
| ❌ 不在组件内定义数据数组 | `const FEATURES = [...]` 禁止 |

### 7.2 链接渲染规则

```tsx
// type: "spa" → TanStack Router
import { Link } from "@tanstack/react-router";
<Link to={link.href}>{link.label}</Link>

// type: "docfx" → 整页跳转
<a href={link.href}>{link.label}</a>

// type: "external" → 新标签页
<a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
```

### 7.3 Section 标题区

每个 Section 渲染时自动加 `<section id="{key}">` 锚点，用于 Hero 的 `scrollTo` 平滑滚动。

### 7.4 新增 Section 完整流程

1. **内容维护者**：
   - 在 `docs/content/home/` 下新建内容文件（JSON 或 MD）
   - 在 `sections.json` 数组中加 key
   - 在本文件 §八 映射表加一行
   - 通知 UI Agent

2. **UI Agent**：
   - 创建 `src/components/sections/{key}.tsx`
   - 按本文件 §七 规则实现纯渲染组件
   - 在路由的 `sectionMap` 中注册

### 7.5 新增页面完整流程

1. **内容维护者**：
   - 在 `docs/content/{page-name}/` 下创建内容文件
   - 在 `shared/nav.json` 中加导航链接（`type: "spa"`）
   - 在本文件 §八 加页面映射表
   - 通知 UI Agent

2. **UI Agent**：
   - 创建 `src/routes/{page-name}.tsx`
   - 实现页面组件（从 content 文件读取数据）

### 7.6 Vite 别名配置（UI Agent 在 `webui/vite.config.ts` 中设置）

内容文件在 `docs/content/` 下，SPA 在 `webui/` 下，需要用 Vite 别名桥接：

```ts
// webui/vite.config.ts
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@content": path.resolve(__dirname, "../docs/content"),
      "@": path.resolve(__dirname, "./src"),   // 已有别名
    },
  },
});
```

组件中这样导入：
```tsx
import features from "@content/home/features.json";
import rawScenario from "@content/home/scenarios/01-entity.md?raw";
import { iconMap } from "@/lib/icon-map";  // webui 内部路径不变
```

### 7.7 DocFX 风格同步（SPA 定稿后实施）

SPA 首页风格定稿后，从 `webui/src/styles.css` 的 `@theme inline` 中提取设计令牌，供 DocFX 自定义模板使用：

```css
/* 共享 CSS 变量（docs/assets/tkwf-theme.css） */
:root {
  --color-primary: #...;
  --color-accent: #...;
  --font-sans: '...';
  --radius: 0.5rem;
}
```

SPA 通过 Tailwind `@theme` 引用，DocFX 通过自定义模板 `<link>` 引入。两者保持品牌色一致，但布局各自独立。

---

## 八、完整映射表

### 首页 (/)

| Section Key | 内容文件 | 格式 | 组件路径 | 说明 |
|:---|:---|:---|:---|:---|
| `hero` | `home/hero.json` | JSON | `sections/hero.tsx` | Hero 区：徽章+标题+CTA |
| `evaluation` | `home/evaluation.json` | JSON | `sections/evaluation.tsx` | Agentic 友好度三方评估 |
| `workflow` | `home/workflow.json` | JSON | `sections/workflow.tsx` | 三方分工工作流 + 代码 |
| `pillars` | `home/pillars.json` | JSON | `sections/pillars.tsx` | 五大设计支柱 |
| `scenarios` | `home/scenarios/*.md` | MD | `sections/scenarios.tsx` | 10 个代码场景（Tabs 切换） |
| `paths` | `home/paths.json` | JSON | `sections/paths.tsx` | 4 张路径卡片 |
| `features` | `home/features.json` | JSON | `sections/features.tsx` | 10 张核心特性卡片 |
| `versions` | `home/versions.json` | JSON | `sections/versions.tsx` | 版本动态表（prebuild 同步） |
| `roadmap` | `home/roadmap.json` | JSON | `sections/roadmap.tsx` | V5.0 路线图 |

### NuGet 页 (/nuget)

| 内容文件 | 格式 | 说明 |
|:---|:---|:---|
| `nuget/packages.json` | JSON | 包列表 + 安装命令 |

### 架构页 (/architecture)

| 内容文件 | 格式 | 说明 |
|:---|:---|:---|
| `architecture/layers.json` | JSON | 架构分层信息 |

### 最佳实践页 (/best-practices)

| 内容文件 | 格式 | 说明 |
|:---|:---|:---|
| `best-practices/practices.json` | JSON | 推荐做法 + 反模式 |

### 共享

| 内容文件 | 格式 | 说明 |
|:---|:---|:---|
| `site.json` | JSON | 站点配置（版本、URL、许可证） |
| `shared/nav.json` | JSON | 导航栏 |
| `shared/footer.json` | JSON | 页脚 |

---

## 九、内容维护工作流

### 9.1 日常内容修改

```
改文字/数据 → 编辑对应 JSON/MD 文件 → git commit → push
                                      ↓
                              UI Agent 不需要介入
```

### 9.2 新增内容区块（首页内）

```
1. 创建内容文件 (docs/content/home/xxx.json)
2. 在 sections.json 加 key
3. 在本文件 §八 加映射行
4. 通知 UI Agent 创建组件
```

### 9.3 新增页面（新路由）

> 如新增 `/download`、`/showcase` 等独立页面，非首页内的区块。

```
1. 创建内容文件 (docs/content/{page-name}/xxx.json)
2. 在 shared/nav.json 加导航链接（type: "spa"）
3. 在本文件 §八 加页面映射表行
4. 通知 UI Agent 创建路由 + 页面组件
```

### 9.4 TKWF 版本同步

```
_TKWF 发布新版本
      ↓
prebuild.ps1 自动更新 versions.json（+ llms.txt + source-doc-map.md）
      ↓
git commit + push → CI 重建 SPA + DocFX → GitHub Pages 自动部署
```

> `versions.json` 是 prebuild.ps1 的写入目标之一，不要手动改版本数据。
> `site.json` 的 `version` 字段也由 prebuild.ps1 同步。

### 9.5 接收 UI Agent 输出包

UI Agent 每次交付完整的 SPA 项目包，**你负责筛选整理**：

```
1. Remove-Item -Recurse -Force webui/     ← 删干净，不留旧文件残留
2. 解压包 → webui/                         ← 放入新文件
3. Remove-Item -Recurse -Force webui/src/content/  ← 删除 UI Agent 本地副本，事实来源是 docs/content/
4. cd webui && pnpm install               ← 装依赖
5. cd webui && pnpm build                 ← 验证编译通过
6. git status / git diff                  ← 审查变化
7. git add webui/ && git commit           ← 提交
```

> **注意**：UI Agent 的 `src/content/` 是从 GitHub 下载的本地预览副本，非事实来源。`webui/` 中的组件通过 `@content` 别名导入 `docs/content/` 下的文件，删除此目录不影响编译。
>
> **UI Agent 交付时需附带变更说明**：如果设计调整过程中修改了 `docs/content/` 下的内容文件，UI Agent 应在交付包中附一份变更摘要（`docs/CONTENT_CHANGELOG.md` 或随附说明），列明哪些文件被修改、修改了什么，以便核对和同步到 `docs/content/`。

---

## 十、变更记录

| 版本 | 日期 | 变更 |
|:---|:---|:---|
| V1.3 | 2026-08-24 | 修复：路径前缀约定说明 + §5.4 代码围栏表示改为引用实际文件 |
| V1.2 | 2026-08-24 | 新增 §7.7 DocFX 风格同步指引 |
| V1.1 | 2026-08-24 | 新增 Source of Truth 声明 + 新增页面工作流 §9.3 + 重编号 §9.x |
| V1.0 | 2026-08-24 | 初始版本：完整内容地图规范 |
