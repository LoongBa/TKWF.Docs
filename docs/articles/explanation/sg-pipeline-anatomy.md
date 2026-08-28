---
title: 三层 SG 管线解剖
description: 解剖 TKWF 四层 Source Generator 管线（SG#1~#4），理解全自动代码生成链路
---
# 三层 SG 管线解剖

> 源文档：[D07](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07-%E4%B8%89%E5%B1%82SG-%E5%8E%9F%E5%88%99%E5%92%8C%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) · [D07A](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D07A-RPC-%E8%BF%9C%E7%A8%8B%E8%BF%87%E7%A8%8B%E8%B0%83%E7%94%A8-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88V2.md) · V4.9.41

---

## 一句话总结

TKWF 的 SG 管线只有**三层**：SG1（领域层元数据提取）→ SG2（WebApi 层端点生成）→ SG3（客户端层代理生成）。没有 SG4。整个管线是**元数据传递链**，不是三个独立扫描器。

---

## 三层 SG 总览

```
┌─────────────────────────────────────────────────────────┐
│ SG1（领域层）                                            │
│                                                          │
│ SG1a: EntityMetadataGenerator                            │
│   → 提取 Entity / Enum 元数据                             │
│   → 生成 _ProjectMetaContext.g.cs（元数据注册）            │
│   → 生成 GateRules（门控规则）                             │
│                                                          │
│ SG1b: ControllerGenerator                                │
│   → 为 [GenerateController] 生成 Controller/Interface     │
│   → 为手写 Controller 生成 Interface                      │
│   → 聚合 InterfaceNames → ProjectMetaContext              │
│   → 生成 GeneratedExtensionInitializers（扩展发现注册表）  │
└──────────────────────┬──────────────────────────────────┘
                       │ ProjectMetaContext（元数据）
                       ↓
┌─────────────────────────────────────────────────────────┐
│ SG2（WebApi 层）                                         │
│                                                          │
│ SG2a: ApiServiceGenerator                                │
│   → 为 IAopContract 生成 GraphQL Resolver + REST 端点     │
│                                                          │
│ SG2b: ApiMetaGenerator                                   │
│   → 从控制器实现类基类链递归收集类型                        │
│   → 导出结构化 ApiMetadata（控制元数据 → 客户端类型映射）   │
└──────────────────────┬──────────────────────────────────┘
                       │ ApiMetadata（结构化元数据）
                       ↓
┌─────────────────────────────────────────────────────────┐
│ SG3（客户端层）                                          │
│                                                          │
│ ClientMetadataGenerator                                  │
│   → 读取 SG2 的 ApiMetadata                               │
│   → 生成客户端代理（GraphQL 请求构造 + 类型定义）          │
│   → 生成 EntityFieldList（实体字段注册）                   │
└─────────────────────────────────────────────────────────┘
```

---

## SG1：元数据提取层

### 职责

SG1 是整个管线的**基础**——提取领域层的全部元数据（Entity / Service / DataService / Enum / Controller），生成 `ProjectMetaContext`。

### SG1a：EntityMetadataGenerator

```csharp
// 扫描 [DomainGenerateCode] 标记的 Entity
[DomainGenerateCode]
public class TodoItem : IDomainEntity
{
    public long Id { get; set; }
    public string Title { get; set; } = "";
    public bool IsDone { get; set; }
}

// SG1a 生成：
// _ProjectMetaContext.g.cs
public partial class ProjectMetaContext
{
    public ProjectMetaContext()
    {
        // Entity 元数据注册
        _allMetadatas.Add(TodoItemMeta.Metadata);
        // Enum 元数据注册
        _allMetadatas.Add(OrderStatusMeta.Metadata);
    }
}
```

### SG1b：ControllerGenerator

```csharp
// 为 [GenerateController] 生成 Controller + Interface
[GenerateController(typeof(ITodoService))]
public class TodoServiceImpl : TodoDataService, ITodoService { }

// SG1b 生成：
// TodoServiceController.cs（GraphQL Resolver + REST 端点）
// IAopContract（AOP 拦截器契约）
// GeneratedExtensionInitializers（扩展发现注册表）
```

### 元数据合约

SG1 生成的元数据通过 `ProjectMetaContext` 传递给 SG2：

