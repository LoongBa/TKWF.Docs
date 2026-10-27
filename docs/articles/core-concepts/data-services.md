---
title: 领域数据服务
description: 领域数据服务（DataService）的核心概念、基类体系与自定义业务逻辑
---

# 领域数据服务

DataService 是 TKWF 中管理实体数据存取的核心抽象层，提供 CRUD、事务、条件查询等开箱即用能力。

---

## DataService 基类体系

| 基类 | 说明 |
|:-----|:------|
| `DomainDataServiceBase<TEntity,TDto>` | 可读写 DataService，含完整 CRUD（写操作 + `OnBefore/AfterCreate/Update/Delete` 钩子） |
| `DomainReadOnlyDataServiceBase<TEntity,TDto>` | 只读 DataService，仅查询方法 |

基类链：`DomainServiceBase` ← `DomainReadOnlyDataServiceBase<TEntity,TDto>` ← `DomainDataServiceBase<TEntity,TDto>`（v4.9.80 ADR42 非泛型主实现 + 泛型薄门面）。

> **说明**：DataService 的数据存取经 **SG1 生成的 `{Entity}DataService.g.cs`**（骨架 `.cs` 手写扩展）与基类 `IEntityDAC<TEntity>` 访问——**不存在 `Repository` 构件**（四件套 = Entity / Dto / DataService / IEntityDAC）。

## 查询方法

DataService 继承 `DomainReadOnlyDataServiceBase<TEntity,TDto>` 提供的读 API（参数顺序以基类签名为准，**selector 在前**）：

| 方法 | 返回 | 说明 |
|:-----|:-----|:------|
| `GetByIdAsync(id)` | 单条 | 按主键查单条 |
| `GetAsync<TResult>(selector)` | 单条 | 投影单条 |
| `GetRequiredAsync(selector)` | 单条 | 投影单条，无结果抛异常 |
| `SelectAsync<TResult>(selector, predicate?, skip?, limit?, orderBy?)` | 多条 | 条件 + 投影查询（selector 在前） |
| `SelectPageAsync(predicate, pageNumber, pageSize, orderBy?, ct)` | 分页 | 分页查询 |
| `CountAsync(predicate)` | 数量 | 计数 |
| `QueryForUser()` | `IQueryable` | 带 `IGlobalQueryFilter` 的查询入口 |

### ⚠️ V4.9.28 方法暴露限制

上表中含 `Expression<Func<...>>` 参数的方法（`GetAsync<TResult>`、`SelectAsync<TResult>` 等）**无法被 `[GenerateController]` 暴露为远程调用**——HC GraphQL / REST 无法序列化 `Expression`。ControllerGenerator 会硬过滤含 Expression 参数的方法，即使被 `IncludeMethods` / `[GenerateControllerMethod]` 显式包含也跳过。

需要将条件查询暴露为远程能力时，请通过**业务方法封装**——在 DataService / Service 中编写无 Expression 参数的业务化方法，内部调用上述通用查询方法：

```csharp
// ✅ 业务化方法（无 Expression 参数，可被 [GenerateController] 暴露）
public async Task<List<MerchantDto>> GetActiveMerchantsAsync(int limit = 20)
    => await SelectAsync(
        selector: m => new MerchantDto { Id = m.Id, Name = m.Name },
        predicate: m => m.Status == 1,
        limit: limit);
```

业务方法名应表达业务语义（如 `GetActiveMerchantsAsync`），而非暴露通用查询参数（`predicate`/`selector`）。

## 事务处理

| 机制 | 适用范围 | 说明 |
|:-----|:---------|:------|
| DataService 内置事务 | 单 DataService 方法内 | 每个 CRUD 公开方法自动开/提交（`BeginTxScopeAsync`，加入外层事务 Propagation.Required） |
| `[Transactional]` AOP 声明 | 跨 Service 调用 | 拦截器统一管理事务（方法级 → 类级兜底） |
| `ITransactionManager` | 手动精细控制 | 注入 `ITransactionManager` 手动管理（`DomainUser.BeginTransaction()` 已废弃） |

## 参考

- [G06 — 领域数据服务与数据存取使用指南（源文档）](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G06-%E9%A2%86%E5%9F%9F%E6%95%B0%E6%8D%AE%E6%9C%8D%E5%8A%A1%E4%B8%8E%E6%95%B0%E6%8D%AE%E5%AD%98%E5%8F%96%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md)
- [数据层架构](../explanation/data-layer-architecture.md)
- [条件构建器](../advanced/conditions-builder.md)
