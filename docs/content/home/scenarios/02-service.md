---
order: 2
badge: "2️⃣"
tab: Agent 编写服务
title: Agent 使用 Skill 编写 Service → 自动生成 Controller + 自动暴露 WebApi 端点 + 自动生成 Client
description: Controller 自动受 AOP 框架支持；自动生成 ApiService 自动暴露为 WebApi(GraphQL/REST)；自动生成用于 Wasm/TypeScript 的 ApiClient 自动调用 WebApi 服务。
language: csharp
---

[GenerateController] 一行标注，编译期自动生成全套 Controller/AOP Decorator/GraphQL Resolver/REST Endpoint/Wasm Client/TypeScript Client：

```csharp
[GenerateController]
public class OrderService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    [AuthorityFilter(Roles = "Admin")]
    [Transactional]
    public async Task<OrderDto> CreateAsync(string title)
    {
        var ds = User.Use<OrderDataService>();
        var order = new Order { Title = title, UserId = User.UserId };
        await ds.InsertAsync(order);
        return order.ToDto<OrderDto>();
    }
    // 也可以使用强大的 IQueryable<Order> + Linq 语法
    public async Task<List<OrderDto>> QueryAsync(string keyword)
    {
        var ds = User.Use<OrderDataService>();
        var list = await ds.Query
            .Where(o => o.Title.Contains(keyword))
            .And(o => o.UserId == User.UserId)  // 仅查询当前用户的订单
            .OrderByDescending(o => o.CreateTime)
            .ToListAsync();
        return list.ToDtoList<OrderDto>();
    }
}
```
