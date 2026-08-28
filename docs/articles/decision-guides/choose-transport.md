---
title: 传输协议选型：GraphQL vs REST vs RPC
description: 在 GraphQL、REST、RPC 三协议间做选型的决策指南，含对比表、决策树与场景推荐
---
# 传输协议选型：GraphQL vs REST vs RPC

> 源文档：[D07A](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07A-RPC-%E8%BF%9C%E7%A8%8B%E8%BF%87%E7%A8%8B%E8%B0%83%E7%94%A8-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88V2.md) · [G07A](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G07A-RPC-%E8%BF%9C%E7%A8%8B%E8%BF%87%E7%A8%8B%E8%B0%83%E7%94%A8-WebApi%E6%9C%8D%E5%8A%A1%E7%AB%AF%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · V4.9.41

---

## 一句话总结

**GraphQL** 适合复杂查询 + 前端驱动；**REST** 适合简单 CRUD + 公开 API；**RPC** 适合服务间通信 + 进程内调用。TKWF 三协议并行，SG2 自动生成。

---

## 对比表

| 维度 | GraphQL | REST | RPC |
|:--|:--|:--|:--|
| **协议风格** | 查询语言（声明式） | 资源导向（名词） | 方法调用（动词） |
| **端点** | 单一端点（`/graphql`） | 多端点（`/api/orders`） | 多端点（`/api/OrderService/Create`） |
| **查询能力** | 强（嵌套查询、字段裁剪） | 弱（需多个端点组合） | 中（方法参数） |
| **类型安全** | 强（Schema + 代码生成） | 中（OpenAPI） | 强（接口契约） |
| **缓存** | 复杂（需要客户端缓存） | 简单（HTTP 缓存） | 不适用 |
| **学习曲线** | 中（GraphQL 语言） | 低（HTTP 基础） | 低（方法调用） |
| **适用场景** | 复杂查询、SPA、移动端 | 公开 API、简单 CRUD | 服务间通信、进程内调用 |

---

## 决策树

```
你的 API 消费者是谁？
├─ 前端 SPA / 移动端 ─────────────→ GraphQL（复杂查询）或 REST（简单 CRUD）
├─ 公开 API（外部开发者）────────→ REST（标准化）
├─ 服务间通信 ───────────────────→ RPC（进程内 / gRPC）
├─ 内部管理后台 ─────────────────→ GraphQL（灵活查询）或 RPC（快速开发）
└─ 混合场景 ─────────────────────→ 三协议并行（SG2 自动生成）
```

---

## GraphQL：复杂查询首选

### 优势

- **前端驱动**：前端决定查询哪些字段，减少过度获取
- **嵌套查询**：一次请求获取关联数据（如订单 + 会员 + 商品）
- **字段裁剪**：`Select` 投影仅请求需要的字段
- **类型安全**：Schema + 代码生成，编译期检查

### 示例

```graphql
# 查询订单 + 关联会员信息（一次请求）
query {
  orderService {
    get(id: 1) {
      id
      orderNo
      totalAmount
      member {
        id
        name
        phone
      }
    }
  }
}

# 字段裁剪（仅请求需要的字段）
query {
  orderService {
    listPending {
      id
      orderNo
      totalAmount
    }
  }
}
```

### 适用场景

- SPA / 移动端（复杂查询 + 字段裁剪）
- 内部管理后台（灵活查询）
- 数据分析平台（聚合查询）

---

## REST：简单 CRUD 首选

### 优势

- **标准化**：HTTP 动词（GET/POST/PUT/DELETE）语义清晰
- **缓存友好**：HTTP 缓存机制（ETag、Last-Modified）
- **学习曲线低**：只需 HTTP 基础
- **公开 API**：外部开发者熟悉 REST 风格

### 示例

```http
# CRUD 操作
GET    /api/orders/1              # 查询单个
GET    /api/orders?status=pending # 列表查询
POST   /api/orders                # 创建
PUT    /api/orders/1              # 更新
DELETE /api/orders/1              # 删除
```

### 适用场景

- 公开 API（外部开发者）
- 简单 CRUD 应用
- 微服务间 HTTP 通信

---

## RPC：服务间通信首选

### 优势

- **方法调用语义**：`CreateOrder` / `TransferFunds` 语义清晰
- **类型安全**：接口契约 + 编译期检查
- **进程内调用**：零网络开销（同一进程内）
- **AOP 拦截器**：服务端自动生效

### 示例

```csharp
// 服务端（进程内调用）
var result = await user.Use<ITodoService>().CreateAsync("New Todo");

// 客户端（跨进程 RPC）
var result = await _user.Use<ITodoService>().CreateAsync("New Todo");
```

### 适用场景

- 服务间通信（微服务架构）
- 进程内调用（同一应用内）
- 后台 Job / 定时任务

---

## TKWF 三协议并行

TKWF 的 SG2 管线**自动生成三协议端点**——你只需声明接口，无需手写 Controller：

```csharp
// 声明接口（SG2 自动生成 GraphQL/REST/RPC）
public interface ITodoService : IDomainServiceContract<DmpUserInfo>
{
    Task<TodoItemDto?> GetAsync(long id, CancellationToken ct = default);
    Task<long> CreateAsync(string title, CancellationToken ct = default);
}
```

**自动生成产物**：

| 协议 | 端点 | 说明 |
|:--|:--|:--|
| GraphQL | `/graphql` | `todoService.get(id: 1)` |
| REST | `/api/TodoService/Get?id=1` | 标准 HTTP GET |
| RPC | 进程内调用 | `user.Use<ITodoService>().GetAsync(1)` |

---

## 混合架构（推荐）

实际项目通常三协议并行：

```
┌─────────────────────────────────────────────────┐
│                  SG2 自动生成                      │
│                                                   │
│  ITodoService → GraphQL + REST + RPC             │
└──────────────────────┬──────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ GraphQL  │  │ REST     │  │ RPC      │
  │ SPA/移动端│  │ 公开API  │  │ 服务间    │
  └──────────┘  └──────────┘  └──────────┘
```

---

## 进一步阅读

- [控制器路径选型](./choose-controller-path.md) — 自动生成 vs 手写 Controller
- [集成形态选型](./choose-integration.md) — Web / Blazor / MAUI 选型
- [三层 SG 管线解剖](../explanation/sg-pipeline-anatomy.md) — SG1/SG2/SG3 自动生成原理
