---
title: 控制器路径选型：Path A vs Path B
description: 对比 [GenerateController] 自动生成与手写控制器两种路径的决策指南
---
# 控制器路径选型：Path A vs Path B

> 源文档：[D07](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07-%E4%B8%89%E5%B1%82SG-%E5%8E%9F%E5%88%99%E5%92%8C%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) · [D07A](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07A-RPC-%E8%BF%9C%E7%A8%8B%E8%BF%87%E7%A8%8B%E8%B0%83%E7%94%A8-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88V2.md) · V4.9.41

---

## 一句话总结

**Path A（`[GenerateController]` 自动生成）** 适合标准 CRUD 服务；**Path B（手写 Controller）** 适合需要自定义路由/参数/响应的复杂 API。

---

## 对比表

| 维度 | Path A：自动生成 | Path B：手写 Controller |
|:--|:--|:--|
| **声明方式** | `[GenerateController(typeof(ITodoService))]` | 手写 `TodoController : DomainControllerBase` |
| **路由** | 自动生成（`/api/{ServiceName}/{MethodName}`） | 自定义（`[Route("api/orders")]`） |
| **参数绑定** | 自动（简单类型 querystring，复杂类型 body） | 手动（`[FromBody]` / `[FromQuery]`） |
| **响应格式** | 自动（JSON / GraphQL） | 手动控制 |
| **AOP 拦截器** | 自动继承（全局注册） | 需手动标注 |
| **适用场景** | 标准 CRUD、内部服务 | 复杂 API、RESTful 设计、特殊协议 |
| **维护成本** | 低（SG 自动生成） | 中（手写 + 维护） |
| **灵活性** | 低（固定模式） | 高（完全控制） |

---

## 决策树

```
你的服务需要什么？
├─ 标准 CRUD（增删改查） ──────────→ Path A（[GenerateController]）
├─ 内部 RPC 调用 ──────────────────→ Path A（[GenerateController]）
├─ 复杂参数绑定（多 body / 文件上传） → Path B（手写 Controller）
├─ 自定义路由（RESTful 风格） ──────→ Path B（手写 Controller）
├─ 特殊响应格式（非 JSON） ────────→ Path B（手写 Controller）
└─ 混合场景 ──────────────────────→ Path A 为主 + Path B 补充
```

---

## Path A：自动生成（推荐）

### 声明

```csharp
// 1. 定义服务接口
public interface ITodoService : IDomainServiceContract<DmpUserInfo>
{
    Task<TodoItemDto?> GetAsync(long id, CancellationToken ct = default);
    Task<List<TodoItemDto>> ListPendingAsync(CancellationToken ct = default);
    Task<long> CreateAsync(string title, CancellationToken ct = default);
    Task CompleteAsync(long id, CancellationToken ct = default);
}

// 2. 标注 [GenerateController]（SG1 自动生成 Controller）
[GenerateController(typeof(ITodoService))]
public class TodoServiceImpl : TodoDataService, ITodoService
{
    // 实现接口方法...
}
```

### 自动生成的产物

SG1 自动生成：
- `TodoServiceController.cs`（GraphQL Resolver + REST 端点）
- `IAopContract` 接口（AOP 拦截器契约）
- 客户端代理（SG3，按需）

### 适用场景

- 标准 CRUD 服务（增删改查）
- 内部 RPC 调用（服务间通信）
- 快速原型开发
- 团队对 API 设计无特殊要求

---

## Path B：手写 Controller

### 声明

```csharp
// 手写 Controller（完全控制）
[Route("api/orders")]
[AuthorityFilter]
public class OrderController : DomainControllerBase<DmpUserInfo>(User)
{
    private readonly OrderService _orderSvc;

    public OrderController(OrderService orderSvc) => _orderSvc = orderSvc;

    [HttpGet("{id}")]
    public async Task<OrderDto> GetOrder(long id)
    {
        var order = await _orderSvc.EntityGetAsync(id);
        return order?.ToDto();
    }

    [HttpPost("search")]
    public async Task<List<OrderDto>> SearchOrders([FromBody] SearchOrdersDto dto)
    {
        return await _orderSvc.SearchAsync(dto.MemberId, dto.Status, dto.Keyword);
    }

    [HttpPost("batch-import")]
    [RequestSizeLimit(10 * 1024 * 1024)]  // 10MB 文件上传限制
    public async Task<ImportResult> BatchImport(IFormFile file)
    {
        // 文件上传 + 批量导入逻辑
    }
}
```

### 适用场景

- 复杂参数绑定（多 body、文件上传、特殊路由）
- RESTful API 设计（`/api/orders/{id}`）
- 非 JSON 响应格式（XML、CSV 导出）
- 需要自定义中间件/过滤器
- 公开 API（外部消费者）

---

## 混合模式（推荐）

实际项目中，两种路径通常混合使用：

```
服务类型              路径选择
───────────────────────────────
内部 CRUD 服务        Path A（[GenerateController]）
公开 REST API        Path B（手写 Controller）
后台管理 API         Path A（快速开发）
移动端 API           Path B（RESTful 设计）
文件上传/下载         Path B（特殊协议）
```

---

## 进一步阅读

- [传输协议选型](./choose-transport.md) — GraphQL vs REST vs RPC 选型
- [集成形态选型](./choose-integration.md) — Web / Blazor / MAUI 选型
- [三层 SG 管线解剖](../explanation/sg-pipeline-anatomy.md) — SG1/SG2/SG3 自动生成原理
