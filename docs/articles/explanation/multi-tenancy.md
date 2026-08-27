---
title: 多租户
description: TKWF 多租户架构详解：加字段（共享库行级隔离）与分库（Database-per-Tenant）双模式、租户识别与授权、跨租户作用域
---
# 多租户

TKWF 提供完整的**多租户（Multi-Tenant）SaaS 架构**支持，通过"加字段"与"分库"双模式实现租户间数据隔离，并内置租户识别、授权校验、跨租户作用域等安全机制。

> 本文面向架构与集成。设计方案见源文档 [D13](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D13-%E5%A4%9A%E7%A7%9F%E6%88%B7%EF%BC%9A%E5%8A%A0%E5%AD%97%E6%AE%B5%E4%B8%8E%E5%88%86%E5%BA%93%E5%8F%8C%E6%A8%A1%E5%BC%8F%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md)，实操见 [G13 使用指南](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G13-%E5%A4%9A%E7%A7%9F%E6%88%B7%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md)。

---

## 核心问题

多租户 SaaS 架构需解决三个核心问题：

| 问题 | 影响 | 方案 |
|------|------|------|
| **租户识别** | 系统如何知道当前请求属于哪个租户 | `ITenantContext` + `IContextExtractor` + `IAmbientContext` |
| **数据隔离** | 租户间数据如何隔离 | 双模式：加字段（行级）/ 分库（数据库级） |
| **租户授权** | 已认证用户是否被允许访问该租户 | `ITenantAuthorization` + 框架级授权门 |

## 双模式隔离

| 模式 | 隔离级别 | 适用场景 | 启用方式 |
|------|---------|---------|---------|
| **加字段**（共享库） | 行级（`TenantId` 列） | 租户量大但单租户数据量小、单库运维 | 注册 `TenantGlobalQueryFilter` + 写路径自动赋值 |
| **分库**（Database-per-Tenant） | 数据库级 | 租户数据量大、隔离要求高 | `cfg.UseTenantDatabaseIsolation()` |
| **混合** | 数据库 + 行级 | 平台表（共享库）+ 租户表（租户库） | 两者都启用 |

两种模式都是框架的一等公民，通过"注册行为"选型，且**可正交组合**（`IEntityTenant` 声明"此表按租户行级隔离"，与"表在哪个库"无关）。

## 租户识别与授权

### 提取链路

```
HTTP 请求
  → ContextExtractionMiddleware 阶段 1：提取器（TenantIdContextExtractor + 其他）
  → 框架级授权门：含 TenantId 键 → ITenantAuthorization.IsAllowed → 不通过抛异常
  → IAmbientContext.Set(TenantContextKeys.TenantId, tenantId)
  → ContextExtractionMiddleware 阶段 2：会话解析
  → Scoped ITenantContext / IFreeSql / DbContext 按租户解析
```

### `ITenantContext`

```csharp
public interface ITenantContext
{
    long? TenantId { get; }           // 当前请求租户；未识别/无租户（SystemActor/后台）为 null
    bool IsTenantResolved { get; }    // 是否已显式解析（区分"确无租户"与"未配置"）
}
```

### 内置提取器 `TenantIdContextExtractor`

来源优先级（权威降序）：**登录态（`AuthInfo`，最权威不可覆盖）→ 路径段（`{tenantId}`）→ 查询参数 → 请求头 `X-Tenant-Id`（最弱，仅作降级来源）**。

### 授权校验 `ITenantAuthorization`

- 识别回答"请求声称哪个租户"；**授权**回答"该已认证用户是否被允许访问该租户"。
- 默认实现 `AllowAuthenticatedToOwnTenantAuthorization`：从 `AuthInfo` 解析当前登录租户（单租户保守默认），校验提取到的租户 == 登录租户。
- 多租户用户 → 业务替换实现（查询用户-租户关联表）。
- SystemActor：恒返回 true。

> **双层授权门**：内置提取器内校验一次 + `ContextExtractionMiddleware` 框架级门再校验一次，确保自定义提取器也无法绕过。

## 租户确定场景：身份租户（A）与目标租户（B）

多租户机制不仅回答"数据如何隔离"，还须回答"租户 ID 从何确定"。两种场景都是一等公民：

