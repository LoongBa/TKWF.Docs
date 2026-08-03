---
title: FreeSql ORM 适配
description: FreeSql ORM 适配：数据层配置与使用
---
# FreeSql ORM 适配

`TKWF.Domain.FreeSql` 提供 FreeSql 作为 TKWF 框架的数据层实现。

---

## 安装

```shell
dotnet add package TKWF.Domain.FreeSql
```

## 配置

```csharp
// Program.cs
builder.ConfigWebAppDomain<AppUserInfo, AppDomainInitializer>(options =>
{
    options.Data.UseFreeSql(fsql =>
    {
        fsql.ConnectionString = "Data Source=localhost;Database=tkf;...";
        fsql.Provider = FreeSqlProvider.SqlServer;
        fsql.AutoSyncStructure = true;   // 自动同步表结构
    });
});
```

## 支持的数据库

| 数据库 | FreeSqlProvider |
|:-------|:----------------|
| SQL Server | `FreeSqlProvider.SqlServer` |
| PostgreSQL | `FreeSqlProvider.PostgreSQL` |
| MySQL | `FreeSqlProvider.MySql` |
| SQLite | `FreeSqlProvider.Sqlite` |
| Oracle | `FreeSqlProvider.Oracle` |

## 仓储模式

```csharp
[GenerateController]
public class TodoService(DomainUser<AppUserInfo> user)
    : DomainServiceBase<AppUserInfo>(user)
{
    // FreeSql 仓储通过 Repository 属性访问
    public async Task<List<Todo>> GetTodosAsync()
    {
        return await Repository
            .Where(t => t.UserId == User.UserId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }
}
```

## 事务支持

配合 `[Transactional]` 实现自动事务管理：

```csharp
[Transactional]
public async Task TransferAsync(long fromId, long toId, decimal amount)
{
    // 任一失败自动回滚
    await Repository.UpdateAsync(new Account(fromId) { Balance -= amount });
    await Repository.UpdateAsync(new Account(toId) { Balance += amount });
}
```

## 参考

- [AOP 管线](../core-concepts/aop-pipeline.md)
- [Web 集成](web.md)
- [配置参考](../advanced/configuration.md)