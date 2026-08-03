---
title: 认证
description: 认证：Challenge-Response 登录、AuthController 接口、安全注册与登录流程
---
# 认证

TKWF 使用 **Challenge-Response** 认证协议，在不传输密码明文的前提下验证用户身份。

---

## Challenge-Response 流程

```
客户端                          服务器
  │                               │
  │  1. 请求 Challenge            │
  │─────────────────────────────→ │
  │                               │
  │  2. 返回 Challenge (随机数)   │
  │←───────────────────────────── │
  │                               │
  │  3. 提交 Response (Hash(密码 + Challenge)) │
  │─────────────────────────────→ │
  │                               │
  │  4. 验证通过 → 返回 Session   │
  │←───────────────────────────── │
```

### 安全特性

- **密码永不着地** — 网络传输的只有 Hash 结果，不包含密码原文
- **防重放攻击** — 每次 Challenge 不同，即使截获也无法重放
- **防中间人** — 服务器验证 Hash 时结合 Challenge 和服务器端存储的密码哈希

## 配置认证

```csharp
// Program.cs
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(options =>
{
    options.Authentication.ChallengeExpiration = TimeSpan.FromMinutes(5);
    options.Authentication.SessionExpiration = TimeSpan.FromHours(8);
});
```

## 客户端调用

### 获取 Challenge

```csharp
var challenge = await authClient.GetChallengeAsync("username");
// 返回: { Challenge: "abc123...", Salt: "xyz..." }
```

### 提交 Response

```csharp
var response = ComputeHash(password + challenge.Salt + challenge.Challenge);
var session = await authClient.AuthenticateAsync("username", response);
// 返回: { SessionId: "ses_...", Token: "eyJ..." }
```

## 自定义认证

实现 `IAuthenticationHandler<TUserInfo>` 接口自定义认证逻辑：

```csharp
public class CustomAuthHandler : IAuthenticationHandler<AppUserInfo>
{
    public async Task<AuthenticationResult> AuthenticateAsync(
        string username, byte[] response, ChallengeContext context)
    {
        // 验证 Response
        // 返回 AuthenticationResult（成功/失败 + 用户信息）
    }
}
```

## 参考

- [授权](authorization.md)
- [Session 管理](session.md)
- [DomainUser 详解](../core-concepts/domain-user.md)