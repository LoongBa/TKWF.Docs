---
title: 门控机制
description: TKWF 门控机制：编译期、运行时启动期、配置期三种形态与具体门控规则
---

# 门控机制

> ⚠️ 本文为规划占位（设计方案 §3.2.1-F1）。内容待补，将覆盖：**三种形态**——①编译期门控（SG 自诊断 ADR01 / IsExposed ADR07）②运行时启动期门控（表结构同步 ADR30 / 多租户 ValidateRuntimeGates ADR34-35）③配置期门控（AddDomain 门控 / AddEventDispatch opt-in）；**具体规则**——ADR35 GateRules 数据驱动规则集（12 项缺口：Outbox 未配置、事件未接线、BCL 双标注不一致、孤儿事件等）。
> 引用源文档：ADR35 · ADR01/07/30/34