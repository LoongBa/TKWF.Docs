---
title: ts-client-mock 前端 Mock 测试
description: @tkwf/tsclient-mock 使用指南：MockTransport 注入、createMockDb、MockHttpServer、场景切换、录制回放
---

# ts-client-mock 前端 Mock 测试

> ⚠️ 本文为规划占位（设计方案 §3.2.1-D1）。内容待补，将覆盖：Transport 层注入原理、安装与快速开始（gen-mock-handlers + `Tkwf.configure` 接入 + `VITE_USE_MOCK` 切换）、MockTransport（管道/delay/failRate/error 注入）、createMockDb（26 操作符/关联过滤 some-every-none/inverse 双向同步/aggregate 聚合）、场景切换（setScenario 三态）、录制回放、zod 契约校验、HTTP mock server（MockHttpServer/状态码映射）、场景指南与版本速查。
> 引用源文档：G07D §1-2/3.1/3.2/3.7-14/§4