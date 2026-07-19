# MAUI 集成

`TKWF.Domain.Maui` 让 MAUI 应用集成 TKWF 领域框架，支持离线场景和远程调用。

---

## 安装

```shell
dotnet add package TKWF.Domain.Maui
```

## 配置

```csharp
// MauiProgram.cs
builder.ConfigMauiDomain<AppUserInfo, AppDomainInitializer>()
    .UseApiClient<AppUserInfo>(options =>
    {
        options.BaseUrl = "https://api.example.com";
        options.Transport = TransportType.GraphQL;
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
        // 支持离线读取
        return await Repository.SelectAsync();
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