---
title: 控制器路径选型：Path A vs Path B
description: 对比 [GenerateController] 自动生成与手写控制器两种路径的决策指南
---
# 控制器路径选型：Path A vs Path B

> 源文档：[D07](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07-%E4%B8%89%E5%B1%82SG-%E5%8E%9F%E5%88%99%E5%92%8C%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) · [D07A](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07A-RPC-%E8%BF%9C%E7%A8%8B%E8%BF%87%E7%A8%8B%E8%B0%83%E7%94%A8-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88V2.md) · V4.9.41

---

## 一句话总结

**Path A（手写 Controller，契约先行）** 适合编排入口明确、需要手写业务逻辑的复杂服务；**Path B（`[GenerateController]` 标注 Service）** 适合标准 CRUD 服务。

---

## 对比表

| 维度 | Path A：手写 Controller（契约先行） | Path B：自动生成（`[GenerateController]`） |
|:--|:--|:--|
| **声明方式** | 手写 `XxxController : DomainControllerBase` + `IAopContract` 契约 | Service 类级标注 `[GenerateController]` |
| **路由** | 由 SG2 生成端点决定（`/api/{ServiceName}/{MethodName}`，无手写 MVC 路由） | 同左（自动生成，SG2 决定） |
| **参数绑定** | 由 SG2 生成端点决定（无手写 MVC 绑定） | 自动（简单类型 querystring，复杂类型 body） |
| **响应格式** | 自动（JSON / GraphQL） | 自动（JSON / GraphQL） |
| **AOP 拦截器** | 经 `IAopContract` 自动进 AOP | 经 `IAopContract` 自动进 AOP |
| **适用场景** | 复杂编排、自定义业务逻辑入口 | 标准 CRUD、内部服务、快速交付 |
| **维护成本** | 中（手写 + 维护） | 低（SG 自动生成） |
| **灵活性** | 高（完全控制编排逻辑） | 低（固定模式） |

---

## 决策树

```
你的服务需要什么？
├─ 标准 CRUD（增删改查） ──────────→ Path B（[GenerateController]）
├─ 内部 RPC 调用 ──────────────────→ Path B（[GenerateController]）
├─ 复杂编排 / 手写业务逻辑入口 ─────→ Path A（手写 Controller）
├─ 自定义路由（RESTful 风格） ──────→ 路由由 SG2 生成端点决定，无需手写
├─ 特殊响应格式（非 JSON） ────────→ 由 DTO 投影 / 响应契约决定
└─ 混合场景 ──────────────────────→ Path B 为主 + Path A 补充
```

---

## Path B：自动生成（`[GenerateController]` 标注 Service，推荐）

### 声明

```csharp
// 1. 定义服务类（构造函数形态以源码为准）
[GenerateController]
public class TodoService(...) : DomainServiceBase(...)
{
    // 业务方法：SG2a 据此生成 GraphQL Resolver + REST 端点
    public async Task<TodoItemDto?> GetAsync(long id, CancellationToken ct = default) { /* ... */ }
    public async Task<List<TodoItemDto>> ListPendingAsync(CancellationToken ct = default) { /* ... */ }
    public async Task<long> CreateAsync(string title, CancellationToken ct = default) { /* ... */ }
    public async Task CompleteAsync(long id, CancellationToken ct = default) { /* ... */ }
}
```

### 自动生成的产物

- **SG1b**（Domain 编译期）：生成 `TodoServiceController.g.cs` + `ITodoServiceController` 契约接口（`I{ServiceName}Controller`，继承 `IAopContract`）+ `TodoServiceControllerDecorator.g.cs`（AOP 装饰器）三件套
- **SG2a**（WebApi 编译期）：生成 GraphQL Resolver + REST 端点（接入层）
- **SG3**（客户端编译期，按需）：客户端代理

### 适用场景

- 标准 CRUD 服务（增删改查）
- 内部 RPC 调用（服务间通信）
- 快速原型开发
- 团队对 API 设计无特殊要求

---

## Path A：手写 Controller（契约先行）

### 声明

```csharp
// 1. 手写契约接口（A 路径：契约先行；SG2a 据此生成 GraphQL/REST 端点）
public interface IOrderController : IAopContract
{
    Task<OrderDto?> GetAsync(long id, CancellationToken ct = default);
    Task<List<OrderDto>> SearchAsync(SearchOrdersDto dto, CancellationToken ct = default);
}

// 2. 手写 Controller（只标 AOP 特性；不要在 Controller 上手写 MVC 路由/绑定）
[Transactional] // AOP 特性示例（以源码为准）
public class OrderController : DomainControllerBase<DmpUserInfo>, IOrderController
{
    private readonly OrderService _orderSvc;

    public OrderController(DomainUser<DmpUserInfo> user, OrderService orderSvc)
        : base(user) => _orderSvc = orderSvc;

    public async Task<OrderDto?> GetAsync(long id, CancellationToken ct = default)
    {
        var order = await _orderSvc.GetRequiredAsync(e => e.Id == id);   // 公开读 API（EntityGetAsync 是 internal 生成物）
        return order?.ToDto();
    }

    // 其余契约方法...
}

// 授权过滤器统一注册（不裸标在 Controller 上；泛型特性标注形式以源码为准）：
// 初始化器：AddGlobalFilter(new AuthorityFilterAttribute<DmpUserInfo>());
```

### 适用场景

- 复杂编排 / 需要手写业务逻辑入口（AuthController 式）
- 契约先行：服务外观（方法集）需精确控制
- 需要自定义中间件/过滤器
- 公开 API（外部消费者）

---

## 混合模式（推荐）

实际项目中，两种路径通常混合使用：

```
服务类型              路径选择
───────────────────────────────
内部 CRUD 服务        Path B（[GenerateController]）
公开 REST API        Path A（手写 Controller，契约先行）
后台管理 API         Path B（快速开发）
移动端 API           Path A（契约先行）
快速原型 / 标准服务   Path B（自动生成）
```

---

## 进一步阅读

- [传输协议选型](./choose-transport.md) — GraphQL vs REST vs RPC 选型
- [集成形态选型](./choose-integration.md) — Web / Blazor / MAUI 选型
- [三层 SG 管线解剖](../explanation/sg-pipeline-anatomy.md) — SG1/SG2/SG3 自动生成原理
