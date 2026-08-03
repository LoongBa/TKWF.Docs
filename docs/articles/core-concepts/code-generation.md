---
title: 代码生成管线
description: 代码生成管线详解：SG#1~#4 四层 Source Generator 的职责与扩展
---
# 代码生成管线

TKWF 内置 4 个 Source Generator（SG#1~#4），在编译期自动生成 API 表面、
传输端点、客户端代理和 AOP 控制器。

---

## 管线总览

```
┌─────────────────────────────────────────────────────────┐
│                   编译期（Source Generator）              │
│                                                         │
│  SG#1 ──→ 扫描框架内置 Controller                       │
│           生成 API 表面元数据                             │
│                                                         │
│  SG#2 ──→ 为所有 Controller 生成传输层端点               │
│           GraphQL Resolver / REST 端点                   │
│                                                         │
│  SG#3 ──→ 生成客户端代理                                 │
│           远程调用如同本地方法                             │
│                                                         │
│  SG#4 ──→ 为 [GenerateController] 生成 AOP 控制器       │
│           控制器接口 + 装饰器                             │
└─────────────────────────────────────────────────────────┘
```

## SG#1 — 元数据扫描

扫描框架识别的 Controller 类型，收集 API 表面信息。

**职责：**
- 识别所有 Controller 类
- 提取方法签名、参数、返回类型
- 为后续 SG 提供元数据输入

## SG#2 — 传输层端点生成

为所有 Controller 生成 GraphQL Resolver 和 REST 端点。

### GraphQL 输出

```csharp
// 自动生成：*Resolver.g.cs
[ExtendObjectType(typeof(Query))]
public class GreetingServiceResolver
{
    public async Task<string> SayHello(
        [Service] GreetingService service,
        string name)
    {
        return await service.SayHelloAsync(name);
    }
}
```

### REST 输出

```csharp
// 自动生成：*RestEndpoints.g.cs
public static class GreetingServiceEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/api/greeting/sayHello/{name}", async (
            string name,
            [FromServices] DomainUser<AppUserInfo> user) =>
        {
            var service = user.UseNoAop<GreetingService>();
            return await service.SayHelloAsync(name);
        });
    }
}
```

## SG#3 — 客户端代理生成

生成强类型客户端，远程调用如同本地方法：

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

## SG#4 — AOP 控制器生成

为标注 `[GenerateController]` 的 Service 生成控制器接口和装饰器：

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
        var service = _user.UseNoAop<GreetingService>();
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
编译时 SG#4 生成 AOP 控制器
    ↓
SG#2 生成 GraphQL + REST 端点
    ↓
SG#3 生成客户端代理
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