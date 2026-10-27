---
title: 代码生成管线
description: 代码生成管线详解：SG1a/SG1b/SG2a/SG2b/SG3 五生成器 + SG4 诊断族的职责与扩展
---
# 代码生成管线

TKWF 的编译期生成体系由 **SG1a/SG1b/SG2a/SG2b/SG3 五个生成器** + **SG4 诊断族**组成：在编译期自动生成 API 表面、传输端点、客户端代理和 AOP 控制器。**SG4 不是独立生成器类**——`EVT001-005` 事件诊断由 `ApiServiceGenerator.DomainEventHandler.cs`（SG2a 的 partial）发射（详见 `D18A` §一）。

> **a/b 分工铁律**：**a 出 meta，b 出 code**。SG1a 只出元数据，不生成任何业务代码文件；接口/控制器/装饰器全部由 SG1b 生成。

---

## 管线总览

```
┌─────────────────────────────────────────────────────────┐
│            领域项目编译期（Source Generator）              │
│                                                         │
│  SG1a ──→ 扫描 [DomainGenerateCode] Entity/枚举/服务      │
│           生成 {Entity}Meta.g.cs + ProjectMetaContext    │
│           （Entity/DataService/Service 注册 partial）     │
│                                                         │
│  SG1b ──→ 扫描 A 路径（手写 Controller）+ B 路径（[GenerateController] Service）
│           生成 {Contract}Controller/Interface/Decorator  │
│           三件套（B 路径）+ 扩展三层门控 + 页面注册表       │
└──────────────┬──────────────────────────────────────────┘
               │ 同解决方案编译：SG2 用 GetTypeByMetadataName
               │ 读 Domain 程序集中的接口（无文件传递）
               ▼
┌─────────────────────────────────────────────────────────┐
│             WebApi 项目编译期                            │
│  SG2a ──→ 为 IAopContract 生成 GraphQL Resolver + REST 端点（能力探测择一：无 HotChocolate 包→无 GraphQL 产物；无 MinimalApi→无 REST）
│  SG2b ──→ 从 Resolver 符号模型递归收集类型 → ApiMetadata.g.cs（结构化契约）
└──────────────┬──────────────────────────────────────────┘
               │ MSBuild 复制到 .TKWF/{域}/（稳定路径）
               ▼
┌─────────────────────────────────────────────────────────┐
│             客户端项目编译期                             │
│  SG3 ──→ 读 ApiMetadata（GetTypeByMetadataName）         │
│           生成代理类 + Surrogate 接口 + 类型存根 + DI 注册│
└─────────────────────────────────────────────────────────┘
```

**四条不可违反的管线纪律**：

| # | 纪律 | 违反后果 |
|---|---|---|
| 1 | `ProjectMetaContext` 是**唯一元数据源**；SG2 不自扫控制器、SG3 不自发现类型 | 双份扫描 → 契约漂移（ADR07/18） |
| 2 | 管线内**零运行时反射**（编译期用 Roslyn 符号，运行时读 `ProjectMetaContext` 实例） | AOT 崩、启动慢 |
| 3 | SG2b 发射结构化分类，SG3 **纯消费零推导** | G11/G19 双份推导链分叉（ADR81/93） |
| 4 | **能力探测择一**：无 HotChocolate → 无 GraphQL 产物；无 MinimalApi → 无 REST | 编译 CS0400 / 运行时 fail-fast（ADR95） |

## SG1a — 元数据提取

扫描 `[DomainGenerateCode]` 标记的 Entity / 枚举 / 服务 / DataService，生成 `{Entity}Meta.g.cs` 与 `_ProjectMetaContext` 注册 partial。

**职责：**
- 提取 Entity / Enum / Service / DataService 元数据
- 生成 `_ProjectMetaContext` Entity/DataService/Service 注册 partial + GateRules
- **只出 meta，不出业务代码**（接口/控制器/装饰器在 SG1b）

## SG1b — 控制器生成（A 路径 / B 路径）

为两类 Controller 生成契约接口与装饰器：

| 路径 | 输入 | 生成物 |
|:--|:--|:--|
| **A 路径（手写）** | 手写 `Controller`（继承 `DomainControllerBase`，实现 `IAopContract`） | `I{Controller}.g.cs` 契约接口 |
| **B 路径（生成）** | 标注 `[GenerateController]` 的 Service 类 | `{Contract}Controller`/`Interface`/`Decorator` 三件套 |

### 方法提取规则（V4.9.40+）

SG1b（ControllerGenerator）的方法提取由 `ServiceMethodExtractor` 统一执行，**所有提取路径都汇聚到同一套过滤链**。规则如下（按优先级）：

