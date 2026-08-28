---
title: ts-client-mock 前端 Mock 测试
description: @tkwf/tsclient-mock 使用指南：MockTransport 注入、createMockDb、MockHttpServer、场景切换、录制回放
---

# ts-client-mock 前端 Mock 测试

> @tkwf/tsclient-mock 为前端提供完整的 Mock 运行时，支持 Transport 注入、内存数据库、场景切换、录制回放、HTTP Mock Server，让前端在无后端环境下独立开发、测试、演示。
> 设计依据：[G07D](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G07D-RPC-前端客户端-ts-client-mock-使用指南.md) · [D07M](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07M-RPC-前端客户端-ts-client-mock-设计方案.md) · [ADR09](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR09-Mock数据基础设施架构.md)

---

## 核心概念

| 概念 | 说明 |
|:--|:--|
| **MockTransport** | Transport 接口实现，替代真实网络请求，按 field 分发 handler |
| **createMockDb** | 内存数据库引擎，支持 CRUD、26 操作符、关联过滤、聚合、场景切换 |
| **createMockFactory** | 类型驱动数据工厂，支持策略化生成、faker.js 真实感数据 |
| **MockHttpServer** | 基于 node:http 的轻量 HTTP Mock Server，支持 CORS、Auth、场景注入 |
| **gen-mock-handlers** | CLI 工具，从 ts-client.g.ts 生成 handler 骨架，防漂移 |

> 核心架构：业务代码零改动 → `Tkwf.configure({ transport: new MockTransport(handlers) })` → 全部 `Tkwf.User.Use<T>()` 走 Mock 数据

---

## 快速开始

### 1. 安装

```bash
npm install --save-dev @tkwf/tsclient-mock
# 推荐 realistic 模式需额外安装
npm install --save-dev @faker-js/faker
```

### 2. 生成 Mock 骨架

```bash
# 从 ts-client.g.ts 生成全部 handler 骨架
npx gen-mock-handlers \
  --input src/gql/ts-client.g.ts \
  --output src/gql/ts-client.mock.g.ts
```

生成产物结构：
```
ts-client.mock.g.ts
├── createMockDb({ ... })          — 内存数据库骨架
├── scenarios                      — 场景数据集骨架（default + empty）
├── scenarioOverrides              — 场景注入骨架（error + loading）
├── DTO schema 常量                // XxxSchema = { ... } as const
├── defineXxxFactory               // 工厂 DSL 骨架
├── validateXxx                    // 运行时校验函数（动态 import zod）
├── registerRelations(db)          // 实体关系注册骨架
├── handlers = { ... }             // 全部 field handler 骨架
├── satisfies Record<...>          — 编译期完整性检查
└── _AssertAllFieldsCovered        — 漏掉 API 编译报错
```

### 3. 接入应用

```typescript
// main.ts
import { Tkwf } from "@tkwf/tsclient";
import { MockTransport } from "@tkwf/tsclient-mock";
import { handlers } from "./gql/ts-client.mock.g";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

Tkwf.configure("my_app", {
  endpoint: "/graphql",
  ...(useMock ? { transport: new MockTransport(handlers) } : {}),
});
```

### 4. 环境变量切换

```bash
# .env.mock
VITE_USE_MOCK=true
```

```bash
# 启动
npx vite --mode mock
```

---

## 核心能力详解

### 1. MockTransport —— Transport 层注入

**用途**：替换真实 Transport，让 `Tkwf.User.Use<XxxService>()` 走 handler 而非网络。

```typescript
import { MockTransport } from "@tkwf/tsclient-mock";

const transport = new MockTransport(
  {
    paymentLogs: (vars) => db.query("paymentLogs", vars?.where, vars?.order, { first: vars?.first }),
    createPaymentLog: (vars) => db.insert("paymentLogs", vars?.input),
  },
  {
    delayMs: 150,          // 全局模拟延迟
    fieldOptions: {
      paymentLogs: {       // per-field 覆盖
        delayMs: 500,
        failRate: 0.1,    // 10% 概率失败
        error: new Error("模拟异常"),
      },
    },
  },
);
```

