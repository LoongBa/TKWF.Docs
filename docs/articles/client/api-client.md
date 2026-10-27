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

> **代理生成范围（v4.10.87 ADR113）**：SG3 只为**已暴露**方法生成代理，暴露判定与 SG2 端点发射条件逐项对齐（服务级 `ExposeToGraphQL`/`ExposeToRest` + 方法级 `[ApiExpose]` + 宿主是否具备 ASP.NET Core）。服务端显式关闭两条通道的方法（如 `[ApiExpose(ExposeGraphQL = false, ExposeRest = false)]`）**不会**出现在客户端代理里——升级后代理方法可能减少，**编译期即可发现**，按需调整调用点即可。

## 配置

真实入口为 `UseApiClient`（UseApiClientExtensions.cs）：直接传入 `IApiClient` 实例与 `DomainClientOptions`。协议选择器是 `ApiClientType`，**无 Transport/TransportType/BaseUrl/Timeout 选项**。

```csharp
var gql = new GraphQLClient("https://api.example.com");
services.UseApiClient<AppUserInfo>(gql, new DomainClientOptions
{
    IsDevelopment = true,
    ApplicationName = "MyApp",
    // DomainClientOptions 仅含 IsDevelopment / ApplicationName / WasmContextExtractorTypes
    // （认证跳转类选项 AutoRedirectOnAuthRequired / LoginUrl / LogOnServiceError 位于 DomainClientUserOptions）
});

// WASM 宿主亦可使用链式形态（ConfigWasmClient → UseApiClient(ApiClientType.GraphQL)）：
// services.ConfigWasmClient<AppUserInfo>("https://api.example.com", options => { })
//     .UseApiClient(ApiClientType.GraphQL);
```

## Token 设置与会话恢复

不存在 `ITokenProvider`。Token 由传输客户端自持（`GraphQLClient.SetToken`），或经登录结果自动写入：

```csharp
// 方式一：手动设置 Token（兼容模式，GraphQLClient.cs）
var gql = new GraphQLClient("https://api.example.com");
gql.SetToken("session-token");

// 方式二：会话恢复 —— DomainClientUser 构造时自动从 ISessionStore 恢复
//（RestoreSession 将持久化的 SessionKey 同步到全部已注册传输客户端）
var user = DomainClient<AppUserInfo>.Root!.NewGuestUser();
```

## 错误处理

不存在 `ApiClientException`。错误链路为三层：领域 `DomainException` → 服务端 `DomainErrorFilter` / `WebExceptionMiddleware(ProblemDetails)` → 客户端事件订阅：

```csharp
var user = DomainClient<AppUserInfo>.Root!.NewGuestUser();

user.OnAuthRequired += async () =>
{
    // 会话过期/未登录 —— 跳转登录页
    navigation.NavigateTo(user.Options.LoginUrl);
};

user.OnAuthFailed += async () =>
{
    // 登录失败（用户名/密码错误）
    await dialog.ShowMessageAsync("用户名或密码错误");
};

user.OnServiceError += async ex =>
{
    // 通用服务端错误（403 无权限 / 400 校验失败等）
    // 事件触发后异常仍会抛出，组件层仍可 try-catch 做针对性处理
};
```

请求仍会以 `DomainException` 抛出：语义码经 `extensions.code` 映射后写入 `DomainException.ErrorCode`（如 `AUTH_REQUIRED`），由 `DomainClientUser.HandleErrorAsync` 分发到对应事件。

## 参考

- [GraphQL 客户端](graphql-client.md)
- [REST 客户端](rest-client.md)
- [RPC 传输](../transport/rpc.md)