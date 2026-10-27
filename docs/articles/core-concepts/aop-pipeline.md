---
title: AOP 管线详解
description: AOP 管线详解：静态拦截原理、自定义 Filter、管线编排
---
# AOP 管线详解

TKWF 的 AOP（面向切面编程）在编译期通过 Source Generator 生成装饰器实现，
零运行时反射，性能与手写代码一致。

---

## 工作原理

### 编译期生成

当标注 `[GenerateController]`（B 路径）或手写 `IAopContract` Controller（A 路径）时，**SG1b** 在编译期生成装饰器类：

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
    private readonly StaticDomainInterceptor _interceptor;
    private readonly DomainUser<AppUserInfo> _user;

    public async Task<Order> CreateAsync(OrderInput input)
    {
        // 装饰器转发给 StaticDomainInterceptor.InterceptAsync——
        // 由拦截器按 PreProceed(Global→Controller→Method) 管线执行
        // AuthorityFilter/Transactional 等特性由拦截器统一判定与调用
        return await _interceptor.InterceptAsync(
            _user, this, nameof(CreateAsync), args, () => _inner.CreateAsync(input));
    }
}
```

> **说明**：装饰器不做内联拦截——`[AuthorityFilter]`/`[Transactional]` 特性由 `StaticDomainInterceptor` 在执行管线中判定并触发（`CanWeGo` → `PreProceedAsync` → proceed → `PostProceedAsync` 逆序）。

### AOP 边界

AOP 拦截只在 **Controller / API 层**生效。`Use<T>()` 根据 T 类型自动路由——
接口走 AOP 管线，具体类走直接构造（域内调用，无拦截）：

```
User.Use<IService>()       → AOP 管线激活 → 装饰器执行（接口路径）
User.Use<MyService>()     → 直接调用 → 无拦截（类路径，域内调用）
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
    // 数据写入经 SG1 生成的 DataService（禁裸 ORM / Repository——框架无此构件）
    await User.Use<AccountDataService>().TransferAsync(fromId, toId, amount);
    // 任一失败，数据库自动回滚
}
```

## 自定义 Filter

自定义横切过滤器继承 `DomainFilterAttribute<TUserInfo>`（基类形态见下方示意；**精确签名与钩子以 [G04 源文档](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G04-AOP拦截器使用指南.md) / `D03` 为准**），在 **FilterBuilder** 中全局注册一次（S→F→O 三级排序）。过滤器在 `StaticDomainInterceptor` 管线中按 Pre/Post 阶段执行：

```csharp
// 示意（非精确签名）：过滤器继承 DomainFilterAttribute<TUserInfo>
// Pre 阶段：CanWeGo → PreProceedAsync；Post 阶段：PostProceedAsync（逆序）
// 状态放 Invocation.Bag（实例字段跨调用污染，见 filters.md 事故 C1）
public class LoggingFilterAttribute<TUserInfo> : DomainFilterAttribute<TUserInfo>
{
    // PreProceedAsync(...)：Bag 记录开始时间
    // PostProceedAsync(...)：读 Bag 计算耗时并输出
}

// 宿主侧：FilterBuilder 全局注册（FilterTier.Security/Function/Operation；AddCoreDefaults 预填 Validate→Authority）
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer, DomainWebOptions>("DomainOptions", options =>
{
    options.Aop.FilterBuilder.AddCoreDefaults();
    options.Aop.FilterBuilder.Add<LoggingFilterAttribute<AppUserInfo>>(FilterTier.Operation);
});
```

> **完整内置过滤器与 Flag+Filter 分离模式** 见 [全局过滤器体系](filters.md)。

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

通过初始化器/`ConfigWebAppDomain` 的 FilterBuilder 配置全局 Filter（见上节"宿主侧"示例）——`AddCoreDefaults()` 预填 `ValidateParameters → Authority`，再按需追加。**不存在独立的 `AopOptions.EnableGlobalFilters/Filters.Add` 配置面**；过滤器统一注册在 FilterBuilder（S→F→O 三级）。

## 在 AI 编码场景中的优势

### 声明式而非命令式

```csharp
// AI 只需要加标注，不需要写拦截逻辑
[AuthorityFilter(Roles = "Admin")]
[Transactional]
public async Task<Order> CreateOrderAsync(OrderInput input)
{
    // AI 只关心业务逻辑（数据写入经 SG1 生成的 DataService）
    var orderSvc = User.Use<OrderDataService>();
    var order = await orderSvc.CreateAsync(input.ToDto());
    await User.Use<InventoryDataService>().DecreaseStockAsync(input.ProductId, input.Quantity);
    return order;
}
```

> **注**：权限声明使用泛型特性 `AuthorityFilterAttribute<TUserInfo>`（不存在非泛型版本）；方法级标注 + 初始化器 `AddGlobalFilter(new AuthorityFilterAttribute<TUserInfo>())` 全局注册，Flag+Filter 分离模式详见 [全局过滤器体系](filters.md)。`Roles`/`Policy` 等属性须以实际特性定义为准（详见 [授权指南](../security/authorization.md)）。

### 编译期验证

SG 在编译期检查 Filter 的正确性，运行时不会因为 Filter 配置错误而崩溃——AI 生成
的代码在编译阶段就能发现问题。

## 参考

- [代码生成管线](code-generation.md)
- [授权指南](../security/authorization.md)
- [最佳实践](../advanced/best-practices.md)