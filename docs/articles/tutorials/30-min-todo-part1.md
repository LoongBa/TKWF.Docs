---
title: 30 分钟实战：领域服务 + 数据层
description: 30 分钟实战教程：构建 Todo 领域服务与数据层，从 Entity 到 DataService 的完整 CRUD
---
# 30 分钟实战：领域服务 + 数据层

> 源文档：[D06](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D06-%E9%A2%86%E5%9F%9F%E6%95%B0%E6%8D%AE%E6%9C%8D%E5%8A%A1%E4%B8%8E%E6%95%B0%E6%8D%AE%E5%AD%98%E5%8F%96%E8%AE%BE%E8%AE%A1.md) · [G06](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G06-%E9%A2%86%E5%9F%9F%E6%95%B0%E6%8D%AE%E6%9C%8D%E5%8A%A1%E4%B8%8E%E6%95%B0%E6%8D%AE%E5%AD%98%E5%8F%96%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) · V4.9.59

---

## 本节目标

30 分钟内，从零构建一个 Todo 领域服务：定义 Entity → 编写 DataService → 注册 DAC → 完整 CRUD。完成后你将掌握 TKWF 数据存取层的核心用法。

---

## Step 1：定义 Entity（3 分钟）

Entity 是领域的核心数据单元。TKWF 要求 Entity 继承 `IDomainEntity`，框架通过源码生成器（SG1）自动提取元数据。

```csharp
using TKW.Framework.Domain.Entities;

public class TodoItem : IDomainEntity
{
    public long Id { get; set; }           // 主键（框架约定 long）
    public string Title { get; set; } = "";
    public bool IsDone { get; set; }
    public DateTime CreateTime { get; set; }
    public DateTime? UpdateTime { get; set; }
}
```

**关键约束**：
- 必须有无参构造函数（ORM 需要）
- `Id` 为 `long` 类型（框架约定）
- 实体必须标注 `[DomainGenerateCode]`（脚手架模板默认带），否则 SG1a 不产元数据，后续生成全断

---

## Step 2：编写 DataService（10 分钟）

DataService 是领域服务的核心——它封装 Entity 的 CRUD 操作，通过 `IEntityDAC<TEntity>` 接口访问数据库，**零 ORM 引用**。

```csharp
using TKW.Framework.Domain.DataServices;
using TKW.Framework.Domain.DataServices.Base;

public class TodoDataService 
    : DomainDataServiceBase<TodoItem, TodoItemDto>
{
    // 构造函数注入 DAC（ORM 无关抽象层）；user 在前、dac 在后
    public TodoDataService(
        DomainUser<DmpUserInfo> user,
        IEntityDAC<TodoItem> dac,
        bool hasSoftDelete = false)
        : base(user, dac)
    {
    }
}
```

**基类选择**：
| 基类 | 用途 | 公开写 API |
|:--|:--|:--|
| `DomainDataServiceBase<TEntity, TDto>` | 完整 CRUD（读写） | `CreateAsync(TDto)` / `UpdateAsync(long id, TDto)` / `DeleteAsync(long id)` |
| `DomainReadOnlyDataServiceBase<TEntity, TDto>` | 只读服务 | 仅查询（`GetByIdAsync` / `SelectAsync` / `CountAsync` 等） |

**核心约定**：
- DAC 通过构造函数注入，**不手动 new**
- `DomainUser<DmpUserInfo>` 由框架自动注入（AOP 拦截器维护上下文）
- 无参构造函数必须存在（DI 容器需要）

---

## Step 3：注册 DAC（5 分钟）

DAC（Data Access Component）是 ORM 的抽象层。默认使用 FreeSql，框架提供 `FreeSqlEntityDAC<TEntity>` 实现。

```csharp
// Program.cs 或 Startup.cs
var app = builder.ConfigWebAppDomain<DmpUserInfo, MyDomainInitializer, DomainWebOptions>(
        "DomainOptions", cfg =>
        {
            cfg.UseWebExceptionMiddleware = true;
            cfg.UseFreeSqlEntityDAC();  // 注册 FreeSql DAC（从配置读连接串）
        })
    .Build(...);
```

`UseFreeSqlEntityDAC()` 一行代码完成：
1. 注册 `FreeSqlEntityDAC<>` 为 `IEntityDAC<>` 默认实现
2. 注册 `IFreeSql` 单例（自动连接池）
3. 配置连接串（从 `appsettings.json` 读取）

**验证注册成功**：