| | **场景 A：身份租户** | **场景 B：目标租户** |
|---|---|---|
| **语义** | 登录后租户固定，租户是**用户身份属性** | 租户是**请求目标属性**，每请求可能指向不同租户 |
| **典型例子** | 企业 SaaS：员工登录后归属固定租户 | 前端用户访问不同商户页面，按目标切换 |
| **登录态承载** | 单一租户 ID（`ITenantScopedUser`） | 可访问租户集合（用户-租户关联表） |
| **授权实现** | 默认实现开箱即用 | 必须替换 `ITenantAuthorization`（查关联表） |
| **跨租户操作** | 少用 | 常用（SystemActor `ExecuteInTenantAsync`） |

> **设计不变量**：租户确定之后的下游行为（读过滤 / 写赋值 / 连接串解析 / 更新校验）**不区分 A/B**——两场景仅在"提取来源 + 授权实现"两处分叉。机制层不得感知场景。

### V4.9.68 双场景完善

- **授权读写分离**：`TenantAccessKind{Read, Write}` + `ITenantAuthorization` 分维度重载（默认实现 kind-agnostic，零破坏）。中间件授权门查 **Read**、写路径查 **Write**——成员只读用户可读不可写、读写成员可写。
- **null-user 裁决归一**：授权门不再对未解析用户先行硬抛，裁决权归授权层（默认实现依旧 fail-closed）；匿名场景可由业务自定义授权放行。
- **租户 ID 唯一解析**：`TenantIdentity`（long/数字串且 >0）收敛提取器/上下文/中间件/初始化器四处解析，消除 `TenantId==0` 哨兵碰撞与负数注入。
- **客户端租户传播**：`ApiServiceContext.CurrentTenantId` + `BeginTenantScope`；`RestClient`/`GraphQLClient` 非 null 时附加 `X-Tenant-Id` 请求头（与服务端内置提取器协议闭环）。

## 加字段模式（共享库行级隔离）

### 实体声明

实现 `IEntityTenant` 标记接口 = 声明"此表按租户行级隔离"；不实现 = 平台表（天然不过滤）：

```csharp
public class Order : IDomainEntity, IEntityTenant
{
    public long Id { get; set; }
    public string OrderNo { get; set; } = "";
    public long TenantId { get; set; }   // IEntityTenant
}

public class TenantCatalog : IDomainEntity   // 平台表，不过滤
{
    public long Id { get; set; }
    public string TenantName { get; set; } = "";
}
```

### 注册

```csharp
// 初始化器 —— 启用加字段隔离（opt-in）
protected override IReadOnlyList<Type> GetHostContextExtractors()
    => [typeof(TenantIdContextExtractor)];   // 注册租户提取器（连带注册默认 ITenantAuthorization）

protected override void ConfigureGlobalFilters(FilterBuilder filters)
{
    filters.AddTenantFilter();   // 注册 TenantGlobalQueryFilter
}
```

### 写路径自动赋值

`DataService` 创建时，`IEntityTenant.TenantId` 自动填充当前租户：

- `TenantId == 0`（未赋值）→ 自动填充 `ITenantContext.TenantId`
- `TenantId != 0` → 不覆盖
- `TenantId == null` 且非 SystemActor → 拒绝（`DomainException`）
- `TenantId == null` 且 SystemActor → 需 `ExecuteInTenantAsync` 显式作用域

### 读路径自动过滤

`TenantGlobalQueryFilter` 自动追加 `WHERE TenantId = <当前租户>`，三调用点全覆盖（EQR / `DomainUser.Query<T>` / `QueryForUser`）。未确定租户时 fail-closed（非 SystemActor 抛异常）。

### 更新路径租户校验

所有更新路径（单条/批量）在写入前**重读 + 断言 `TenantId`**，防止跨租户更新 IDOR。

> **V4.9.68 更新路径租户钳制（安全修复）**：更新校验后**覆写入参 `TenantId` 为当前已验证租户**。行为变化——更新载荷中的 `TenantId` 字段从此**无效、不再透传**，消除"租户 42 用户将自己实体改挂租户 99"的跨租户转移漏洞。

## 分库模式（Database-per-Tenant）

### 一行启用

