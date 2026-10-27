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

三种进入领域的方式**互斥，嵌套禁止**：

| 场景 | 入口 | 身份 | 审计 | 会话 | 适用 |
|:--|:--|:--|:--|:--|:--|
| Web 无 sessionKey → 游客降级 | `HttpAuthenticationMiddleware` → `BeginSessionScopeAsync` | 游客（未认证） | 写游客 UserName | 正常持久化 | 匿名浏览 |
| 后台任务/Job/健康检查 | `DomainHost.CreateSessionScopeAsync(sessionKey?)` | 已有会话或无身份 | 跳过审计（`[NoAuditFlag]`） | 按需持久化 | 纯查询/定时同步 |
| 系统操作（OAuth 回调/系统服务） | `DomainHost.BeginSystemScopeAsync(externalSp?)` | SystemUser（已认证, Roles=["系统"]） | 写 ActorType/ActorId | **瞬态空会话（不持久化）** | 代码交换 token、后台管理操作 |

---

## 核心 API

### 1. SystemUser —— 系统身份实体

```csharp
// 示意形态（真实 API 以 D11 / DomainHost 源码为准）
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
- `SessionKey = "system_{guid}"` —— **瞬态**会话标识：不持久化，**永不进 HTTP 认证通道**
- `UserIdString = "system"` —— 字符串主键，避免与数字主键冲突
- `LoginFrom = EnumLoginFrom.System = 100` —— 高位区隔，避免与人类登录方式冲突

### 2. BeginSystemScopeAsync —— 系统作用域入口

```csharp
// 无人操作时进入系统作用域（无回调重载，返回作用域对象）
await using var sysScope = await domainHost.BeginSystemScopeAsync(sp);

// 系统作用域内：scope.User 即 SystemUser
await sysScope.User.Use<IXxxService>().SomeMethodAsync(...);
```

**系统作用域三铁律**（代码实读，务必遵守）：

| # | 铁律 | 说明 |
|:--|:--|:--|
| 1 | **SessionKey 不持久化** | `system_{guid}` 瞬态，永不进 HTTP 认证通道 |
| 2 | **Human→System 嵌套抛异常** | 人类会话内再开系统作用域 → 抛（防静默提权）；System 内可再开子作用域？→ 以 D11 为准（**嵌套禁止**） |
| 3 | **`[DenySystemActor]` 显式禁止** | 敏感方法标注后，SystemActor 调用被拒绝 |

### 3. [DenySystemActor] —— 敏感方法防护

```csharp
[DenySystemActor]   // SystemActor 调用此方法 → 拒绝
public async Task<Secret> GetSecretAsync() { ... }
```

用于显式禁止"无人操作"路径触碰敏感能力（如凭据读取、提权操作、人工审核决策）。框架对无标记方法不做隐式限制——敏感面由开发者显式声明。

---

## 会话与身份

| 关注点 | 事实 |
|:--|:--|
| `DomainUser` 是否进 DI | **永不**。经 `DomainUserContext.CurrentAopUser`（AsyncLocal）在 `Use<T>()` 帧内传递 |
| 会话存哪 | `ISessionManager`（Local/Web/Stateless/No/Test 等实现）；JSON 多态读路径走 `SessionJsonTypeRegistry` **编译期闭集**，无反射回退（v4.10.43/44/47） |
| SystemActor 会话 | `SessionKey = "system_{guid}"`，瞬态，不持久化，不参与 HTTP 认证 |
| 未就绪封锁 | `Setup` 未完成 → `SystemSetupRequiredException`（**设计内**封锁路径，不是事故） |
| 执行者审计 | `IEntityActorAuditable` + `ISystemActorService`——后台 Job / OAuth 回调 / AI Agent 调用均有可审计系统身份 |

---

## 最佳实践

1. **只对无人场景用 SystemActor**——有人类用户就该走正常登录/会话；SystemActor 是"系统身份"不是"匿名通道"
2. **敏感方法显式 `[DenySystemActor]`**——不做隐式依赖；框架不猜你的意图
3. **后台任务用 `CreateSessionScopeAsync` + `[NoAuditFlag]`**——不要用 SystemActor 代替"已有身份"的作业会话
4. **System 作用域内跨租户执行用 `ExecuteInTenantAsync`/`ExecuteWithoutTenantAsync`**（仅 System 作用域合法）——见 [多租户](multi-tenancy.md)
5. **不要手动 `new SystemUser` 绕过作用域**——标准路径是 `BeginSystemScopeAsync`（创建路径与守卫绑定）

---

## 进一步阅读

- [为什么领域自治](./why-domain-autonomy.md) — DomainUser + Use&lt;T&gt;() 设计原理
- [多租户](multi-tenancy.md) — SystemActor 内租户作用域（ExecuteIn/WithoutTenant）
- [认证与授权](../security/authentication.md) — Challenge-Response + AuthorityFilter
- [后台作业](background-jobs.md) — `CreateSessionScopeAsync` 作业会话