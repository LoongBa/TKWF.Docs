# TKWF Framework Documentation

> TKWF 领域自治框架的官方文档站点 —— 为 **Agentic Engineering** 时代设计。

[![Build and Deploy Docs](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml/badge.svg)](https://github.com/LoongBa/TKWF.Docs/actions/workflows/docfx.yml)

**当前同步版本：V4.10.68**（文档与框架 [LoongBa/TKW.Framework](https://github.com/LoongBa/TKW.Framework) 保持同步）

---

## 最近版本动态

| 版本 | 日期 | 核心内容 |
|:-----|:-----|:---------|
| **4.10.68** | 2026-10-07 | 密钥强度调整（转告回复闭环）——组件指南 §7 安全基线 + 适配通知 |
| **4.10.67** | 2026-10-07 | `IRateLimitCheck` 点检查限流原语 R1（ADR104，Utility 收纳边界）——响应扩展组转达（AuthCenter 身份域频控） |
| **4.10.66** | 2026-10-07 | 表名别名机制一等公民化（ADR100）——统一表名解析权威 + TABLE 门控族 4 码（`TKWF_SG1a_TABLE001-004`）+ 框架表前缀统一（52 实体 `TKWF_` 前缀） |
| **4.10.65** | 2026-10-06 | V5/Iter-4 M3 扩展依赖版本门控——`[TKWFExtensionDependency]` + SemVerUtil 比较器 + SG 编译期校验（ADR50 兑现） |
| **4.10.64** | 2026-10-06 | V5/Iter-1 请求级 UoW 上下文（ADR97 实施修正 C1-C3）+ D18A 诊断码登记 |
| **4.10.63** | 2026-10-06 | OAuthClient 引擎 OIDC 增强（ADR103）——边界扩展与 client_credentials 新功能决策 + 跨服务身份传递基线（ADR102） |
| **4.10.62** | 2026-10-06 | `IDacQuerySurface` 数据访问表面判定接口 + V5.0 前瞻立项 Iter-0 交付（ADR97-102 固化台账）+ nuget-unlist workflow 参数化 |
| **4.10.61** | 2026-10-06 | E4 密钥管理抽象上提主框架（ADR96）——5 项 API（`ISymmetricKeyProvider`/`DevKeyCache` 等）+ keyed DI 首次引入 |
| **4.10.60** | 2026-10-06 | OAuth 2.0/OIDC 协议引擎 `TKWF.Utility.OAuthClient`（Oracle 双 PASS）+ V5 清单 #21 已实施 |
| **4.10.58** | 2026-10-05 | 消费方反馈根治（ADR95）——REST 动词规范化 + SG2 编译期能力探测择一（GraphQL/REST-only）+ 运行时 GraphQL fail-fast；`TKWF_SG2_*` 诊断 | 
| **4.10.57** | 2026-10-04 | SG2 权威注册选择契约化（ADR94，问题单 G20）——权限注册选择契约化 + 扩展空壳同名歧义消除；D18A 登记 ERR004/WARN006 |
| **4.10.56** | 2026-10-04 | SG3 属性类型分类元数据完备化（ADR93，问题单 G19）——`ClassifyType` 权威推导 + Category 纯消费 + `TKWF_SG3_GUARD_006` 守卫 |
| **4.10.55** | 2026-10-04 | 多实现集合守卫工厂（ADR92）——`TryAddEnumerableConstructible` + Authentication 登录编排门面 + 4 扩展守卫迁移 |
| **4.10.54** | 2026-10-04 | 转达兑现——后台作业周期调度 `IRecurringBackgroundJobManager`（ADR91）+ 测试辅助 `BindTestScope`/`AssertConstructible` |
| **4.10.53** | 2026-10-03 | 领域自治根治（ADR90）——Store 概念废弃 + `AddConstructibleService` 门面注册 + 批次整改（DI004/DI005 归零） |
| **4.10.52** | 2026-10-03 | IEntityDAC 条件原子更新原语（ADR89）——`UpdateWhereAsync` 单语句条件原子更新 |
| **4.10.51** | 2026-10-03 | 构造注入门控（ADR88）——`DI004` 禁止构造注入域服务 + `DI005` 契约缺口 + 运行期可诊断 |
| **4.10.50** | 2026-10-02 | SG.Tests 运行时隔离测试跨平台路径修复（CI Linux）+ 扩展 DataService 聚合失效根治 |
| **4.10.48** | 2026-10-02 | GraphQLClient 读 `extensions.code` 恒 null 修复（业务码映射全失效，BUG007）+ G18 修复 |
| **4.10.47** | 2026-10-02 | 会话 JSON `$type` 读路径取消反射回退（R3 决策逆向）——未注册一律硬失败 |
| **4.10.46** | 2026-10-02 | 内置控制器 GraphQL 契约字段名对齐 HC 运行时 Async 裁剪（G17/BUG005） |
| **4.10.44** | 2026-10-01 | 会话 JSON 注册表 SG 生成（ADR86 偏离注记）——`[SessionUserType]` 标记 + `SessionUserTypeGenerator`（SG1a）自动注册 + `TKWF_SG1a_SESS001-004` 诊断 |
| **4.10.43** | 2026-10-01 | 会话 JSON 注册表 API（ADR86）——`SessionJsonTypeRegistry` 编译期闭集替换反射兜底 + `DomainUserJsonConverter.Read` 零反射命中路径 + StrictMode 硬失败 |
| **4.10.42** | 2026-10-01 | D19 AOT 三件套复查补丁——LoggerMessage 补迁 12 文件 30 调用点（含 6 热路径 AOP 过滤器）+ `DomainUserJsonConverter.Write` 标注 + D19A 分类修正 |
| **4.10.41** | 2026-10-01 | D19 AOT 三件套（ADR84 落地）——JIT 为主 + 诚实标注策略 + TrimAnalyzer 基线产出（D19A）；新增 D19A 清单文档 |
| **4.10.40** | 2026-10-01 | SG1a 空骨架早退点生成空壳 ProjectMetaContext（ADR85，消除 CS0103）+ 部署包 local-feed 机制（扩展侧方案 B） |
| **4.10.39** | 2026-10-01 | 分组聚合 API（F7，V5 候选转正）——`GroupByAsync`/`GroupCountAsync`/`GroupByAsync` 三方法（GROUP BY + ORDER BY + LIMIT 全下推，ADR15 决策 3 落地） |
| **4.10.38** | 2026-09-30 | `EntityUpdateBatchAsync` 游离实体批量更新失败修复（ADR83，XiaoShuTong G15）——DAC `UpdateBatchAsync` 改 SetSource 裸 IUpdate 路径（对齐 `UpdateColumnsBatchAsync`，公共 API 签名零变化） |
| **4.10.37** | 2026-09-29 | Core 解耦 Localization 编译期强依赖（ADR82）——`EnumDisplayNameAttribute(key)` 语言中性键契约替代 `[Display(ResourceType)]` + `FallbackFrameworkLocalizer.Get(key, culture)` + Core 零运行时依赖（Minor breaking：框架枚举外部反射 `[Display]` 不命中） |
| **4.10.36** | 2026-09-28 | SG3 GraphQL 字段名跟随 SG2 消歧（ADR81，XiaoShuTong G11）——`ApiMethodInfo` 契约加 `GraphQLField` 字段 + 消歧算法共享（无冲突项目零行为变化） |
| **4.10.35** | 2026-09-26 | GraphQL 通道登录会话激活失败修复（ADR80）——`WebSessionManager` 泛型门面缓存类型标签统一（`T=SessionInfo` 与读取路径一致，修复 HybridCache 类型敏感检查 miss） |
| **4.10.34** | 2026-09-22 | i18n 国际化 Phase 2 前端 TS 消费与贡献者（ADR79 采纳）——构建时发射器 `Localization.Gen`（resx→JSON + `keys.ts` + `FrameworkMessageKeys.g.cs`）+ `JsonFileLocalizationContributor` 热更新 + `I18nKeyDriftGateTests` 漂移守卫（`TKWF_I18N_001`） |
| **4.10.33** | 2026-09-19 | i18n 国际化 Phase 1（ADR31 采纳）——Localization 项目 + `IFrameworkLocalizer` 三接口 + `DomainException` MessageKey/MessageArgs + 错误码唯一事实权威收拢 + 枚举/校验双语化（breaking：text-matcher） |
| **4.10.32** | 2026-09-18 | 贡献者机制 A+ 阶段 4（V5 破坏性清理）——删旧特性/旧桥 + `CreateContributorInstances` 编译期实例化 + CTRB001-003 诊断码（A+ 4 阶段闭环） |
| **4.10.31** | 2026-09-18 | 贡献者机制 A+ 阶段 3——Permission/Feature 迁移接口判定（PERM001 锁步） |
| **4.10.30** | 2026-09-18 | 贡献者机制 A+ 阶段 2——旧桥转发 + SG 删 Menu override + ADR39 修订 |
| **4.10.29** | 2026-09-18 | 贡献者机制 A+ 阶段 1——`ContributorDescriptor` 四元组 + `Contributors` 单桥 + SG 接口判定骨架 + xCodeGen ContributorRegistry |
| **4.10.28** | 2026-09-17 | SignalNewJob flaky 根治残留——SignalProveStartedCeiling 3s→5s + CI 测试串行逐项目 |
| **4.10.27** | 2026-09-16 | D20 分析服务 Stage 1 框架侧落地——`TKW.Framework.Utility.Analytics` 核心 + `TKWF.Ext.Analytics` 集成层 + flint 模板注册表快照 |
| **4.10.26** | 2026-09-16 | SignalNewJob 测试 flaky 根治（信号证明与终态等待分离）+ D08 NuGet Trusted Publishing 迁移（OIDC） |
| **4.10.25** | 2026-09-15 | V5 破坏性变更收尾 F1-F5（ADR78 `InitializeAsync(IServiceProvider)` 断代升级）+ xCodeGen 中枢化完成 + dotnet tool 发布就绪（ADR77 商业许可）+ VEntity-Sql 静态产出 |
| **4.10.24** | 2026-09-15 | xCodeGen 活态文档生成缺陷修复 G9/G10——DOMAIN_MAP 收录 VEntity + 实体描述去占位（XiaoShuTong 问题单，Oracle PASS） |
| **4.10.23** | 2026-09-14 | xCodeGen 生成期可插拔校验阶段（ADR76 U3b）——`IValidationChecker` 快/重两档 + `ValidationRunner`，默认关闭零行为变化 |
| **4.10.22** | 2026-09-14 | DI001 扫描面信号驱动化（ADR74）+ DI003 扩展聚合遗漏诊断（ADR75）——编译期 DI 校验三件套闭环 |
| **4.10.21** | 2026-09-13 | DI 契约豁免 `[DiContractIgnore]`（ADR71）+ 方法级 ExposeRest 门控完成（ADR72） |
| **4.10.20** | 2026-09-13 | 方法级 ExposeGraphQL 接线——`[ApiExpose(ExposeGraphQL=false)]` 方法级生效（ADR70） |
| **4.10.4** | 2026-09-11 | SG 嵌套类型兼容修复（Roslyn `FullyQualifiedFormat` `+` 分隔误判）+ Oracle P1-1 CS1737 编译风险吸收（V5 前收尾清单 §二 #12） |
| **4.10.3** | 2026-09-11 | 跨命名空间同名 Controller resolver hintName 相撞修复（`SanitizeIdentifier(FullTypeName)` 全类型名消歧，V5 前收尾清单 §一 #11） |
| **4.10.2** | 2026-09-11 | DataService 纯实体 IQueryable 路径迁移方案 1（阶段②）——GraphQL SQL 级列裁剪对齐实体连接路径（ADR58 + D071 §二） |
| **4.9.92** | 2026-09-03 | 表结构同步调用面统一（ADR49）：SG 编译期 `EntityAssemblies` 清单 + EF Core 模型层修复，框架内置/扩展实体建表责任收敛到 `SyncTables` 单一门控 |
| **4.9.91** | 2026-09-03 | `TKWF.Tools` → `TKWF.Utility` 更名（ADR52）+ `TKWF.Cryptography` 并包 + Tag 算法回归 `TKW.Framework.Utility.Tags`（`TKWF.Ext.Tagging` 瘦身为存储扩展 V0.2.0） |
| **4.9.90** | 2026-09-02 | 配置字典回退 `Dictionary<string,string>`（ADR51）——撤销 V4.7.3 `List<ConfigEntry>` 连带改动 |
| **4.9.89** | 2026-09-01 | 事务特性查找正确性回归修复 + AOT 标注补齐（`[RequiresUnreferencedCode]`） |
| **4.9.88** | 2026-09-01 | 反射消除与 SG 化（三层原则落地）：SG 内零反射 + 事件热路径缓存 + AOT 标注 + 热路径反射缓存 |
| **4.9.87** | 2026-09-01 | 门控诊断文档更新：新增 `D18A` 诊断码总表 + ADR47/50 诊断码表 + 清理会话/门控调试刷屏 |
| **4.9.86** | 2026-09-01 | 会话持久化反序列化接口崩溃修复（`IDomainUser` 自定义 JsonConverter） |
| **4.9.85** | 2026-09-01 | 权威注册源上提（ADR47）+ 扩展机制编译期化（ADR48）+ 三层门控（ADR50）——领域自治 + 源头门控 |
| **4.9.84** | 2026-09-01 | 扩展模块引入门控（ADR46）：`TKWFEnabledExtension` 白名单 + `TKWF0020` 诊断 |
| **4.9.83** | 2026-08-31 | 会话上下文非泛型化收尾（ADR45）+ 泛型会话事件契约修复 + 两处回归缺陷修复 |
| **4.9.82** | 2026-08-31 | Obsolete 清理 + G06 事务章节按 ADR26 重写 + ADR 状态回填 |
| **4.9.79** | 2026-08-29 | Tagging 扩展包迁移（D17 模式 3）：标签服务迁出为 `TKWF.Ext.Tagging` |
| **4.9.78** | 2026-08-29 | 查询暴露开关统一（ADR40）+ 控制器接口命名统一（ADR41）+ VEntity 生成物收尾 |

> V4.9.76/77（扩展机制 Phase 3 配置结构验证 + 有状态扩展单例 + 系列收尾）为 v4.9.78 之前另一组扩展机制迭代，CHANGELOG 并入 v4.9.78 记录。

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