---
title: 30 分钟实战：认证授权
description: 30 分钟实战教程：为 Todo 应用添加 Challenge-Response 登录与 AuthorityFilter 角色授权
---
# 30 分钟实战：认证授权

> 源文档：[D02](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D02-%E5%A4%9A%E5%BD%A2%E6%80%81%E5%AE%A2%E6%88%B7%E7%AB%AF%E8%AE%A4%E8%AF%81%E6%9E%B6%E6%9E%84.md) · [G04](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G04-AOP%E6%8B%A6%E6%88%AA%E5%99%A8%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · V4.9.25

---

## 本节目标

在 Part 1 的 Todo 应用基础上，添加 Challenge-Response 密码登录和 AuthorityFilter 角色授权——15 分钟完成。

---

## Step 1：定义 User 实体（3 分钟）

TKWF 的用户实体必须实现 `IUserInfo`，框架通过 `DomainUser<TUserInfo>` 管理认证上下文。

```csharp
using TKW.Framework.Domain.Entities;
using TKW.Framework.Domain.Authentication;
using TKW.Framework.Enumerations;

public class DmpUserInfo : IUserInfo
{
    // IUserInfo 必含成员（见 _Framework/Core/IUserInfo.cs）
    public string UserIdString { get; set; } = "";
    public string UserName { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public EnumLoginFrom LoginFrom { get; set; }
    public List<string>? Roles { get; set; }

    // 认证附加字段（Challenge-Response 用）
    public long Id { get; set; }
    public string? SaltHex { get; set; }        // 盐值（十六进制）
    public string? StoredBlob { get; set; }      // 加密凭据
}
```

---

## Step 2：实现 UserHelper 钩子（5 分钟）

`DomainUserHelperBase<TUserInfo>` 是所有认证形态共享的钩子体系。业务层只需 override 所需的认证方式：

```csharp
using TKW.Framework.Domain.Authentication;

public class DmpUserHelper : DomainUserHelperBase<DmpUserInfo>
{
    // 数据访问红线：禁裸 IEntityDAC 直用——必须经 SG1 DataService（user.Use<T>() 帧内）
    // （DataService 名/读 API 以 xCodeGen 生成产物为准）
    // Challenge-Response 登录：查询盐值
    protected override async Task<byte[]?> GetSaltAsync(
        DomainUser<DmpUserInfo> user, string userName)
    {
        var entity = (await user.Use<DmpUserInfoDataService>()
            .SelectAsync(u => u.UserName == userName)).FirstOrDefault();
        if (entity?.SaltHex is not { Length: > 0 }) return null;
        try { return Convert.FromHexString(entity.SaltHex); }
        catch (FormatException) { return null; }
    }

    // Challenge-Response 登录：查询加密凭据
    protected override async Task<string?> GetStoredBlobAsync(
        DomainUser<DmpUserInfo> user, string userName)
    {
        var entity = (await user.Use<DmpUserInfoDataService>()
            .SelectAsync(u => u.UserName == userName)).FirstOrDefault();
        return entity?.StoredBlob;
    }

    // 用户注册：存储加密凭据（真实签名：user, userName, credentialHex, saltHex）
    protected override async Task OnUserRegisterAsync(
        DomainUser<DmpUserInfo> user, string userName,
        string credentialHex, string saltHex)
    {
        var dto = new DmpUserInfoDto
        {
            UserName = userName,
            SaltHex = saltHex,
            // ProtectClientHash 是本 Helper 自身 protected 成员（非 DomainUser 成员）
            StoredBlob = ProtectClientHash(Convert.FromHexString(credentialHex))
        };  // （Dto 构造以生成的 DmpUserInfoDto.g.cs 为准）
        await user.Use<DmpUserInfoDataService>().CreateAsync(dto);
    }
}
```

**V4.9.25 安全设计**：`GetSaltAsync` / `GetStoredBlobAsync` 使用 `protected internal virtual` 签名（含 `DomainUser<TUserInfo> user` 参数），业务直接 override，通过 `user.Use<T>()` 走框架统一服务解析入口——消除静态访问和反射绕开 `Use<T>()` 的问题。

---

## Step 3：注册认证服务（2 分钟）

```csharp
// Program.cs
var app = builder.ConfigWebAppDomain<DmpUserInfo, MyDomainInitializer, DomainWebOptions>(
        "DomainOptions", cfg =>
        {
            cfg.UseWebExceptionMiddleware = true;
            cfg.UseFreeSqlEntityDAC();
        })
    .RegisterServices((services, cfg) =>
    {
        // UserHelper 不在此注册——由初始化器 InitializeDiContainer(...) 的返回值注册
        // （无 IDomainUserHelper 接口，勿手动 AddSingleton）
    })
    .Build(...);
```

---

## Step 4：添加 AuthorityFilter（3 分钟）

AuthorityFilter 是 AOP 权限过滤器，检查用户是否已认证、是否具备所需角色。

```csharp
// 全局注册（对所有控制器生效）——在领域初始化器内调用
// （AddGlobalFilter 是初始化器实例方法，非 IServiceCollection 扩展）
AddGlobalFilter(new AuthorityFilterAttribute<DmpUserInfo>());

// 或标注在控制器/方法上（泛型标注 + 构造把 DomainUser 传给基类）
[AuthorityFilter<DmpUserInfo>]
public class TodoController : DomainControllerBase<DmpUserInfo>
{
    public TodoController(DomainUser<DmpUserInfo> user) : base(user) { }

    // 所有方法都需要认证

    [AllowAnonymousFlag]  // 跳过权限检查
    public async Task PingAsync() => await Task.CompletedTask;

    [RequireRoleFlag("Admin", Match = MultiRoleMatch.Any)]  // 需要 Admin 角色
    public async Task DeleteAllAsync() { /* ... */ }
}
```

**角色标记**：

| 标记 | 效果 |
|:--|:--|
| `[AllowAnonymousFlag]` | 跳过认证检查 |
| `[RequireRoleFlag("Admin")]` | 需要 Admin 角色 |
| `[RequireRoleFlag("Admin", "Manager", Match = MultiRoleMatch.All)]` | 需要全部角色 |
| `[RequireRoleFlag("Admin", "Manager", Match = MultiRoleMatch.Any)]` | 任一角色即可 |

**错误处理**：
- 未认证 → `AuthenticationException` → HTTP 401
- 已认证但无权限 → `UnauthorizedAccessException` → HTTP 403

---

## Step 5：验证（2 分钟）

```bash
# 1. 启动应用
dotnet run

# 2. Challenge-Response 登录
curl -X POST https://localhost:5001/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"userName": "admin", "clientHash": "xxx"}'

# 3. 带 Token 访问受保护接口
curl https://localhost:5001/api/todo \
  -H "Authorization: Bearer <token>"

# 4. 无权限访问（预期 403）
curl https://localhost:5001/api/todo/delete-all \
  -H "Authorization: Bearer <viewer-token>"
```

---

## 进一步阅读

- [多形态客户端认证架构](../security/authentication.md) — 三种认证形态详解
- [AOP 拦截器使用指南](../core-concepts/filters.md) — AuthorityFilter / LoggingFilter / EntityHistoryFilter
- [30 分钟实战 Part 3：多协议暴露](./30-min-todo-part3.md) — GraphQL/REST/RPC 三协议暴露 + 客户端