```csharp
// Program.cs —— cfg lambda 中与 UseFreeSqlEntityDAC 同层
cfg.UseTenantDatabaseIsolation(o =>
{
    o.ConnectionStringTemplate = cfg.DomainConnectionStringTemplate;
});
```

内部接线自动完成：设状态 → Registrar 门控 → `AddDomain` 启动校验模板含 `{0}`（fail-fast）→ 自动注册提取器 + 默认授权。

### 连接串模板

```json
{
  "DomainOptions": {
    "ConnectionStringTemplate": "Host=localhost;Database=AppDb_{0};Username=postgres;Password=***"
  }
}
```

`{0}` 占位符运行时替换为租户标识。可 override `OnResolveTenantConnectionString` 自定义解析。

### 实例管理

`FreeSqlCache` 按**解析后连接串**缓存 `IFreeSql` 实例（`ConcurrentDictionary`），每请求一次解析 + 字典查找，微秒级。EF Core 走对等路径（`ActivatorUtilities` 按解析连接串创建 `DbContext`）。

> **注意**：分库模式当前硬编码 PostgreSQL（`DataType`），异构数据库租户暂不支持。

## 混合模式

平台表在平台库（固定连接串），租户表在租户库（模板解析）+ 行级过滤纵深防御：

```csharp
cfg.UseTenantDatabaseIsolation(o => o.ConnectionStringTemplate = cfg.DomainConnectionStringTemplate);
filters.AddTenantFilter();   // 平台表不过滤；租户表叠加行级过滤
```

## 跨租户作用域

`ExecuteInTenantAsync` / `ExecuteWithoutTenantAsync` **仅限 SystemActor**（普通用户调用抛 `UnauthorizedAccessException`）：

```csharp
await using (user.BeginSystemScope())
{
    await user.ExecuteInTenantAsync(tenantIdA, async () =>
    {
        await orderService.CreateAsync("ORDER-001");   // 以租户 A 身份写入
    });
    await user.ExecuteInTenantAsync(tenantIdB, async () =>
    {
        await orderService.CreateAsync("ORDER-002");   // 切换到租户 B
    });
}
```

> **"读可宽、写必窄"**：SystemActor 未作用域化时读放行全租户（管理视图/报表）；**任何写操作必须显式 `ExecuteInTenantAsync` 作用于单租户**。

> **V4.9.68 三态作用域**：`TenantScope{Kind: None/Specific/Suppress}` 显式三态持有着，修复 `ExecuteWithoutTenantAsync` 在 ambient 含租户时穿透（契约失真）；`TenantScopeManager.BeginTenantScope(long?)` 提供更精细的作用域控制，`ITenantScopeRestorer` 收敛为薄封装。

## 安全要点

| 威胁 | 防御 |
|------|------|
| **Tenant-hopping**（改 `X-Tenant-Id` 头读他租户） | 登录态优先级最高（不可被头覆盖）+ 双层授权校验 |
| **提权**（普通用户调 `ExecuteInTenantAsync`） | 方法首行 `IsSystemActor` 断言 |
| **跨租户更新 IDOR** | 更新路径前置重读 + `TenantId` 断言 |
| **漏标实体**（忘实现 `IEntityTenant`） | 未确定租户 fail-closed + 启动期门控校验 |
| **解析失败** | 告警 + `null` + `IsTenantResolved=false`，写路径因 null 被拒 |

## 启动期门控校验

框架启动期自动执行运行时门控校验（`IProjectMetaContext.ValidateRuntimeGates`）：

| 门控 | 触发条件 | 修复 |
|:---:|---------|------|
| 加字段无实体 | 启用隔离但无 `IEntityTenant` 实体 | 实现 `IEntityTenant` 或移除启用 |
| 实体未隔离 | 有 `IEntityTenant` 实体但未启用任何隔离 | 启用隔离或移除标记 |
| 分库模板缺 {0} | `UseTenantDatabaseIsolation()` 但模板不含 `{0}` | 设置含 `{0}` 的模板 |

## 继续阅读

- [数据层架构](data-layer-architecture.md)
- [SystemActor 体系](system-actor-explained.md)
- [数据服务与数据存取](../core-concepts/data-services.md)
- [配置参考](../advanced/configuration.md)