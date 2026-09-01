---
title: 导航扩展：TKWF.Ext.Navigation
description: 导航扩展使用指南：菜单项定义/贡献者、IMenuManager 树形组装 + 权限过滤（All/Any）、checker 缺失降级、贡献者同步化
---
# 导航扩展：TKWF.Ext.Navigation

> TKWF 导航扩展提供**菜单数据模型与贡献机制**——菜单项定义（名称/层级/权限）、菜单管理器（组装 + 权限过滤），**不涉及菜单渲染**（渲染是业务 UI 层的事）。
> 使用指南：[G17B（已迁 TKWF.Extensions）](https://github.com/LoongBa/TKWF.Extensions/blob/main/docs/Navigation/%E5%AF%BC%E8%88%AA%E6%89%A9%E5%B1%95-%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · 设计：[D17 §4.2](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D17-TKWF%E6%89%A9%E5%B1%95%E6%9C%BA%E5%88%B6%E4%B8%8E%E4%B8%9A%E5%8A%A1%E6%A8%A1%E5%9D%97%E5%85%A8%E6%99%AF-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) · 决策：ADR39 · V4.9.74

---

## 为什么需要导航扩展

框架核心不内置菜单系统——菜单是业务层关注点，不同项目菜单结构差异巨大。但每个项目都要重新造轮子（菜单数据模型、权限过滤、树形组装）既低效又容易出错。

导航扩展提供**标准化的菜单数据模型 + 贡献机制**，让业务模块声明式贡献菜单项，框架负责树形组装和权限过滤——**业务只管声明，框架管编排**。

> **ABP 对比**：ABP 的 `INavigationManager` + `IMenuProvider` 类似此设计，但 TKWF 的关键差异在**贡献者发现机制**——ABP 运行时反射扫描 `IMenuContributor` 实现，TKWF 用 SG1 编译期扫描 `[MenuContributor]` 标记生成类型清单（零运行时反射，镜像 Permissions 机制）。

---

## 架构全景

```
┌──────────────────────────────────────────────────────────────┐
│ 消费方项目（App.csproj）                                      │
│                                                                │
│  [MenuContributor]                                            │
│  class MainMenuContributor : IMenuContributor                 │
│  { ConfigureMenu(ctx) => ctx.Add("Orders", parent=null)      │
│                         => ctx.Add("Orders.Create", ...) }   │
│                                                                │
│  <PackageReference Include="TKWF.Ext.Navigation" />           │
│    └─ 传递引用带入 TKWF.Ext.Permissions                       │
└──────────────────────────┬───────────────────────────────────┘
                           │ 编译期引用程序集
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ SG1 编译期扫描（ReferencedAssemblySymbols）                    │
│                                                                │
│  ① 扫描 [TKWFExtension("Navigation")] → 扩展初始器类型清单    │
│  ② 扫描 [MenuContributor] → 贡献者类型清单                    │
│  ③ 生成 typeof(global::{FullName}) 编译期类型引用             │
│  ④ 写入 ProjectMetaContext.MenuContributors 桥               │
└──────────────────────────┬───────────────────────────────────┘
                           │ 启动时
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ NavigationExtensionInitializer 三钩子                          │
│                                                                │
│  ConfigureServices（DI 构建前，同步）                          │
│    → 读 ProjectMetaContext.MenuContributors                   │
│    → Activator.CreateInstance(contributorType)  无参构造       │
│    → contributor.ConfigureMenu(context)  ★同步 void            │
│    → 填充 IMenuDefinitionRepository                            │
│    → TryAdd 注册 IMenuManager + IMenuDefinitionRepository    │
│                                                                │
│  ConfigureFilters（空——菜单不注册 AOP 过滤器）                 │
│  InitializeAsync（空）                                         │
└──────────────────────────┬───────────────────────────────────┘
                           │ 运行时查询
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ IMenuManager.GetMenuAsync                                     │
│                                                                │
│  ① 从 IMenuDefinitionRepository 取全部 MenuItemDefinition     │
│  ② 树形组装（Parent 引用关联）                                │
│  ③ 深度优先排序（深度, Order）                                 │
│  ④ 循环检测（ComputeDepths 成环 → InvalidOperationException） │
│  ⑤ 权限过滤：                                                  │
│     ├─ RequiredPermissions 非空？                              │
│     │   ├─ IPermissionChecker 已注册？                         │
│     │   │   ├─ 是 → 检查 All/Any → 不过滤/过滤                │
│     │   │   └─ 否 → ★降级不过滤（返回全菜单）                 │
│     │   └─ RequiredPermissions 为空 → 不过滤                  │
│  ⑥ 返回扁平 MenuItemDefinition[]（前端据 Parent 建树）        │
└──────────────────────────────────────────────────────────────┘
```

---

## 快速入门

### Step 1：启用导航扩展

消费方引用 `TKWF.Ext.Navigation` 包（传递引用带入 Permissions）。扩展经 `[TKWFExtension("Navigation")]` 被 SG1 自动发现，三钩子自动接线——**无需手动注册**：

```xml
<!-- 消费方 .csproj -->
<ProjectReference Include="..\Framework\Navigation\TKWF.Ext.Navigation.csproj" />
```

扩展自动注册：`IMenuManager`（默认 `MenuManager<TUserInfo>`）+ `IMenuDefinitionRepository`。

### Step 2：贡献菜单项

业务模块用 `[MenuContributor]` 标记一个实现 `IMenuContributor` 的类：

```csharp
[MenuContributor]
public class MainMenuContributor : IMenuContributor
{
    public void ConfigureMenu(MenuConfigurationContext context)
    {
        // 顶层菜单
        context.Add(new MenuItemDefinition
        {
            Name = "Orders",
            DisplayName = "订单",
            Url = "/orders",
            Icon = "orders",
            Order = 1
        });

        // 子菜单（Parent 指向顶层 Name）
        context.Add(new MenuItemDefinition
        {
            Name = "Orders.Create",
            DisplayName = "创建订单",
            Url = "/orders/create",
            Parent = "Orders",
            Order = 1
        });

        // 权限过滤：仅"订单查看"权限的用户可见
        context.Add(new MenuItemDefinition
        {
            Name = "Orders.Reports",
            DisplayName = "订单报表",
            Url = "/orders/reports",
            Parent = "Orders",
            Order = 2,
            RequiredPermissions = new[] { "Order.View" }
        });
    }
}
```

SG1 扫描 `[MenuContributor]` → 生成 `GeneratedMenuContributors` → 启动时扩展初始化器实例化贡献者、同步调用 `ConfigureMenu()` 收集菜单项（ConfigureServices 阶段）。

### Step 3：获取菜单

注入 `IMenuManager` 获取菜单：

```csharp
public class MenuService
{
    private readonly IMenuManager _menuManager;
    public MenuService(IMenuManager menuManager) => _menuManager = menuManager;

    public async Task<MenuItemDefinition[]> GetMainMenuAsync()
        => await _menuManager.GetMainMenuAsync();   // 便捷入口 = GetMenuAsync("Main")
}
```

返回**扁平** `MenuItemDefinition[]`，按 `(深度, Order)` 排序（顶层优先、父子相邻）——前端据 `Parent` 引用建树渲染。

---

## 核心概念

| 概念 | 说明 |
|:--|:--|
| 菜单项（MenuItemDefinition） | 菜单数据——Name/DisplayName/Url/Icon/Order/Parent/RequiredPermissions |
| 菜单贡献者（IMenuContributor） | 业务模块贡献菜单项的类，`[MenuContributor]` 标记 |
| 菜单管理器（IMenuManager） | 组装树形菜单 + 权限过滤 |
| 菜单定义仓库（IMenuDefinitionRepository） | 收集的菜单项存储（ConfigureServices 阶段填充） |

### 与权限扩展的集成

菜单项关联 `RequiredPermissions`，`IMenuManager` 用 `IPermissionChecker`（来自 `TKWF.Ext.Permissions`）运行时过滤——无权限的菜单项不返回给前端。

| 集成点 | 说明 |
|:--|:--|
| 依赖 | Navigation 经编译期 ProjectReference 引用 Permissions（ADR39 D1） |
| 过滤 | `RequiredPermissions` 非空 → `IPermissionChecker` 判定（All/Any） |
| checker 缺失 | **降级不过滤**（返回全菜单——菜单是展示层非安全边界，安全由 `[RequirePermission]` 兜底） |

---

## 设计原理

### 为什么 checker 缺失降级不过滤（ADR39 D3）

这是最关键的设计决策。Permissions 扩展是 fail-closed（checker 缺失 → `[RequirePermission]` 抛异常），为什么菜单不也 fail-closed？

**两者安全层不同**：

| 维度 | PermissionFilter（API 边界） | MenuManager（展示层） |
|:--|:--|:--|
| 职责 | 阻止未授权的**操作**执行 | 过滤不显示的**菜单项** |
| 失败后果 | 安全漏洞（未授权操作执行了） | 菜单项可见但点击被拒（无害） |
| 兜底机制 | 无——fail 必须拒绝 | `[RequirePermission]` 方法级权限门兜底 |
| 正确默认 | fail-closed（拒绝） | fail-open（返回全菜单） |

如果菜单也 fail-closed：消费方未启用 Permissions（未注册 store）→ `IMenuManager` 抛异常 → 整个菜单系统崩溃。这不合理——菜单是展示层数据，不应因为安全基础设施未配置而瘫痪。

**正确策略**：菜单降级不过滤（返回全菜单），无权限用户可能看到菜单项，但点击后 API 会被 `PermissionFilterAttribute` 兜底拒绝。安全不破。

> ⚠ 若业务要求"未授权用户**绝不能**看到菜单项存在"，需消费方自定义 `IPermissionChecker` 或在前端渲染层过滤。框架默认行为是降级——展示层不阻塞。

### 为什么贡献者同步化（ADR39 D5 / Oracle H1）

D17 §4.2 早期设计 `IMenuContributor.ConfigureMenuAsync`（异步），但 V4.9.74 落地时改为**同步 void** `ConfigureMenu`（ADR39 D5）。原因：

```
ExtensionInitializer 三钩子时序：
  ConfigureServices  ← 同步 void（DI 构建前调用）
  ConfigureFilters  ← FilterBuilder 构建阶段
  InitializeAsync   ← Task（系统就绪后，无 IServiceProvider 参数）
```

`ConfigureServices` 是同步 void 钩子——无法 `await`。`InitializeAsync` 虽是 Task 但无 `IServiceProvider` 参数，拿不到 DI。异步贡献者**无合法调用时机**——这是 D17 设计的真实缺陷。

**修正**：`ConfigureMenu` 改为同步 void，在 `ConfigureServices` 阶段收集。这与 Permissions 的 `IPermissionDefinitionContributor.Define()`（同步 void）对齐——贡献者都是纯声明式（`context.Add(...)`），无异步 IO 诉求。

> ⚠ 异步加载菜单（数据库/远程）不适用——菜单定义应在编译期/启动期确定性收集，运行时动态数据归 `IMenuManager` 扩展点。

### 为什么循环检测（ADR39 D6 / Oracle L1）

菜单项 `Parent` 指向另一个菜单项的 `Name`。如果 A→B→A 成环，树形组装会无限递归。`MenuManager` 的 `ComputeDepths` 算法在计算深度时检测成环，抛 `InvalidOperationException`——防无限递归崩溃。

### 为什么多菜单组暂不支持

`GetMenuAsync(string menuName)` 的 `menuName` 参数当前**忽略**——`GetMenuAsync("Main")` 与 `GetMenuAsync("Admin")` 返回相同。多菜单组（Main/Admin/Mobile）是已规划的前瞻扩展点，V4.9.74 单一菜单定义集已覆盖大多数场景。后续版本按需落地。

---

## 菜单管理器行为

### 树形组装与排序

| 行为 | 说明 |
|:--|:--|
| 排序 | `(深度, Order)`——浅层优先，同级按 Order 小值在前 |
| 非法 Parent | Parent 指向不存在的项 → 该菜单项归为顶层 |
| 循环检测 | Parent 成环（A→B→A）→ 抛 `InvalidOperationException`（防无限递归） |

### 权限过滤（All / Any）

| Logic | 语义 | 示例 |
|:--|:--|:--|
| `PermissionLogic.All`（默认） | 所有所需权限都授予才可见 | `RequiredPermissions = ["Order.View", "Order.Edit"]` → 两权限都有才显示 |
| `PermissionLogic.Any` | 任一所需权限授予即可见 | `RequiredPermissions = ["Sale.View", "Admin.View"], Logic = Any` → 销售或管理员任一可见 |

### checker 缺失降级

消费方未注册 `IPermissionChecker`（未启用 Permissions 的 store）→ `IMenuManager` **不过滤**（返回全菜单）。这是设计决策（ADR39 D3）：菜单是展示层数据，安全由方法级 `[RequirePermission]` 兜底——无权限用户可能看到菜单项，但点击后 API 会被拒绝。

---

## 设计要点与边界

### 表现层边界

Navigation 扩展只定义"菜单项有什么"（名称、层级、关联权限），**不定义"菜单怎么渲染"**。渲染是业务 UI 层的事——返回的扁平 `MenuItemDefinition[]` 由前端据 `Parent` 引用建树渲染（Blazor/React/Vue 各自实现）。

### 已知边界（V4.9.74）

| 边界 | 说明 | 规划 |
|:--|:--|:--|
| 菜单渲染 | 不提供——只定义"菜单项有什么"，渲染归业务 UI 层 | 消费方职责 |
| TS Client 菜单元数据 | 未实现（扩展仓库弱增强） | 留后续迭代 |
| 异步贡献者 | 不支持——`ConfigureMenu` 是同步（ConfigureServices 同步钩子约束） | 设计约束 |
| 多菜单组 | `GetMenuAsync(menuName)` 参数当前忽略 | 前瞻扩展点 |

### 常见反模式

| 反模式 | 说明 | 正确做法 |
|:--|:--|:--|
| 在 `ConfigureMenu` 里做 IO/数据库查询 | 贡献者应纯声明式；ConfigureServices 阶段无 DI | 菜单定义静态声明，动态数据放 `IMenuManager` 扩展 |
| 菜单项 Name 重复 | `MenuConfigurationContext.Add` 抛异常 | 全局唯一 Name（层级关联用） |
| 依赖菜单过滤做安全 | 菜单是展示层，checker 缺失时不过滤 | 安全用 `[RequirePermission]`（fail-closed） |
| 在贡献者里读配置/解析 JSON | 贡献者是编译期/启动期确定性收集，不应有运行时依赖 | 静态声明菜单项，动态数据走运行时查询 |

---

## FAQ

**Q: 如何让菜单项按角色显示？**
菜单按权限过滤（`RequiredPermissions`）。角色→权限的映射由 `IPermissionStore` 实现决定——若角色即权限，store 返回角色对应权限的授予即可。

**Q: 菜单项支持多级嵌套吗？**
支持。`Parent` 指向任意层级的菜单项 Name（顶层 Parent=null），无层级限制（有循环检测保护）。

**Q: 能按菜单组（Main/Admin）区分吗？**
V4.9.74 暂不支持分区（单一菜单集）。多菜单组是前瞻扩展点，后续版本落地。

**Q: 不用 Permissions 扩展能用 Navigation 吗？**
能。Navigation 传递引用带 Permissions 程序集，但不注册 store 时 checker 缺失 → 菜单不过滤（返回全菜单）。安全由方法级权限门兜底。

**Q: 为什么 `ConfigureMenu` 是同步的，不是异步？**
`ExtensionInitializer.ConfigureServices` 是同步 void 钩子（DI 构建前调用），无法 `await`。异步贡献者无合法调用时机——这是 D17 §4.2 原设计的真实缺陷，V4.9.74 修正为同步（Oracle H1）。

---

## 进一步阅读

| 文章 | 说明 |
|:--|:--|
| [权限扩展](./permissions.md) | 权限定义 + `[RequirePermission]` + `IPermissionChecker`（Navigation 的过滤依赖） |
| [扩展机制：如何使用](./usage.md) | 三层分离、三类分离、启用扩展的接入方式 |
| [扩展机制：如何开发扩展](./development.md) | 扩展契约、三钩子、SG 扫描、过滤器注册 |
| [认证与授权](../../security/authorization.md) | AuthorityFilter 角色授权（与权限扩展并存） |