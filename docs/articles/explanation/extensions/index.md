---
title: 扩展子系列：有哪些扩展
description: TKWF 扩展机制子系列索引：24 个扩展模块一览（V4.9.80 起独立仓库 TKWF.Extensions，独立版本演进）
---
# 扩展子系列：有哪些扩展

> TKWF 扩展机制子系列（每扩展一篇）。V4.9.80 起扩展迁至公开仓库 [`TKWF.Extensions`](https://github.com/LoongBa/TKWF.Extensions)，独立版本（v0.1.0+）。
> 设计依据：D17 扩展机制（业务模块全景 V4.9.80 剥离至扩展仓库总览）
> 各扩展独立版本演进；**事实来源：扩展仓库 [`README`](https://github.com/LoongBa/TKWF.Extensions) 扩展一览表**（本站表格同步自该表）。

| 扩展 | 版本 | 说明 | 指南（扩展仓库） |
|:-----|:-----|:-----|:-----|
| **Permissions**（权限） | V0.7.0 + V0.8.0 | 细粒度权限定义 / fail-closed 检查 / 编译期权限名校验（PERM001） | [本地文章](./permissions.md) · [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Permissions/权限扩展-使用指南.md) |
| **Permissions.Abstractions** | V0.1.0 | 权限契约抽象（`IPermissionChecker`/`RequirePermission`/`IRoleProvider`） | —（并入 Permissions） |
| **Permissions.Validation** | V0.8.0 | 扩展侧 PERM001 DiagnosticAnalyzer（从内核移除耦合） | —（并入 Permissions） |
| **Identity**（身份） | V0.3.0 | 用户 / 角色 / 用户角色分配 + PasswordHasher 凭据验证；`GetRolesAsync` VEntity 跨表 JOIN | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Identity/身份管理扩展-使用指南.md) |
| **Account**（账户） | V0.3.0 | 账户锁定 + 密码重置 + **登录历史与异常检测**（消费 SecurityLog 查询） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Account/账户管理扩展-使用指南.md) |
| **Navigation**（导航/菜单） | V0.1.0 | 菜单数据模型 / 贡献机制 / 权限过滤（从主框架迁出） | [本地文章](./navigation.md) · [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Navigation/导航扩展-使用指南.md) |
| **AuditLogging**（审计） | V0.3.0 | 审计日志 FreeSql 存储 + SG1 实体 + 查询 API + 统计聚合 + 保留天数清理 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/AuditLogging/审计日志扩展-使用指南.md) |
| **Settings**（设置） | V0.2.0 | 全局/用户级配置持久化 + 分层读取 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Settings/设置管理扩展-使用指南.md) |
| **BlobStoring**（二进制存储） | V0.2.0 | 本地文件系统存储 + FreeSql 记录 + FileStream 流式下载 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/BlobStoring/二进制存储扩展-使用指南.md) |
| **BlobStoring.Abstractions** | V0.1.1 | Blob 存储契约（`IBlobStorageService`/`BlobInfo`/`BlobStoringOptions`，ADR50 依赖倒置） | —（并入 BlobStoring） |
| **Emailing**（邮件） | V0.2.0 | SMTP/MailKit 发送 + FreeSql 发送记录 + 指数退避重试；契约抽取至 `.Abstractions` | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Emailing/邮件发送扩展-使用指南.md) |
| **Emailing.Abstractions** | V0.1.0 | 邮件发送契约（`IEmailSender`/`EmailMessage`，ADR48 D7 依赖倒置） | —（并入 Emailing） |
| **DataDictionary**（数据字典） | V0.2.0 | 数据字典集中管理（定义 + 项 + 按编码查询） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/DataDictionary/数据字典扩展-使用指南.md) |
| **Tagging**（标签存储） | V0.4.0 | 标签存储扩展（算法回归 `TKW.Framework.Utility.Tags`；AC 自动机 `DictMatch` 批量匹配 + Options 配置接入） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Tagging/标签服务扩展-使用指南.md) |
| **PrintTemplates**（打印模板） | V0.1.0 | 打印模板引擎与版本化（Scriban 沙箱渲染 + Draft/Active/Archived 生命周期） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/PrintTemplates/打印模板扩展-使用指南.md) |
| **Dashboard**（仪表盘） | V0.1.0 | 仪表盘数据服务（Metrics 展示层——JSON 描述符 + Widget 数据查询） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Dashboard/仪表盘扩展-使用指南.md) |
| **DataPort**（导入导出） | V0.1.0 | 数据导入导出（核心运行库 + MiniExcel Provider + SG1 持久化；FileHash 幂等） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/DataPort/数据导入导出扩展-使用指南.md) |
| **Notifications**（通知中心） | V0.2.0 | 站内通知收件箱 + 订阅 + 事件驱动通知 + 多通道路由（UseChannels/Email） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Notifications/通知中心扩展-使用指南.md) |
| **BackgroundJobs**（后台任务持久化） | V0.2.0 | 执行历史 `JobExecution` + 业务结果 `JobResult` 追踪 + 历史清理（RetentionDays） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/BackgroundJobs/后台任务持久化扩展-使用指南.md) |
| **BackgroundJobs.Quartz** | V0.1.0 | Quartz AdoJobStore 一键封装（`UseTkfwAdoJobStore` 12 表自动建表/集群配置） | —（并入 BackgroundJobs） |
| **HealthCheck**（健康检查） | V0.2.0 | 系统健康探测（net10 HealthChecks + `/health` 端点 + 内置 DB 探针 `AddDatabaseHealthCheck<T>`） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/HealthCheck/健康检查扩展-使用指南.md) |
| **RateLimiting**（限流） | V0.1.0 | Web 层限流接线（AddRateLimiter + IP/用户分区 + 429/Retry-After；与 Domain `[RateLimit]` 双层防护） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/RateLimiting/限流扩展-使用指南.md) |
| **SecurityLog**（安全日志） | V0.2.0 | 安全事件日志（登录/登出/改密/重置/锁定/注册/挑战 + IP/UA + 异常检测聚合 + 保留天数清理） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/SecurityLog/安全日志扩展-使用指南.md) |
| **Approval**（审批流） | V0.2.0 | 轻量审批引擎（流程定义/实例/任务三实体 + 状态机 + 或签/会签 + 委派/加签/抄送/超时自动处理 + 完成事件回调） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Approval/审批流扩展-使用指南.md) |
| **OrganizationUnit**（组织单元） | V0.1.0 | 树形部门/团队/分组（物化路径 Level/Path + 循环防护/删除保护 + 用户关联 + 事务包裹） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/OrganizationUnit/组织单元扩展-使用指南.md) |
| **Calendar**（日历排程） | V0.1.0 | 日历/事件 CRUD + 重复规则子集（DAILY/WEEKLY/MONTHLY/YEARLY + 月末钳制）+ occurrence 查询 + UTC 契约 | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/Calendar/日历排程扩展-使用指南.md) |
| **FileManagement**（文件管理） | V0.2.0 | 目录树 + 文件元数据 SHA256/去重 + 文件版本化/配额 + 上传 10 步安全链 + 依赖倒置 BlobStoring.Abstractions | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/FileManagement/文件管理扩展-使用指南.md) |
| **FeatureManagement**（功能管理） | V0.3.0 | 特性开关（`[FeatureContributor]` 定义收集 + Provider 链分层值 + IFeatureChecker + 复杂 ValueType 类型化读写 + 变更事件分布式广播） | [指南](https://github.com/LoongBa/TKWF.Extensions/blob/master/docs/FeatureManagement/功能管理扩展-使用指南.md) |
| 扩展机制总览 | ✅ 已发布 | [扩展机制：如何使用](./usage.md) · [如何开发扩展](./development.md) | 三层分离、扩展契约、三钩子、Abstractions 依赖倒置 |

> **V4.9.75 收尾**：GateRules `SourceExtension`（禁用扩展跳过 Warning 级门控）+ 编译期 DI 依赖验证（`TKWF_DI001`）+ `FreeSqlPermissionStore` 权限持久化。原计划的能力引用机制（`RequiresCapability`）已按 ADR37 决策 5 正式废弃——依赖声明改用编译期 `ProjectReference`。
>
> **V4.9.84-85 门控体系**：扩展模块引入门控（ADR46 `TKWFEnabledExtension` 白名单 + `TKWF0020`）+ 权威注册源上提（ADR47）+ 扩展机制编译期化（ADR48 D4 编译期实例化 + D7 Abstractions 依赖倒置）+ 三层门控（ADR50 `TKWF0030-33`）。详见 [门控机制](../gates.md)。
>
> **V4.9.91（ADR52）Tagging 瘦身**：标签算法（分词/匹配/流水线 + `ITagService`/`TagService`）回归 `TKWF.Utility`（`TKW.Framework.Utility.Tags`）；`TKWF.Ext.Tagging` 瘦身为**标签存储扩展**（V0.2.0 → V0.4.0）。

> 引用源文档：D17 扩展机制 · G17A（设计扩展模块）/ G17B（使用扩展模块）· 各扩展指南在 [`TKWF.Extensions`](https://github.com/LoongBa/TKWF.Extensions)（V4.9.80 起）· 扩展模块版本一览以扩展仓库 README 为准