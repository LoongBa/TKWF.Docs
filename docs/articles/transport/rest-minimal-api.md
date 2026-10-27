---
title: REST 传输
description: REST 传输：基于 Minimal API 的 REST 端点配置与使用，含 ?fields 投影
---
# REST 传输

基于 ASP.NET Minimal API，TKWF 自动为所有 Controller 生成 REST 端点。

---

## 启用 REST

```csharp
// 脚手架四阶段链：REST 经 UseApiService 的 UseRest 节启用（非独立 UseRestApiService）
var app = builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer, DomainWebOptions>(
        "DomainOptions", cfg => { })
    .UseWebSession(o => { })
    .UseApiService(opt =>
    {
        opt.UseGraphQL("/graphql");
        opt.UseRest("/api");          // ← 自动注册 REST 端点（Minimal API）
    })
    .Build(...);
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
        // 经 SG1 生成的 DataService（框架无 Repository 构件）
        return await User.Use<TodoDataService>().SelectAsync(e => true);
    }

    public async Task<Todo> CreateTodoAsync(string title, string content)
    {
        // ...
    }
}
```

自动生成（SG2a 产出 REST 端点）：

```http
GET  /api/todo/getTodos
POST /api/todo/createTodo  {"title": "...", "content": "..."}
```

### 契约先行模式

手写 Controller（A 路径，继承 `DomainControllerBase<TUserInfo>`）同样自动注册：

```csharp
public class TodoController : DomainControllerBase<AppUserInfo>, ITodoController
{
    public TodoController(DomainUser<AppUserInfo> user) : base(user) { }
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

### 两级路由前缀（v4.10.85 用户裁定）

REST 路由前缀分**两级**，各级**显式空串**有独立语义：

| 级别 | 来源 | 空串语义 |
|:--|:--|:--|
| **第一级 base** | `TKWF:Api:RestBasePath`（默认 `/api`）；`ApiServiceOptions.UseRestWithoutBasePath()` 入口 | **显式 `""` → 跳过第一级**（而非回退 `/api`） |
| **第二级 模块** | 扩展 `[ExtensionModule("key", "default-prefix")]` 的 `DefaultPrefix`，可经 `TKWF:Api:Modules:{Key}:Prefix` 覆盖 | **显式 `""` → 清除模块前缀** |

> **注意**：`UseApiService`（默认路径）与 `UseRestWithoutBasePath`（无 base 路径）两条路径需**独立对齐两步**——改动前缀语义时两条路径都要验证（v4.10.85 skill 新增自查项）。

> **声明式端点（v4.10.82 F13）**：扩展 REST 端点经 `IWebExtension.DeclareEndpoints(registry)` + `registry.MapGenerated<TFacade>()` 生成化声明（DTO 首参 body 绑定 + 类型化异常 ErrorCode 映射），不再手写 minimal API；注册表是全仓唯一端点登记通道（详见 [扩展机制使用](../explanation/extensions/usage.md) §Web 扩展装配）。

## 参考

- [GraphQL 传输](graphql.md)
- [RPC 传输](rpc.md)
- [代码生成管线](../core-concepts/code-generation.md)