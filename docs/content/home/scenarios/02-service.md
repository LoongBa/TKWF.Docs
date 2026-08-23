---
order: 2
badge: "2️⃣"
title: Agent 编写 Service → 自动生成 Controller + 自动暴露 WebApi
description: 公共业务方法自动生成 Controller + AOP 框架支持 + WebApi GraphQL/REST 端点。
language: csharp
---

[GenerateController] 一行标注，编译期自动生成 5 份管道。

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

    public async Task<List<OrderDto>> QueryAsync(string keyword)
    {
        var ds = User.Use<OrderDataService>();
        var list = await ds.Query
            .Where(o => o.Title.Contains(keyword))
            .OrderByDescending(o => o.CreateTime)
            .ToListAsync();
        return list.ToDtoList<OrderDto>();
    }
}
// 编译期自动生成 5 份：Controller / AOP Decorator / GraphQL Resolver / REST Endpoint / Client
```
