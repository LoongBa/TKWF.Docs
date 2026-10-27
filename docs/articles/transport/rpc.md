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
# 客户端核心（含 GraphQL 传输，基座包）
dotnet add package TKWF.Domain.Api

# REST 传输（可选，按需）
dotnet add package TKWF.Domain.Api.Rest
```

> **注**：不存在 `TKWF.Domain.ApiClient.GraphQL` 包——GraphQL 能力含于基座包 `TKWF.Domain.Api`（csproj 项目名 `ApiClient`，发布包名 `TKWF.Domain.Api`）。

## 配置客户端

```csharp
// 客户端 Program.cs —— 真实入口 UseApiClient（签名以源码为准）
var gql = new GraphQLClient("https://api.example.com");   // 或 RestClient
builder.Services.UseApiClient<AppUserInfo>(gql, options =>
{
    // DomainClientOptions：IsDevelopment / ApplicationName / AutoRedirectOnAuthRequired / LoginUrl 等
    // 协议选择器是 ApiClientType，无 Transport/TransportType/BaseUrl/Timeout 选项
});
```

## 使用客户端

SG3 自动生成强类型客户端代理，经 `AddApiServices` 注册进 DI：

```csharp
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

> **提示**：`ApiMetadata` 是客户端契约唯一事实源（SG3 纯消费，ADR81/93）——服务端契约字段变化后客户端不重新生成会静默 400。错误处理走三层事件模型（`DomainClientUser.OnAuthRequired/OnAuthFailed/OnServiceError`）。

## 传输协议选择

| 协议 | 包 | 选择器 | 特点 |
|:-----|:---|:-----|:-----|
| GraphQL | 基座包 `TKWF.Domain.Api` | `ApiClientType.GraphQL` | 灵活查询、按需取字段 |
| REST | `TKWF.Domain.Api.Rest` | `ApiClientType.Rest` | 简单直接、HTTP 标准 |

## 参考

- [GraphQL 客户端](../client/graphql-client.md)
- [REST 客户端](../client/rest-client.md)
- [ApiClient 详解](../client/api-client.md)