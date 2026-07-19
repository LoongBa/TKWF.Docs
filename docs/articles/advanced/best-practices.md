# 最佳实践

TKWF 框架的设计原则和推荐实践。

---

## 架构设计

### 领域自治

- **DomainUser 只通过构造函数注入** — 不要手动创建或从静态上下文获取
- **域内调用用 `UseNoAop`** — 避免 AOP 拦截的重复开销
- **跨层调用用 `Use`** — 确保 AuthorityFilter 等安全拦截生效

### 服务设计

```csharp
// ✅ 推荐：构造函数注入
public class OrderService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
}

// ❌ 避免：手动获取 DomainUser
public class OrderService
{
    public async Task DoSomethingAsync()
    {
        var user = SomeStaticContext.GetUser();  // 不推荐
    }
}
```

## 代码生成

### [GenerateController] 适用场景

| 适合 | 不适合 |
|:-----|:-------|
| 标准 CRUD 服务 | 需要精细控制 AOP 拦截顺序 |
| AI 生成的 Service | 需要自定义 GraphQL 类型映射 |
| 快速原型开发 | 已有手写 Controller 的遗留系统 |

### 命名约定

- Service 类名以 `Service` 结尾（如 `TodoService`）
- 方法名以 `Async` 结尾（如 `GetTodosAsync`）
- 方法参数使用 DTO 而非原始类型（复杂场景）

## 安全

### 最小权限

```csharp
// ✅ 推荐：只在需要权限的方法上加
public async Task<List<Todo>> GetPublicTodosAsync() { ... }

[AuthorityFilter(Roles = "Admin")]
public async Task<List<Todo>> GetAllTodosAsync() { ... }
```

### 角色命名

使用统一的标准角色名：`Admin`、`Manager`、`User`、`Guest`

## 事务

```csharp
// ✅ 推荐：在 Service 方法上加 [Transactional]
[Transactional]
public async Task PlaceOrderAsync(OrderInput input)
{
    await UpdateInventoryAsync(input.ProductId, -input.Quantity);
    await Repository.InsertAsync(MapToOrder(input));
}

// ❌ 避免：在 Controller 层管理事务
```

## 测试

### 单元测试

```csharp
[Test]
public async Task CreateTodo_Should_Return_Todo()
{
    var user = new DomainUser<AppUserInfo>(new AppUserInfo
    {
        UserName = "test",
        Roles = new() { "User" }
    });

    var service = user.UseNoAop<TodoService>();
    var result = await service.CreateTodoAsync("Test", "Content");

    Assert.That(result, Is.Not.Null);
    Assert.That(result.Title, Is.EqualTo("Test"));
}
```

## 常见反模式

| 反模式 | 说明 | 正确做法 |
|:-------|:-----|:---------|
| 在 Service 中引用 HttpContext | 领域层耦合 Web | 使用 DomainUser 获取用户信息 |
| 手动 new Service | 绕过 AOP 拦截 | 通过 `User.Use<T>()` 或 DI 获取 |
| 在 Service 中管理事务 | 业务逻辑与事务耦合 | 使用 `[Transactional]` 声明式事务 |
| 暴露 DomainUser 给客户端 | 安全风险 | 只暴露必要的 DTO |

## 性能建议

1. **`UseNoAop` 优先** — 域内调用用 `UseNoAop`，避免 AOP 装饰器开销
2. **批量操作用 `[Transactional]`** — 减少数据库连接往返
3. **按需查询** — GraphQL 客户端使用 Select 表达式只取需要的字段

## 参考

- [配置参考](configuration.md)
- [异常处理](error-handling.md)
- [AOP 管线](../core-concepts/aop-pipeline.md)