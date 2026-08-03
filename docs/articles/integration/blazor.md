---
title: Blazor 集成
description: Blazor 集成：在 Blazor Server/WASM 中使用 TKWF 领域框架
---
# Blazor 集成

`TKWF.Domain.Blazor` 让 Blazor Server / WASM 应用无缝集成 TKWF 领域框架。

---

## 安装

```shell
dotnet add package TKWF.Domain.Blazor
```

## 配置

### Blazor Server

```csharp
// Program.cs
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>()
    .UseBlazor()                           // Blazor 集成
    .UseGraphQLApiService<AppUserInfo>()   // 或 UseRestApiService
    .Build();
```

### Blazor WASM

```csharp
// Program.cs
builder.ConfigWebAssemblyDomain<AppUserInfo, AppDomainInitializer>()
    .UseApiClient<AppUserInfo>(options =>
    {
        options.BaseUrl = "https://api.example.com";
    });
```

## 在组件中使用

```razor
@* Pages/TodoPage.razor *@
@inject DomainUser<AppUserInfo> User
@inject TodoServiceClient Client

<h3>@User.UserInfo.DisplayName 的待办事项</h3>

@if (todos is null)
{
    <p>加载中...</p>
}
else
{
    <ul>
    @foreach (var todo in todos)
    {
        <li>@todo.Title — @(todo.IsDone ? "✅" : "⬜")</li>
    }
    </ul>
}

@code {
    private List<Todo>? todos;

    protected override async Task OnInitializedAsync()
    {
        todos = await Client.GetTodosAsync();
    }
}
```

## 自动注入

Blazor 集成自动注册以下服务：

| 服务 | 生命周期 | 说明 |
|:-----|:---------|:-----|
| `DomainUser<AppUserInfo>` | Scoped | 当前用户 |
| `TodoServiceClient` | Scoped | 自动生成的客户端代理 |
| `IAuthenticationService` | Scoped | 认证服务 |

## 参考

- [MAUI 集成](maui.md)
- [Web 集成](web.md)
- [ApiClient 详解](../client/api-client.md)