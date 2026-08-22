---
title: 数据层架构与 ORM 无关性
description: 深度理解 TKWF 数据层架构与 ORM 无关性设计，IEntityDAC 抽象层与 FreeSql 适配
---

# 数据层架构与 ORM 无关性

> 领域业务不必关心数据怎么存。换数据库、换 ORM、换表结构同步策略——业务代码一行不改。

TKWF 的数据层围绕一条核心原则设计：**领域层不依赖任何具体 ORM**。不管底层跑的是 FreeSql、EF Core 还是 Mock 数据库，DataService 写的 CRUD 代码完全一样。这不是约定，是架构强制——核心层（`TKW.Framework.Domain`）零 ORM 引用，连 NuGet 依赖都没有。

---

## 一、分层架构

数据存取层分三层，每层只关心自己的事：

```
┌──────────────────────────────────────────────────┐
│             领域服务 (DataService)                   │
│       只依赖 IEntityDAC<TEntity> 接口                │
├──────────────────────────────────────────────────┤
│            IEntityDAC 抽象契约层                       │
├──────────────────┬───────────────────────────────┤
│  FreeSqlEntityDAC │   EFCoreEntityDAC (扩展)       │
│    (框架默认实现)    │   (按需实现)                    │
└──────────────────┴───────────────────────────────┘
```

- **领域服务层**：DataService 通过构造函数注入 `IEntityDAC<TEntity>`，写 Insert/Update/Delete/Query，完全不知道底层是哪个 ORM。
- **抽象契约层**：`IEntityDAC<TEntity>` + `IEntityReadOnlyDAC<TEntity>` + `ITransactionManager`——框架定义的接口集合，全在核心层，无 ORM 引用。
- **实现层**：按需注册具体 ORM 实现。框架默认是 `FreeSqlEntityDAC<TEntity>`，生产环境可换成 EF Core，测试环境可换成 Mock。

**编译期隔离原则**：`TKW.Framework.Domain` 核心项目不引用任何 ORM 包。`FreeSql` 引用在 `_Domain.Infrastructure/FreeSql/`，`Microsoft.EntityFrameworkCore` 引用在 `_Domain.Infrastructure/EFCore/`——都在基础设施层，核心层一片净土。

---

## 二、IEntityDAC 抽象契约

### 2.1 只读接口 IEntityReadOnlyDAC

```csharp
public interface IEntityReadOnlyDAC<TEntity>
    where TEntity : class, IDomainEntity, new()
{
    IQueryable<TEntity> Query { get; }

    Task<TEntity?> FirstOrDefaultAsync(IQueryable<TEntity> query, CancellationToken ct = default);
    Task<List<TEntity>> ToListAsync(IQueryable<TEntity> query, CancellationToken ct = default);
    Task<long> CountAsync(IQueryable<TEntity> query, CancellationToken ct = default);

    // 投影重载（V3.4+）
    Task<TResult?> FirstOrDefaultAsync<TResult>(
        IQueryable<TEntity> query,
        Expression<Func<TEntity, TResult>> selector,
        CancellationToken ct = default);
    Task<List<TResult>> ToListAsync<TResult>(
        IQueryable<TEntity> query,
        Expression<Func<TEntity, TResult>> selector,
        CancellationToken ct = default);
}
```

`IQueryable` 是查询组合的核心入口。框架要求 DAC 实现类提供安全异步执行 `IQueryable` 的能力，而不是让调用者直接调用 `ToListAsync()` 等 ORM 专有扩展——这保证了 ORM 无关性。

投影重载让查询在 SQL 层完成字段裁剪，不拉取整个实体再内存投影：

```csharp
// 只查 Name 和 Status，不走全字段
var names = await dac.ToListAsync(
    dac.Query.Where(e => e.Status == 1),
    e => new { e.Id, e.Name, e.Status });
```

### 2.2 读写接口 IEntityDAC

