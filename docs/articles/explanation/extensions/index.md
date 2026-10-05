---
title: 扩展子系列：有哪些扩展
description: TKWF 扩展机制子系列索引：扩展模块一览（V4.9.80 起独立仓库 TKWF.Extensions，独立版本演进）
---
# 扩展子系列：有哪些扩展

> TKWF 扩展机制子系列（每扩展一篇）。V4.9.80 起扩展迁至公开仓库 [`TKWF.Extensions`](https://github.com/LoongBa/TKWF.Extensions)，独立版本（v0.1.0+）。
> 设计依据：D17 扩展机制（业务模块全景 V4.9.80 剥离至扩展仓库总览）
> 各扩展独立版本演进；**事实来源：扩展仓库 [`README`](https://github.com/LoongBa/TKWF.Extensions) 扩展一览表**（本站表格同步自该表）。

| 扩展 | 版本 | 说明 | 指南（扩展仓库） |
|:-----|:-----|:-----|:-----|
| **Permissions**（权限） | V0.9.3 | 细粒度权限定义 / fail-closed 检查 / 编译期权限名校验（PERM001）/ 多用户批量权限检查（`IPermissionBatchChecker`）/ 领域自治整改（v4.10.53：Store 概念废弃 + 守卫工厂） | [本地文章](./permissions.md) · [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Permissions/权限扩展-使用指南.md) |
| **Permissions.Abstractions** | V0.1.0 | 权限契约抽象（`IPermissionChecker`/`RequirePermission`/`IRoleProvider`） | —（并入 Permissions） |
| **Permissions.Validation** | V0.8.0 | 扩展侧 PERM001 DiagnosticAnalyzer（从内核移除耦合） | —（并入 Permissions） |
| **Identity**（身份） | V0.5.0 | 用户 / 角色 / 用户角色分配 + PasswordHasher 凭据验证；`GetRolesAsync` VEntity 跨表 JOIN + **REST 直接暴露（`UserRoleViewQueryService`）** + 领域自治整改（v4.10.53） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Identity/身份管理扩展-使用指南.md) |
| **Account**（账户） | V0.5.0 | 账户锁定 + 密码重置 + 登录历史与异常检测 + 依赖倒置（SecurityLog 契约改引 Abstractions）+ 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Account/账户管理扩展-使用指南.md) |
| **Account.Abstractions** | V0.1.2 | 账户契约抽象（`IAccountPasswordManager` 等——ADR48 D7 依赖倒置，零框架引用纯 BCL） | —（并入 Account） |
| **Authentication**（认证中心） | V0.5.4 | 认证中心——令牌体系（手写 RS256 JWT + kid 轮换 + 黑名单落库 + Refresh rotation + TokenVersion）/ 认证矩阵 Provider（短信 + 微信）/ 登录保护 / 票据换令牌（PKCE）/ 身份适配层（`JwtDomainUserParser`/`ITokenVerifier`/`JwtAuthenticationMiddleware`——AuthorityFilter 零改动）/ 跨系统映射 / 平台凭证（AES-GCM）+ **登录编排门面（V0.5.0）+ ITokenVerifier 游客帧修复（V0.5.1/0.5.2）+ DevRsaKeyCache 开发模式密钥跨实例一致（V0.5.3）+ `BeginSystemScopeAsync` 不传参修复（V0.5.4）** | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Authentication/认证中心-使用指南.md) |
| **UserCenter**（用户中心） | V0.1.0 | 通用档案面扩展——**契约包 `TKWF.Ext.UserCenter.Abstractions`**（三 Source 抽象 + 门面接口 + DTO，零框架依赖）+ **主包零实体零存储**（门面组合三 Source + `PhoneMasker` 脱敏 + 仅本人防护）——扩展间契约协作实证 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/UserCenter/用户中心扩展-使用指南.md) |
| **UserCenter.Abstractions** | V0.1.0 | 用户中心契约包（三 Source + 门面 + 三 DTO——ADR48 D7 第 6 次落地，命名空间保持 `TKWF.Ext.UserCenter`） | —（并入 UserCenter） |
| **Federation**（联邦互联） | V0.1.1 | 认证中心联邦层（跨应用 Federated SSO，2026-10 归层定名"联邦互联"）——应用注册（origin 白名单 + scope + AES-GCM credential）/ 授权码 accesscode（120s 原子 CAS + SHA256 + PKCE）/ **token2 手写 ES256 独立密钥域 + kid 轮换** / profile API / `ISsoChannel` 契约；`BeginSystemScopeAsync` 不传参修复（V0.1.1） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Federation/联邦互联-使用指南.md) |
| **Federation.WeChat** | V0.1.0 | 微信公众平台连接器（平台网关库——纯库无装配无持久化，方向对外接微信 IdP）：`WeChatApiClient` 出站（access_token L1 缓存 + 并发锁 + 提前 5min 刷新）+ 双通道（`WeChatOauthChannel`/`WeChatEventChannel`） | —（并入 Federation） |
| **MFA**（多因素认证） | V0.1.3 | 第二因素验证服务——TOTP（RFC 6238 自研零第三方）+ SMS 双方法 + 挑战票据（一次性 TTL + 单次消费防重放）+ 尝试频控 + 恢复码；**独立扩展零依赖**（短信渠道经 `IMfaSmsSender` 注入）；secret AES-GCM 密文落库；V0.1.0 原子消费逃生口迁移 ADR89 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/MFA/MFA多因素认证-使用指南.md) |
| **Navigation**（导航/菜单） | V0.1.2 | 菜单数据模型 / 贡献机制 / 权限过滤（从主框架迁出） | [本地文章](./navigation.md) · [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Navigation/导航扩展-使用指南.md) |
| **Navigation.Abstractions** | V0.1.0 | 导航契约抽象（`IMenuContributor`/`MenuItemDefinition` 等——ADR48 D7） | —（并入 Navigation） |
| **AuditLogging**（审计） | V0.5.0 | 审计日志 FreeSql 存储 + SG1 实体 + 查询 API + 统计聚合 + 保留天数清理 + 管理 API + 聚合 SQL 下推 + 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/AuditLogging/审计日志扩展-使用指南.md) |
| **Settings**（设置） | V0.3.0 | 全局/用户级配置持久化 + 分层读取 + **领域自治整改（V0.3.0：删伪 Store + SettingManager 继承 DomainServiceBase + AddConstructibleService）** | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Settings/设置管理扩展-使用指南.md) |
| **BlobStoring**（二进制存储） | V0.3.0 | 本地文件系统存储 + FreeSql 记录 + FileStream 流式下载 + 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/BlobStoring/二进制存储扩展-使用指南.md) |
| **BlobStoring.Abstractions** | V0.1.1 | Blob 存储契约（`IBlobStorageService`/`BlobInfo`/`BlobStoringOptions`，ADR50 依赖倒置） | —（并入 BlobStoring） |
| **Emailing**（邮件） | V0.3.0 | SMTP/MailKit 发送 + FreeSql 发送记录 + 指数退避重试 + 领域自治整改（域作用域警示）；契约抽取至 `.Abstractions` | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Emailing/邮件发送扩展-使用指南.md) |
| **Emailing.Abstractions** | V0.1.0 | 邮件发送契约（`IEmailSender`/`EmailMessage`，ADR48 D7 依赖倒置） | —（并入 Emailing） |
| **DataDictionary**（数据字典） | V0.3.0 | 数据字典集中管理（定义 + 项 + 按编码查询）+ VEntity 读模型联邦（`vw_DictionaryItemView`）+ 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/DataDictionary/数据字典扩展-使用指南.md) |
| **Tagging**（标签存储） | V0.4.5 | 标签存储扩展（算法回归 `TKW.Framework.Utility.Tags`；AC 自动机 `DictMatch` 批量匹配）+ 聚合 SQL 下推 + 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Tagging/标签服务扩展-使用指南.md) |
| **PrintTemplates**（打印模板） | V0.3.0 | 打印模板引擎与版本化（Scriban 沙箱渲染 + Draft/Active/Archived 生命周期）+ VEntity 化 + 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/PrintTemplates/打印模板扩展-使用指南.md) |
| **Metrics**（指标引擎） | V0.2.1 | 业务指标计算引擎（规格文档驱动复合指标；核心计算在 `TKW.Framework.Utility.Metrics`）+ 指标结果持久化 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Metrics/指标扩展-使用指南.md) |
| **Analytics**（分析服务） | V0.1.0 | 业务分析服务（spec 文件驱动 + flint 单一真相 JsonDocument——D20 Stage 1 骨架，v4.10.27 框架核心 + 本包集成层） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Analytics/Analytics分析服务-使用指南.md) |
| **Dashboard**（仪表盘） | V0.1.2 | 仪表盘数据服务（Metrics 展示层——JSON 描述符 + Widget 数据查询） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Dashboard/仪表盘扩展-使用指南.md) |
| **DataPort**（导入导出） | V0.1.4 | 数据导入导出（核心运行库 + MiniExcel Provider + SG1 持久化；FileHash 幂等） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/DataPort/数据导入导出扩展-使用指南.md) |
| **Notifications**（通知中心） | V0.6.1 | 站内通知收件箱 + 订阅 + 事件驱动通知 + 多通道路由（UseChannels/Email）+ 用户偏好路由 + 逐用户权限门控 + SignalR 实时推送通道 + **通知本地化（V0.5.0）+ REST 直接暴露（V0.5.0：`UserNotificationViewQueryService`）+ 领域自治整改（V0.6.x）** | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Notifications/通知中心扩展-使用指南.md) |
| **Notifications.SignalR** | V0.2.0 | 通知中心 SignalR 实时推送通道（独立包——Hub 类型锚 + best-effort 推送 + 端点映射；`FrameworkReference` 共享框架零 NuGet；服务端非 UI） | —（并入 Notifications） |
| **BackgroundJobs**（后台任务持久化） | V0.4.1 | 执行历史 `JobExecution` + 业务结果 `JobResult` 追踪 + 历史清理 + **周期调度接口 `IRecurringBackgroundJobManager`（v4.10.54 ADR91）** + 领域自治整改（`JobExecutionRecorder` 泛型化） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/BackgroundJobs/后台任务持久化扩展-使用指南.md) |
| **BackgroundJobs.Quartz** | V0.1.0 | Quartz AdoJobStore 一键封装（`UseTkfwAdoJobStore` 12 表自动建表/集群配置） | —（并入 BackgroundJobs） |
| **HealthCheck**（健康检查） | V0.3.0 | 系统健康探测（net10 HealthChecks + `/health` 端点 + 内置 DB 探针 `AddDatabaseHealthCheck<T>`）+ 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/HealthCheck/健康检查扩展-使用指南.md) |
| **RateLimiting**（限流） | V0.2.0 | Web 层限流接线（AddRateLimiter + IP/用户分区 + 429/Retry-After；与 Domain `[RateLimit]` 双层防护）+ 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/RateLimiting/限流扩展-使用指南.md) |
| **SecurityLog**（安全日志） | V0.4.0 | 安全事件日志（登录/登出/改密/重置/锁定/注册/挑战 + IP/UA + 异常检测聚合 + 保留天数清理）+ 契约拆包（Abstractions）+ 聚合 SQL 下推 + 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/SecurityLog/安全日志扩展-使用指南.md) |
| **SecurityLog.Abstractions** | V0.1.0 | 安全日志契约抽象（`ISecurityLogStore`/`ISecurityLogQueryService`/`ISecurityLogAnalyticsService` + DTO/Options） | —（并入 SecurityLog） |
| **Approval**（审批流） | V0.4.0 | 轻量审批引擎（流程定义/实例/任务三实体 + 状态机 + 或签/会签 + 委派/加签/抄送/超时自动处理 + 完成事件回调）+ 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Approval/审批流扩展-使用指南.md) |
| **OrganizationUnit**（组织单元） | V0.5.0 | 树形部门/团队/分组（物化路径 Level/Path + 循环防护/删除保护 + 用户关联 + 事务包裹）+ VEntity 化/下推 + 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/OrganizationUnit/组织单元扩展-使用指南.md) |
| **Calendar**（日历排程） | V0.4.0 | 日历/事件 CRUD + 重复规则子集（DAILY/WEEKLY/MONTHLY/YEARLY + 月末钳制）+ occurrence 查询 + UTC 契约 + 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Calendar/日历排程扩展-使用指南.md) |
| **FileManagement**（文件管理） | V0.4.0 | 目录树 + 文件元数据 SHA256/去重 + 文件版本化/配额 + 用户级配额 + 并发上传竞态加固 + 上传 10 步安全链 + 依赖倒置 BlobStoring.Abstractions + 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/FileManagement/文件管理扩展-使用指南.md) |
| **FeatureManagement**（功能管理） | V0.4.4 | 特性开关（接口判定编译期定义 + Provider 链分层值 + IFeatureChecker + 复杂 ValueType 类型化读写 + 变更事件分布式广播 + 管理 API）+ 领域自治整改 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/FeatureManagement/功能管理扩展-使用指南.md) |
| 扩展机制总览 | ✅ 已发布 | [扩展机制：如何使用](./usage.md) · [如何开发扩展](./development.md) | 三层分离、扩展契约、三钩子、Abstractions 依赖倒置 |