**handler 签名**：
```typescript
type MockHandler = (
  variables: Record<string, unknown> | undefined,
  ctx: { sessionKey?: string; signal?: AbortSignal; scenario?: string },
) => unknown;
```

**注入管道**（每步可被 scenario 覆盖）：
```
error → failRate → delay → handler → timeout
```

---

### 2. createMockDb — 内存数据库

**用途**：Mutation→Query 联动（新建后列表刷新）、where/orderBy/page 真实过滤。

```typescript
import { createMockDb } from "@tkwf/tsclient-mock";

const db = createMockDb({
  paymentLogs: [
    { id: 1, status: "SUCCESS", amount: 100, createdAt: new Date() },
    { id: 2, status: "FAILED", amount: 50, createdAt: new Date() },
  ],
});

// 注册 field → 表映射
db.registerQuery("paymentLogs", "paymentLogs");
db.registerMutation("createPaymentLog", "paymentLogs", "create");

// 查询（支持过滤/排序/分页）
db.query("paymentLogs", { status: { eq: "SUCCESS" } }, { createdAt: "desc" }, { first: 10 });

// 操作（Mutation→Query 状态同步立即可见）
db.insert("paymentLogs", { status: "NEW", amount: 200 });
db.update("paymentLogs", 1, { status: "CANCELLED" });
db.remove("paymentLogs", 2);
```

**FilterInput 支持的操作符（26 个）**：

| 类别 | 操作符 |
|:--|:--|
| 相等 | eq, neq |
| 比较 | gt, gte, lt, lte |
| 反向比较 | ngt, ngte, nlt, nlte |
| 集合 | in, nin |
| 字符串 | contains, ncontains, startsWith, nstartsWith, endsWith, nendsWith |
| 布尔 | isTrue, isFalse |
| 空值 | isNull |
| 范围 | between |
| 大小写 | mode: "default" \| "insensitive" |
| 数组 | containsAny, containsAll |
| 逻辑 | and, or |

**多数据集**：
```typescript
const db = createMockDb({ logs: [] }, {
  datasets: {
    default: { logs: [{ id: 1, status: "OK" }] },
    empty: { logs: [] },
  },
});
db.switchDataset("empty");  // 运行时切换数据
```

---

### 3. createMockFactory — 类型驱动工厂

**用途**：从 DTO 类型递归生成合法默认值，Agent 只覆盖业务关键字段。

```typescript
import { createMockFactory } from "@tkwf/tsclient-mock";
import type { PaymentLog } from "./gql/ts-client.g";

const paymentFactory = createMockFactory<PaymentLog>();

// 生成一条（其余字段自动合法）
const log = paymentFactory.make({ status: "SUCCESS" });

// 生成多条
const logs = paymentFactory.makeN(5, { status: "SUCCESS" });

// 定值列表
const items = paymentFactory.makeMany([
  { status: "SUCCESS", amount: 100 },
  { status: "FAILED", amount: 50 },
]);
```

**默认值生成规则**：

| 类型 | 默认值 |
|:--|:--|
| string | `"mock-{field}"`（id 字段自增） |
| number | LCG 确定性序列 |
| boolean | `false` |
| Date | 固定时间轴递增 |
| enum | 第一个枚举值 |
| array | `[]` |
| object | 递归生成 |

---

### 4. gen-mock-handlers —— codegen 骨架生成

**用途**：从 `ts-client.g.ts` 读取全部 field，生成 `handlers` + `db` + `scenarios` + `registerRelation` + `defineXxxFactory` 骨架。

```bash
npx gen-mock-handlers \
  --input src/gql/ts-client.g.ts \
  --output src/gql/ts-client.mock.g.ts
```

