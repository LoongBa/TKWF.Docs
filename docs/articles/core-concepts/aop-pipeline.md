# AOP 管线详解

TKWF 的 AOP（面向切面编程）在编译期通过 Source Generator 生成装饰器实现，
零运行时反射，性能与手写代码一致。

---

## 工作原理

### 编译期生成

当标注 `[GenerateController]` 或实现 `IAopContract` 时，SG#4 在编译期
生成装饰器类：

```csharp
// 源码：Service 定义
[GenerateController]
public class OrderService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    [AuthorityFilter(Roles = "Admin")]
    public async Task<Order> CreateAsync(OrderInput input) { ... }
}

// 编译期生成：装饰器（伪代码）
public class OrderServiceDecorator : IOrderServiceController
{
    private readonly OrderService _inner;

    public async Task<Order> CreateAsync(OrderInput input)
    {
        // 1. 权限检查
        await AuthorityFilterAttribute.ExecuteAsync(...);

        // 2. 调用真实方法
        return await _inner.CreateAsync(input);
    }
}
```

### AOP 边界

AOP 拦截只在 **Controller / API 层**生效，域内调用（`UseNoAop`）跳过拦截：

```
User.Use<IService>()     → AOP 管线激活 → 装饰器执行
User.UseNoAop<TService>() → 直接调用 → 无拦截
```

## 内置 Filter

### [AuthorityFilter]

方法级权限控制：

```csharp
// 基于角色
[AuthorityFilter(Roles = "Admin")]
public async Task<Report> GenerateReportAsync() { ... }

// 基于策略
[AuthorityFilter(Policy = "MustBeManager")]
public async Task ApproveAsync(long id) { ... }
```

### [Transactional]

包裹多步写入操作，异常时自动回滚：

```csharp
[Transactional]
public async Task TransferAsync(long fromId, long toId, decimal amount)
{
    await Repository.UpdateAsync(new Account(fromId) { Balance -= amount });
    await Repository.UpdateAsync(new Account(toId) { Balance += amount });
    // 任一失败，数据库自动回滚
}
```

## 自定义 Filter

实现 `IAopFilter` 接口创建自定义拦截器：

```csharp
public class LoggingFilter : IAopFilter
{
    public async Task ExecuteAsync(AopContext context, Func<Task> next)
    {
        var sw = Stopwatch.StartNew();
        Console.WriteLine($"[AOP] Enter: {context.Method.Name}");

        try
        {
            await next();
        }
        finally
        {
            sw.Stop();
            Console.WriteLine($"[AOP] Exit: {context.Method.Name} ({sw.ElapsedMilliseconds}ms)");
        }
    }
}
```

### Filter 执行顺序

```
[AuthorityFilter]         ← 最先执行（安全检查优先）
    ↓
[Transactional]          ← 事务包裹
    ↓
[LoggingFilter]          ← 日志
    ↓
真实方法                  ← 最后执行
```

## Filter 配置

通过 `AopOptions` 配置全局 Filter：

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(options =>
{
    options.Aop.EnableGlobalFilters = true;
    options.Aop.Filters.Add(new LoggingFilter());
});
```

## 在 AI 编码场景中的优势

### 声明式而非命令式

```csharp
// AI 只需要加标注，不需要写拦截逻辑
[AuthorityFilter(Roles = "Admin")]
[Transactional]
public async Task<Order> CreateOrderAsync(OrderInput input)
{
    // AI 只关心业务逻辑
    var order = MapToOrder(input);
    await UpdateInventoryAsync(input.ProductId, input.Quantity);
    return await Repository.InsertAsync(order);
}
```

### 编译期验证

SG 在编译期检查 Filter 的正确性，运行时不会因为 Filter 配置错误而崩溃——AI 生成
的代码在编译阶段就能发现问题。

## 参考

- [代码生成管线](code-generation.md)
- [授权指南](../security/authorization.md)
- [最佳实践](../advanced/best-practices.md)