```csharp
public interface IEntityDAC<TEntity> : IEntityReadOnlyDAC<TEntity>
    where TEntity : class, IDomainEntity, new()
{
    Task<TEntity> InsertAsync(TEntity entity, CancellationToken ct = default);
    Task<List<TEntity>> InsertBatchAsync(IEnumerable<TEntity> entities, CancellationToken ct = default);
    Task<bool> DeleteAsync(TEntity entity, CancellationToken ct = default);
    Task UpdateAsync(TEntity entity, CancellationToken ct = default);
    Task UpdateBatchAsync(IEnumerable<TEntity> entities, CancellationToken ct = default);
    Task<int> UpdateColumnsBatchAsync<TColumns>(
        IEnumerable<TEntity> entities,
        Expression<Func<TEntity, TColumns>> columns,
        CancellationToken ct = default);
}
```

所有写操作都是异步方法。`UpdateColumnsBatchAsync` 提供按需更新指定列的能力，适用于性能敏感场景。`TColumns` 泛型签名（V4.9.4+）避免了值类型 boxing 导致的表达式树 `Convert` 节点。

### 2.3 为什么读写分离？

将只读与读写拆为两个接口：

- **接口隔离原则**：某些场景只需要读能力（如查询服务），不应暴露写方法。
- **安全**：参数校验层依赖只读接口做数据校验，确保不会意外调用写方法。
- **测试**：Mock 只读接口比 Mock 完整接口更轻量。

### 2.4 为什么用 IQueryable 不用 ISpecification？

框架没有引入 Specification 模式。原因很简单：`IQueryable` 已经足够表达所有查询场景，FreeSql 的 `Select` 和 EF Core 的 `DbSet` 都提供 `IQueryable<T>` 入口。再包装一层 Specification 会引入不必要的学习成本和性能损耗。

---

## 三、Entity 映射策略

### 3.1 从 FreeSql 专属到 BCL 标准属性

V4.9.54 之前，TKWF 的 Entity 类使用 `FreeSql.DataAnnotations.*` 属性。切换到 EF Core 时这些属性不被识别，需要改 Entity 类——违反了"一份 Entity 多 ORM"的目标。

**ADR27 决策**：Entity 类改用 `System.ComponentModel.DataAnnotations` 和 `System.ComponentModel.DataAnnotations.Schema` 命名空间下的 BCL 标准属性。FreeSql v1.4.0+ 原生识别这些 BCL 属性（官方文档确认），EF Core 原生，RepoDB 原生——一份 Entity 多 ORM 零适配。

**属性映射对照表**：

| FreeSql 属性 | BCL 等价 | 说明 |
|:--|:--|:--|
| `[Table(Name = "x")]` | `[Table("x")]` | 表名映射 |
| `[Column(Name = "x")]` | `[Column("x")]` | 列名映射 |
| `[Column(IsIdentity = true)]` | `[DatabaseGenerated(DatabaseGeneratedOption.Identity)]` | 自增主键 |
| `[Column(IsPrimary = true)]` | `[Key]` | 主键标记 |
| `[Column(IsIgnore = true)]` | `[NotMapped]` | 忽略映射 |
| `[Column(IsNullable = false)]` | `[Required]` | 非空约束 |
| `[Column(DbType = "...")]` | `[Column(TypeName = "...")]` | 数据库类型 |
| `[Column(Position = n)]` | `[Column(Order = n)]` | 列顺序 |
| `[Column(StringLength = n)]` | `[MaxLength(n)]` 或 `[StringLength(n)]` | 最大长度 |

**迁移示例**：

```csharp
// 旧：FreeSql 命名空间
using FreeSql.DataAnnotations;

[Table(Name = "tkwf_order")]
public class Order
{
    [Column(IsIdentity = true, IsPrimary = true, Position = 1)]
    public long Id { get; set; }
    [Column(Position = 2, StringLength = 100)]
    public string Name { get; set; }
    [Column(IsIgnore = true)]
    public string Derived => Name.ToUpper();
}

// 新：BCL 标准属性
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("tkwf_order")]
public class Order
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column(Order = 1)]
    public long Id { get; set; }

    [Column(Order = 2)]
    [MaxLength(100)]
    public string Name { get; set; }

    [NotMapped]
    public string Derived => Name.ToUpper();
}
```