**防漂移机制**：`handlers satisfies Record<keyof typeof Query | keyof typeof Mutation, MockHandler>`——主包 codegen 新增 field 后重跑本命令，漏掉的 handler 直接编译报错。

---

### 5. 场景切换

```typescript
import { MockTransport, createMockDb, createScenarioContext } from "@tkwf/tsclient-mock";

const db = createMockDb({ paymentLogs: [] }, {
  datasets: {
    default: { paymentLogs: [{ id: 1, status: "ok", amount: 100 }] },
    empty: { paymentLogs: [] },
  },
});

const transport = new MockTransport(handlers, {
  scenarios: {
    error: { fieldOptions: { paymentLogs: { error: new Error("网络异常") } } },
    loading: { delayMs: 3000 },
  },
});

const scenario = createScenarioContext({ db, transport });

scenario.setScenario("empty");    // 空态 → 列表空
scenario.setScenario("error");    // 错误态 → 报错
scenario.setScenario("loading");  // 加载态 → 3s 骨架屏
```

**注入优先级**（逐项覆盖）：
```
scenarios[scenario].fieldOptions?.[field]?.error
  ?? scenarios[scenario].error
  ?? fieldOptions?.[field]?.error

scenarios[scenario].fieldOptions?.[field]?.delayMs
  ?? scenarios[scenario].delayMs
  ?? fieldOptions?.[field]?.delayMs
  ?? delayMs
```

---

### 6. 录制回放

```typescript
import { createRecordingTransport, MemoryRecordingStore, normalizeTimestamps } from "@tkwf/tsclient-mock";

// 1. 录制
const store = new MemoryRecordingStore();
store.start("payment-flow");
const recordTransport = createRecordingTransport(realTransport, {
  mode: "record",
  recordingName: "payment-flow",
  store,
  normalizers: {
    normalizeResult: (result) => normalizeTimestamps(result),
  },
});
// 执行操作... 数据写入 store
store.stop();

// 2. 回放
const replayTransport = createRecordingTransport(transport, {
  mode: "replay",
  recordingName: "payment-flow",
  store,
  maxUsageCount: 1,
});
```

**三态模式**：

| mode | 行为 |
|:--|:--|
| `record` | 走真实 Transport，记录请求/响应 |
| `replay` | 从录制数据匹配请求，返回录制响应 |
| `passthrough` | 直通不录 |

**文件存储**（跨进程持久化）：
```typescript
import { FileRecordingStore } from "@tkwf/tsclient-mock";
const store = new FileRecordingStore("./recordings");
store.start("payment-flow");  // → 写入 ./recordings/payment-flow.json
```

---

### 7. 运行时契约校验

```typescript
import { mockFieldSchemaToZod, validateWithZod } from "@tkwf/tsclient-mock";

const zodSchema = mockFieldSchemaToZod(PaymentLogSchema);
const result = validateWithZod(PaymentLogSchema, agentData);
if (!result.ok) {
  console.log(result.errors);   // ["$.status: Invalid option..."]
  console.log(result.issues);   // [{ code, path, message }]
}
```

**自愈重试**（与 AI 填充配合）：
```typescript
import { selfHealing } from "@tkwf/tsclient-mock";

const data = await selfHealing({
  schema: PaymentLogSchema,
  zodSchema: PaymentLogSchema,
  generator: () => llmFill(prompt, dtoSchema),
  maxRetries: 3,
});
```

---

### 8. 关联过滤嵌套

```typescript
const db = createMockDb({ logs: [...], merchants: [...] });

db.registerRelation("logs", "merchant", {
  type: "belongsTo", targetTable: "merchants", foreignKey: "merchantId",
});
db.registerRelation("merchants", "logs", {
  type: "hasMany", targetTable: "logs", foreignKey: "logIds",
});

// 至少有一条日志金额 > 100 的商户
const result = db.query<Merchant>("merchants", {
  logs: { some: { amount: { gt: 100 } } },
});

// 所有日志都是 SUCCESS 的商户（空关联 → true）
db.query("merchants", { logs: { every: { status: { eq: "SUCCESS" } } } });

// 没有日志是 FAILED 的商户
db.query("merchants", { logs: { none: { status: { eq: "FAILED" } } } });
```