```csharp
// ProjectMetaContext 包含全部元数据
public partial class ProjectMetaContext
{
    public IReadOnlyList<ClassMetadata> AllMetadatas => _allMetadatas;
    // 包含：Entity / Service / DataService / Enum / Controller
}
```

---

## SG2：服务端生成层

### 职责

SG2 读取 SG1 的 `ProjectMetaContext`，为每个 `IAopContract` 接口生成 **GraphQL Resolver + REST 端点**。

### SG2a：ApiServiceGenerator

```csharp
// SG2 为 ITodoService 生成：
// TodoServiceController.cs

[Route("api/TodoService")]
public class TodoServiceController : DomainControllerBase<DmpUserInfo>(User)
{
    // GraphQL Resolver
    [GraphQLName("todoService")]
    public async Task<TodoItemDto?> GetAsync(long id) { /* ... */ }

    // REST 端点
    [HttpGet("Get")]
    public async Task<TodoItemDto?> Get(long id) { /* ... */ }
}
```

### SG2b：ApiMetaGenerator

SG2b 从控制器实现类**基类链递归**收集类型，导出结构化 `ApiMetadata`：

```csharp
// 控制器继承链：
// TodoServiceImpl → TodoDataService → DomainDataServiceBase<DmpUserInfo, TodoItem, TodoItemDto>

// SG2b 递归收集：
// TodoItem（Entity）
// TodoItemDto（DTO）
// DmpUserInfo（User）
// → 导出 ApiMetadata（类型映射）
```

**关键设计**：SG2b 不扫描源码，只从 `ProjectMetaContext` 读取元数据——遵循"SG 管线不允许反射"原则。

---

## SG3：客户端生成层

### 职责

SG3 读取 SG2 的 `ApiMetadata`，为客户端（Blazor WASM / MAUI）生成代理代码。

### 生成产物

```csharp
// SG3 为 TodoItem 生成：
// TodoItemConnection.g.cs（HC 标准 Connection 类型）
// TodoItemFieldList.g.cs（实体字段注册）

// SG3 为 ITodoService 生成：
// TodoServiceClientProxy.g.cs（客户端代理）
```

### EntityFieldList（V4.9.35+）

```csharp
// SG3 生成实体字段注册（客户端查询用）
public static class TodoItemEntityFieldList
{
    public static readonly string[] Fields = ["Id", "Title", "IsDone", "CreateTime"];
}
```

---

## 元数据传递链

### 核心原则

| 原则 | 说明 |
|:--|:--|
| **ProjectMetaContext 是唯一元数据源** | SG1 生成，SG2 读取，SG3 从 SG2 间接读取 |
| **SG 管线不允许反射** | 编译时用 Roslyn 符号 API，运行时直接使用 `ProjectMetaContext` 实例 |
| **SG2 不自行发现控制器** | 只从 `ProjectMetaContext` 读取接口名列表 |
| **SG3 不自行发现类型** | 只读 SG2 的 `ApiMetadata` |

### 数据流

```
源代码
  ↓ SG1 扫描
ProjectMetaContext（Entity / Service / Enum / Controller 元数据）
  ↓ SG2 读取
ApiMetadata（控制器元数据 → 客户端类型映射）
  ↓ SG3 读取
客户端代理（GraphQL 请求构造 + 类型定义）
```

---

## 编译期验证三件套

SG 管线在编译期执行三项验证：

| 验证 | 时机 | 失败后果 |
|:--|:--|:--|
| **门控验证** | SG1 生成 `GateRules` → 运行时启动期验证 | 启动失败（缺少依赖） |
| **DI 全图验证** | SG1 生成注册代码 → 编译期检查依赖链 | 编译失败（缺少注册） |
| **配置结构验证** | SG1 生成配置 Schema → 编译期检查配置 | 编译失败（配置错误） |

---

## 进一步阅读

- [为什么 AOP 编译期生成](./aop-by-design.md) — 编译期 vs 运行时 AOP 对比
- [控制器路径选型](../decision-guides/choose-controller-path.md) — 自动生成 vs 手写 Controller
- [传输协议选型](../decision-guides/choose-transport.md) — GraphQL vs REST vs RPC 选型
- [扩展机制：如何开发扩展](./extensions-development.md) — SG1 扫描扩展契约
