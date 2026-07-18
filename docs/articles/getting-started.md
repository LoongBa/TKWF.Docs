# 5 分钟入门

## 前置条件

- .NET 10 SDK
- NuGet 包引用 `TKWF.Domain` + 对应传输层包

## 第一步：安装 NuGet 包

```shell
dotnet add package TKWF.Domain
dotnet add package TKWF.Domain.ApiService.HotChocolate  # GraphQL
dotnet add package TKWF.Domain.Web                      # Web 集成
```

## 第二步：实现用户信息

```csharp
// Domain/AppUserInfo.cs
public class AppUserInfo : IUserInfo
{
    public string UserName { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string? Email { get; set; }
    public List<string> Roles { get; set; } = new();
}
```

## 第三步：编写领域服务

```csharp
// Domain/Services/GreetingService.cs
[GenerateController]                     // ← 触发 SG#4 代码生成
public class GreetingService(
    DomainUser<AppUserInfo> user)        // ← DomainUser 自持实例化
    : DomainServiceBase<AppUserInfo>(user)
{
    public async Task<string> SayHelloAsync(string name)
    {
        var currentUser = User.UserInfo.UserName;
        return $"Hello {name}! (from {currentUser})";
    }
}
```

## 第四步：配置主机

```csharp
// Program.cs
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>()
    .UseWebSession()
    .UseGraphQLApiService<AppUserInfo>()
    .Build();

app.Run();
```

## 第五步：查询

```graphql
query {
  sayHello(name: "World")
}
```

返回：

```json
{
  "data": {
    "sayHello": "Hello World! (from admin)"
  }
}
```

## 下一步

- 添加 `[AuthorityFilter]` 保护方法
- 使用 `[Transactional]` 包裹多步写入
- 探索 RPC 远程过程调用
