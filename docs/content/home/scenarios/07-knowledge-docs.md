---
order: 7
badge: "7️⃣"
tab: 知识驱动文档
title: 自动更新业务领域知识文档 — Agent 无需读代码
description: dotnet build → AfterBuild → xCodeGen 自动生成活文档，Agent 只读薄索引。
language: text
---

Agent 开发 Service/Test 不读代码，开发 UI 不读接口契约——只读薄索引，减少上下文依赖和 Token 消耗。

```text
// dotnet build 后自动生成（Agent 读这些，不读 .g.cs）：
// .TKWF/Commerce/
//   ├── DOMAIN_MAP.md          // 领域实体/服务全貌
//   ├── DataService_API.md     // 每个 DataService 的方法签名速查，供编写业务方法使用
//   ├── Domain_Api.md          // 对外暴露的 API 接口清单（GraphQL/REST），供表现层编写 UI 使用
//   ├── Business.md            // 业务规则物化（tkwf-business skill 产出），业务规则速查
//   ├── GraphQL_Api.md         // 用于编写 UI 查询的 GraphQL 端点清单
//   ├── mock-data-spec.json    // 根据 MOCK_SPEC.md 自动生成的 mock 数据
//   └── schema.graghql         // 用于自动生成 ts-client 所需的强类型 ts 文件和 mock 数据

// Agent 守则："❌ 不读 *.g.cs / *.biz.cs / DataServices/*.cs"
```
