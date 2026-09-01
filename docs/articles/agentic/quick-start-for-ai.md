---
title: AI 快速上手（速查卡 + Prompt 模板）
description: 面向 AI Agent 的快速上手文档，含速查卡、6 条框架规则与 3 个 Prompt 模板
---
# AI 快速上手（速查卡 + Prompt 模板）

> 面向 AI Agent（Cursor / GitHub Copilot / Claude 等）的快速参考。
> 设计依据：[AC05（原 G06B-Agentic）](https://github.com/LoongBa/TKW.Framework/blob/master/docs/AC-Docs/AC05-%E6%9D%A1%E4%BB%B6%E8%A1%A8%E8%BE%BE%E5%BC%8F%E6%9E%84%E5%BB%BA%E5%99%A8%E7%AE%80%E6%98%8E%E6%8C%87%E5%8D%97.md) · V4.9.41

---

## 速查卡（30 秒读完）

```
TKWF 框架核心规则：
  1. 领域服务继承 DomainServiceBase<TUserInfo>
  2. 数据访问通过 IEntityDAC<T>（ORM 无关）
  3. AOP 拦截器编译期生成（[Transactional] / [AuthorityFilter]）
  4. 用户上下文通过 User.Use<T>() 显式注入
  5. 查询条件用 Entity.Where.ByXxx() 链式构建
  6. 客户端查询用 User.Query<T>()（自动翻译 GraphQL）

禁止事项：
  ❌ 不要 new Service()——用 User.Use<T>()
  ❌ 不要直接 new EntityDAC()——用 DI 注入
  ❌ 不要手写 Controller（SG 自动生成）
  ❌ 不要运行时代理（Castle / Autofac）
  ❌ 不要手动管理事务（用 [Transactional]）
```

---

## 6 条框架规则

### 规则 1：领域服务继承 DomainServiceBase

```csharp
// ✅ 正确
public class OrderService : DomainServiceBase<DmpUserInfo>
{
    public OrderService(DomainUser<DmpUserInfo> user) : base(user) { }
}

// ❌ 错误
public class OrderService  // 没有继承基类
{
    public OrderService(IEntityDAC<Order> dac) { }  // 直接注入 DAC
}
```

### 规则 2：数据访问通过 IEntityDAC\<T\>

```csharp
// ✅ 正确
var order = await _dac.FirstOrDefaultAsync(
    _dac.Query.Where(e => e.Id == id));

// ❌ 错误
var order = await _dbContext.Orders.FindAsync(id);  // 直接用 ORM
```

### 规则 3：AOP 拦截器编译期生成

```csharp
// ✅ 正确（SG1 自动生成 Decorator）
[Transactional]
public async Task TransferFundsAsync(decimal amount) { /* ... */ }

// ❌ 错误（运行时代理）
// 没有 [Transactional]，手动管理事务
```

### 规则 4：用户上下文通过 User.Use\<T\>()

```csharp
// ✅ 正确
var memberSvc = User.Use<MemberService>();
var member = await memberSvc.EntityGetAsync(memberId);

// ❌ 错误
var memberSvc = new MemberService(dac);  // 直接 new
var memberSvc = _serviceProvider.GetRequiredService<MemberService>();  // 直接解析
```

### 规则 5：查询条件用 Entity.Where.ByXxx()

```csharp
// ✅ 正确
var query = Entity.Where.ByMemberId(123).ByStatus(1);
var results = await svc.SelectAsync(query);

// ❌ 错误
var query = e => e.MemberId == 123 && e.Status == 1;  // 手写表达式
```

### 规则 6：客户端查询用 User.Query\<T\>()

```csharp
// ✅ 正确（自动翻译 GraphQL）
var result = await _user.Query<OrderDto>()
    .Where(x => x.Status == OrderStatus.Pending)
    .Page(1, 20)
    .ToPageAsync();

// ❌ 错误
var result = await _httpClient.GetAsync("/api/orders?status=pending");  // 手动 HTTP
```

---

## 3 个 Prompt 模板

### Prompt 1：生成领域服务

```
为 TodoItem 实体生成领域服务：

实体定义：
public class TodoItem : IDomainEntity
{
    public long Id { get; set; }
    public string Title { get; set; } = "";
    public bool IsDone { get; set; }
    public DateTime CreateTime { get; set; }
}

要求：
1. 继承 DomainServiceBase<DmpUserInfo>
2. 构造函数注入 DomainUser<DmpUserInfo>
3. 实现 CRUD 方法（Get / List / Create / Update / Delete）
4. 使用 IEntityDAC<TodoItem> 访问数据
5. 查询条件用 Entity.Where.ByXxx() 链式构建
```

### Prompt 2：生成 Controller

```
为 ITodoService 接口生成 Controller：

接口定义：
public interface ITodoService : IDomainServiceContract<DmpUserInfo>
{
    Task<TodoItemDto?> GetAsync(long id, CancellationToken ct = default);
    Task<List<TodoItemDto>> ListPendingAsync(CancellationToken ct = default);
    Task<long> CreateAsync(string title, CancellationToken ct = default);
    Task CompleteAsync(long id, CancellationToken ct = default);
}

要求：
1. 使用 [GenerateController(typeof(ITodoService))] 标注
2. SG1 自动生成 Controller + IAopContract
3. 不要手写 Controller（SG 自动生成）
```

### Prompt 3：生成查询条件

```
为 Order 实体生成动态查询条件：

实体定义：
public class Order : IDomainEntity
{
    public long Id { get; set; }
    public long MemberId { get; set; }
    public int Status { get; set; }
    public string OrderNo { get; set; } = "";
    public decimal TotalAmount { get; set; }
    public DateTime CreateTime { get; set; }
}

要求：
1. 支持按 MemberId / Status / OrderNo / CreateTimeRange 查询
2. 使用 Entity.Where.ByXxx() 链式构建
3. 支持动态拼接（If 条件）
4. 支持 OR 分支
```

---

## 常见错误模式

### 错误 1：直接 new Service

```csharp
// ❌ 错误
var service = new OrderService(dac, user);

// ✅ 正确
var service = User.Use<OrderService>();
```

### 错误 2：直接用 ORM

```csharp
// ❌ 错误
var order = await _dbContext.Orders.FindAsync(id);

// ✅ 正确
var order = await _dac.FirstOrDefaultAsync(
    _dac.Query.Where(e => e.Id == id));
```

### 错误 3：手写表达式

```csharp
// ❌ 错误
var query = e => e.MemberId == 123 && e.Status == 1;

// ✅ 正确
var query = Entity.Where.ByMemberId(123).ByStatus(1);
```

### 错误 4：手动管理事务

```csharp
// ❌ 错误
using var tx = _txManager.Begin();
try { /* ... */ tx.Commit(); }
catch { tx.Rollback(); throw; }

// ✅ 正确
[Transactional]
public async Task TransferFundsAsync(decimal amount) { /* ... */ }
```

---

## 进一步阅读

- [条件表达式构建器](../advanced/conditions-builder.md) — Conditions Builder 完整 API 参考
- [增强查询 QueryBuilder](../advanced/query-guide.md) — User.Query\<T\>() 客户端远程查询
- [扩展机制：如何开发扩展](../explanation/extensions/development.md) — SG1 扫描扩展契约
