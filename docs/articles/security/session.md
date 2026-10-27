---
title: Session 管理
description: Session 管理：会话生命周期、LoginAsAsync/Logout 操作、用户信息获取
---
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

## 服务端会话管理器（ISessionManager）

> **口径校准**：服务端会话存储/管理器是 `ISessionManager`（Local / Web / Stateless / No / Test 等实现），**不是** `ISessionStore`——`ISessionStore` 是客户端 SessionKey 存储，见下节。

Web 宿主默认注册 `WebSessionManager`（`UseWebSession()` 自动装配），基于 **HybridCache**（内存 L1 + 分布式二级缓存）管理会话生命周期，而非简单的进程内内存字典；`SessionOptions.Expiration` 作为 HybridCache 条目的有效期写入（README V4.10.35 对齐）。

会话 JSON 多态读路径走 `SessionJsonTypeRegistry` **编译期闭集**（`[SessionUserType]` 标记 + SG 生成注册），**无反射回退**——未注册的 `$type` 一律硬失败（V4.10.43/47）。

自定义服务端会话实现：替换 `ISessionManager` / `ISessionManager<TUserInfo>`（具体实现清单与注册方式以源码为准）。

### 客户端 SessionKey 存储（ISessionStore）

`ISessionStore`（`TKW.Framework.Session`）是**客户端侧** SessionKey 持久化存储抽象，与 ts-domain-client 的 `Storage` 接口对称，仅读写 SessionKey，**不存储服务端会话数据**：

```csharp
public class LocalSessionStore : ISessionStore
{
    public string? GetSessionKey() => /* 从 localStorage 等读取 SessionKey */;

    public void SetSessionKey(string? sessionKey) => /* 保存或清除（传 null 清除） */;
}
```

> 同步接口设计（`DomainClientUser` 构造为同步、Blazor WASM 单线程下 `IJSRuntime` 实质同步）；异步场景使用 `ISessionStorage`（`TKW.Framework.Domain.Session`）。服务端会话数据请勿写入此存储。

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