---
title: 扩展机制：如何开发扩展
description: TKWF 扩展开发指南：编译期发现（vs ABP 运行时）、SG 识别、扩展契约、门控衔接（V4.9.70/71 已实施）
---

# 扩展机制：如何开发扩展

> 扩展通过 `[TKWFExtension]` + `ExtensionInitializer<TUserInfo>` 声明，SG1 编译期发现并生成注册代码。
> 设计依据：[D17](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D17-TKWF%E6%89%A9%E5%B1%95%E6%9C%BA%E5%88%B6%E4%B8%8E%E4%B8%9A%E5%8A%A1%E6%A8%A1%E5%9D%97%E5%85%A8%E6%99%AF-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) · [ADR37](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-%E8%BF%AD%E4%BB%A3%E5%BC%80%E5%8F%91/ADR/ADR37-TKWF%E6%89%A9%E5%B1%95%E6%9C%BA%E5%88%B6%E6%9E%B6%E6%9E%84%E5%86%B3%E7%AD%96.md) · V4.9.70/71

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
        services.AddScoped<IPermissionChecker, DefaultPermissionChecker>();
        services.AddScoped<IPermissionStore, EfCorePermissionStore>();
    }

    // 3. 注册 AOP 过滤器（FilterBuilder 构建阶段）
    public override void ConfigureFilters(FilterBuilder<MyUserInfo> builder)
    {
        builder.Add<PermissionFilter>(FilterTier.Security);
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
├── TKWFExtension + ExtensionInitializer<TUserInfo>
├── IPermissionChecker.cs
├── DefaultPermissionChecker.cs
├── PermissionFilter.cs（DomainFilterAttribute）
├── EfCorePermissionStore.cs（表结构）
└── TKWF.Ext.Permissions.csproj
```

---

## 当前实施状态

| 阶段 | 版本 | 内容 | 状态 |
|:--|:--|:--|:--|
| **Phase 1 基座** | V4.9.70 | 扩展契约 + FilterBuilder.Add\<T\>(FilterTier) + SG1 发现注册表 + 门控衔接 | ✅ 已实施 |
| **Phase 2 接线基座** | V4.9.71 | 三钩子实际接线 + 扩展清单 API + 按需启停 + Enable/Disable | ✅ 已实施 |
| **Phase 2 业务模块** | V4.9.72+ | Permissions / Navigation 首批验证模块（独立扩展包） | 🔲 待实施 |
| **Phase 3 能力引用** | 未来 | `RequiresCapability` / `ProvidesCapability` + SG 编译期校验 | 🔲 待引入 |
| **Phase 3 扩展单例** | 未来 | 跨钩子共享实例 + DI 解析扩展 | 🔲 待引入 |

> **结论**：扩展机制接线基座已可用——现在就可以开发自己的扩展。首批框架组业务模块（Permissions/Navigation）将在 V4.9.72+ 落地，届时可参考实现。

---

## 进一步阅读

| 文章 | 说明 |
|:--|:--|
| [扩展机制：如何使用](./usage.md) | 三层分离、三类分离、启用/禁用扩展 |
| [门控机制](../gates.md) | 编译期 / 运行时启动期 / 配置期三形态 + ADR35 具体规则 |
| [AOP 管线详解](../../core-concepts/aop-pipeline.md) | AOP 拦截器体系（扩展过滤器与 AOP 管线的关系） |
| [全局过滤器体系](../../core-concepts/filters.md) | FilterBuilder 注册入口与 FilterTier 语义 |
