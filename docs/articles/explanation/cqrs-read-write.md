---
title: VEntity 读写分离（CQRS）
description: TKWF 架构级 CQRS：Entity 写模型 / VEntity 读模型类型级分离，ViewSql 声明式视图，EQR 统一查询入口
---

# VEntity 读写分离（CQRS）

> ⚠️ 本文为规划占位（设计方案 §3.2.1-A1）。内容待补，将覆盖：Entity 写 / VEntity 读的类型级分离、ViewSql 声明式视图、EQR 统一入口（8 跳→3 跳）、三端 `User.Query<T>()`。
> 引用源文档：D06C/G06C · V4.9.36-40