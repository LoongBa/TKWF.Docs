---
title: VEntity 统计与聚合
description: TKWF VEntity 统计聚合能力：ViewSql 自动聚合（StatsDto）、Hasura 风格聚合 GraphQL、AutoQuery 消除 80% 查询代码
---

# VEntity 统计与聚合

> ⚠️ 本文为规划占位（设计方案 §3.2.1-A2，核心卖点）。内容待补，将覆盖：ViewSql 自动聚合（StatsDto 扫描 SUM/COUNT/AVG/MIN/MAX 推断类型）、Hasura 风格 `{entity}_aggregate` 聚合 GraphQL、`.Aggregate().ToAggregateAsync()` 三端对齐、AutoQuery 消除 80% 查询 Service 代码。
> 引用源文档：ADR20 · V4.9.53 · V4.9.38