### 3.2 遗留：无 BCL 等价的特性

有些 FreeSql 特性没有 BCL 等价物，需要特殊处理：

| 特性 | 无 BCL 等价 | 影响 | 处理方式 |
|:--|:--|:--|:--|
| `[Index]` | FreeSql 和 EF Core 各有 `[Index]`（不同命名空间） | 无法同一特性兼容两 ORM | 双标注过渡期（ADR28）：FreeSql 特性保留用于 SG 元数据提取，`EFCoreModelConfigurator` 从 `IProjectMetaContext` 读元数据补偿 `HasIndex` |
| `[Navigate]` | BCL 无导航属性 | 导航关系是 ORM 特有 | 双标注：FreeSql 宿主用 `[Navigate]`，EF Core 宿主用 `OnModelCreating` 配置关系 |
| `[Column(MapType = typeof(string))]` | BCL 无枚举→string 映射 | EF Core 默认存 int | `EFCoreModelConfigurator` 自动扫描 enum 属性，应用 `.HasConversion<string>()` |
| `[Table(DisableSyncStructure = true)]` | BCL 无此属性 | FreeSql 丢失跳过同步标记 | 过渡期保留 FreeSql 特性双标注；最终由适配层排除列表处理 |

### 3.3 双标注策略（ADR28）

V4.9.55 纠正了降级缺陷，采用双标注策略——Entity 同时标注 BCL 标准属性和 FreeSql 特性，两者并排共存：

```csharp
using FreeSql.DataAnnotations;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("tkwf_order")]                          // BCL（EF Core 原生识别）
[FreeSql.DataAnnotations.Table(Name = "tkwf_order")]  // FreeSql（AOP + SG 元数据提取）
[Index("idx_order_no", nameof(OrderNo))]       // FreeSql（SG 提取 → EFCoreModelConfigurator.HasIndex）
public partial class Order
{
    [Key]                                        // BCL
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]  // BCL
    [Column(Order = 1)]                          // BCL
    [FreeSql.DataAnnotations.Column(IsPrimary = true, IsIdentity = true, Position = 1)]  // FreeSql
    public long Id { get; set; }

    [Column(Order = 2)]                          // BCL
    [MaxLength(32)]                              // BCL
    [FreeSql.DataAnnotations.Column(Position = 2, StringLength = 32)]  // FreeSql
    public string OrderNo { get; set; }

    [NotMapped]                                  // BCL
    public string DerivedField => OrderNo.ToUpper();
}
```

各消费者读取自己需要的部分：FreeSql AOP 读 FreeSql 特性，EF Core 读 BCL 特性，SG 的 `ExtractAttributeMetadataList` 提取全部特性填充 `IProjectMetaContext`，`EFCoreModelConfigurator` 从元数据生成 Fluent API 补偿。

---

## 四、FreeSql 适配（默认实现）

### 4.1 FreeSqlEntityDAC

`FreeSqlEntityDAC<TEntity>` 是框架提供的默认实现，构造函数注入 `UnitOfWorkManager`（Scoped），CRUD 通过 `uowManager.Orm` 执行——每个操作经委托解析绑定当前 UoW 事务：