| 优先级 | 规则 | 行为 |
|--------|------|------|
| 1 | 非 public / static / override / 非普通方法 | 跳过 |
| 2 | 泛型方法 | 跳过——生成的控制器/接口无法声明泛型类型参数 |
| 3 | 框架级排除名（`get_`/`set_`/`GetType`/`Equals`/`ToString` 等） | 跳过 |
| 4 | 用户 `ExcludeMethods` 通配符 | 跳过 |
| 5 | **含 `Expression<Func<...>>` 参数**（V4.9.28 硬过滤） | 跳过——**即使被 IncludeMethods / `[GenerateControllerMethod]` 显式包含也强制跳过**。HC GraphQL / REST 无法序列化 `Expression`，此类通用查询方法只能通过**业务方法封装**暴露 |
| 6 | `whiteList` 白名单（调用方传入时） | 仅提取匹配的方法 |
| 7 | `methodPredicate` 自定义谓词 | 按属性/方法名过滤 |

> **硬过滤语义**（优先级 5）：Expression 参数过滤是**参数类型级**的绝对约束，与方法名/特性控制正交。`IncludeMethods`、`ExcludeMethods`、`[GenerateControllerMethod]`、白名单全部基于方法名操作，无法绕过参数类型过滤。远程契约（HC GraphQL / REST）只能暴露可序列化的业务化方法，通用查询能力留在领域层内部。

## SG2a — 服务端端点生成

为所有 `IAopContract` 接口生成 GraphQL Resolver + REST 端点。**接入层唯一代码形状 `await _user.Use<IContract>().MethodAsync(args)`**——不直接注入 Service，也不从 DI 取 `DomainUser`（`DomainUser` 永不进 DI，经 `Use<T>()` 帧内 AsyncLocal 传递）。

### GraphQL 输出

```csharp
// 自动生成（示意）：*Resolver.g.cs——经 user.Use<IContract>() 走 AOP
public class GreetingServiceResolver
{
    public async Task<string> SayHello(
        DomainUser<AppUserInfo> user,
        string name)
    {
        var svc = user.Use<IGreetingServiceController>();
        return await svc.SayHelloAsync(name);
    }
}
```

> **示例提示**：`DomainUser` 由 `Use<T>()` 帧内 AsyncLocal 提供，**不从 DI / 参数注入解析**（`DomainUser` 永不进 DI）。接入层唯一代码形状是 `await user.Use<IContract>().MethodAsync(args)`。

### REST 输出

```csharp
// 自动生成（示意）：*RestEndpoints.g.cs
public static class GreetingServiceEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/api/greeting/sayHello/{name}", async (
            string name,
            IGreetingServiceContract contract) =>
        {
            // 端点签名由 SG2 按契约生成；DomainUser 经帧内解析，不进 DI
            return await contract.SayHelloAsync(name);
        });
    }
}
```

## SG3 — 客户端代理生成（客户端项目编译期）

生成强类型客户端，远程调用如同本地方法。SG3 读 SG2b 产出的 `ApiMetadata`（纯消费，零推导）：

```csharp
// 自动生成：*Client.g.cs
public class GreetingServiceClient
{
    private readonly HttpClient _http;

    public async Task<string> SayHelloAsync(string name)
    {
        var response = await _http.GetAsync($"/api/greeting/sayHello/{name}");
        return await response.Content.ReadFromJsonAsync<string>();
    }
}
```

## SG1b（续）— AOP 控制器生成

B 路径下，为标注 `[GenerateController]` 的 Service 生成控制器接口和装饰器（三件套之一，与 SG2a 端点生成分别在 Domain / WebApi 项目编译期发生）：

```csharp
// 自动生成：I*Controller.g.cs
public interface IGreetingServiceController
{
    Task<string> SayHelloAsync(string name);
}

// 自动生成：*ControllerDecorator.g.cs
public class GreetingServiceControllerDecorator
    : IGreetingServiceController
{
    public async Task<string> SayHelloAsync(string name)
    {
        // AOP 拦截注册在此执行
        // [AuthorityFilter]、[Transactional] 等在此生效
        var service = _user.Use<GreetingService>();
        return await service.SayHelloAsync(name);
    }
}
```

## 扩展代码生成

### 自定义 SG

你可以创建自己的 Source Generator 与 TKWF 管线集成：

```csharp
[Generator]
public class MyCustomGenerator : ISourceGenerator
{
    public void Execute(GeneratorExecutionContext context)
    {
        // 读取 TKWF 的 Controller 元数据
        // 生成自定义代码（如 OpenAPI 文档、gRPC 服务定义等）
    }
}
```

## 在 AI 编码场景中的优势

### 全自动管道

```
AI 写 Service 代码
    ↓
编译时 SG1b 生成 AOP 控制器（接口 + 装饰器）
    ↓
SG2a 生成 GraphQL + REST 端点（WebApi 项目）
    ↓
SG3 生成客户端代理（客户端项目）
    ↓
无需手写任何管道代码
```

### 声明式驱动

AI 只需标注 `[GenerateController]`，框架自动完成所有管道工作。
不需要理解 ASP.NET 的路由注册、GraphQL 的类型配置、HTTP 客户端的序列化。

## 参考

- [AOP 管线详解](aop-pipeline.md)
- [GraphQL 传输](../transport/graphql.md)
- [REST 传输](../transport/rest-minimal-api.md)
- [RPC 客户端](../client/api-client.md)