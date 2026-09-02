---
title: 扩展机制：如何使用
description: TKWF 扩展机制使用指南：三层分离、三类分离、启用扩展的接入方式（V4.9.70-85 已实施，V4.9.80 起扩展独立仓库）
---

# 扩展机制：如何使用

> TKWF 扩展机制让"权限、菜单、审计"等业务模块作为可选包按需安装，同时保持框架核心精简。
> 设计依据：[D17](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D17-TKWF%E6%89%A9%E5%B1%95%E6%9C%BA%E5%88%B6%E4%B8%8E%E4%B8%9A%E5%8A%A1%E6%A8%A1%E5%9D%97%E5%85%A8%E6%99%AF-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) · [ADR37](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-%E8%BF%AD%E4%BB%A3%E5%BC%80%E5%8F%91/ADR/ADR37-TKWF%E6%89%A9%E5%B1%95%E6%9C%BA%E5%88%B6%E6%9E%B6%E6%9E%84%E5%86%B3%E7%AD%96.md) · [G17B（使用扩展模块指南）](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G17B-%E4%BD%BF%E7%94%A8%E6%89%A9%E5%B1%95%E6%A8%A1%E5%9D%97-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · V4.9.70-85

---

## 为什么需要扩展机制

企业级框架面临"太薄 vs 太厚"的永恒张力：

- **太薄**（如 ASP.NET Core 原生）：只提供管线，权限模型、菜单系统、审计日志全靠自建，生产力低。
- **太厚**（如 ABP Commercial）：内置大量业务模块，开箱即用，但约束设计、包体积大、难以裁剪。
- **中间路线**：核心提供最小骨架，完整功能作为**可选扩展包**按需安装。

TKWF 的扩展机制走中间路线，但实现方式与 ABP 有根本区别：

| 维度 | ABP Framework | TKWF V5 |
|:--|:--|:--|
| **发现时机** | 运行时 DI 自动发现（`OnRegistered` 反射扫描） | **编译期 SG 扫描发现** |
| **注册方式** | 运行时反射 + DI 注册 | **编译期生成注册代码** |
| **错误暴露** | 运行时异常（依赖缺失、循环引用） | **编译期错误**（SG 诊断 + 生成失败） |
| **指导思想** | 运行时灵活性优先 | **编译期确定性优先** |

> **核心差异化**：TKWF 的扩展在编译期被 SG1 扫描发现、生成注册代码、校验依赖——"编译即验证，尽早发现问题"，而不是 ABP 式的运行时反射。这延续了框架"编译期确定性"的核心理念。

---

## 三层分离

TKWF 的能力按"框架介入程度"分为三层：

```
┌────────────────────────────────────────────────────┐
│ 第一层：框架核心（essential，不可移除）               │
│  - AOP 拦截器 / SG 管线 / DomainUser / 本地事件总线   │
│  - DAC 抽象 / 事务管理器 / 缓存抽象 / 过滤器注册机制   │
│  - 特征：移除任一项框架不工作                         │
├────────────────────────────────────────────────────┤
│ 第二层：内置扩展（非核心，随框架发布）                 │
│  - 分布式事件总线 / Outbox-Inbox / 后台作业            │
│  - 分布式缓存 / 多租户 / 本地化                        │
│  - 特征：不是每个项目都需要，但很多扩展依赖            │
├────────────────────────────────────────────────────┤
│ 第三层：业务扩展（可选安装）                           │
│  - 权限管理 / 导航菜单 / 审计日志 / 设置 / Tag 服务     │
│  - 特征：按需安装，命名空间用 TKWF.Ext.*               │
└────────────────────────────────────────────────────┘
```

**判断一个能力属于哪一层**，三个问题：

1. **框架自身是否需要它？** 是 → 第一层（框架核心）
2. **默认实现是否够大多数场景？** 是 → 第一层（框架核心 + DI 覆盖）
3. **是否需要表结构/外部依赖/CRUD？** 是 → 第三层（业务扩展）

中间地带（框架自身不需要 + 默认实现不够 + 需要外部依赖但非表结构）→ 第二层（内置扩展）。

> **不存在"基础但非必备"的模糊地带**：非必备的一律是扩展。扩展之间通过"能力要求"声明依赖。

---

## 三类分离

框架能力的提供方式分为三类，按发现/触发时机区分：

| 类别 | 特征 | 例子 | 发现/触发 | DB Schema |
|:--|:--|:--|:--|:--|
| **Tools** | 纯编译期/开发期工具 | xCodeGen、契约比对测试、脚手架 | 手动/CI | ❌ |
| **Extensions** | 运行时功能，可能自带表结构 | Permission、Navigation、AuditLog | 编译期 SG | ✅ 可能 |
| **动态插件** | 运行时加载，处理特定场景 | Excel 模板兼容 | 运行时 | 可选 |

> **动态插件明确不进入框架核心**——运行时动态加载违背"编译期确定性"理念且存在合规性风险。未来可作为某个特殊扩展提供（如 `TKWF.Ext.PluginLoader`），但框架核心不内置。

---

## 三种模式

框架能力的提供方式有三种模式，按"框架介入程度"递减：

### 模式 1：框架核心接口 + 默认实现 + DI 覆盖

接口太基础、默认实现足够、特殊需求直接 DI 覆盖——不需要扩展机制。

| 能力 | 默认实现 | 覆盖方式 |
|:--|:--|:--|
| `IIDGenerator` | SnowflakeIdGenerator | DI 替换 |
| `ILocalEventBus` | 进程内 LocalEventBus | DI 替换 |
| `ICacheProvider`（本地） | MemoryCache | DI 替换 |
| `ITransactionManager` | FreeSqlTransactionManager | DI 替换 |

### 模式 2：框架核心接口 + 内置扩展提供实现

接口在框架核心（其他扩展可能声明能力要求），实现是可选内置扩展（需要外部依赖或表结构）。

| 能力 | 实现方 | 定位 |
|:--|:--|:--|
| `IDistributedEventBus` | `TKW.Framework.EventBus.RabbitMQ` | 需要 RabbitMQ |
| `IDistributedCache` | `TKW.Framework.Caching.Redis` | 需要 Redis |
| Outbox/Inbox | `TKW.Framework.Outbox` | 需要表结构 |
| 后台作业 | `TKW.Framework.BackgroundJobs` | 需要表结构 |

### 模式 3：业务扩展（全部在扩展中）

框架核心完全不知道该概念——纯业务功能（需要表、需要 CRUD、需要查询），打包为 `TKWF.Ext.*`。

| 能力 | 扩展包 | 说明 |
|:--|:--|:--|
| `IPermissionChecker` | `TKWF.Ext.Permissions` | RBAC 权限管理 |
| `IMenuManager` | `TKWF.Ext.Navigation` | 菜单数据模型 + 权限过滤 |
| `IAuditLogger` | `TKWF.Ext.AuditLogging` | 审计日志持久化 |
| `ISettingManager` | `TKWF.Ext.Settings` | 配置持久化 |
| `ITagService` | `TKWF.Ext.Tagging` | 标签管理（从框架核心迁出） |

---

## 如何启用扩展

### 安装扩展包

扩展以 NuGet 包形式分发（框架组非内置扩展用 `TKWF.Ext.*` 命名）：

```xml
<PackageReference Include="TKWF.Ext.Permissions" Version="1.0.0" />
```

安装后，SG1 在**编译期**扫描引用程序集中的 `[TKWFExtension]` 标记，自动发现扩展并生成注册代码——**无需手动 DI 注册**。

### 白名单声明（V4.9.85+ 必需）

> **发现 ≠ 启用（V4.9.85 ADR46 起）**：只引用扩展包不会生效——扩展被 SG1 发现但 `IsEnabled` 默认 `false`，三钩子（`ConfigureServices`/`ConfigureFilters`/`InitializeAsync`）不执行。必须在领域初始化器上显式声明白名单：

```csharp
using TKWF.Ext.Permissions;
using TKWF.Ext.Identity;

// 单个扩展
[TKWFEnabledExtension(typeof(PermissionExtensionInitializer<>))]
public class MyDomainInitializer : DomainHostInitializerBase<MyUserInfo> { ... }

// 多个扩展——AllowMultiple，每扩展一行
[TKWFEnabledExtension(typeof(PermissionExtensionInitializer<>))]
[TKWFEnabledExtension(typeof(IdentityExtensionInitializer<>))]
public class MyDomainInitializer : DomainHostInitializerBase<MyUserInfo> { ... }
```

`typeof(XxxExtensionInitializer<>)` 用**开放泛型**——SG1 从 `ContainingAssembly.Name` 推导扩展程序集名，运行时由框架填充具体的 `TUserInfo`。声明后扩展的能力清单（`GeneratedControllerCatalog`）被聚合进领域权威注册，三钩子才真正接线。

> 只引用扩展包但未声明白名单：扩展的 DI 注册、过滤器、种子数据都不会生效。这是编译期门控（ADR46 `TKWF0020`/ADR50 `TKWF0032`），非运行时配置。

### 查看扩展清单

扩展发现后，通过 `ITkExtensionContainer` 查看扩展清单（可注入单例）：

```csharp
public class MyHostInitializer : DomainHostInitializerBase<MyUserInfo>
{
    private readonly ITkExtensionContainer _extensions;

    public MyHostInitializer(ITkExtensionContainer extensions) => _extensions = extensions;

    public void ListExtensions()
    {
        foreach (var descriptor in _extensions.Extensions)
        {
            // ITkExtensionDescriptor: Name / Version / Description / InitializerType
            //   / IsAutoDiscovered / IsEnabled
            Console.WriteLine($"{descriptor.Name} v{descriptor.Version} - {descriptor.Description} (enabled: {descriptor.IsEnabled})");
        }
    }
}
```

> **V4.9.85 后 `ITkExtensionContainer` 语义变化**：扩展实例化已编译期化（ADR48 D4，SG 生成 `CreateInstances()`，零 `Activator.CreateInstance` 反射），`ITkExtensionContainer`/`ITkExtensionRegistry` 退化为"SG 生成集合的查询视图"。旧 `ConfigureExtensions(registry)` 按需启停降级为防御性覆盖——正常启用路径走 `[TKWFEnabledExtension]` 白名单。

### 命名规范

| 层级 | 命名空间 | NuGet 包 | 语义 |
|:--|:--|:--|:--|
| 框架核心+内置扩展 | `TKW.Framework.*` | `TKWF.*` | "这是框架的一部分"——不强调扩展身份 |
| 框架组非内置扩展 | `TKWF.Ext.*` | `TKWF.Ext.*` | "框架组出品，需单独安装" |
| 第三方扩展 | 任意 | 任意 | 不受约束 |

> **内置扩展的命名空间不强调"扩展"身份**——它已经是框架的一部分（如 `TKW.Framework.EventBus`）。非内置扩展用 `TKWF.Ext.*` 明确标出——用户一眼可辨"这是可选的"。

---

## 现有扩展清单

扩展模块全景（原 D17 §5，V4.9.80 剥离至扩展仓库）P0 共 11 个，**9/11 已实施**（V0.1.0+，独立版本）：

| 扩展 | 版本 | 说明 |
|:--|:--|:--|
| Permissions（权限） | V0.7.0 + V0.8.0 | 权限定义 / fail-closed 检查 / 编译期权限名校验（PERM001） |
| Identity（身份） | V0.1.0 | 用户 / 角色 / 用户角色分配 + 凭据验证 |
| Account（账户） | V0.1.0 | 账户锁定 + 密码重置流程 |
| Navigation（导航/菜单） | V0.1.0 | 菜单数据模型 / 贡献机制 / 权限过滤 |
| AuditLogging（审计日志） | V0.1.0 | 审计日志 FreeSql 存储 |
| Settings（设置） | V0.1.0 | 全局/用户级配置持久化 + 分层读取 |
| BlobStoring（二进制存储） | V0.1.0 | 大对象本地文件系统存储 |
| Emailing（邮件） | V0.1.0 | SMTP/MailKit 邮件发送 |
| DataDictionary（数据字典） | V0.1.0 | 字典定义 + 项 + 按编码查询 |
| Tagging（标签） | V0.1.0 | 标签提取 / 匹配 / 格式化 |

> P0 剩余：**PrintTemplates**（打印模板，需先写 ADR 定模板引擎选型）。完整清单/状态/路线图见扩展仓库 [`TKWF.Extensions`](https://github.com/LoongBa/TKWF.Extensions)（README 扩展一览表）与主框架私有 `03_扩展模块/总览和跟踪.md`。
>
> **V4.9.80 扩展独立仓库**：扩展代码/测试/指南从主框架迁至公开仓库 [`TKWF.Extensions`](https://github.com/LoongBa/TKWF.Extensions)，独立版本（v0.1.0 起）+ 独立 NuGet（规划）；各扩展有独立使用指南（`docs/{扩展}/...-使用指南.md`）。扩展模块开发文档（开发方案/ADR/总览跟踪）留在主框架 `03_扩展模块/`（私有）。本页聚焦扩展机制本身。

P1（推荐）模块约 25 个（后台任务、多租户、通知、本地化、限流、文件管理等），P2（按场景）约 20 个（CMS、支付、CRM、AI 等）——均作为扩展提供。

---

## 当前实施状态

扩展机制分阶段实施，当前已落地：

| 阶段 | 版本 | 内容 | 状态 |
|:--|:--|:--|:--|
| **Phase 1 基座** | V4.9.70 | 扩展契约（`TKWFExtensionAttribute` + `ExtensionInitializer<TUserInfo>`）、`FilterBuilder.Add<T>(FilterTier)`、SG1 编译期发现注册表、门控衔接（ADR35） | ✅ 已实施 |
| **Phase 2 接线基座** | V4.9.71 | 三钩子实际接线（`ConfigureServices`/`ConfigureFilters`/`InitializeAsync`）、扩展清单 API（`ITkExtensionContainer`/`ITkExtensionRegistry`）、按需启停（`IsEnabled`） | ✅ 已实施 |
| **Phase 2 业务模块** | V4.9.72-79 | 首批验证模块（Permissions/Navigation/Tagging）作为独立扩展包落地 | ✅ 已实施 |
| **Phase 3 收尾** | V4.9.75-77 | GateRules `SourceExtension` + DI 全图验证（`TKWF_DI001`）+ `FreeSqlPermissionStore` + 配置结构验证（`TKWF_OPT0xx`）+ 有状态扩展单例（D2） | ✅ 已实施 |
| **独立仓库化** | V4.9.80+ | 扩展迁至 `TKWF.Extensions` 公开仓库，独立版本；框架内核去泛型化（ADR42）配合扩展 SG1 化 | ✅ 已实施 |
| **门控体系** | V4.9.84-85 | 扩展模块引入门控（ADR46）+ 权威注册源上提（ADR47）+ 扩展机制编译期化（ADR48）+ 三层门控（ADR50） | ✅ 已实施 |
| ~~能力引用~~ | — | `RequiresCapability` / `ProvidesCapability` 声明式软依赖 | ⛔ 已废弃（ADR37 决策 5） |

> **结论**：扩展机制基座 + 接线 + 首批业务模块 + 收尾 + 独立仓库化 + 门控体系全部落地。现在就可以开发自己的扩展（见 [扩展机制：如何开发扩展](./development.md)），并直接参考 `TKWF.Extensions` 仓库中的官方扩展实现。

---

## 与门控的关系

扩展内部使用 `[DistributedEvent]` / `[BackgroundJob]` 等框架特性时，SG1 自动生成对应的 `GateRules` 门控条目（纳入 ADR35 统一门控验证），**扩展零手写门控代码**。若扩展依赖的运行时接线（如 `IDistributedEventBus`）未配置，启动时门控会报错。

> 门控三形态与具体规则见 [门控机制](../gates.md)。

---

## 进一步阅读

| 文章 | 说明 |
|:--|:--|
| [扩展机制：如何开发扩展](./development.md) | 扩展契约、三钩子、SG1 扫描、过滤器注册、开发工作流 |
| [门控机制](../gates.md) | 编译期 / 运行时启动期 / 配置期三形态 + ADR35 具体规则 |
| [事件总线与消息基础设施](../event-bus.md) | 本地/分布式事件总线（框架核心能力，扩展可依赖） |
| [后台作业](../background-jobs.md) | 后台作业基础设施（内置扩展） |
