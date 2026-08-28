---
title: 如何编写 Mock 数据
description: TKWF 前端 Mock 数据编写指南：三层文件架构、createMockFactory 策略化生成、MockDataSpec 规则驱动、DatasetSeed 跨语言共享
---

# 如何编写 Mock 数据

> 本文聚焦"数据怎么造"——与 [ts-client-mock 前端 Mock 测试](ts-client-mock.md)（"运行时怎么跑"）互为姊妹篇。
> 设计依据：[G07D](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G07D-RPC-前端客户端-ts-client-mock-使用指南.md) §3.3-3.6/3.15 · [SKILL.md](https://github.com/LoongBa/TKW.Framework/blob/master/docs/AC-Kit/skills/tkwf-tsclient-mock/SKILL.md) · [ADR09](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR09-Mock数据基础设施架构.md)

---

## 三层文件架构

Mock 数据编写围绕三层文件展开：

| 层 | 文件 | 生成方式 | 操作 |
|:--|:--|:--|:--|
| **骨架层** | `src/gql/ts-client.mock.g.ts` | `npx gen-mock-handlers` 生成 | ⚠️ 只读，禁止手改 |
| **数据层** | `src/mock/data.ts` | Agent 手工创建/回填 | ✅ 数据唯一入口，永不覆盖 |
| **接线层** | `src/main.tsx`（注入模式） / `scripts/mock-server.ts`（HTTP 模式） | 手工编写 | 连接数据到运行环境 |

> 数据层同时被注入模式（skill1）和 HTTP 模式（skill2）消费——一份数据两端用。

---

## 四条数据编写路径

### 路径 ① 类型驱动工厂（createMockFactory）

**适用**：快速生成少量数据，字段覆盖少。

```typescript
import { createMockFactory } from "@tkwf/tsclient-mock";
import type { PaymentLog } from "./gql/ts-client.g";

const factory = createMockFactory<PaymentLog>({
  _types: PaymentLogSchema,           // 类型元数据（codegen 生成）
  _strategy: "realistic",              // "minimal"（快速）或 "realistic"（faker 真实感）
  _faker: fakerZH_CN,                  // faker 实例（realistic 模式必需）
  _generators: {                       // 字段级覆盖
    amount: () => Math.round(Math.random() * 10000) / 100,
  },
  _relations: {                        // 关联数据生成
    merchant: { type: "belongsTo", target: "merchants", foreignKey: "merchantId" },
  },
});

// 生成
const log = factory.make({ status: "SUCCESS" });
const logs = factory.makeN(5, { status: "SUCCESS" });
```

**字段名三层映射**（60+ 规则）：

| 层 | 匹配方式 | 示例 |
|:--|:--|:--|
| 精确匹配 | 字段名完全一致 | `email` → faker.internet.email() |
| 后缀匹配 | 字段以 `*Time`/`*At` 结尾 | `createTime` → faker.date.recent() |
| 前缀匹配 | 字段以 `*Id`/`*Code` 开头 | `merchantId` → faker.number.int() |

**_strategy 两种模式**：

| 策略 | 特点 | 需要 faker |
|:--|:--|:--|
| `"minimal"` | 快速、确定性、无外部依赖 | ❌ |
| `"realistic"` | faker.js 真实感数据（中文名、真实邮箱等） | ✅ `@faker-js/faker` |

> `_strategy: "realistic"` 但未安装 `@faker-js/faker` 时自动降级为 `minimal` + `console.warn` 提示。

---

### 路径 ② MockDataSpec 规则驱动（推荐）

**适用**：批量生成、场景化数据、跨语言共享。

```json
// mock-data-spec.json
{
  "version": "1.0",
  "locale": "zh-CN",
  "seed": 42,
  "entities": {
    "PaymentLog": {
      "count": 20,
      "fields": {
        "status": { "strategy": "enum", "values": ["SUCCESS", "FAILED", "PENDING"], "weighted": [70, 20, 10] },
        "amount": { "strategy": "range", "min": 10, "max": 5000 },
        "merchantId": { "strategy": "ref", "entity": "Merchant", "field": "id" },
        "createdAt": { "strategy": "dateRange", "from": "2026-01-01", "to": "2026-08-28" },
        "orderNo": { "strategy": "pattern", "pattern": "ORD-{seq:000000}" },
        "remark": { "strategy": "faker", "fakerMethod": "commerce.productDescription" },
        "totalScore": { "strategy": "computed", "expression": "amount * 0.1" }
      },
      "relations": {
        "merchant": { "type": "belongsTo", "target": "Merchant", "foreignKey": "merchantId" }
      }
    }
  },
  "scenarios": {
    "empty": { "PaymentLog": { "count": 0 } },
    "error": { "PaymentLog": { "count": 5, "fields": { "status": { "strategy": "constant", "value": "ERROR" } } } }
  }
}
```

**11 种生成策略**：

| 策略 | 说明 | 示例 |
|:--|:--|:--|
| `sequence` | 自增序列 | `1, 2, 3, ...` |
| `uuid` | UUID v4 | `"a1b2c3d4-..."` |
| `ref` | 引用其他实体 | `merchantId` → Merchant.id |
| `faker` | faker.js 方法 | `commerce.productName()` |
| `range` | 数值范围 | `10 ~ 5000` |
| `dateRange` | 日期范围 | `2026-01-01 ~ 2026-08-28` |
| `pattern` | 模板字符串 | `"ORD-{seq:000000}"` |
| `computed` | 表达式计算 | `amount * 0.1` |
| `constant` | 固定值 | `"ERROR"` |
| `sample` | 随机抽样 | `["A", "B", "C"]` 随机选一 |
| `enum` | 枚举（支持 weighted） | `["SUCCESS", "FAILED"]` 按 70:30 分布 |

**生成管线顺序**：
```
1. 非 ref 字段生成 → 2. ref 字段解析 → 3. relations 关联生成 → 4. computed 计算
```

> `computed` 在 `relations` 之后——可引用 FK 字段（如 `merchantId` 已在第 2 步生成）。

**使用**：
```typescript
import { generateFromSpec } from "@tkwf/tsclient-mock";
import spec from "./mock-data-spec.json";

const seed = generateFromSpec(spec, { scenario: "default" });
// → DatasetSeed

const db = createMockDb({});
db.buildDataset(seed, { unknownTables: "warn" });
// 表名不匹配时 warn（默认）/ error / ignore
```

---

### 路径 ③ gen-mock-handlers 骨架 + data.ts 手工填充

**适用**：精确控制每条数据。

```bash
# 生成骨架（含 // → API: 反向注释 + MOCK_SPEC.md 映射表）
npx gen-mock-handlers \
  --input src/gql/ts-client.g.ts \
  --output src/gql/ts-client.mock.g.ts \
  --mock-spec src/mock/MOCK_SPEC.md
```

```typescript
// src/mock/data.ts — Agent 按 MOCK_SPEC.md 策略填充
import { definePaymentLog } from "../gql/ts-client.mock.g";

export const initialData = {
  paymentLogs: definePaymentLog.makeN(20, { status: "SUCCESS" }),
  merchants: defineMerchant.makeN(5),
};

export const scenarioOverrides = {
  empty: { paymentLogs: [] },
  error: { paymentLogs: definePaymentLog.makeN(3, { status: "FAILED" }) },
  loading: {},  // 数据不变，仅 transport delay
};
```

> **防漂移**：`satisfies Record<keyof typeof Query | keyof typeof Mutation, MockHandler>`——主包 codegen 新增 field 后重跑 gen-mock-handlers，漏掉的 handler 直接编译报错。

---

### 路径 ④ DatasetSeed 跨语言共享（TS↔.NET）

**适用**：前后端共享同一份 Mock 数据。

```
TS 端                              .NET 端
exportDatasetSeed(seed)            DacMigrator.JsonToDatabaseAsync(json)
     ↓                                    ↓
     JSON 文件（语言无关）               PostgreSQL
     ↓                                    ↑
importDatasetSeed(json)            ← 或：C# Bogus 加载同一 spec 独立生成
```

**两条路径**：

| 路径 | 方式 | 说明 |
|:--|:--|:--|
| **转换** | TS `exportDatasetSeed` → JSON → C# `DacMigrator` 写 DB | 精确一致 |
| **重新生成** | C# Bogus 加载同一 `MockDataSpec` 独立生成 | 同 seed 确定性 |

**TS 端**：
```typescript
import { exportDatasetSeed, serializeDatasetSeed } from "@tkwf/tsclient-mock/server";

// 导出
const json = serializeDatasetSeed(seed);
fs.writeFileSync("./seed.json", json);

// 或 CLI
// npx gen-seed --spec mock-data-spec.json --output seed.json
```

**.NET 端**（ADR09 Mock 数据基础设施）：
```csharp
// C# 侧加载同一 JSON
var migrator = new DacMigrator(db);
await migrator.JsonToDatabaseAsync("./seed.json");
```

---

## MOCK_SPEC.md — 人类可读策略文档

`gen-mock-handlers --mock-spec` 生成六节模板：

| 节 | 内容 |
|:--|:--|
| **§1 API 映射表** | 每个 field → 目标表/操作（自动生成） |
| **§2 数据策略** | 每个字段的生成策略（手写——序列/faker/range/pattern/computed） |
| **§3 表间关系** | belongsTo/hasMany 关系声明（手写） |
| **§4 Schema 同步** | DTO 字段与 MockDataSpec 字段对照 |
| **§5 MockDataSpec 翻译** | 人类策略 → JSON spec 的映射规则 |
| **§6 共享移植** | 跨项目/跨语言数据共享方案 |

> MOCK_SPEC.md 与 MockDataSpec JSON **并存不替代**——前者人类读、后者机器读。

---

## 实战要点

| 要点 | 说明 |
|:--|:--|
| **initialData vs scenarioOverrides** | 正常数据放 `initialData`；边界态（空/错误/加载）放 `scenarioOverrides` |
| **登录平铺结构** | Mock 登录链路（loginByPassword 等）的返回值必须平铺，不嵌套 `data.viewer` |
| **ref vs belongsTo** | `ref` = 字段值引用（`merchantId` = Merchant.id）；`belongsTo` = 关系声明（生成关联数据） |
| **表名一致性** | MockDataSpec 中的 entity 名必须与 ts-client.g.ts 中的 type 名一致 |
| **包装/分页** | Connection 类型（edges/pageInfo）不在 spec 范围——由 MockTransport 自动包装 |
| **gen-seed CLI** | `npx gen-seed --spec spec.json --output seed.json`（v1.4.3+） |

---

## 常见问题

### Q: MockDataSpec 和 data.ts 同时存在用哪个？
两者共存不冲突。`data.ts` 的 `initialData` 是手填数据（精确控制），`MockDataSpec` 是规则生成（批量/场景化）。推荐先用 `data.ts` 快速起步，数据量增大后迁移到 MockDataSpec。

### Q: generated 数据每次不一样怎么办？
指定 `seed` 字段（如 `"seed": 42`）——LCG 确定性序列保证同 seed 生成相同数据。

### Q: 如何在浏览器端使用 MockDataSpec？
`generateFromSpec` 是纯函数，浏览器可用。但 `exportDatasetSeed`/`importDatasetSeed` 依赖 `fs`，仅在 Node.js（`/server` 子路径）可用。

### Q: schema 变更后怎么办？
重跑 `npx gen-mock-handlers`——骨架层重新生成（不覆盖 data.ts），`satisfies` 编译检查暴露新增 field 的缺失 handler。

---

## 相关文档

- [ts-client-mock 前端 Mock 测试](ts-client-mock.md) — 运行时使用指南
- [G07D](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G07D-RPC-前端客户端-ts-client-mock-使用指南.md) — 完整使用指南
- [D07M](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07M-RPC-前端客户端-ts-client-mock-设计方案.md) — 设计方案
- [ADR09](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR09-Mock数据基础设施架构.md) — 跨语言 Mock 基础设施