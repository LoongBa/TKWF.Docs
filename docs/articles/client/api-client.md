---
title: ApiClient 核心
description: ApiClient 核心：RPC 客户端核心机制与使用
---
# ApiClient 核心

`TKWF.Domain.ApiClient` 提供强类型的 RPC 客户端基础设施。

---

## 安装

```shell
dotnet add package TKWF.Domain.ApiClient
```

## 客户端生成

SG#3 自动为每个 Controller 生成对应的客户端代理：

```csharp
// 源码：服务器端 Service
[GenerateController]
public class GreetingService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    public async Task<string> SayHelloAsync(string name) { ... }
}

// 自动生成：客户端代理
// 客户端使用
public class MyViewModel
{
    private readonly GreetingServiceClient _client;

    public MyViewModel(GreetingServiceClient client)
    {
        _client = client;
    }

    public async Task LoadAsync()
    {
        var result = await _client.SayHelloAsync("World");
    }
}
```

## 配置

```csharp
builder.Services.AddApiClient<AppUserInfo>(options =>
{
    options.BaseUrl = "https://api.example.com";
    options.Transport = TransportType.GraphQL;  // 或 Rest
    options.Timeout = TimeSpan.FromSeconds(30);
    options.TokenProvider = new TokenProvider();
});
```

## 自定义 Token 提供器

```csharp
public class TokenProvider : ITokenProvider
{
    public async Task<string?> GetTokenAsync()
    {
        // 从 SecureStorage 或本地缓存获取 Token
        return await SecureStorage.GetAsync("session_token");
    }
}
```

## 错误处理

```csharp
try
{
    var result = await _client.SayHelloAsync("World");
}
catch (ApiClientException ex) when (ex.StatusCode == 401)
{
    // 未授权，重新登录
}
catch (ApiClientException ex) when (ex.StatusCode == 422)
{
    // 参数验证失败
}
```

## 参考

- [GraphQL 客户端](graphql-client.md)
- [REST 客户端](rest-client.md)
- [RPC 传输](../transport/rpc.md)