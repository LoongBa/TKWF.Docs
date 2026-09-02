---
title: 扩展机制：如何开发扩展
description: TKWF 扩展开发指南：编译期发现（vs ABP 运行时）、SG 识别、扩展契约、门控衔接（V4.9.70/71 已实施）
---

# 扩展机制：如何开发扩展

> 扩展通过 `[TKWFExtension]` + `ExtensionInitializer<TUserInfo>` 声明，SG1 编译期发现并生成注册代码。
> 设计依据：[D17](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D17-TKWF%E6%89%A9%E5%B1%95%E6%9C%BA%E5%88%B6%E4%B8%8E%E4%B8%9A%E5%8A%A1%E6%A8%A1%E5%9D%97%E5%85%A8%E6%99%AF-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) · [ADR37](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-%E8%BF%AD%E4%BB%A3%E5%BC%80%E5%8F%91/ADR/ADR37-TKWF%E6%89%A9%E5%B1%95%E6%9C%BA%E5%88%B6%E6%9E%B6%E6%9E%84%E5%86%B3%E7%AD%96.md) · [G17A（设计扩展模块指南）](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G17A-%E8%AE%BE%E8%AE%A1%E6%89%A9%E5%B1%95%E6%A8%A1%E5%9D%97-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · V4.9.70-85

---

## 一句话摘要

SG1 在编译期扫描 `[TKWFExtension]` 标记的 `ExtensionInitializer<TUserInfo>` 子类，生成发现注册表（类型清单）和门控规则；扩展通过 `ConfigureServices` / `ConfigureFilters` / `InitializeAsync` 三钩子接入框架生命周期，无需运行时反射。

---

## 扩展契约

### TKWFExtensionAttribute

```csharp
[AttributeUsage(AttributeTargets.Class)]
public sealed class TKWFExtensionAttribute : Attribute
{
    public string Name { get; }
    public string Version { get; }
    public string Description { get; set; } = "";
}
```

- **`Name`**：扩展唯一名称（如 `"Permissions"`），用于扩展清单查询和启停控制。
- **`Version`**：语义化版本号，供日志和清单展示。
- **`Description`**：简要说明。

### ExtensionInitializer\<TUserInfo\>

```csharp
public abstract class ExtensionInitializer<TUserInfo> : ITKWFExtension
    where TUserInfo : class, IUserInfo, new()
{
    public virtual void ConfigureServices(IServiceCollection services) { }
    public virtual void ConfigureFilters(FilterBuilder<TUserInfo> builder) { }
    public virtual Task InitializeAsync() => Task.CompletedTask;
}
```

泛型 `TUserInfo` 与框架重度泛型化一致（`FilterBuilder<TUserInfo>` / `DomainHostInitializerBase<TUserInfo>`），让 `ConfigureFilters` 能访问真实 `FilterBuilder<TUserInfo>`。

> **为什么不引入非泛型基类？** D17 §4.4.2 设计了非泛型版本，但 ADR37 采用泛型版本——与 FilterBuilder 和 DomainHost 保持类型安全一致。扩展开发者只需指定 `TUserInfo` 类型参数即可。

---

## 三钩子接线时序

扩展通过三个钩子接入框架启动流程（V4.9.71 已接线落地）：

```
InitializeDiContainer
  ↓ ConfigureServices              ← DI 容器构建前（扩展注册服务）
  ↓ RegisterInfrastructureInternal
  ↓ OnRegisterInfrastructureServices  → ProjectMetaContextBase.Instance 赋值
  ↓ OnRegisterDomainServices
  ↓
ConfigGlobalFilters(builder)       ← ConfigureFilters（扩展注册 AOP 过滤器）
  ↓
ServiceProviderBuiltCallbackAsync
  ↓ OnValidateRuntimeGatesAsync    ← 门控验证（扩展贡献的 GateRules 在此执行）
  ↓ SyncTables
  ↓ SyncViewsAsync
  ↓ OnEnsureSystemReadyAsync
  ↓ InitializeAsync                ← 种子数据 / 运行时初始化（扩展可选）
  ↓ IsBootstrapCompleted = true
```

### 各钩子职责

| 钩子 | 插入点 | 约束 | 典型用途 |
|:--|:--|:--|:--|
| `ConfigureServices` | `InitializeDiContainer` 内，DI 容器未构建前 | 不可访问 `Host`（`ServiceProviderBuiltCallbackAsync` 才绑定） | 注册 DI 服务（`services.AddScoped<IPermissionChecker, ...>()`） |
| `ConfigureFilters` | `ConfigGlobalFilters` 内，`ConfigureGlobalFilters(builder)` 之后 | 复用同一 builder，S→F→O tier 排序自动生效 | 注册 AOP 过滤器（`builder.Add<PermissionFilter>(FilterTier.Security)`） |
| `InitializeAsync` | `ServiceProviderBuiltCallbackAsync` 内，`OnEnsureSystemReadyAsync` 之后 | 系统已就绪，可安全访问数据库 | 种子数据、初始化缓存 |

### 扩展实例创建

三个钩子各自独立实例化——用 `Activator.CreateInstance(type)` 无参创建，不从 DI 解析（`ConfigureServices` 阶段 DI 容器尚未构建）。

> **注意**：扩展应保持无状态。跨钩子共享实例需等待 Phase 3（扩展单例 + DI 解析）。

---

## SG1 编译期扫描

SG1（`IIncrementalGenerator`）新增 `CollectFeatureGates` 扫描，编译期生成两套数据：

### 1. 发现注册表（`GeneratedExtensionInitializers`）

```
[TKWFExtension] 标记的 ExtensionInitializer<TUserInfo> 子类
  → SG1 扫描 → 生成 GeneratedExtensionInitializers 发现注册表
  → 类型清单编译期确定，运行时无反射
```

框架启动时 `ProjectMetaContextBase.FromProjectMetaContext`（`RegisterInfrastructureInternal` **之后**）读取注册表，构建 `_extensionRegistry`。

### 2. 门控规则（`GateRules`）

扩展内部使用的 `[DistributedEvent]` / `[BackgroundJob]` / `[DomainEventHandler]` 等编译期声明，SG1 自动扫描生成对应的 `GateRules` 条目到 `ProjectMetaContext`——扩展**零手写门控代码**。

如果扩展引入了新的编译期声明（如 `[RequirePermission]`），扩展可自带 SG 分析器追加规则到 `ProjectMetaContext.GateRules`——遵循"后续加规则只改 ProjectMetaContext"原则。

> 门控三形态与验证机制详见 [门控机制](../gates.md)。

---

## 过滤器注册（FilterBuilder）

### FilterTier 枚举

新增 `FilterTier` 枚举（对齐 ADR19 三级分类）：

```csharp
public enum FilterTier
{
    Security = 0,   // S 级：权限、认证
    Function = 1,   // F 级：功能过滤器（事件派发等）
    Operation = 2   // O 级：操作过滤器（事务等）
}
```

### Add\<T\>(FilterTier) 方法

```csharp
public FilterBuilder<TUserInfo> Add<TFilter>(FilterTier tier)
    where TFilter : DomainFilterAttribute<TUserInfo>, new()
{
    var filter = new TFilter();
    InsertInTier(filter, tier);  // 按 tier 插入正确位置
    _explicitTiers[typeof(TFilter)] = tier;  // 记录层级参与排序
    return this;
}
```

**注册示例**（扩展自带过滤器）：

```csharp
public class PermissionExtensionInitializer : ExtensionInitializer<MyUserInfo>
{
    public override void ConfigureFilters(FilterBuilder<MyUserInfo> builder)
    {
        // 显式注册到 Tier-S
        builder.Add<PermissionFilter>(FilterTier.Security);
    }
}
```

**不需要引入 `IInterceptorFilter` 接口**——与现有过滤器基类统一，避免双类型系统。既有 `Add(DomainFilterAttribute)` 按实例入口保留，向后兼容。

---

## 扩展清单 API

### ITkExtensionDescriptor

```csharp
public interface ITkExtensionDescriptor
{
    string Name { get; }
    string Version { get; }
    string Description { get; }
    Type InitializerType { get; }
    bool IsAutoDiscovered { get; }  // SG 发现即 true
    bool IsEnabled { get; }         // 可被 ConfigureExtensions 覆盖
}
```

### ITkExtensionContainer（可注入单例）

```csharp
public interface ITkExtensionContainer
{
    IReadOnlyList<ITkExtensionDescriptor> Extensions { get; }
    ITkExtensionDescriptor? Find(string name);
}
```

### ITkExtensionRegistry（开发者配置入口）

```csharp
public interface ITkExtensionRegistry
{
    void Enable(string name);
    void Disable(string name);
    void Configure(string name, Action<object> configure);
}
```

消费方通过 `DomainHostInitializerBase<TUserInfo>` 的 `ConfigureExtensions` 虚方法访问：

```csharp
protected override void ConfigureExtensions(ITkExtensionRegistry registry, IServiceCollection services)
{
    // 按需禁用——三钩子均跳过
    registry.Disable("SomeUnusedExtension");

    // 自定义配置
    registry.Configure("AuditLogging", opt =>
    {
        // opt 由扩展自行定义类型
    });
}
```

---

## 完整扩展示例

```csharp
// TKWF.Ext.Permissions 项目中
namespace TKWF.Ext.Permissions;

// 1. 扩展声明——SG 据此发现
[TKWFExtension("Permissions", Version = "1.0.0", Description = "RBAC 权限管理")]
public class PermissionExtensionInitializer : ExtensionInitializer<MyUserInfo>
{
    // 2. 注册 DI 服务（DI 容器构建前）
    public override void ConfigureServices(IServiceCollection services)
    {
        services.AddScoped<IPermissionChecker, PermissionChecker<MyUserInfo>>();
        services.AddScoped<IPermissionDefinitionRepository, InMemoryPermissionDefinitionRepository>();
        // 注意：IPermissionStore 不由本扩展注册——
        // 官方 FreeSql 实现 FreeSqlPermissionStore 在 TKWF.Domain.FreeSql 包内条件注册
        // （已注册 IFreeSql → FreeSqlPermissionStore；否则回退 NoOp，避免本包强依赖 FreeSql）
    }

    // 3. 注册 AOP 过滤器（FilterBuilder 构建阶段）
    public override void ConfigureFilters(FilterBuilder<MyUserInfo> builder)
    {
        builder.Add<PermissionFilter<MyUserInfo>>(FilterTier.Security);
    }

    // 4. 种子数据 / 运行时初始化（系统就绪后）
    public override async Task InitializeAsync()
    {
        // 例如：创建默认角色、初始化权限表
    }
}
```

**项目结构**（NuGet 包）：

```
TKWF.Ext.Permissions/
├── PermissionExtensionInitializer<TUserInfo>.cs（[TKWFExtension] + 三钩子）
├── IPermissionChecker.cs / PermissionChecker<TUserInfo>.cs
├── IPermissionStore.cs / NoOpPermissionStore.cs（默认回退，非持久化）
├── PermissionDefinition.cs / IPermissionDefinitionContributor.cs
├── PermissionFilter<TUserInfo>.cs（DomainFilterAttribute，Tier-S）
└── TKWF.Ext.Permissions.csproj（零 ORM 依赖；FreeSql 持久化在 TKWF.Domain.FreeSql 包）
```

> **包边界（Oracle H4，V4.9.75）**：`FreeSqlPermissionStore` 刻意**不进** Permissions 包——否则权限包强依赖 FreeSql，会污染所有非 FreeSql 宿主。持久化实现随 ORM 包走，权限包只定义契约 + 回退实现。

---

## 扩展间依赖与 .Abstractions（V4.9.85+，ADR48 D7）

扩展 A 需要引用扩展 B 的接口时，**不得引用 B 的实现项目**（L2 门控 `TKWF0022` Error）——必须走 B 的 `.Abstractions` 抽象项目（接口/契约，无实现）。

```
Navigation → Permissions.Abstractions   ✅ 合法（依赖倒置）
Navigation → Permissions                ❌ TKWF0022 Error
```

### 什么时候需要创建 `.Abstractions`

| 条件 | 判断 | 结果 |
|------|------|------|
| 其他扩展需要引用此扩展的接口 | 跨扩展依赖 | 创建 `.Abstractions` |
| 扩展完全独立，其他扩展不依赖它 | 无跨扩展依赖 | 不创建 |
| 接口只在扩展内部使用 | `internal` 可见性即可 | 不创建 |

### 扩展角色分类（Abstractions 需求概率）

| 角色 | 说明 | Abstractions 需求 | 典型扩展 |
|------|------|:-----------------:|----------|
| **上下文提供者** | 回答"谁/什么配置/什么权限" | **高** | Identity、Permissions、Settings |
| **横切关注点** | 跨业务领域使用 | **中** | AuditLogging、Navigation |
| **功能扩展** | 面向终端用户的独立特性 | **低** | Emailing、BlobStoring、Tagging、DataDictionary |
| **增强扩展** | 扩展另一个扩展的能力 | **低** | Account（增强 Identity） |

> **规律**：被依赖方（箭头起点）需要 Abstractions，依赖方（箭头终点）不需要。例如 `Identity (谁) → AuditLogging (谁做了什么)`——Identity 需要 Abstractions，AuditLogging 不需要。

> **按需创建，不过度设计**：当第一个跨扩展依赖出现时才创建对应的 Abstractions。执行时机——扩展 A 代码中出现 `using TKW.Framework.Ext.{B}` 时，立即评估 B 是否有 Abstractions：有 → 改引用 `B.Abstractions`；无 → 立即创建 `B.Abstractions` 并提取公共接口。

> `.Abstractions` 项目无 `ExtensionInitializer` 派生类，L2 门控判据天然豁免。当前 Permissions 已有 `.Abstractions`；Identity 建议新增；Settings 暂缓；Navigation/DataDictionary 不需要。完整决策框架见 [G17A §七](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G17A-%E8%AE%BE%E8%AE%A1%E6%89%A9%E5%B1%95%E6%A8%A1%E5%9D%97-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) 与 D17 §4.5A。

---

## 当前实施状态

| 阶段 | 版本 | 内容 | 状态 |
|:--|:--|:--|:--|
| **Phase 1 基座** | V4.9.70 | 扩展契约 + FilterBuilder.Add\<T\>(FilterTier) + SG1 发现注册表 + 门控衔接 | ✅ 已实施 |
| **Phase 2 接线基座** | V4.9.71 | 三钩子实际接线 + 扩展清单 API + 按需启停 + Enable/Disable | ✅ 已实施 |
| **Phase 2 业务模块** | V4.9.72-74 | Permissions（ADR38，权限持久化 V4.9.75）+ Navigation（ADR39）首批验证模块 | ✅ 已实施 |
| **收尾** | V4.9.75 | GateRules `SourceExtension` 程序集归属关联 + DI 全图验证（`TKWF_DI001`）+ `FreeSqlPermissionStore` | ✅ 已实施 |
| **Phase 3** | V4.9.76-77 | 配置结构验证（`TKWF_OPT0xx`）+ 有状态扩展单例（D2）+ 系列收尾 | ✅ 已实施 |
| **独立仓库化** | V4.9.80+ | 扩展迁至公开仓库 `TKWF.Extensions`（独立版本 v0.1.0+）；框架内核去泛型化（ADR42）；Tagging/Account/Identity/AuditLogging/Settings 等扩展迁出 | ✅ 已实施 |
| **Tagging 瘦身（ADR52）** | V4.9.91 | 标签算法（`ITagService`/`TagService` + 分词/匹配流水线）回归 `TKWF.Utility`（`TKW.Framework.Utility.Tags`）；`TKWF.Ext.Tagging` 瘦身为标签存储扩展（V0.2.0，持久化 V0.3.0 实施） | ✅ 已实施 |
| **门控体系** | V4.9.84-85 | 扩展模块引入门控（ADR46 `TKWFEnabledExtension`）+ 权威注册源上提（ADR47）+ 编译期实例化（ADR48 D4）+ 三层门控（ADR50 `TKWF0030-33`） | ✅ 已实施 |
| ~~Phase 3 能力引用~~ | — | `RequiresCapability` / `ProvidesCapability` + SG 编译期校验 | ⛔ 已废弃（ADR37 决策 5） |

> **结论**：扩展机制基座 + 接线 + 首批业务模块 + 收尾 + Phase 3 + 独立仓库化 + 门控体系全部落地——现在就可以开发自己的扩展，并直接参考 [`TKWF.Extensions`](https://github.com/LoongBa/TKWF.Extensions) 仓库中官方 `TKWF.Ext.Permissions` / `TKWF.Ext.Navigation` 实现（V4.9.80 起迁移至独立仓库，独立版本 v0.1.0+）。

> ⛔ **能力引用机制（ADR37 决策 5，V4.9.75 正式废弃）**：`RequiresCapability` / `ProvidesCapability` 声明式软依赖原计划 V4.9.75+ 引入，因 **YAGNI 持续成立**（无真实软依赖案例）+ **编译期 ProjectReference 已覆盖依赖声明**（ADR39 Navigation 的依赖即 `ProjectReference`）而废弃。`FrameworkCapability` 常量保留仅供向后兼容引用。**显式 ProjectReference 优先于运行时能力发现**——接口是契约、DI 注册是能力提供。

---

## 进一步阅读

| 文章 | 说明 |
|:--|:--|
| [扩展机制：如何使用](./usage.md) | 三层分离、三类分离、启用/禁用扩展 |
| [门控机制](../gates.md) | 编译期 / 运行时启动期 / 配置期三形态 + ADR35 具体规则 |
| [AOP 管线详解](../../core-concepts/aop-pipeline.md) | AOP 拦截器体系（扩展过滤器与 AOP 管线的关系） |
| [全局过滤器体系](../../core-concepts/filters.md) | FilterBuilder 注册入口与 FilterTier 语义 |
