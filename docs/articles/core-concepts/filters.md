---
title: 全局过滤器体系
description: TKWF 全局过滤器体系详解：6 个声明式 AOP 过滤器、Flag+Filter 分离模式、注册与执行顺序
---

# 全局过滤器体系

> 从 V4.9.46 起，TKWF 在既有 AOP 拦截器（`AuthorityFilter`、`ValidateParametersFilter`、`ContentCacheFilter` 等）之上，补齐了一套完整的**全局过滤器体系**——用声明式标注表达"要什么"，由全局注册的过滤器统一执行。本质是**横切关注点的声明式治理**。

---

## 为什么需要过滤器体系

业务方法执行前后，常有一批与业务无关的横切逻辑：记录调用者、限流、功能开关、刷新缓存、传播关联 ID。如果每个 Service 方法都手写这些逻辑，代码会迅速膨胀且容易遗漏。

TKWF 的解法与 AOP 一脉相承：**声明式标注 + 编译期/拦截期执行**。开发者只标注"要什么"，过滤器在 AOP 管线中自动执行。

### 起源：既有过滤器的缺陷修复（V4.9.46）

V4.9.46 对既有 6 个 AOP 过滤器做了一次全量审计，修复了 8 项缺陷（4 CRITICAL + 3 HIGH + 1 MEDIUM），这是过滤器体系健壮化的地基：

| ID | 严重度 | 问题 | 修复 |
|:--|:--|:--|:--|
| C1 | CRITICAL | LoggingFilter 的 `Stopwatch` 实例字段跨调用污染 | 改为 Bag 存储（`__Logging_Stopwatch`） |
| C3 | CRITICAL | AuthorityFilter 非 HTTP 路径 `user=null` 时 NRE | 角色检查循环前加 null 守卫 |
| C4 | CRITICAL | IdempotentFilter 异常时幂等键不写入，重试破坏幂等 | Pre 阶段原子性 `TryAdd` 写入"处理中"标记 |
| C5 | CRITICAL | 短接跳过所有 PostProceed，后置逻辑不执行 | 短接时仍执行 PostProceed，各 Filter 自行检查 |
| H1 | HIGH | IdempotentFilter 用 `IMemoryCache`，分布式失效 | 改用 `ICacheProvider` |
| H3 | HIGH | ContentCacheFilter 复杂对象参数只按类型名做 key | 引入 `ICacheKeyProvider` + JSON 序列化回退 |
| H6 | HIGH | EntityHistoryFilter 配置属性定义未使用 | 启用 `TrackCreations/Updates/Deletions` 等 |
| M1 | MEDIUM | PostProceed 缺 AppliedConcerns 检查 | 与 PreProceed 对称补上 |

> **C5 的意义**：修复后，即使业务方法被短接（如缓存命中），其他过滤器的后置逻辑仍会执行，但各过滤器通过 Bag 标记自检是否真的执行过 Pre。这把"过滤器间的组合语义"从隐式约定变成了显式契约。

---

## Flag + Filter 分离模式（核心设计）

过滤器体系遵循**"Flag 声明 + Filter 执行"分离**模式：

- **Flag 特性**：业务代码上的标注（如 `[DisableAuditLog]`、`[RequireFeature(...)]`），继承 `DomainFlagAttribute`
- **Filter 过滤器**：在 FilterBuilder 中**全局注册一次**的过滤器（如 `AuditLogFilterAttribute<TUserInfo>`），继承 `DomainFilterAttribute<TUserInfo>`

```csharp
// 业务代码：只标 Flag，一行
[RequireFeature("PremiumAnalytics")]
public Task<ReportDto> GetReportAsync(long id, ...)

// 宿主配置：只注册 Filter，一行
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(options =>
{
    options.Aop.FilterBuilder.AddFeatureCheck();
});
```

**为什么这么设计？** 声明式标记（业务代码 1 行）+ 全局过滤器（注册 1 行），对业务零侵入。过滤器通过 `CanWeGo` 短路无标记的方法——没有 Flag 的方法根本不会执行过滤器逻辑。

---

## 内置过滤器清单

