---
title: GraphQL 传输
description: GraphQL 传输：基于 HotChocolate 16 的 GraphQL 端点配置与查询
---
# GraphQL 传输

基于 HotChocolate 16，TKWF 自动为所有 Controller 生成 GraphQL Resolver，
无需手写 GraphQL 配置。

---

## 启用 GraphQL

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>()
    .UseWebSession()
    .UseGraphQLApiService<AppUserInfo>()   // ← 自动注册 GraphQL
    .Build();
```

## 自动生成的查询

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

```graphql
type Query {
  todos: [Todo!]!
}

type Mutation {
  createTodo(title: String!, content: String!): Todo!
}
```

### 契约先行模式

手写的 Controller 同样自动生成 Resolver：

```csharp
public class TodoController<TUserInfo> : ControllerBase<TUserInfo>
    where TUserInfo : IUserInfo
{
    public async Task<List<Todo>> GetTodosAsync() { ... }
}
```

## 自定义 GraphQL 配置

```csharp
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(options =>
{
    options.GraphQL = new GraphQLOptions
    {
        EnablePlayground = true,           // 启用 GraphQL Playground
        MaxComplexity = 100,               // 查询复杂度限制
        EnablePersistedQueries = false,    // 持久化查询
    };
});
```

## 注意事项

1. **命名约定** — 方法名自动映射为 GraphQL 字段名（`SayHelloAsync` → `sayHello`）
2. **复杂类型** — 自动生成 GraphQL 类型定义，嵌套对象、集合、枚举均支持
3. **授权集成** — `[AuthorityFilter]` 在 GraphQL 层同样生效

## 参考

- [REST 传输](rest-minimal-api.md)
- [RPC 传输](rpc.md)
- [代码生成管线](../core-concepts/code-generation.md)