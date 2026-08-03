---
title: REST 传输
description: REST 传输：基于 Minimal API 的 REST 端点配置与使用，含 ?fields 投影
---
# REST 传输

基于 ASP.NET Minimal API，TKWF 自动为所有 Controller 生成 REST 端点。

---

## 启用 REST

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>()
    .UseWebSession()
    .UseRestApiService<AppUserInfo>()      // ← 自动注册 REST 端点
    .Build();
```

## 自动生成的端点

### 标注驱动模式

```csharp
[GenerateController]
public class TodoService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    public async Task<List<Todo>> GetTodosAsync()
    {
        return await Repository.SelectAsync();
    }

    public async Task<Todo> CreateTodoAsync(string title, string content)
    {
        // ...
    }
}
```

自动生成：

```http
GET  /api/todo/getTodos
POST /api/todo/createTodo  {"title": "...", "content": "..."}
```

### 契约先行模式

手写 Controller 同样自动注册：

```csharp
public class TodoController<TUserInfo> : ControllerBase<TUserInfo>
    where TUserInfo : IUserInfo
{
    public async Task<List<Todo>> GetTodosAsync() { ... }
}
```

## 路由约定

| 方法签名 | HTTP 方法 | 路由 |
|:---------|:----------|:-----|
| `GetTodosAsync()` | GET | `/api/{controller}/getTodos` |
| `CreateTodoAsync(input)` | POST | `/api/{controller}/createTodo` |
| `UpdateTodoAsync(id, input)` | PUT | `/api/{controller}/updateTodo` |
| `DeleteTodoAsync(id)` | DELETE | `/api/{controller}/deleteTodo` |

路由前缀可配置：

```csharp
options.Rest = new RestApiOptions
{
    RoutePrefix = "api/v1",
    EnableOpenApi = true,        // 自动生成 OpenAPI 文档
};
```

## 参考

- [GraphQL 传输](graphql.md)
- [RPC 传输](rpc.md)
- [代码生成管线](../core-concepts/code-generation.md)