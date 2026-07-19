# 授权

TKWF 通过 `[AuthorityFilter]` 提供声明式方法级授权，支持 Role-based 和 Policy-based 两种模式。

---

## AuthorityFilter

### 基本用法

```csharp
[AuthorityFilter(Roles = "Admin")]
public async Task<Report> GenerateReportAsync() { ... }
```

当用户不包含 `Admin` 角色时，调用将抛出 `UnauthorizedAccessException`。

### 多角色（OR 逻辑）

```csharp
// 满足任一角色即可
[AuthorityFilter(Roles = "Admin,Manager")]
public async Task ApproveAsync(long id) { ... }
```

### 策略模式

```csharp
[AuthorityFilter(Policy = "OrderApproval")]
public async Task ApproveOrderAsync(long orderId) { ... }
```

## 自定义策略

实现 `IAuthorizationPolicy` 接口：

```csharp
public class OrderApprovalPolicy : IAuthorizationPolicy
{
    public async Task<bool> AuthorizeAsync(AuthorizationContext context)
    {
        var user = context.User;
        // 管理员直接通过
        if (user.Roles.Contains("Admin")) return true;

        // 普通用户需要检查权限
        return user.Roles.Contains("OrderApprover");
    }
}
```

注册自定义策略：

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(options =>
{
    options.Authorization.Policies.Add("OrderApproval",
        new OrderApprovalPolicy());
});
```

## 在 Controller 中使用

```csharp
// 路径 A：契约先行
public class AuthController<TUserInfo> : ControllerBase<TUserInfo>
    where TUserInfo : IUserInfo
{
    [AuthorityFilter(Roles = "Admin")]
    public async Task<DashboardData> GetDashboardAsync()
    {
        // 只有 Admin 可以访问
    }
}

// 路径 B：标注驱动
[GenerateController]
public class AdminService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    [AuthorityFilter(Roles = "Admin")]
    public async Task<Log> GetSystemLogAsync() { ... }
}
```

## 最佳实践

1. **最小权限原则** — 默认不加 `[AuthorityFilter]`，只在需要权限的方法上加
2. **角色命名规范** — 统一使用 `Admin`、`Manager`、`User`、`Guest` 等标准角色名
3. **策略复用** — 多个方法共享相同权限逻辑时，使用 Policy 模式而非重复写 Roles
4. **测试覆盖** — 为每个策略编写单元测试

## 参考

- [认证](authentication.md)
- [AOP 管线](../core-concepts/aop-pipeline.md)
- [最佳实践](../advanced/best-practices.md)