| 过滤器 | Flag | 版本 | 作用 |
|:--|:--|:--|:--|
| 既有过滤器缺陷修复 | —（修复既有 6 个过滤器） | V4.9.46 | 4 CRITICAL + 3 HIGH + 1 MEDIUM，过滤器体系的安全地基 |
| CorrelationIdMiddleware | —（中间件） | V4.9.47 | 请求关联 ID 端到端传播 |
| AuditLogFilter | `[DisableAuditLog]` | V4.9.48 | 方法级审计日志（参数脱敏） |
| RateLimitFilter | `[RateLimit("policy")]` | V4.9.49 | 声明式 AOP 限流 |
| FeatureFilter | `[RequireFeature(...)]` | V4.9.50 | 功能开关检查（fail-closed） |
| CacheInvalidationFilter | `[InvalidateCache("prefix")]` | V4.9.51 | 写操作后缓存失效 |

---

## CorrelationId 传播（V4.9.47）

对标 ABP 的 `ICorrelationIdProvider`。解决跨层日志关联与分布式追踪问题：一次请求产生的所有日志（中间件、AOP、业务、审计）共享同一个关联 ID。

**传播链路**：

```
HTTP 请求 X-Correlation-Id 头
  → CorrelationIdMiddleware（提取/生成，挂载在最前）
  → ICorrelationIdProvider.Change()（AsyncLocal 存储）
  → ILogger scope（BeginScope 携带 CorrelationId）
  → DomainContext.CorrelationId（AOP 层可读）
  → AuditLogFilter.PostProceed（审计记录写入 CorrelationId）
```

**基础设施**：

```csharp
// 核心层抽象（_Framework/Core/）——与平台无关
public interface ICorrelationIdProvider
{
    string? CurrentId { get; }
    IDisposable Change(string? correlationId);
}
```

```csharp
// 中间件（Web 层）——提取/生成 + 响应回传
public class CorrelationIdMiddleware(RequestDelegate next, ICorrelationIdProvider provider)
{
    public const string HeaderName = "X-Correlation-Id";
    // 读请求头，缺省 Guid.NewGuid()；provider.Change() 包裹整个调用链
    // 响应头回传同一 ID，方便客户端前后端对齐排查
}
```

**使用方式**：中间件挂载在 `ContextExtractionMiddleware` 之前（WebAppBuilder 管线最前），业务层通过 `context.CorrelationId` 读取。非 Web 环境（测试/CLI）Provider 未注册时返回 null，不抛异常。

> 主头 `X-Correlation-Id`（ABP 兼容，TS 客户端友好）；可选入站 `traceparent`（W3C 标准）。**安全注意**：关联 ID 客户端可伪造，不用于认证/限流/缓存键。

---

## AuditLogFilter 方法级审计（V4.9.48）

对标 ABP `AuditingInterceptor`。填补 `LoggingFilter`（调试日志）与 `EntityHistoryFilter`（实体变更）之间的**安全合规缺口**——记录谁、在什么时候、调用了什么方法、耗时多久。

**核心组件**：

| 组件 | 说明 |
|:--|:--|
| `AuditLogEntry` | 审计记录模型：UserName/UserId/ServiceName/MethodName/ArgumentsJson/DurationMs/CorrelationId |
| `IAuditLogStore` | 存储抽象：`SaveAsync(entry)`——可接数据库、文件、第三方审计平台 |
| `AuditLogFilterAttribute<TUserInfo>` | 过滤器：Pre 记录时间戳（Bag，零分配）、Post 构建记录并保存 |
| `DisableAuditLogAttribute` | opt-out 标记：标注的方法不审计 |

**声明式使用**：

```csharp
// 默认：所有标记了 [GenerateController] 的方法都会被审计
// 例外：标注 [DisableAuditLog] 的方法跳过
[DisableAuditLog]
public Task PingAsync() => Task.CompletedTask;
```

**参数脱敏**：序列化参数时按敏感字段黑名单脱敏（`password`/`clienthash`/`credential`/`salt`/`token`/`secret` 等 10 个字段），避免凭据落审计库。

**行为说明**：
- 仅记录**成功调用**（异常由 StaticDomainInterceptor 的 LogException 处理，已有 Warning/Error 日志）
- 未注册 `IAuditLogStore` 时安全跳过
- `CorrelationId` 依赖 V4.9.47 的传播链路

---

## RateLimitFilter 声明式限流（V4.9.49）

基于既有 `PartitionedRateLimiter` + `EnforceAsync`（V4.9.26 引入，`System.Threading.RateLimiting`），提供**声明式 AOP 限流**。覆盖 HTTP + 非 HTTP 路径（Blazor/MAUI/SignalR）。

