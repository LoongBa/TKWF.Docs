---
order: 8
badge: "8️⃣"
tab: TypeScript Client
title: 网页端 ts-client — 自动生成的强类型客户端
description: 由 schema.graphql 自动生成强类型定义——无需手写接口、字段名或请求构造。
language: typescript
---

拼错即编译报错，避免运行时才报错。并保持了与 C#/Wasm 一致的使用体验，和强大的查询能力。

```typescript
// 由 gen-domain-client 从 schema.graphql 自动生成 ts-client.g.ts：
// interface OrderService { createAsync(args): Promise<Order>; ... }
// interface OrderQueryBuilder { where(f): ...; orderBy(f): ... }

// 无需手写任何接口/请求构造——类型即契约，拼错字段编译期报错
const svc = Tkwf.User.Use<OrderService>();
const order = await svc.createAsync("买咖啡");

const list = await Tkwf.User.Query<Order>()
    .where(f => f.status.eq("Paid"))
    .orderBy(f => f.createdAt)
    .page(1, 20)
    .toPageAsync();
```
