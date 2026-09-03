---
title: 门控机制
description: TKWF 门控机制：编译期、运行时启动期、配置期三种形态与具体门控规则
---

# 门控机制

> TKWF 门控体系覆盖编译期、运行时启动期、配置期三种形态，确保"编译即验证，尽早发现"。
> 设计依据：[ADR35](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR35-统一运行时门控体系-编译期生成与初始化器自动验证.md) · ADR01/07/30/34 · V4.9.70

---

## 什么是门控

**门控**（Gate）= 框架在编译期或启动期自动检查"声明与配置是否一致"，不一致就报错或警告。核心目标：**尽早发现配置遗漏，而不是在首次调用时抛异常**。

传统框架的问题：缺 Outbox、缺 Provider、缺 Store 等场景都是**静默降级**或**首次调用时抛异常**——违背"编译即验证"理念。

---

## 三种门控形态

| 形态 | 时机 | 机制 | 覆盖范围 |
|:--|:--|:--|:--|
| **① 编译期门控** | 编译时 | SG 自诊断 / IsExposed 标志 / SG 诊断 Error | 包引用、方法暴露、BCL 双标注 |
| **② 运行时启动期门控** | 应用启动 | `ValidateRuntimeGates` + `GateRules`（ADR35） | 多租户、表结构、事件、Outbox |
| **③ 配置期门控** | `AddDomain` 调用时 | 门控校验 + `DomainException` | EntityDAC 未配、提取器未接线 |

---

## ① 编译期门控

### SG 自诊断（ADR01）

SG 编译失败时生成诊断信息而非静默降级，门禁机制（失败即阻断构建 + 明确错误定位）。

| 检查 | 诊断 ID | 行为 |
|:--|:--|:--|
| 包引用自检 | WRN_001 | Warning |
| SG2/SG3 共存检查 | — | Error |
| 消费项目缺框架控制器 | SG2ERR002/003 | Error |

### IsExposed 编译期标志（ADR07）

SG2 计算布尔标志 → SG3 过滤代码生成。方法级暴露控制——标记为不暴露的方法不生成客户端代理。

### BCL 双标注一致性（ADR28 #4）

SG 检查 `[Table("x")]` vs FreeSql `[Table(Name="y")]` 名称不一致——编译期 Error。

---

## ② 运行时启动期门控（ADR35，V4.9.70 已实施）

### 统一门控体系

V4.9.70 ADR35 将三套分散门控（SG 自诊断 / IsExposed / ADR30 能力即注册行为）统一为一套**编译期生成 + 运行时初始化器自动验证**。

**核心架构**：
```
SG1 扫描特性/声明 → 生成 GateRules 规则集到 ProjectMetaContext
     ↓
框架初始化器自动调用 OnValidateRuntimeGatesAsync(sp)
     ↓
ProjectMetaContext.ValidateRuntimeGates(RuntimeGateOptions)
     ↓
逐条规则检查 → 不通过抛 DomainException（启动期，非请求时）
```

**关键设计**：
- **规则在 `ProjectMetaContext`**（持有编译期元数据 + 运行时配置 `RuntimeGateOptions`）
- **初始化器自动调用**（`ServiceProviderBuiltCallbackAsync` → `OnValidateRuntimeGatesAsync`）
- **新增规则只改 `ProjectMetaContextBase.ValidateRuntimeGates`**，初始化器无需改

### 12 项门控缺口（ADR35 全量评审 ADR01-34 识别）

| # | ADR | 缺口描述 | 状态 |
|:--|:----|:---|:----|
| 1 | ADR30 | 表结构同步门控 | ✅ 已实现（范式范本） |
| 2 | ADR24 | `[DistributedEvent]` 存在但 Outbox 未配置 | ✅ V4.9.70 |
| 3 | ADR22 | `LocalDistributedEventBus` 静默降级（忘注册 Provider） | ✅ V4.9.70 |
| 4 | ADR28 | BCL `[Table("x")]` vs FreeSql `[Table(Name="y")]` 不一致 | ✅ 纯编译期 |
| 5 | ADR27 | `SchemaSyncStrategy=Migrations` 但无迁移文件 | ✅ V4.9.70 |
| 6 | ADR21 | `[DomainEventHandler]` 存在但 `AddEventDispatch()` 未调用 | ✅ V4.9.70 |
| 7 | ADR33 | RPC 路径非 `[DistributedEvent]` 事件可序列化性 | 编译期 |
| 8 | ADR28 | `ProjectMetaContext.Instance` 未在 `OnModelCreating` 前初始化 | ⏳ Phase 2 |
| 9 | ADR24 | `InboxProcessor` 配置但 `IDistributedLock` 未注册 | ✅ V4.9.70 |
| 10 | ADR21 | 孤儿事件：`AddEvent<T>()` 无匹配 `[DomainEventHandler]` | 编译期 |
| 11 | ADR25 | `EntityHistoryFilter` 注册但 `IEntityHistoryStore` 未在 DI | ✅ V4.9.70 |
| 12 | ADR23 | `[BackgroundJob]` 存在但 `IBackgroundJobManager` 未注册 | ✅ V4.9.70 |

