---
title: 如何编写 Mock 数据
description: TKWF 前端 Mock 数据编写指南：三层文件架构、createMockFactory 策略化生成、MockDataSpec 规则驱动、DatasetSeed 跨语言共享
---

# 如何编写 Mock 数据

> ⚠️ 本文为规划占位（设计方案 §3.2.1-D2）。内容待补，将覆盖：三层文件架构（骨架层 ts-client.mock.g.ts / 数据层 data.ts / 接线层）、gen-mock-handlers 骨架生成、createMockFactory 策略化数据生成（_strategy/_faker/_generators/字段名三层映射）、MockDataSpec 规则驱动（11 种策略 + weighted + computed）、MOCK_SPEC.md 人类策略文档翻译、DatasetSeed 跨语言共享（TS↔.NET 两路径）。
> 引用源文档：G07D §3.3-3.6/3.15 · SKILL.md · ADR09