```csharp
public class FreeSqlEntityDAC<TEntity>(
    UnitOfWorkManager uowManager,
    IProjectMetaContext? meta = null,
    IFreeSqlCache? fsqlCache = null) : IEntityDAC<TEntity>
    where TEntity : class, IDomainEntity, new()
{
    // 事务性 CRUD 入口（scoped 委托解析，绑定当前 UoW）
    private IFreeSql Orm => uowManager.Orm;

    // 裸 IFreeSql 仅用于 Schema/CodeFirst
    private IFreeSql? SchemaFsql => fsqlCache?.GetOrAdd(uowManager.Orm.Ado.ConnectionString);

    public IQueryable<TEntity> Query => Orm.Select<TEntity>().AsQueryable();

    public async Task<TEntity> InsertAsync(TEntity entity, CancellationToken ct = default)
    {
        await Orm.Insert<TEntity>().AppendData(entity).ExecuteAffrowsAsync(ct);
        return entity;
    }
    // ...
}
```

**关键设计**：
- `uowManager.Orm` 返回 `DbContextScopedFreeSql`，与业务操作共享同一 UoW 事务，async 安全。
- 裸 Singleton `IFreeSql` 不可用于 CRUD——它没有委托解析，autocommit 不参与 UoW，仅用于 Schema/CodeFirst。
- `RestoreToSelect` 桥接模式：外部保持 `IQueryable` 契约，执行时恢复为 FreeSql 原生 `ISelect` 调用异步 API。

### 4.2 表结构同步

`FreeSqlTableStructureSynchronizer` 在启动时自动同步 Entity 到数据库表。FreeSql 的 `SyncStructure()` 支持运行时 ALTER（加列、删列），这是开发体验上的核心优势——开发环境改 Entity 后重启即自动更新表结构，无需手动迁移。

### 4.3 多库支持（多租户分库）

V4.9.4 引入 `IFreeSqlCache` 按连接字符串缓存 `IFreeSql` 实例，每个唯一连接串只 Build 一次。通过 `SetFreeSqlEntityDAC(Func<IServiceProvider, string>)` 工厂重载，多租户场景每请求解析不同连接串：

```csharp
// 多商户：通过 TenantResolver 每请求解析
services.AddHttpContextAccessor();
services.AddScoped<ITenantResolver, TenantResolver>();
services.SetFreeSqlEntityDAC(
    sp => sp.GetRequiredService<ITenantResolver>().ResolveConnectionString(),
    isDevelopment: builder.Environment.IsDevelopment());
```

---

## 五、EF Core 适配（扩展实现）

### 5.1 七组件架构

`_Domain.Infrastructure/EFCore/` 适配包包含 7 个组件：

| 组件 | 职责 |
|:--|:--|
| `EFCoreEntityDAC.cs` | 实现 `IEntityDAC<T>`，用 `DbContext.Set<T>()` + `SaveChangesAsync` |
| `EFCoreTransactionManager.cs` | 实现 `ITransactionManager`，覆写 `BeginAsync` → `Database.BeginTransactionAsync(ct)` |
| `EFCoreTableStructureSynchronizer.cs` | 实现 `ITableStructureSynchronizer`，支持 `MigrateAsync` / `EnsureCreated` |
| `EFCoreInfrastructureRegistrar.cs` | DI 注册匹配器，`CanHandle` 识别 `EFCoreEntityDAC<>` |
| `EFCoreAppBuilderExtensions.cs` | `UseEFCoreEntityDAC<TDbContext>` 一行切换入口 |
| `EFCoreSqlExecutor.cs` | 实现 `ISqlExecutor`，执行原始 SQL |
| `EFCoreModelConfigurator.cs` | `OnModelCreating` 驱动：索引补偿、导航补偿、MapType 精确转换 |

### 5.2 一行切换

从 FreeSql 切换到 EF Core 只需改一行 DI 注册：

```csharp
// FreeSql 宿主（开发环境，运行时自动同步表结构）
cfg.UseFreeSqlEntityDAC(connectionString);

// EF Core 宿主（生产环境，迁移文件管理 Schema）
cfg.UseEFCoreEntityDAC<AppDbContext>(
    connectionString,
    SchemaSyncStrategy.Migrations,
    (opts, conn) => opts.UseNpgsql(conn));
```