> **共同模式**：SG 能在编译期检测**静态条件**（特性存在、类型可序列化、双标注名称一致、孤儿处理器），但"功能是否真的接线了"永远需要运行时信息（DI 注册、DB 表存在、配置值、Provider 存在）。

### 多租户门控（ADR34，V4.9.65）

| 门控 | 触发条件 | 修复 |
|:--|:--|:--|
| 加字段无实体 | `EnableTenantIsolation()` 启用但无 `IEntityTenant` 实体 | 实现 `IEntityTenant` 或移除启用 |
| 实体未隔离 | 有 `IEntityTenant` 实体但未启用任何隔离 | 启用隔离或移除标记 |
| 分库模板缺 {0} | `UseTenantDatabaseIsolation()` 但模板不含 `{0}` | 设置含 `{0}` 的模板 |

### 表结构同步门控（ADR30，V4.9.61）

| 环境 | 行为 |
|:--|:--|
| 开发 | 总放行（表结构自动同步） |
| 生产 | 仅 `AutoMigrateDatabase=true` 放行 |
| 未注册同步器 | LogWarning 而非静默跳过 |

> **V4.9.92（ADR49）调用面统一**：框架内置实体（Outbox/Inbox/InboxAppliedVersion/DistributedLock/JobRecord）与扩展实体建表责任收敛到 `SyncTables` 单一门控——SG1a 生成 `EntityAssemblies` 清单（消费方 + `TKWF.Core` + `TKWF.BackgroundJobs` + `[TKWFEnabledExtension]` 白名单内扩展程序集），`SyncTables` 遍历清单统一 `SyncStructure`；EF Core 路径 `ApplyFrameworkEntities` 将框架内置实体注册进消费方 DbContext（`Entity<T>()` 幂等，零配置建表）。既有迁移文件不回溯，消费方须 `dotnet ef migrations add` 捕获框架实体。

---

## ③ 配置期门控

### AddDomain 门控

`AddDomain` 调用时检查 `DomainOptions` 是否正确配置 EntityDAC：

| 检查 | 行为 |
|:--|:--|
| `EntityDACType == null && !ExplicitNoEntityDAC` | 抛 `DomainException`（未设 DAC） |
| 0 个匹配 Registrar | 抛 `DomainException`（配置阶段 fail-fast） |
| 非 `DomainOptions` 消费者 | 跳过（安全） |

### AddEventDispatch opt-in

`AddEventDispatch()` 未调用时，`PublishAsync` 在 AOP 路径不收集事件（V4.9.70+ ADR35 #6 生成 Warning 级门控）。

---

## ④ 编译期 DI 依赖验证（V4.9.75，`TKWF_DI001`）

扩展机制收尾新增的**编译期诊断**——SG1 扫描服务类构造函数，请求的接口若无框架特性注册且不在白名单，输出 `TKWF_DI001`：

```
TKWF_DI001: 'OrderService' 请求服务接口 'ICacheService' 但无框架特性注册
            （[DomainService] 等）——若为运行时手写注册请忽略；
            如需编译期校验可升级 TKWF_DI001_Severity=Error
```

| 项 | 说明 |
|:--|:--|
| 信号源 | `ClassMetadata.ConstructorParameterTypes`（SG 扫描构造函数参数类型） |
| 判定 | 参数接口无框架特性注册（`[DomainService]` 等 `ImplementedInterfaces`）且不在白名单 |
| 白名单 | `System.` / `Microsoft.` / `TKW.Framework.` 前缀，及泛型/基类/`IEnumerable` 场景 |
| 默认级别 | **`Warning`**（不破坏既有编译） |
| 升级方式 | `.csproj` 加 `<TKWF_DI001_Severity>Error</TKWF_DI001_Severity>` |
| 边界 | 不验证**运行时手写注册**（SG 看不到运行时代码） |

> 这是门控体系首次覆盖"**构造依赖能否被满足**"——此前只能靠启动时 DI 解析异常暴露，现在编译期即报。dry-run 全仓零误报。

### GateRules 扩展归属关联（`SourceExtension`）

`RuntimeGateRule` 新增 `SourceExtension` 属性，SG1 按**程序集归属**把特征门控规则关联到同程序集的扩展：

```
特征类型.ContainingAssembly == 扩展初始化器.ContainingAssembly
  → rule.SourceExtension = 该扩展名
  → 无匹配 → null（框架行为不变）
```

`OnValidateRuntimeGatesAsync` 据此判断：`Disable("Permissions")` 后，Permissions 扩展的 **Warning 级**规则跳过（不再误报），但 **Error 级不跳过**——安全门控不被弱化为 fail-open。框架内置的 3 条多租户门控 `SourceExtension = null`，行为完全不变。

