---
title: 5 分钟快速开始
description: 5 分钟快速开始：从 NuGet 安装到 [GenerateController] 标注生成 GraphQL+REST 双端点的完整闭环
---
# 5 分钟入门

本指南带你从零创建一个带 AOP 拦截、GraphQL 暴露的领域服务。

---

## 前置条件

- .NET 10 SDK
- NuGet 包引用 `TKWF.Domain` + 对应传输层包

## 第一步：安装 NuGet 包

```shell
dotnet add package TKWF.Domain
dotnet add package TKWF.Domain.ApiService.HotChocolate  # GraphQL
dotnet add package TKWF.Domain.Web                      # Web 集成
```

## 第二步：实现用户信息

```csharp
// Domain/AppUserInfo.cs
public class AppUserInfo : IUserInfo
{
    public string UserName { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string? Email { get; set; }
    public List<string> Roles { get; set; } = new();
}
```

## 第三步：编写领域服务

```csharp
// Domain/Services/GreetingService.cs
[GenerateController]                     // ← 触发 SG#4 代码生成
public class GreetingService(
    DomainUser<AppUserInfo> user)        // ← DomainUser 自持实例化
    : DomainServiceBase<AppUserInfo>(user)
{
    public async Task<string> SayHelloAsync(string name)
    {
        var currentUser = User.UserInfo.UserName;
        return $"Hello {name}! (from {currentUser})";
    }
}
```

> `[GenerateController]` 只需一个标注，SG 自动生成控制器、接口、Resolver。无需手写 Controller。

## 第四步：配置主机

```csharp
// Program.cs
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>()
    .UseWebSession()
    .UseGraphQLApiService<AppUserInfo>()
    .Build();

app.Run();
```

## 第五步：查询

```graphql
query {
  sayHello(name: "World")
}
```

返回：

```json
{
  "data": {
    "sayHello": "Hello World! (from admin)"
  }
}
```

## 你刚刚完成了什么？

| 步骤 | 自动生成的内容 |
|:-----|:--------------|
| `[GenerateController]` | AOP 控制器接口 + 装饰器 |
| 主机配置 | Session 中间件 + GraphQL 端点 |
| 客户端使用 | 自动生成 Resolver，无需手写 |

## 下一步

- 添加 `[AuthorityFilter]` 保护方法 → [授权指南](security/authorization.md)
- 使用 `[Transactional]` 包裹多步写入 → [AOP 管线](core-concepts/aop-pipeline.md)
- 探索 RPC 远程过程调用 → [RPC 传输](transport/rpc.md)
- 完整配置选项 → [配置参考](advanced/configuration.md)