消费方 DbContext 须在 `OnModelCreating` 中调用 `EFCoreModelConfigurator.Apply(modelBuilder)` 应用索引/导航/MapType 补偿。

### 5.3 Schema 同步策略

```csharp
public enum SchemaSyncStrategy
{
    RuntimeSync,    // FreeSql SyncStructure（运行时 ALTER，开发友好）
    Migrations,     // EF Core Migrations（生产标准）
    EnsureCreated,  // EF Core EnsureCreated（仅空 DB，测试用）
    External,       // Dapper/RepoDB（外部 SQL 脚本）
}
```

**关键差异**：FreeSql 的 `SyncStructure()` 支持运行时 ALTER 现有表，EF Core 的 `EnsureCreated` 不支持——生产环境需用 Migrations（`dotnet ef migrations add` + `MigrateAsync`）。

### 5.4 约束与限制

| 约束 | 说明 |
|:--|:--|
| Provider 由消费方注入 | 框架适配包只引 `Microsoft.EntityFrameworkCore`（base），不引 Npgsql/Sqlite。消费方在 `configureProvider` 委托中配置 |
| DbContext Scoped | EF Core 10 无非泛型 `AddDbContext` 重载——使用 Scoped 工厂 + `ActivatorUtilities.CreateInstance` + `AddScoped<DbContext>` 基类别名 |
| 嵌套事务防护 | `EFCoreTransactionManager.BeginAsync` 先查 `CurrentTransaction != null`，有则返回 no-op scope（模拟 Propagation.Required） |
| 多对多导航推迟 | 多对多 `UsingEntity` 需消费方手动配置（EF Core 非泛型 API 限制） |

---

## 六、Mock / 测试适配

### 6.1 MockDbEntityDAC

V4.9.44 引入 `MockDbEntityDAC<TEntity>`，基于内存集合实现 `IEntityDAC<TEntity>`。单元测试无需数据库，注入 Mock 即可：

```csharp
// 测试：注入 Mock DAC，零数据库依赖
services.AddScoped(typeof(IEntityDAC<>), typeof(MockDbEntityDAC<>));
```

MockDbEntityDAC 支持完整的 CRUD 语义：Insert 后实体自动获得 Id，Delete 从集合移除，Update 按主键匹配替换。查询通过 `IQueryable` 走 LINQ to Objects，与真实 DAC 行为一致。

### 6.2 TestingEntityDAC

`TestingEntityDAC` 是更轻量的测试实现，专注于 Contract 测试场景。它不依赖 Mock 框架，纯内存操作，验证 DataService 的 CRUD 行为是否符合预期。

---

## 七、事务跨 ORM

### 7.1 ITransactionManager 抽象

V4.9.52（ADR26）将事务机制从 `System.Transactions.TransactionScope` 迁移到 `ITransactionManager` 抽象。原因：FreeSql 不参与 `TransactionScope`，Linux 上多连接触发 MSDTC 崩溃（源码级验证）。

```csharp
public interface ITransactionManager
{
    // 同步入口（FreeSql 原生同步）
    ITransactionScope Begin(IsolationLevel isolationLevel = IsolationLevel.Serializable);

    // V4.9.54 异步入口（DIM 默认委托同步 Begin——FreeSql 零改动）
    // EF Core 适配层覆写为 Database.BeginTransactionAsync(ct)
    Task<ITransactionScope> BeginAsync(
        IsolationLevel isolationLevel = IsolationLevel.Serializable,
        CancellationToken ct = default)
        => Task.FromResult(Begin(isolationLevel));

    bool IsActive { get; }
}
```

`BeginAsync` 使用 DIM（Default Interface Method）模式：FreeSql 透明使用默认实现（原生同步，零开销），EF Core 适配层覆写为真异步，避免热路径 sync-over-async。详见 [事务机制详解](../core-concepts/transactions.md)。

### 7.2 三层事务体系

