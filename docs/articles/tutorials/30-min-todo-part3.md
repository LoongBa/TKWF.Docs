---
title: 30 分钟实战：多协议暴露 + 客户端
description: 30 分钟实战教程：将 Todo 服务通过 GraphQL/REST/RPC 三协议暴露，并用 C# 客户端调用
---
# 30 分钟实战：多协议暴露 + 客户端

> 源文档：[D07](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07-%E4%B8%89%E5%B1%82SG-%E5%8E%9F%E5%88%99%E5%92%8C%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) · [D07A](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07A-RPC-%E8%BF%9C%E7%A8%8B%E8%BF%87%E7%A8%8B%E8%B0%83%E7%94%A8-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88V2.md) · [G07A](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G07A-RPC-%E8%BF%9C%E7%A8%8B%E8%BF%87%E7%A8%8B%E8%B0%83%E7%94%A8-WebApi%E6%9C%8D%E5%8A%A1%E7%AB%AF%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · V4.9.41

---

## 本节目标

在 Part 2 的 Todo 应用基础上，将 TodoService 通过 GraphQL/REST/RPC 三协议暴露，并用 C# 客户端调用——10 分钟完成。

---

## Step 1：声明服务接口（3 分钟）

TKWF 的三层 SG 管线会自动为服务接口生成 Controller / GraphQL Resolver / REST 端点。你只需声明接口：

```csharp
using TKW.Framework.Domain.DataServices;
using TKW.Framework.Domain.DataServices.Base;

// 声明契约接口（SG1 自动生成 Controller + IAopContract）
public interface ITodoService : IDomainServiceContract<DmpUserInfo>
{
    Task<TodoItemDto?> GetAsync(long id, CancellationToken ct = default);
    Task<List<TodoItemDto>> ListPendingAsync(CancellationToken ct = default);
    Task<long> CreateAsync(string title, CancellationToken ct = default);
    Task CompleteAsync(long id, CancellationToken ct = default);
}
```

**SG 管线自动生成**：

| SG 层 | 产出 | 说明 |
|:--|:--|:--|
| SG1 (领域层) | `GeneratedControllerRegistrations` | 提取接口元数据 |
| SG2 (WebApi 层) | `TodoServiceController.cs` | GraphQL Resolver + REST 端点 |
| SG3 (客户端层) | 客户端代理（按需） | Blazor WASM / MAUI 客户端代理 |

---

## Step 2：三协议暴露（2 分钟）

接口声明后，SG2 自动生成三协议端点——**无需手动写 Controller**：

### GraphQL

```graphql
# 自动生成的 GraphQL Query
query {
  todoService {
    get(id: 1) { id title isDone }
    listPending { id title }
  }
}

# 自动生成的 GraphQL Mutation
mutation {
  todoService {
    create(title: "New Todo")  # 返回 id
    complete(id: 1)
  }
}
```

### REST

```http
GET  /api/TodoService/Get?id=1
GET  /api/TodoService/ListPending
POST /api/TodoService/Create?title=New%20Todo
POST /api/TodoService/Complete?id=1
```

### RPC（进程内）

```csharp
// 服务端代码直接调用（无网络开销）
var result = await user.Use<ITodoService>().GetAsync(1);
```

---

## Step 3：C# 客户端调用（3 分钟）

### Blazor WASM / MAUI 客户端

```csharp
// 在 Blazor Page 或 ViewModel 中
public class TodoListPage
{
    private DomainClientUser _user;

    public async Task LoadDataAsync()
    {
        // RPC 调用（自动翻译为 GraphQL/REST）
        var todos = await _user.Use<ITodoService>().ListPendingAsync();

        // 复杂查询（User.Query<T> 自动构建 GraphQL 表达式）
        var page = await _user.Query<TodoItemDto>()
            .Where(x => !x.IsDone)
            .OrderByDescending(x => x.CreateTime)
            .Page(1, 20)
            .ToPageAsync();
    }
}
```

### 前端 TypeScript 客户端

```typescript
import { DomainHostClient } from '@tkwf/tsclient';

const client = new DomainHostClient({ baseUrl: 'https://localhost:5001' });

// RPC 调用
const todos = await client.use('ITodoService').listPending();

// 复杂查询（GraphQL 表达式）
const page = await client.query('TodoItemDto')
  .where({ isDone: false })
  .orderByDescending('createTime')
  .page(1, 20)
  .toPromise();
```

---

## Step 4：验证（2 分钟）

```bash
# 1. 启动服务端
dotnet run

# 2. GraphQL 查询
curl -X POST https://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ todoService { listPending { id title } } }"}'

# 3. REST 调用
curl https://localhost:5001/api/TodoService/ListPending

# 4. 客户端调用（在 Blazor WASM 中）
# _user.Use<ITodoService>().ListPendingAsync()
```

---

## 完整架构图

```
┌─────────────────────────────────────────────────────────┐
│                    SG 管线自动生成                         │
│                                                          │
│  ITodoService (接口声明)                                  │
│       ↓ SG1 扫描                                         │
│  GeneratedControllerRegistrations (元数据)               │
│       ↓ SG2 生成                                         │
│  ┌──────────────┬──────────────┬──────────────┐         │
│  │ GraphQL      │ REST         │ RPC          │         │
│  │ Resolver     │ Controller   │ (进程内)      │         │
│  └──────┬───────┴──────┬───────┴──────┬───────┘         │
│         │              │              │                   │
│         ↓              ↓              ↓                   │
│  ┌──────────────────────────────────────────────┐       │
│  │  TodoServiceImpl : ITodoService               │       │
│  │  (DataService + AOP 拦截器 + 事务)             │       │
│  └──────────────────────────────────────────────┘       │
│         │                                                │
│         ↓                                                │
│  ┌──────────────────────────────────────────────┐       │
│  │  IEntityDAC<TodoItem> (FreeSqlEntityDAC)      │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 进一步阅读

- [三层 SG 管线解剖](../explanation/sg-pipeline-anatomy.md) — SG1/SG2/SG3 分层职责详解
- [传输协议选型](../decision-guides/choose-transport.md) — GraphQL vs REST vs RPC 选型指南
- [控制器路径选型](../decision-guides/choose-controller-path.md) — 自动生成 vs 手写控制器
- [30 分钟实战系列总结](./30-min-todo-part1.md) — 从 Entity 到多协议暴露的完整路径
