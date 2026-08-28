---
title: SystemActor 系统角色解析（V4.9.9+）
description: 深度理解 SystemActor 系统角色体系，scope.System 作用域 API 与 [DenySystemActor] 安全机制
---

# SystemActor 系统角色解析（V4.9.9+）

> TKWF.Domain V4.9.9 引入 SystemActor 机制，解决"无人类用户操作"的领域自治难题。本文深度解析 SystemActor 架构、API、安全机制与最佳实践。

---

## 为什么需要 SystemActor

### 核心困境

TKWF.Domain 以 `DomainUser` 非空执行流为核心架构守卫。`EnsureNotNull` 保证领域服务始终有合法的执行者上下文。但现实中存在大量"无人类用户"的操作场景：

| 场景 | 特征 | 原有痛点 |
|:--|:--|:--|
| OAuth 回调 | 交换 token 时无人类用户 | `NoSessionManager` 抛异常，领域层中断 |
| 后台 Job | Hangfire/Quartz 定时任务 | 无 HttpContext，`DomainUser` 无法解析 |
| MQ 消费 | 消息队列消费者处理消息 | 无用户会话，领域服务不可用 |
| 健康检查 | 探针探测服务存活 | 无需审计，但框架强制要求用户 |
| 定时同步 | 数据同步任务 | 无用户身份，领域服务不可用 |

### 方案对比：为什么选择 SystemActor

| 维度 | 方案 A：SystemActor（非空上下文+系统身份） | 方案 B：可空上下文 |
|:--|:--|:--|
| `EnsureNotNull` 守卫 | 保留 | **拆除**，全链路 null-check 回归 |
| `DomainUser` 构造 | 不变 | 改为可空，链式波及所有领域服务 |
| AOP 拦截器 | 不变 | 需处理 null User 场景 |
| 审计模块 | 新增可选接口 | 全链路改造为条件写入 |
| 破坏性变更 | 无（新增类/接口/方法） | 高（改造核心契约） |
| 业界对照 | Spring `AnonymousAuthenticationToken`、ABP `ICurrentUser` Null-Object | 无对应先例 |

**结论**：TKWF 选择方案 A。`EnsureNotNull` 是框架核心价值，SystemActor 建模为"系统身份"而非"无身份"，符合业界标准（Spring `AnonymousAuthenticationToken`、ABP `ICurrentUser` Null-Object、OAuth2 Client Credentials）。

---

## 核心架构

### 三条正交执行路径

| 场景 | 入口 | 身份 | 审计 | 会话 | 适用 |
|:--|:--|:--|:--|:--|:--|
| Web 无 sessionKey → 游客降级 | `GetOrRestoreUserAsync` → `CreateGuestUserAsync` | 游客（未认证） | 写游客 UserName | 正常持久化 | 匿名浏览 |
| 后台任务/Job/健康检查 | `CreateSessionScopeAsync(null)` + `[NoAuditFlag]` | 已有会话或无身份 | 跳过审计 | 按需持久化 | 纯查询/定时同步 |
| 系统操作（OAuth 回调/系统服务） | `BeginSystemScopeAsync()` | SystemUser（已认证,Roles=["系统"]） | 写 ActorType/ActorId | 瞬态空会话 | 代码交换 token、后台管理操作 |

---

## 核心 API

### 1. SystemUser —— 系统身份实体

```csharp
public class SystemUser<TUserInfo> : DomainUser<TUserInfo>
{
    public SystemUser() : base(CreateSystemUserInfoAsync().GetAwaiter().GetResult())
    {
        // 预设系统身份
        IsAuthenticated = true;           // AuthorityFilter 认证通过
        Roles = new[] { "系统" };          // 仅系统角色
        SessionKey = $"system_{Guid.NewGuid():N}";
    }
}
```

**关键属性**：
- `IsAuthenticated = true` —— AuthorityFilter 认证通过
- `Roles = ["系统"]` —— 仅系统角色，无人类角色（Admin/User 等）
- `SessionKey = "system_{guid}"` —— 瞬态会话标识
- `UserIdString = "system"` —— 字符串主键，避免与数字主键冲突
- `LoginFrom = EnumLoginFrom.System = 100` —— 高位区隔，避免与人类登录方式冲突

---

## 核心 API

### 1. SystemUser —— 系统身份实体

```csharp
public class SystemUser<TUserInfo> : DomainUser<TUserInfo>
{
    public SystemUser() : base(CreateSystemUserInfoAsync().GetAwaiter().GetResult())
    {
        // 预设系统身份
        IsAuthenticated = true;           // AuthorityFilter 认证通过
        Roles = new[] { "系统" };          // 仅系统角色
        SessionKey = $"system_{Guid.NewGuid():N}";
    }
}
```

