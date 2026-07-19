# Session 管理

TKWF 通过 Session 中间件管理用户会话，自动将认证后的用户绑定到 `DomainUser`。

---

## Session 中间件

```csharp
// Program.cs
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>()
    .UseWebSession()  // ← 启用 Session 中间件
    .Build();
```

启用后，中间件自动：

1. 从 HTTP 请求中提取 Token（Header / Cookie）
2. 验证 Token 有效性
3. 创建 `DomainUser<TUserInfo>` 并绑定到请求上下文
4. 请求结束时清理

## Token 传输方式

### Header 模式

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Cookie 模式

```http
Cookie: tkws_session=eyJhbGciOiJIUzI1NiIs...
```

配置方式：

```csharp
options.Session.TokenSource = TokenSource.BearerHeader;  // Header 模式
// 或
options.Session.TokenSource = TokenSource.Cookie;         // Cookie 模式
```

## Session 配置

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(options =>
{
    options.Session = new SessionOptions
    {
        Expiration = TimeSpan.FromHours(8),       // Session 有效期
        RefreshOnActivity = true,                  // 活跃时自动续期
        SlidingExpiration = TimeSpan.FromHours(1), // 滑动过期窗口
        TokenSource = TokenSource.BearerHeader,    // Token 来源
    };
});
```

## 自定义 Session 存储

默认 Session 存储在内存中。实现 `ISessionStore<TUserInfo>` 使用自定义存储：

```csharp
public class RedisSessionStore : ISessionStore<AppUserInfo>
{
    public async Task<Session<AppUserInfo>?> GetAsync(string sessionId)
    {
        // 从 Redis 获取 Session
    }

    public async Task SaveAsync(Session<AppUserInfo> session)
    {
        // 保存到 Redis
    }

    public async Task RemoveAsync(string sessionId)
    {
        // 从 Redis 删除
    }
}
```

注册：

```csharp
options.Session.Store = new RedisSessionStore(redisConnection);
```

## Session 状态

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  未认证      │ ──→ │  已认证       │ ──→ │  Session 过期  │
│  (Anonymous) │     │  (Authenticated) │     │  (Expired)     │
└─────────────┘     └──────────────┘     └───────────────┘
       │                    │                      │
       │ 登录               │ 访问受保护资源        │ 重新认证
       └────────────────────┘                      │
                                                    │
       ┌──────────────┐                             │
       │  注销         │ ←─────────────────────────┘
       │  (LoggedOut)  │
       └──────────────┘
```

## 参考

- [认证](authentication.md)
- [授权](authorization.md)
- [Web 集成](../integration/web.md)