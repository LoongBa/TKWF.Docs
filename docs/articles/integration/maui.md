---
title: MAUI 集成
description: MAUI 集成：跨平台客户端集成 DomainUser 体系
---
# MAUI 集成

`TKWF.Domain.Maui` 让 MAUI 应用集成 TKWF 领域框架，支持离线场景和远程调用。

---

## 安装

```shell
dotnet add package TKWF.Domain.Maui
```

## 配置

```csharp
// MauiProgram.cs（签名以源码/脚手架为准：泛型 + 节名 + Action<TOptions> 形态）
var gql = new GraphQLClient("https://api.example.com");   // 协议选择器 ApiClientType.GraphQL
builder.ConfigMauiDomain<AppUserInfo, AppDomainInitializer, DomainWebOptions>(
        "DomainOptions", cfg => { })
    .UseApiClient<AppUserInfo>(gql, options =>
    {
        // DomainClientOptions（无 BaseUrl/Transport 选项；协议经 ApiClientType）
    })
    .Build();
```

## 离线场景

MAUI 集成支持离线优先的数据访问模式：

```csharp
// 本地优先：先读本地缓存，再同步远程
public class OfflineTodoService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    public async Task<List<Todo>> GetTodosAsync()
    {
        // 经 SG1 生成的 DataService（框架无 Repository 构件）
        return await User.Use<TodoDataService>().SelectAsync(e => true);
    }
}
```

## 平台适配

| 平台 | 支持 |
|:-----|:-----|
| Android | ✅ |
| iOS | ✅ |
| Windows | ✅ |
| macOS | ✅ |

## 参考

- [Blazor 集成](blazor.md)
- [Web 集成](web.md)
- [ApiClient 详解](../client/api-client.md)