**关键属性**：
- `IsAuthenticated = true` —— AuthorityFilter 认证通过
- `Roles = ["系统"]` —— 仅系统角色，无人类角色（Admin/User 等）
- `SessionKey = "system_{guid}"` —— 瞬态会话标识
- `UserIdString = "system"` —— 字符串主键，避免与数字主键冲突
- `LoginFrom = EnumLoginFrom.System = 100` —— 高位区隔，避免与人类登录方式冲突

---

## 核心 API

### 1. SystemUser —— 系统身份实体

```csharp
public class SystemUser<TUserInfo> : DomainUser<TUserInfo>
{
    public SystemUser() : base(CreateSystemUserInfoAsync().GetAwaiter().GetResult())
    {
        // 预设系统身份
        IsAuthenticated = true;           // AuthorityFilter 认证通过
        Roles = new[] { "系统" };          // 仅系统角色
        SessionKey = $"system_{Guid.NewGuid():N}";
    }
}
```

**关键属性**：
- `IsAuthenticated = true` —— AuthorityFilter 认证通过
- `Roles = ["系统"]` —— 仅系统角色，无人类角色（Admin/User 等）
- `SessionKey = "system_{guid}"` —— 瞬态会话标识
- `UserIdString = "system"` —— 字符串主键，避免与数字主键冲突
- `LoginFrom = EnumLoginFrom.System = 100` —— 高位区隔，避免与人类登录方式冲突

---

## 核心 API

### 1. SystemUser —— 系统身份实体

```csharp
public class SystemUser<TUserInfo> : DomainUser<TUserInfo>
{
    public SystemUser() : base(CreateSystemUserInfoAsync().GetAwaiter().GetResult())
    {
        // 预设系统身份
        IsAuthenticated = true;           // AuthorityFilter 认证通过
        Roles = new[] { "系统" };          // 仅系统角色
        SessionKey = $"system_{Guid.NewGuid():N}";
    }
}
```

**关键属性**：
- `IsAuthenticated = true` —— AuthorityFilter 认证通过
- `Roles = ["系统"]` —— 仅系统角色，无人类角色（Admin/User 等）
- `SessionKey = "system_{guid}"` —— 瞬态会话标识
- `UserIdString = "system"` —— 字符串主键，避免与数字主键冲突
- `LoginFrom = EnumLoginFrom.System = 100` —— 高位区隔，避免与人类登录方式冲突

---

## 核心 API

### 1. SystemUser —— 系统身份实体

```csharp
public class SystemUser<TUserInfo> : DomainUser<TUserInfo>
{
    public SystemUser() : base(CreateSystemUserInfoAsync().GetAwaiter().GetResult())
    {
        // 预设系统身份
        IsAuthenticated = true;           // AuthorityFilter 认证通过
        Roles = new[] { "系统" };          // 仅系统角色
        SessionKey = $"system_{Guid.NewGuid():N}";
    }
}
```

**关键属性**：
- `IsAuthenticated = true` —— AuthorityFilter 认证通过
- `Roles = ["系统"]` —— 仅系统角色，无人类角色（Admin/User 等）
- `SessionKey = "system_{guid}"` —— 瞬态会话标识
- `UserIdString = "system"` —— 字符串主键，避免与数字主键冲突
- `LoginFrom = EnumLoginFrom.System = 100` —— 高位区隔，避免与人类登录方式冲突

---

## 核心 API

### 1. SystemUser —— 系统身份实体

```csharp
public class SystemUser<TUserInfo> : DomainUser<TUserInfo>
{
    public SystemUser() : base(CreateSystemUserInfoAsync().GetAwaiter().GetResult())
    {
        // 预设系统身份
        IsAuthenticated = true;           // AuthorityFilter 认证通过
        Roles = new[] { "系统" };          // 仅系统角色
        SessionKey = $"system_{Guid.NewGuid():N}";
    }
}
```

**关键属性**：
- `IsAuthenticated = true` —— AuthorityFilter 认证通过
- `Roles = ["系统"]` —— 仅系统角色，无人类角色（Admin/User 等）
- `SessionKey = "system_{guid}"` —— 瞬态会话标识
- `UserIdString = "system"` —— 字符串主键，避免与数字主键冲突
- `LoginFrom = EnumLoginFrom.System = 100` —— 高位区隔，避免与人类登录方式冲突
