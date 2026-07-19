# GraphQL 客户端

`TKWF.Domain.ApiClient.GraphQL` 提供基于 GraphQL 的 RPC 客户端实现。

---

## 安装

```shell
dotnet add package TKWF.Domain.ApiClient.GraphQL
```

## 配置

```csharp
builder.Services.AddApiClient<AppUserInfo>(options =>
{
    options.BaseUrl = "https://api.example.com/graphql";
    options.Transport = TransportType.GraphQL;
});
```

## 特性

- **强类型查询** — 自动生成客户端代理，编译期类型安全
- **按需取字段** — 支持 Select 表达式选择返回字段
- **批量查询** — 支持 GraphQL 批量操作
- **订阅** — 支持 GraphQL Subscription（实时推送）

## 示例

```csharp
// 按需取字段
var summary = await _client.GetTodosAsync(
    select: t => new { t.Id, t.Title }  // 只取 Id 和 Title
);

// 批量查询
var batch = await _client.BatchAsync(new[]
{
    _client.GetTodosAsync(),
    _client.GetUserProfileAsync()
});
```

## 参考

- [ApiClient 核心](api-client.md)
- [REST 客户端](rest-client.md)
- [GraphQL 传输](../transport/graphql.md)