---
title: GraphQL 客户端
description: GraphQL 客户端：GraphQL 客户端配置与查询
---
# GraphQL 客户端

`TKWF.Domain.ApiClient` 提供基于 GraphQL 的 RPC 客户端实现（GraphQL 传输含于基座包，无独立 `TKWF.Domain.ApiClient.GraphQL` 包）。

---

## 安装

```shell
# GraphQL 传输在基座包内，无需单独安装 GraphQL 包
dotnet add package TKWF.Domain.ApiClient
```

## 配置

```csharp
// 协议选择器为 ApiClientType；无 Transport/TransportType 选项
builder.Services.ConfigWasmClient<AppUserInfo>("https://api.example.com", options =>
{
    options.IsDevelopment = true;
})
    .UseApiClient(ApiClientType.GraphQL);
```

## 特性

- **强类型查询** — 自动生成客户端代理，编译期类型安全
- **按需取字段** — 支持 Select 表达式选择返回字段

## 示例

```csharp
// 按需取字段
var summary = await _client.GetTodosAsync(
    select: t => new { t.Id, t.Title }  // 只取 Id 和 Title
);
```

## 参考

- [ApiClient 核心](api-client.md)
- [REST 客户端](rest-client.md)
- [GraphQL 传输](../transport/graphql.md)