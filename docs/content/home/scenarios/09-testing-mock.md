---
order: 9
badge: "9️⃣"
title: 测试支持 — ts-client-mock 自动生成测试接口 + 语义化测试数据
description: ts-client-mock 自动生成测试接口，基于语义描述生成测试数据。
language: typescript
---

两级 Mock：离线 MockTransport + HTTP MockHttpServer。

```typescript
// MockDataSpec——语义化描述测试数据，非手写死数据
const spec: MockDataSpec = {
  scenarios: {
    "default": { order: { count: 20, fields: { amount: { strategy: "number", min: 10, max: 9999 } } } },
    "empty":   { order: { count: 0 } },
    "error":   { order: { strategy: "throw", errorCode: "OrderLocked" } }
  }
};
const data = generateFromSpec(spec);

// 两级 Mock——开发/测试无需后端
// Level 1: 离线 Mock（零依赖，单机测试）
Tkwf.configure("default", { transport: createMockTransport(handlers) });
// Level 2: HTTP Mock Server（模拟 WebApi，集成测试）
const server = new MockHttpServer(handlers);
await server.listen(4000);
```