---

## ⑤ 扩展模块门控（V4.9.84-89，ADR46/47/50）

扩展机制从"消费端过滤"演进到"领域自治 + 源头门控"，新增一批编译期诊断码（`D18A` 总表）：

| 诊断码 | 级别 | 场景 | 说明 |
|:--|:--|:--|:--|
| `TKWF0020` | Error | 领域项目启用了未 `[TKWFEnabledExtension]` 声明的扩展 | SG2 消费端拦截（ADR46） |
| `TKWF0021` | Warning | 领域项目白名单过滤 | SG1b 聚合层（ADR47） |
| `TKWF0022` | Error | 扩展项目引用扩展实现项目 | 源头禁令（ADR48/50） |
| `TKWF0030` | Error | 普通项目直接引用扩展程序集 | L1 门控（ADR50） |
| `TKWF0031` | Warning | 扩展项目缺 `[TKWFExtension]` 标记 | L2 门控（ADR50） |
| `TKWF0032` | Error | 领域项目引扩展但未 `[TKWFEnabledExtension]` 声明 | L3 门控（ADR50） |
| `TKWF0033` | Error | 普通项目声明 `[TKWFExtension]` | L1 门控（ADR50） |

**三层门控不变式（ADR50）**：只有领域项目可引用扩展程序集且须 `[TKWFEnabledExtension]` 声明——

```
L1 普通项目：直接引扩展 → TKWF0030 Error；声明 [TKWFExtension] → TKWF0033 Error
L2 扩展项目：引用扩展实现 → TKWF0022 Error；缺 [TKWFExtension] → TKWF0031 Warning
L3 领域项目：直接引扩展未声明 → TKWF0032 Error
```

**启用扩展的新方式（V4.9.84+）**：领域项目初始化器显式声明启用，SG1b 生成白名单：

```csharp
[TKWFEnabledExtension(typeof(PermissionExtensionInitializer<>))]  // 强类型白名单
public class MyHostInitializer : DomainHostInitializerBase<MyUserInfo> { ... }
```

> 门控作用面 = 激活 SG1b 的编译（WebApi/测试项目不激活 → 天然豁免）。扩展实例化已编译期化（ADR48 D4，SG 生成 `CreateInstances()`，零 `Activator.CreateInstance` 反射）。

---

## 严重级别

`RuntimeGateOptions.DefaultSeverity` 控制门控不通过时的行为：

| 级别 | 行为 |
|:--|:--|
| `Error` | 抛 `DomainException`，启动中断（fail-fast） |
| `Warning` | LogWarning，继续启动（降级容忍） |
| `Info` | 仅记录日志 |

> 每条规则可单独覆盖严重级别（`GetEffectiveSeverity(ruleId)`）。

---

## 常见问题

### Q: 门控报错怎么排查？
门控抛 `DomainException` 时消息含具体规则 ID + 修复指引。检查 `RuntimeGateOptions` 配置 + `ProjectMetaContext` 编译期元数据。

### Q: 如何自定义门控规则？
override `ProjectMetaContextBase.ValidateRuntimeGates`，在基类调用后追加自定义规则。`RuntimeGateOptions` POCO 可扩展字段。

### Q: 门控误报怎么办？
单条规则可降低严重级别（`GetEffectiveSeverity(ruleId)` 返回 `Warning`），但不应全局关闭——门控是"编译即验证"理念的核心。

---

## 版本演进

| 版本 | 能力 | ADR |
|:--|:--|:--|
| V4.9.15 | SG 自诊断门禁 | ADR01 |
| V4.9.32 | IsExposed 方法级暴露过滤 | ADR07 |
| V4.9.61 | 表结构同步门控 | ADR30 |
| V4.9.65 | 多租户运行时门控 | ADR34 |
| V4.9.70 | 统一门控体系（GateRules + 12 缺口） | ADR35 |
| V4.9.75 | 编译期 DI 依赖验证（`TKWF_DI001`）+ `SourceExtension` 扩展归属关联 | ADR37（决策 5 能力废弃）|
| V4.9.84 | 扩展模块引入门控（`TKWFEnabledExtension` 白名单 + `TKWF0020`） | ADR46 |
| V4.9.85 | 权威注册源上提（ADR47）+ 扩展机制编译期化（ADR48）+ 三层门控（`TKWF0030-33`） | ADR47/48/50 |

---

## 相关文档

- [ADR35 统一运行时门控体系](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-迭代开发/ADR/ADR35-统一运行时门控体系-编译期生成与初始化器自动验证.md)
- [多租户](multi-tenancy.md) §启动期门控校验
- [Web 集成](../integration/web.md) §表结构同步门控
- [后台作业](background-jobs.md) §现状边界