---

### 9. 双向同步

```typescript
db.registerRelation("logs", "merchant", {
  type: "belongsTo", targetTable: "merchants", foreignKey: "merchantId",
  inverse: "logs",
});
db.registerRelation("merchants", "logs", {
  type: "hasMany", targetTable: "logs", foreignKey: "logIds",
  inverse: "merchant",
});

// 插入日志时自动更新 merchant.logIds
db.insert("logs", { id: 10, status: "OK", merchantId: 1 });
// merchant[1].logIds 自动包含 10

// 变更 FK 时旧值自动移除、新值追加
db.update("logs", 10, { merchantId: 2 });
// merchant[1].logIds 移除 10, merchant[2].logIds 包含 10

// 删除日志时自动清理
db.remove("logs", 10);
// merchant[2].logIds 移除 10
```

---

### 10. 聚合查询

```typescript
const result = db.aggregate("logs", {
  fields: {
    totalAmount: { function: "sum", field: "amount" },
    avgAmount: { function: "avg", field: "amount" },
    maxAmount: { function: "max", field: "amount" },
    successCount: { function: "count", filter: { status: { eq: "SUCCESS" } } },
  },
  where: { amount: { gte: 50 } },
});
// { totalAmount: 575, avgAmount: 115, maxAmount: 200, successCount: 3 }
```

---

### 11. 工厂 DSL

```typescript
// ts-client.mock.g.ts 中自动生成
export const definePaymentLog = createMockFactory<PaymentLog>({ _types: PaymentLogSchema });

// 消费端使用
const log = definePaymentLog.make({ status: "SUCCESS", amount: 200 });
const logs = definePaymentLog.makeN(5);
```

---

### 12. HTTP mock server

```typescript
import { MockHttpServer, MockTransport } from "@tkwf/tsclient-mock";

const transport = new MockTransport(handlers);
const server = new MockHttpServer({ transport, port: 0, cors: true, auth: true });

const port = await server.start();
// http://localhost:${port}/graphql 现在可用

await server.stop();
```

**支持**：
- `POST /graphql` — 遵循 graphql-over-http 规范
- `GET /health` — 健康检查
- CORS 中间件 — OPTIONS 204 + 跨域头
- 鉴权 — `Authorization: Bearer <token>` 提取 → sessionKey
- 状态码映射 — 200/401/403/404/429/500/504 自动映射

---

## 场景指南

| 场景 | 做法 |
|:--|:--|
| **无后端本地开发** | 环境变量 `VITE_USE_MOCK=true` → `MockTransport` 注入 |
| **组件/页面单元测试** | vitest + React Testing Library，动态创建 `MockTransport` + `createMockDb` |
| **Storybook 场景渲染** | `createScenarioContext` 绑定 Storybook toolbar |
| **CI 无后端测试** | 开发时录制 → CI 回放 |
| **HTTP 层语义验证** | `MockHttpServer` + scenario 注入状态码 |
| **原型/Demo 快速搭建** | `createMockFactory` + `createMockDb` + `defineXxxFactory` |

---

## 注意事项

- **向后兼容**：`MockTransport` 不传 `scenarios`/`datasets` 时行为与 v1.0.0 完全一致
- **类型安全**：禁止 `as any` / `@ts-ignore`，`satisfies Record<...>` 保证字段变化编译报错
- **环境隔离**：mock 包仅进 `devDependencies`，生产零携带
- **依赖**：`zod@^4` 为 peerDependency（仅运行时校验需要）；零外部运行时依赖

---

> 完整实战请参考 [G07D](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G07D-RPC-前端客户端-ts-client-mock-使用指南.md) 与 [D07M](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07M-RPC-前端客户端-ts-client-mock-设计方案.md)。