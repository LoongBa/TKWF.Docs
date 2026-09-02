---
title: 扩展子系列：有哪些扩展
description: TKWF 扩展机制子系列索引：Permissions、Navigation 已发布（V4.9.80 起独立仓库）+ 更多扩展迁出中
---
# 扩展子系列：有哪些扩展

> TKWF 扩展机制子系列（每扩展一篇）。V4.9.80 起扩展迁至公开仓库 [`TKWF.Extensions`](https://github.com/LoongBa/TKWF.Extensions)，独立版本（v0.1.0+）。
> 设计依据：D17 扩展机制（业务模块全景 V4.9.80 剥离至扩展仓库总览）

| 扩展 | 状态 | 文章 | 说明 |
|:-----|:-----|:-----|:-----|
| Permissions（权限） | ✅ V0.7.0 + V0.8.0 | [权限扩展](./permissions.md) | 权限定义/贡献者、`[RequirePermission]`、IPermissionChecker/IPermissionStore（默认 `FreeSqlPermissionStore`）、编译期校验（PERM001） |
| Navigation（导航/菜单） | ✅ V0.1.0 | [导航扩展](./navigation.md) | 菜单项定义/贡献者、IMenuManager 树形组装 + 权限过滤 |
| Identity（身份） | ✅ V0.1.0（扩展仓库） | — | 用户/角色/分配 + 凭据验证 |
| Account（账户） | ✅ V0.1.0（扩展仓库） | — | 账户锁定 + 密码重置 |
| AuditLogging（审计） | ✅ V0.1.0（扩展仓库） | — | 审计日志 FreeSql 存储 |
| Settings（设置） | ✅ V0.1.0（扩展仓库） | — | 配置持久化 + 分层读取 |
| BlobStoring / Emailing / DataDictionary / Tagging | ✅ V0.1.0（扩展仓库） | — | 存储/邮件/数据字典/标签（P0 9/11 已实施） |
| 扩展机制总览 | ✅ 已发布 | [扩展机制：如何使用](./usage.md) · [如何开发扩展](./development.md) | 三层分离、扩展契约、三钩子、Abstractions 依赖倒置 |

> **V4.9.75 收尾**：GateRules `SourceExtension`（禁用扩展跳过 Warning 级门控）+ 编译期 DI 依赖验证（`TKWF_DI001`）+ `FreeSqlPermissionStore` 权限持久化。原计划的能力引用机制（`RequiresCapability`）已按 ADR37 决策 5 正式废弃——依赖声明改用编译期 `ProjectReference`。
>
> **V4.9.84-85 门控体系**：扩展模块引入门控（ADR46 `TKWFEnabledExtension` 白名单 + `TKWF0020`）+ 权威注册源上提（ADR47）+ 扩展机制编译期化（ADR48 D4 编译期实例化 + D7 Abstractions 依赖倒置）+ 三层门控（ADR50 `TKWF0030-33`）。详见 [门控机制](../gates.md)。

> 引用源文档：D17 扩展机制 · G17A（设计扩展模块）/ G17B（使用扩展模块）· 各扩展指南在 [`TKWF.Extensions`](https://github.com/LoongBa/TKWF.Extensions)（V4.9.80 起）