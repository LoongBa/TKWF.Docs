---
order: 7
badge: "7️⃣"
tab: 知识驱动文档
title: 自动更新业务领域知识文档 — Agent 无需读代码
description: dotnet build → AfterBuild → xCodeGen 自动生成活文档，Agent 只读薄索引。
language: text
---

Agent 开发 Service/Test 不读代码、开发 UI 不读接口契约——只读薄索引，减少上下文依赖和 Token 消耗。

```text
// dotnet build 后自动生成（Agent 读这些，不读 .g.cs）：
// .TKWF/Commerce/
//   ├── DOMAIN_MAP.md          // 领域实体/服务全貌
//   ├── DataService_API.md     // 每个 DataService 的方法签名速查
//   ├── Domain_Api.md          // 对外暴露的 API 接口清单（GraphQL/REST）
//   └── Business.md            // 业务规则物化（tkwf-business skill 产出）

// Agent 守则："❌ 不读 *.g.cs / *.biz.cs / DataServices/*.cs"
```
