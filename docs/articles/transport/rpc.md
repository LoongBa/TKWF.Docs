---
title: RPC 远程过程调用
description: RPC 远程调用：通过 ApiClient 实现远程过程调用
---
# RPC 远程过程调用

TKWF.ApiClient 提供强类型的 RPC 客户端，远程调用领域服务如同调用本地方法。

---

## 架构

```
客户端应用                   服务器
┌────────────┐          ┌────────────┐
│ ApiClient  │ ──RPC──→ │  Service   │
│ (SG#3 生成)│ ←─────── │  (自动暴露) │
└────────────┘          └────────────┘
```

## 安装客户端包

```shell
# 基础客户端
dotnet add package TKWF.Domain.ApiClient

# 按传输协议选择
dotnet add package TKWF.Domain.ApiClient.GraphQL   # GraphQL 传输
dotnet add package TKWF.Domain.ApiClient.Rest       # REST 传输
```

## 配置客户端

```csharp
// 客户端 Program.cs
builder.Services.AddApiClient<AppUserInfo>(options =>
{
    options.BaseUrl = "https://api.example.com";
    options.Transport = TransportType.GraphQL;
    options.TokenProvider = new TokenProvider();  // 提供认证 Token
});
```

## 使用客户端

SG#3 自动生成强类型客户端代理：

```csharp
// 自动生成 — 通过 DI 注入
public class MyAppService
{
    private readonly TodoServiceClient _todoClient;

    public MyAppService(TodoServiceClient todoClient)
    {
        _todoClient = todoClient;
    }

    public async Task RunAsync()
    {
        // 远程调用如同本地方法
        var todos = await _todoClient.GetTodosAsync();
        var created = await _todoClient.CreateTodoAsync("Title", "Content");
    }
}
```

## 传输协议选择

| 协议 | 包 | 特点 |
|:-----|:---|:-----|
| GraphQL | `ApiClient.GraphQL` | 灵活查询、按需取字段 |
| REST | `ApiClient.Rest` | 简单直接、HTTP 标准 |

## 参考

- [GraphQL 客户端](../client/graphql-client.md)
- [REST 客户端](../client/rest-client.md)
- [ApiClient 详解](../client/api-client.md)