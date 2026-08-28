---
title: 权限扩展：TKWF.Ext.Permissions
description: 权限扩展使用指南：权限定义/贡献者、[RequirePermission] 方法级权限门、IPermissionChecker/IPermissionStore、fail-closed 语义、跨程序集 DI 通道
---
# 权限扩展：TKWF.Ext.Permissions

> TKWF 权限扩展提供**细粒度权限管理**——权限定义（如 `"Order.Create"`）、运行时权限检查、方法级权限门（`[RequirePermission]`），与框架核心的 `AuthorityFilter`（角色检查）并存互补。
> 使用指南：[G17A](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G17A-%E6%9D%83%E9%99%90%E6%89%A9%E5%B1%95-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · 设计：[D17 §5.1](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D17-TKWF%E6%89%A9%E5%B1%95%E6%9C%BA%E5%88%B6%E4%B8%8E%E4%B8%9A%E5%8A%A1%E6%A8%A1%E5%9D%97%E5%85%A8%E6%99%AF-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) · 决策：ADR37/38 · V4.9.72+

---

## 为什么需要权限扩展

框架核心已有 `AuthorityFilter`（角色级授权：`[RequireRole("Admin")]`），为什么还要权限扩展？

**角色 vs 权限是两个粒度**：

| 维度 | 角色（AuthorityFilter） | 权限（PermissionFilter） |
|:--|:--|:--|
| 粒度 | 粗——"管理员" | 细——"Order.Create" / "Order.Delete" |
| 变更频率 | 低——组织结构稳定 | 高——业务持续演进 |
| 分配单位 | 人 → 角色 | 人/角色 → 权限 |
| 典型场景 | "只有管理员能进后台" | "销售能创建订单，但只有财务能删除" |

角色适合"谁能进哪个模块"，权限适合"谁能做哪个具体操作"。两者**并存不替代**——同一个方法可同时标注 `[RequireRole("Sales")]` + `[RequirePermission("Order.Create")]`，先查角色再查权限。

> **ABP 对比**：ABP 的 `IPermissionChecker` 与此设计类似，但 TKWF 的关键差异在**发现机制**——ABP 运行时反射扫描 `IPermissionDefinitionContributor` 实现，TKWF 用 SG1 编译期扫描 `[PermissionContributor]` 标记生成类型清单（零运行时反射）。详见下方"架构全景"。

---

## 架构全景

```
┌──────────────────────────────────────────────────────────────┐
│ 消费方项目（App.csproj）                                       │
│                                                                │
│  [PermissionContributor]                                       │
│  class OrderPermissions : IPermissionDefinitionContributor   │
│  { Define(context) => context.Add("Order.Create", ...) }     │
│                                                                │
│  <PackageReference Include="TKWF.Ext.Permissions" />          │
└──────────────────────────┬───────────────────────────────────┘
                           │ 编译期引用程序集
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ SG1 编译期扫描（ReferencedAssemblySymbols）                    │
│                                                                │
│  ① 扫描 [TKWFExtension("Permissions")] → 扩展初始器类型清单   │
│  ② 扫描 [PermissionContributor] → 贡献者类型清单             │
│  ③ 生成 typeof(global::{FullName}) 编译期类型引用             │
│  ④ 写入 ProjectMetaContext.PermissionContributors 桥          │
└──────────────────────────┬───────────────────────────────────┘
                           │ 启动时
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ PermissionExtensionInitializer 三钩子（V4.9.71 机制）         │
│                                                                │
│  ConfigureServices（DI 构建前，同步）                          │
│    → 读 ProjectMetaContext.PermissionContributors             │
│    → Activator.CreateInstance(contributorType)  无参构造       │
│    → contributor.Define(context)  收集权限定义                 │
│    → 填充 IPermissionDefinitionRepository                      │
│    → TryAdd 注册 IPermissionChecker/Store/PermissionFilter    │
│                                                                │
│  ConfigureFilters（FilterBuilder 构建阶段）                    │
│    → builder.Add<PermissionFilterAttribute>(FilterTier.S)     │
│                                                                │
│  InitializeAsync（系统就绪后，可选）                           │
│    → 种子数据（如预置角色权限映射）                            │
└──────────────────────────┬───────────────────────────────────┘
                           │ 运行时请求
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ PermissionFilterAttribute（AOP 拦截，Tier-S）                  │
│                                                                │
│  [RequirePermission("Order.Create")]                         │
│  public Task CreateOrderAsync(...)                            │
│                                                                │
│  PreProceedAsync：                                            │
│    ① 读 context.MethodFlags 的 RequirePermissionAttribute    │
│    ② context.ServiceProvider.GetService<IPermissionChecker>()│
│       ↑ 跨程序集 DI 通道（ADR38 D4：InternalsVisibleTo）      │
│    ③ checker.IsGrantedAsync("Order.Create")                  │
│       → PermissionChecker<TUserInfo>                         │
│       → 读 DomainUserContext.CurrentAopUser（IVT 访问）       │
│       → IPermissionStore.GetAsync("Order.Create","User",uid)│
│    ④ fail-closed：未定义/未授予 → DomainException(FORBIDDEN)  │
└──────────────────────────────────────────────────────────────┘
```

---

## 快速入门

### Step 1：启用权限扩展

消费方引用 `TKWF.Ext.Permissions` 包。扩展经 `[TKWFExtension("Permissions")]` 被 SG1 自动发现，三钩子自动接线——**无需手动注册**：

```xml
<!-- 消费方 .csproj -->
<ProjectReference Include="..\Framework\Permissions\TKWF.Ext.Permissions.csproj" />
```

扩展自动注册：`IPermissionChecker`（默认 `PermissionChecker<TUserInfo>`）+ `IPermissionStore`（默认 NoOp）+ `IPermissionDefinitionRepository` + `PermissionFilterAttribute`（Tier-S）。

> ⚠️ **默认实现说明（V4.9.72）**：默认 `IPermissionStore` 是 NoOp（读恒拒绝）——**真实启用权限需要消费方注册自定义 `IPermissionStore`**（数据库权限存储）。`PermissionChecker<TUserInfo>` 已接通用户上下文 + store 链路，是逻辑层默认实现。

### Step 2：声明权限定义（贡献者）

业务模块用 `[PermissionContributor]` 标记一个实现 `IPermissionDefinitionContributor` 的类：

```csharp
[PermissionContributor]
public class OrderPermissions : IPermissionDefinitionContributor
{
    public void Define(PermissionDefinitionContext context)
    {
        context.Add(new PermissionDefinition
        {
            Name = "Order.Create",       // 点分层级约定
            DisplayName = "创建订单",
            Group = "Order"
        });
        context.Add(new PermissionDefinition
        {
            Name = "Order.Delete",
            DisplayName = "删除订单",
            Group = "Order"
        });
    }
}
```

SG1 扫描 `[PermissionContributor]` → 生成 `GeneratedPermissionContributors` → 启动时扩展初始化器实例化贡献者、调用 `Define()` 收集定义（ConfigureServices 阶段，编译期清单无反射）。

### Step 3：方法级权限门

在服务接口方法或控制器接口上标记 `[RequirePermission]`：

```csharp
public interface IOrderService
{
    [RequirePermission("Order.Create")]
    Task CreateOrderAsync(CreateOrderInput input);

    // 多权限 + 任一逻辑（Any）：销售或管理员任一权限即可
    [RequirePermission("Order.Delete", "Order.ForceDelete", Logic = PermissionLogic.Any)]
    Task DeleteOrderAsync(long id);
}
```

无权限时抛 `DomainException`（`ErrorCode = FORBIDDEN`），客户端收到 `FORBIDDEN` 错误码。

### Step 4：真实启用权限（注册自定义 IPermissionStore）

默认 NoOp store 恒拒绝——注册你的权限存储后权限检查才真正生效：

```csharp
// DomainInitializer / ConfigureServices 中
services.AddSingleton<IPermissionStore, MyDbPermissionStore>();
```

`MyDbPermissionStore` 实现 `IPermissionStore`：

```csharp
public sealed class MyDbPermissionStore : IPermissionStore
{
    public Task<PermissionGrantResult> GetAsync(string permissionName, string providerName, string providerKey)
    {
        // providerName = "User"（当前用户），providerKey = UserIdString
        // 查库判断用户是否被授予该权限
        var granted = /* 查数据库 */;
        return Task.FromResult(granted ? PermissionGrantResult.Granted : PermissionGrantResult.Denied);
    }

    public Task SetAsync(string permissionName, string providerName, string providerKey, bool isGranted)
    {
        // 写入/移除权限授予（权限分配管理后台用）
        return Task.CompletedTask;
    }
}
```

---

## 核心概念

| 概念 | 说明 |
|:--|:--|
| 权限定义（PermissionDefinition） | 权限声明——`Name`（如 `"Order.Create"`）+ 显示名/分组/父权限 |
| 权限贡献者（IPermissionDefinitionContributor） | 业务模块声明权限定义的类，`[PermissionContributor]` 标记 |
| 权限检查器（IPermissionChecker） | 运行时判断当前用户是否拥有权限 |
| 权限存储（IPermissionStore） | 持久化角色/用户权限值（V4.9.72 提供 NoOp 默认实现，真实持久化需消费方实现） |
| 方法级权限门（[RequirePermission]） | 标记方法/接口，无权限时抛 `DomainException(FORBIDDEN)` |

### 与 AuthorityFilter 的分工

| 机制 | 检查内容 | 属性 | 过滤器 | 归属 | 安全层 |
|:--|:--|:--|:--|:--|:--|
| **AuthorityFilter** | 角色（`[RequireRole]`） | `RequireRoleFlagAttribute` | 框架核心 | 角色级授权 | API 边界 |
| **PermissionFilter** | 权限（`[RequirePermission("Order.Create")]`） | `RequirePermissionAttribute` | 扩展（Tier-S） | 权限级授权 | API 边界 |

两者独立工作可同时使用：用户可被分配角色（AuthorityFilter 检查）和权限（PermissionFilter 检查）。

---

## 设计原理

### 为什么 fail-closed（未知权限名 → 拒绝）

权限检查是 **API 安全边界**——失败时的默认行为决定系统安全性。两种策略：

| 策略 | 行为 | 风险 |
|:--|:--|:--|
| **fail-open**（放开） | 未知权限名 → 允许通过 | 权限名拼写错误（`"Order.Cerate"`）→ 静默放行，安全漏洞 |
| **fail-closed**（拒绝）✅ | 未知权限名 → 拒绝 | 拼写错误 → 用户被拒，立即发现并修复 |

TKWF 选择 fail-closed：权限名未定义 / store 返回 Denied / 无 ambient 用户 → 均不查 store，直接拒绝。这与 `AuthorityFilter` 的"未认证 → 401"同构——安全边界默认拒绝。

> **fail-closed 短路链**：空权限名 → 权限名未定义（仓库中不存在）→ 无 ambient 用户（`DomainUserContext.CurrentAopUser` 为 null）→ 均直接拒绝，不查 store。

### 为什么跨程序集 DI 通道（ADR38 D4）

`PermissionFilterAttribute<TUserInfo>` 在独立程序集（`TKWF.Ext.Permissions`）中，需要访问 `IPermissionChecker`（DI 服务）。但有两个约束：

1. **`FilterBuilder.Add<T>()` 要求无参构造**（`where TFilter : new()`）——不能用构造函数注入
2. **`DomainContext.ServiceProvider` 是 internal**——防止滥用

解法：`Domain` 项目通过 `<InternalsVisibleTo Include="TKWF.Ext.Permissions" />` 对**官方扩展包**开放 internal 访问。过滤器在 `PreProceedAsync` 中：

```csharp
var checker = context.ServiceProvider.GetService<IPermissionChecker>();
```

> **仅官方扩展包授信**：第三方未知扩展包不授予 IVT——防止任意程序集访问 `DomainContext` 内部状态。这与 `Domain.Web` / `SystemActor.Tests` 既有 IVT 惯例一致。

### 为什么编译期不校验权限名（已知 gap）

早期草案设想"SG1 编译期校验 `[RequirePermission]` 的权限名是否在贡献者中定义"。但 V4.9.72 落地时发现**技术上不可行**：

```
贡献者 Define() 方法体：
  context.Add(new PermissionDefinition { Name = "Order.Create" })
                          ↑ SG 不能执行用户代码，看不到这个字符串

[RequirePermission("Order.Create")]
                ↑ SG 能看到这个字符串
```

SG1 能扫描 `[RequirePermission]` 特性的字符串（编译期常量），但**看不到 `Define()` 方法体内的运行时字符串**（SG 不执行用户代码）。因此编译期校验权限名匹配不可行。

**V4.9.73 评估结论（ADR38 D7/G1）**：维持 fail-closed 运行时校验，**不引入 `[PermissionDefinition]` 特性声明平行通道**。理由：
1. 编译期校验是"提前报错"优化，非功能缺口——运行时 fail-closed 已覆盖语义
2. 特性声明与 contributor `Define()` 命令式并存会产生**双权威源**，违背"单一数据源"原则
3. 若未来有强编译期校验诉求，应作为独立 ADR 立项

---

## 权限检查 API

### IPermissionChecker（可注入）

运行时任意服务注入 `IPermissionChecker` 做代码级权限判断：

```csharp
public class MyService
{
    private readonly IPermissionChecker _checker;
    public MyService(IPermissionChecker checker) => _checker = checker;

    public async Task DoSomethingAsync()
    {
        if (await _checker.IsGrantedAsync("Order.Create"))
        {
            // 有权限
        }

        // 批量检查
        var results = await _checker.IsGrantedAsync("Order.Create", "Order.Delete");
    }
}
```

> ⚠ 代码级检查是**软判断**（不抛异常）——只做业务分支。真正的**安全门**用 `[RequirePermission]`（fail-closed 抛异常）。

### PermissionChecker\<TUserInfo\> 内部链路

默认 `PermissionChecker<TUserInfo>` 的检查链路（V4.9.72 M1 修复后）：

```
IsGrantedAsync("Order.Create")
  ↓
fail-closed 短路检查
  ├─ 权限名为空？→ 拒绝
  ├─ 权限名未定义（仓库中不存在）？→ 拒绝
  └─ 无 ambient 用户（DomainUserContext.CurrentAopUser 为 null）？→ 拒绝
  ↓ 通过短路
IPermissionStore.GetAsync("Order.Create", "User", userId)
  ├─ NoOp（默认）→ Denied
  └─ 自定义 store → 查库返回 Granted/Denied
```

> **providers 约定**：用户权限 `("User", UserIdString)`——`IPermissionStore` 实现按此键解析；消费方扩展 store 可支持角色/成员 providers。

---

## 设计要点与边界

### 与菜单扩展的集成

菜单项 `RequiredPermissions` 经 `IMenuManager` 调用同一 `IPermissionChecker` 过滤（见 [导航扩展](./navigation.md)）。注意：菜单过滤是**展示层**，checker 缺失时**降级不过滤**（与权限过滤的 fail-closed 不冲突——不同安全层）。

### 已知边界（V4.9.72）

| 边界 | 说明 | 规划 |
|:--|:--|:--|
| 编译期权限名校验 | 未实现（ADR38 D7）——贡献者 `Define()` 是运行时方法，SG 看不到体内字符串 | 未来如需改用特性声明（已知 gap） |
| 权限分配管理 | 依赖 `IPermissionStore.SetAsync` 消费方实现（框架不内置管理 UI） | 消费方职责 |
| 角色→权限映射 | 未内置（`IPermissionStore` 可自行扩展角色 provider） | store 实现层 |
| TS Client 权限元数据 | 未实现（D17 §5.3 弱增强） | 留后续迭代 |

### 常见反模式

| 反模式 | 说明 | 正确做法 |
|:--|:--|:--|
| 只注册 Permissions 包不注册 store | 所有 `[RequirePermission]` 永远拒绝 | 注册自定义 `IPermissionStore` |
| 用 `IPermissionChecker.IsGrantedAsync` 当安全门 | 软判断不抛异常，可被绕过 | 用 `[RequirePermission]`（fail-closed） |
| 权限名用自由字符串散落各处 | 拼写错误运行时才发现（fail-closed 拒绝） | 定义常量/贡献者集中声明 |
| 在贡献者 `Define()` 里做 IO/数据库查询 | 贡献者应纯声明式；ConfigureServices 阶段无 DI | 权限定义静态声明，动态数据放 store |

---

## FAQ

**Q: 如何让"销售或管理员"都能访问一个方法？**
用 `[RequirePermission("Sale.Create", "Admin.All", Logic = PermissionLogic.Any)]`——任一权限授予即可通过。

**Q: 权限检查和角色检查冲突吗？**
不冲突。`AuthorityFilter`（角色）和 `PermissionFilter`（权限）独立工作，可同时标记。请求先过角色检查，再过权限检查。

**Q: 权限定义在哪声明？**
在消费方业务模块的 `[PermissionContributor]` 类里，经 `Define(context).Add(...)` 声明。SG 编译期发现（源码 + 引用程序集）。

**Q: 默认权限检查器为何恒拒绝？**
默认 `IPermissionStore` 是 NoOp（V4.9.72 简化）。`PermissionChecker<TUserInfo>` 已接通用户上下文 + store 链路——注册 store 后即真实生效。

**Q: 为什么不像 ABP 那样运行时反射发现权限定义？**
TKWF 核心理念是"编译期确定性"——SG1 编译期扫描 `[PermissionContributor]` 标记生成类型清单（零运行时反射）。权限定义本身在运行时由扩展初始化器收集（SG 不能执行用户代码），但贡献者类型发现是编译期的。这是 TKWF 与 ABP 的根本区别。

---

## 进一步阅读

| 文章 | 说明 |
|:--|:--|
| [导航扩展](./navigation.md) | 菜单项定义 + IMenuManager 权限过滤（与 Permissions 集成） |
| [扩展机制：如何使用](./../extensions-usage.md) | 三层分离、三类分离、启用扩展的接入方式 |
| [扩展机制：如何开发扩展](./../extensions-development.md) | 扩展契约、三钩子、SG 扫描、过滤器注册 |
| [全局过滤器体系](../../core-concepts/filters.md) | FilterTier 与 AOP 过滤器注册体系 |
| [认证与授权](../../security/authorization.md) | AuthorityFilter 角色授权（与权限扩展并存） |