**使用方式**：

```csharp
// 1. 宿主侧注册限流策略
services.AddRateLimitPolicy("export", opts =>
{
    opts.PermitLimit = 5;
    opts.Window = TimeSpan.FromMinutes(1);
});

// 2. 业务方法声明式限流
[RateLimit("export", PartitionBy = RateLimitPartitionBy.User)]
public Task<byte[]> ExportLargeReportAsync(string reportId, ...)
```

**分区维度**：`RateLimitPartitionBy.User`（按用户）、`.Ip`（按客户端 IP）、`.Method`（按方法）、`.Global`（全局）。

**核心组件**：

| 组件 | 说明 |
|:--|:--|
| `IRateLimitPolicyRegistry` | 策略注册表：`Register(policyName, limiter)` / `GetLimiter(policyName)` |
| `RateLimitFilterAttribute<TUserInfo>` | 过滤器：Pre 阶段 `GetLimiter` + `EnforceAsync(partitionKey)` |

**行为说明**：
- 被限流抛 `AuthenticationException`（复用 EnforceAsync 既有语义）→ Web 中间件统一映射 401
- 策略未注册抛 `InvalidOperationException`（fail-loud，捕获配置错误）
- `IRateLimitPolicyRegistry` 未注册时安全跳过

---

## FeatureFilter 功能开关（V4.9.50）

对标 ABP `FeatureInterceptor` + `Microsoft.FeatureManagement`。让"功能是否可用"成为声明式约束——代码一次写完，功能开关在后端控制。

**使用方式**：

```csharp
// 方法级：需要 "PremiumAnalytics" 功能
[RequireFeature("PremiumAnalytics")]
public Task<ReportDto> GetReportAsync(long id, ...)

// 类级 + 多功能组合：All 表示全部需启用（默认），Any 表示任一启用
[RequireFeature("A", "B", Logic = FeatureLogic.Any)]
public class PremiumService : DomainServiceBase<AppUserInfo> { ... }
```

**核心组件**：

| 组件 | 说明 |
|:--|:--|
| `IFeatureChecker` | 功能检查抽象：`IsEnabledAsync(featureName)` |
| `RequireFeatureAttribute` | 标记特性：`FeatureLogic.All/Any`，`AllowMultiple=true` |
| `FeatureDisabledException` | 功能未启用异常 |
| `FeatureFilterAttribute<TUserInfo>` | 过滤器：合并 MethodFlags + ControllerFlags，并行检查 |

**fail-closed 设计**（安全优先）：

| 场景 | 行为 |
|:--|:--|
| `[RequireFeature]` 标记但 `IFeatureChecker` 未注册 | 抛 `InvalidOperationException`（不静默放行） |
| 功能未定义 | `IsEnabledAsync` 返回 false → 抛 `FeatureDisabledException`（功能保持关闭） |
| 功能关闭 | 抛 `FeatureDisabledException`（fail loud，捕获配置错误） |

---

## CacheInvalidationFilter 缓存失效（V4.9.51）

配合 `ContentCacheFilter`（读缓存）使用：**写操作（Create/Update/Delete）执行成功后，自动失效指定前缀的读缓存**，解决"数据已更新但缓存未过期"的一致性问题。

**使用方式**：

```csharp
// 读方法：ContentCacheFilter 缓存（已有）
[ContentCacheFilter]
public Task<List<MerchantDto>> GetMerchantsAsync(...)

// 写方法：自动失效读缓存
[InvalidateCache("MerchantService.Get", "MerchantService.Select")]
public Task<MerchantDto> UpdateMerchantAsync(long id, UpdateMerchantInput input)
```

**核心机制**：
- `CacheInvalidationFilterAttribute<TUserInfo>`：Pre 设 Bag 标记（`__CacheInvalidate_Pending`），Post 阶段逐前缀调用 `ICacheProvider.RemoveByPrefixAsync`
- `ICacheProvider.RemoveByPrefixAsync`：新增默认接口方法（C# 8 DIM），默认抛 `NotSupportedException`——**既有 ICacheProvider 实现零改动**，宿主按需覆盖（内存遍历 / Redis SCAN+DEL）
- 未注册 `ICacheProvider` 时安全跳过

---

## FilterBuilder 注册与执行顺序

