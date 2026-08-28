---
title: 扩展子系列：有哪些扩展
description: TKWF 扩展机制子系列索引：Permissions、Navigation 已发布 + 审计、设置、TagService 规划中
---
# 扩展子系列：有哪些扩展

> TKWF 扩展机制子系列（每扩展一篇）。已落地的业务扩展见下，其余为规划。
> 设计依据：D17 §5 业务模块全景

| 扩展 | 状态 | 文章 | 说明 |
|:-----|:-----|:-----|:-----|
| Permissions（权限） | ✅ 已发布（V4.9.72+） | [权限扩展](./permissions.md) | 权限定义/贡献者、`[RequirePermission]`、IPermissionChecker/IPermissionStore |
| Navigation（导航/菜单） | ✅ 已发布（V4.9.74+） | [导航扩展](./navigation.md) | 菜单项定义/贡献者、IMenuManager 树形组装 + 权限过滤 |
| 审计（Auditing） | 📋 规划中 | （可能并入 filters 或独立） | 审计日志持久化 |
| 设置（Settings） | 📋 规划中 | `settings.md`（占位） | 配置持久化 |
| TagService（标签） | 📋 迁移中（框架核心→业务扩展） | `tag-service.md`（占位） | 标签管理 |
| 扩展机制总览 | ✅ 已发布 | [扩展机制：如何使用](../extensions-usage.md) · [如何开发扩展](../extensions-development.md) | 三层分离、扩展契约、三钩子 |

> 引用源文档：D17 §5 模块清单 · G17A（权限）· G17B（导航）