> **V4.9.75 收尾**：GateRules `SourceExtension`（禁用扩展跳过 Warning 级门控）+ 编译期 DI 依赖验证（`TKWF_DI001`）+ `FreeSqlPermissionStore` 权限持久化。原计划的能力引用机制（`RequiresCapability`）已按 ADR37 决策 5 正式废弃——依赖声明改用编译期 `ProjectReference`。
>
> **V4.9.84-85 门控体系**：扩展模块引入门控（ADR46 `TKWFEnabledExtension` 白名单 + `TKWF0020`）+ 权威注册源上提（ADR47）+ 扩展机制编译期化（ADR48 D4 编译期实例化 + D7 Abstractions 依赖倒置）+ 三层门控（ADR50 `TKWF0030-33`）。详见 [门控机制](../gates.md)。
>
> **V4.9.91（ADR52）Tagging 瘦身**：标签算法（分词/匹配/流水线 + `ITagService`/`TagService`）回归 `TKWF.Utility`（`TKW.Framework.Utility.Tags`）；`TKWF.Ext.Tagging` 瘦身为**标签存储扩展**（V0.2.0 → V0.4.0）。
>
> **V4.10.29-32（贡献者机制 A+ 阶段 1-4）**：三套贡献者机制（Permission/Menu/Feature）统一收敛——贡献者声明从 `[PermissionContributor]`/`[MenuContributor]`/`[FeatureContributor]` 特性改为**实现对应接口**（`IPermissionDefinitionContributor`/`IMenuContributor`/`IFeatureDefinitionContributor`，SG1 接口判定），旧特性与旧桥在 V4.10.32 破坏性清理中删除；实例化改 `CreateContributorInstances(targetKind)` 编译期化（消除 `Activator.CreateInstance` 反射）。详见 [权限扩展](./permissions.md) / [导航扩展](./navigation.md)。
>
> **V4.10.51-53（领域自治整改，ADR88/90）**：构造注入门控（`DI004` 禁止构造注入域服务 + `DI005` 契约缺口）→ 领域自治根治——Store 概念废弃 + `AddConstructibleService` 门面注册（扩展批次 0-7 整改，21 扩展 tag 批量发布）；Authentication V0.5.0 登录编排门面 + 4 扩展守卫工厂迁移（ADR92 `TryAddEnumerableConstructible`，v4.10.55）。
>
> **V4.10.54（周期调度 + 测试辅助，ADR91）**：后台作业周期调度 `IRecurringBackgroundJobManager`（Unix 5-field cron）+ 框架测试辅助 `BindTestScope`/`AssertConstructible`。
>
> **2026-10 认证体系归层**：认证体系四层归层模型——AuthCenter（认证中心）/ **Federation**（联邦互联，原 SSO）/ Federation.{平台}（如 WeChat 连接器）/ Utility.OAuthClient；`docs/SSO` 历史文档保留旧命名，当前名以 Federation 为准。

> 引用源文档：D17 扩展机制 · G17A（设计扩展模块）/ G17B（使用扩展模块）· 各扩展指南在 [`TKWF.Extensions`](https://github.com/LoongBa/TKWF.Extensions)（V4.9.80 起）· 扩展模块版本一览以扩展仓库 README 为准