### 注册

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(options =>
{
    options.Aop.FilterBuilder
        // AddCoreDefaults() 预填安全核心：ValidateParameters → Authority
        .AddAuditLog(a => a.IsEnabledForAnonymous = true)   // 审计（可配置）
        .AddRateLimit()                                     // 限流
        .AddFeatureCheck()                                  // 功能开关
        .AddCacheInvalidation();                            // 缓存失效
});
```

所有过滤器均为 **opt-in**（Options 为 null = 不注册）。

### 执行顺序

```
FilterBuilder.AddCoreDefaults() 预填：
ValidateParameters → Authority（安全核心，最先）

ApplyFilterOptions 追加：
→ Logging → EntityHistory → ContentCache
→ AuditLog → RateLimit → FeatureCheck → CacheInvalidation
```

**Pre 阶段**：Global → Controller → Method（去重）
**Post 阶段**：Method 逆序 → Controller 逆序 → Global 逆序

顺序设计的合理性：

| 顺序决策 | 理由 |
|:--|:--|
| 安全核心在前 | Validate/Authority 先拒绝未认证请求 |
| RateLimit/Feature 在 Authority 之后 | 已认证请求才检查限流/功能 |
| CacheInvalidation 在 Post 最后 | 写入完成后才失效缓存 |
| AuditLog 在 Post 记录 | 能读取 CorrelationId、拿到最终耗时 |

---

## IAvoidDuplicateCrossCuttingConcerns 去重（V4.9.45）

过滤器体系基于 V4.9.45 的 ADR18 决策：SG 生成控制器**不再重复声明安全核心特性**（`[AuthorityFilter]` + `[ValidateParametersFilter]`），并引入 `IAvoidDuplicateCrossCuttingConcerns` 防重复执行。

```csharp
// 过滤器实现此接口，声明去重键
public class AuthorityFilterAttribute<TUserInfo> : DomainFilterAttribute<TUserInfo>,
    IAvoidDuplicateCrossCuttingConcerns
{
    public string ConcernKey => "Authority";
}
```

在 `StaticDomainInterceptor.PreProceedAsync` 的三阶段（Global/Controller/Method）均检查 `DomainContext.AppliedConcerns`：相同 `ConcernKey` 已执行则跳过。Global 级执行后，Controller/Method 级自动跳过——彻底消除双重执行。

> 新过滤器（AuditLog/RateLimit/Feature/CacheInvalidation）采用 Flag+Filter 分离模式，Filter 全局注册一次，天然不会在 Controller/Method 级重复注册，无需实现该接口。

---

## 最佳实践

1. **优先声明式标注**：业务代码只加 Flag，过滤器逻辑统一在 FilterBuilder 注册——便于全局审视和管理
2. **短接安全靠 Bag 标记**：短接路径下 PostProceed 仍会执行，过滤器要用 `Invocation.Bag` 标记"Pre 是否执行过"（如 `__Logging_Stopwatch`、`__AuditLog_Start`、`__CacheInvalidate_Pending`）——不要在实例字段存状态，过滤器实例跨调用复用会被污染
3. **CacheInvalidation 与 ContentCacheFilter 语义互斥**：读方法标 ContentCache，写方法标 InvalidateCache，不要标错
4. **审计脱敏前置**：敏感 DTO 尽量用黑名单字段名（`password`/`token` 等），或考虑后续版本引入 `[SensitiveData]` 整参数排除
5. **RateLimit 语义提醒**：被限流当前返回 `AuthenticationException`（401）——限流严格意义上是 429，专用 `RateLimitException` 在后续版本规划中
6. **fail-closed 优先**：功能开关、权限校验等安全类过滤器，宁可 fail loud 也不要静默放行

---

## 源文档参考

| 源文档编号 | 标题 | 与本文的关系 |
|:--|:--|:--|
| D03 | AOP拦截与事务与验证 | AOP 静态拦截 + 过滤器组合策略 + 短接机制的设计依据 |
| D03A | 缓存框架-设计方案 | ContentCacheFilter、ICacheProvider 缓存基础设施 |
| D10D | 限流架构-设计方案 | PartitionedRateLimiter、EnforceAsync、429 错误码映射 |
| ADR19 | 全局AOP过滤器体系设计原则与目录 | 过滤器体系的架构原则与目录（内部 ADR） |
| ADR18 | SG安全核心特性声明移除与避免重复执行机制 | IAvoidDuplicateCrossCuttingConcerns 去重机制（内部 ADR） |