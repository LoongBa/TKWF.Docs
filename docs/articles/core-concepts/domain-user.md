# DomainUser 详解

`DomainUser<TUserInfo>` 是 TKWF 框架的核心抽象——它代表"当前操作的用户"，
持有用户身份信息并控制领域服务的实例化。

---

## 为什么需要 DomainUser？

传统 ASP.NET 应用中，用户身份通过 `HttpContext.User` 传递，领域层需要依赖
`IHttpContextAccessor` 才能获取当前用户。这导致：

- **领域层耦合 Web 基础设施**
- **测试困难**（需要 mock HttpContext）
- **AI 生成代码时需要理解 Web 上下文**

DomainUser 将用户身份从基础设施中剥离，成为领域层的一等公民：

```csharp
// 不再需要 IHttpContextAccessor
public class OrderService(DomainUser<AppUserInfo> user)  // ← 直接注入
    : DomainServiceBase<AppUserInfo>(user)
{
    public async Task<List<Order>> GetMyOrdersAsync()
    {
        // 直接使用 User.UserId 获取当前用户
        return await Repository.Where(o => o.UserId == User.UserId).ToListAsync();
    }
}
```

## 核心机制

### 自持实例化

DomainUser 不依赖 DI 容器，而是通过 `User.Use<TService>()` / `User.UseNoAop<TService>()`
显式实例化领域服务：

```csharp
// 通过 DomainUser 实例化服务
var service = user.UseNoAop<OrderService>();
// service 的 User 必然指向当前 user，不可能串号
```

### 两种实例化模式

| 方法 | 行为 | 适用场景 |
|:-----|:-----|:---------|
| `Use<TService>()` | 通过 AOP 代理实例化，应用 AuthorityFilter、Transactional 等拦截器 | 跨层调用、API 入口 |
| `UseNoAop<TService>()` | 直接实例化，跳过 AOP 拦截 | 域内调用、内部逻辑 |

### 信息层级

```
DomainUser<TUserInfo>
├── UserInfo          — 用户身份信息（UserName, DisplayName, Email, Roles...）
├── UserId            — 用户唯一标识
├── IsAuthenticated   — 是否已认证
├── SessionId         — 当前会话 ID
└── Items             — 请求级别的自定义数据字典
```

## 生命周期

```
HTTP 请求到达
    ↓
Session 中间件解析 Token
    ↓
DomainUser 创建并绑定到请求上下文
    ↓
Controller / Service 通过构造函数注入 DomainUser
    ↓
请求处理完成，DomainUser 释放
```

### 请求隔离

每个 HTTP 请求拥有独立的 DomainUser 实例，确保请求间数据隔离：

```csharp
// 请求 A 的 User.UserId = "Alice"
// 请求 B 的 User.UserId = "Bob"
// 两个请求的 Service 实例完全隔离，不会串号
```

## 在 AI 编码场景中的优势

### 可预测性

```csharp
// AI 生成这段代码时，不需要了解 DI 容器配置
[GenerateController]
public class TodoService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    // AI 可以直接使用 User.UserId，结果完全可预测
    public async Task<Todo> CreateAsync(string title)
    {
        return await Repository.InsertAsync(new Todo
        {
            Title = title,
            UserId = User.UserId  // ← 确定性的，不依赖外部状态
        });
    }
}
```

### 可测试性

```csharp
// 单元测试：直接构造 DomainUser，不需要 mock 框架
var user = new DomainUser<AppUserInfo>(new AppUserInfo
{
    UserName = "test",
    Roles = new() { "Admin" }
});

var service = user.UseNoAop<TodoService>();
var result = await service.CreateAsync("Test Todo");
```

## 最佳实践

1. **构造函数注入** — 总是通过构造函数注入 DomainUser，不要手动创建
2. **域内调用用 `UseNoAop`** — 避免重复的 AOP 拦截开销
3. **跨层调用用 `Use`** — 确保 AuthorityFilter 等安全拦截生效
4. **不要在 Service 中暴露 DomainUser** — 保持领域封装性

## 参考

- [AOP 管线详解](aop-pipeline.md)
- [认证与授权](../security/authentication.md)
- [Session 管理](../security/session.md)