```csharp
// 启动后检查数据层是否可用
// 禁裸 IEntityDAC 直用（数据访问红线：必须经 SG1 DataService，经 user.Use<T>() 帧内发起）
public class HealthCheckService
{
    private readonly DomainUser<DmpUserInfo> _user;
    public HealthCheckService(DomainUser<DmpUserInfo> user) => _user = user;

    public async Task<bool> PingAsync()
    {
        _ = await _user.Use<TodoDataService>().CountAsync(e => e.Id > 0);
        return true;
    }
}
```

---

## Step 4：完整 CRUD 示例（10 分钟）

### 创建

```csharp
// 在 Controller 或领域服务中（DTO 承载输入，Entity 由 CreateAsync 内部 ToEntity 转换）
// （TodoItemDto 由 xCodeGen 生成 {Entity}Dto.g.cs，构造形态以生成产物为准）
var dto = new TodoItemDto
{
    Title = "学习 TKWF",
    IsDone = false
};

// 公开写 API：CreateAsync(TDto)
var created = await todoService.CreateAsync(dto);
// created.Id 已被框架自动回填
```

### 查询

```csharp
// 按 Id 查询（基类读 API）
var todo = await todoService.GetByIdAsync(created.Id);

// 条件查询（IQueryable 组合）
var pendingTodos = await todoService.SelectAsync(
    e => e.IsDone == false);

// 投影查询（只取需要的字段）
var titles = await todoService.SelectAsync(
    e => new { e.Id, e.Title },
    e => e.IsDone == false);  // selector 在前、谓词在后
```

### 更新

```csharp
var dto = await todoService.GetByIdAsync(id);
dto.IsDone = true;
await todoService.UpdateAsync(id, dto);
```

### 删除

```csharp
// 按 Id 删除（软删/硬删由 HasSoftDelete 自动分派）
await todoService.DeleteAsync(id);
```

### 批量操作

```csharp
// 批量插入（CreateBatchAsync(IEnumerable<TDto>)）
await todoService.CreateBatchAsync(dtoList);

// 批量更新指定列：DAC 原语（UpdateColumnsBatchAsync），DataService 侧仅以同程序集
// internal 的 EntityUpdateColumnsBatchAsync 内部转发，不在公开 API 面——示例从略
```

---

## Step 5：事务保护（2 分钟）

单次写入操作由框架自动开启短事务。跨多个 Service 方法的复杂流程，用 `[Transactional]` 声明式事务：

```csharp
[Transactional]  // AOP 自动开启事务，成功自动提交，异常自动回滚
public async Task CompleteTodoAndNotifyAsync(long todoId)
{
    var dto = await todoService.GetByIdAsync(todoId);
    dto.IsDone = true;
    await todoService.UpdateAsync(todoId, dto);

    // 跨 Service 调用——在同一个事务内
    await notificationService.SendAsync($"Todo {dto.Title} completed");
}
```

**三层事务体系**（嵌套协作）：

| 层级 | 机制 | 适用场景 |
|:--|:--|:--|
| AOP 声明式 | `[Transactional]` | 跨多个 Service 方法 |
| DataService 内置 | `BeginTxScopeAsync()` | 单次写入的原子性 |
| 手动 | `ITransactionManager` | 批处理等特殊场景 |

---

## 完整代码汇总

```csharp
// 1. Entity
public class TodoItem : IDomainEntity
{
    public long Id { get; set; }
    public string Title { get; set; } = "";
    public bool IsDone { get; set; }
    public DateTime CreateTime { get; set; }
    public DateTime? UpdateTime { get; set; }
}

// 2. DTO：由 xCodeGen 生成 {Entity}Dto.g.cs，勿手写（TDto 约束 IDomainDto<TEntity>）

// 3. DataService
public class TodoDataService 
    : DomainDataServiceBase<TodoItem, TodoItemDto>
{
    public TodoDataService(DomainUser<DmpUserInfo> user, IEntityDAC<TodoItem> dac,
        bool hasSoftDelete = false)
        : base(user, dac) { }
}

// 4. 注册（Program.cs）
cfg.UseFreeSqlEntityDAC();
```

---

## 下一步

- [30 分钟实战 Part 2：认证授权](./30-min-todo-part2.md) — 为 Todo 应用添加 Challenge-Response 登录与角色授权
- [领域数据服务详解](../core-concepts/data-services.md) — DataService 基类体系与查询能力
- [事务管理](../core-concepts/transactions.md) — 三层事务架构详解