| 层级 | 机制 | 定位 |
|:--|:--|:--|
| AOP 声明式 | `[Transactional]` 特性 + `ITransactionManager.BeginAsync` | 跨多个 Service 方法的复杂业务流程 |
| DataService 内置 | `BeginTxScopeAsync()` | 单次写入操作的默认原子性保障 |
| 手动 | `DomainUser.BeginTransaction()` | 批处理等特殊场景 |

三层机制可以嵌套协作——`UnitOfWorkManager.Begin(Propagation.Required)` 有外层则加入，无则新建。

---

## 八、选型建议

| 场景 | 推荐 ORM | 理由 |
|:--|:--|:--|
| 开发环境快速迭代 | FreeSql | `SyncStructure` 运行时自动建表改表，零迁移文件 |
| 生产环境严格的 Schema 管理 | EF Core | Migrations 文件版本化，支持 ALTER 回滚 |
| 单元测试 | Mock（MockDbEntityDAC / TestingEntityDAC） | 零数据库依赖，纯内存 CRUD |
| 多租户分库 | FreeSql | `IFreeSqlCache` 按连接串缓存，工厂模式成熟 |
| 已有 EF Core 生态的项目 | EF Core | 适配包 7 组件，一行切换，`EFCoreModelConfigurator` 自动补偿 |
| 同时需要开发效率和生产严谨 | FreeSql（开发）+ EF Core（生产） | 同一 Entity 类，双 ORM 零冲突（BCL 标准属性） |

**验证数据**：
- FreeSql 路径：`Domain.Core.Tests` 69/69 测试通过。
- EF Core 路径：`Domain.Infrastructure.EFCore.Tests` 4/4 集成测试通过（SQLite in-memory，含 CRUD + 事务 + 枚举转换 + 表结构同步）。
- 全解决方案编译零错误。

---

## 九、源文档参考

| 文档 | 内容 | 版本 |
|:--|:--|:--|
| [D06-领域数据服务与数据存取设计](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D06-领域数据服务与数据存取设计.md) | IEntityDAC 接口契约、FreeSqlEntityDAC 实现、事务架构、多 ORM 兼容设计 | v1.4 |
| [D06C-Entity映射与DB Schema-设计方案](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D06C-Entity%E6%98%A0%E5%B0%84%E4%B8%8EDB%20Schema-%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md) | Entity 映射策略、自动管理字段、查询条件生成管线 | v1.0 |
| [ADR27-多ORM兼容BCL标准属性与适配层扩展](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-%E8%BF%AD%E4%BB%A3%E5%BC%80%E5%8F%91/ADR/ADR27-%E5%A4%9AORM%E5%85%BC%E5%AE%B9BCL%E6%A0%87%E5%87%86%E5%B1%9E%E6%80%A7%E4%B8%8E%E9%80%82%E9%85%8D%E5%B1%82%E6%89%A9%E5%B1%95.md) | BCL 标准属性迁移决策、EF Core 适配包设计、属性映射对照 | ADR v3 |
| [ADR26-UoW事务迁移](https://github.com/LoongBa/TKW.Framework/blob/master/docs/02-%E6%BC%94%E8%BF%AD%E5%BC%80%E5%8F%91/ADR/ADR26-UoW%E4%BA%8B%E5%8A%A1%E8%BF%81%E7%A7%BB.md) | TransactionScope 到 ITransactionManager 迁移决策 | ADR v1 |
| [G06-领域数据服务与数据存取使用指南](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G06-%E9%A2%86%E5%9F%9F%E6%95%B0%E6%8D%AE%E6%9C%8D%E5%8A%A1%E4%B8%8E%E6%95%B0%E6%8D%AE%E5%AD%98%E5%8F%96%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) | 注册配置、事务操作、最佳实践 | v1.0+ |

> 上述文档为 TKWF 框架内部设计文档，位于 `_TKWF` 私有仓库。文档站公开文章（本文）是对其内容的结构化转述，不替代源文档的权威性。