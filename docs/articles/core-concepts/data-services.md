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
| `DomainDataServiceBase<TEntity>` | 可读写 DataService，含完整 CRUD |
| `DomainReadOnlyDataServiceBase<TEntity>` | 只读 DataService，仅查询方法 |

所有 DataService 的 CRUD 方法通过 `Repository` 属性访问实体数据存取层（EntityDAC），默认基于 FreeSql 实现。

## 查询方法

DataService 提供两类查询方法：

| 方法 | 返回 | 说明 |
|:-----|:-----|:------|
| `GetAsync<TResult>(predicate, selector)` | 单条 | 按条件查询单条 |
| `SelectAsync<TResult>(predicate, selector, limit)` | 多条 | 条件查询列表 |
| `SelectPageAsync<TResult>(predicate, selector, page)` | 分页 | 分页查询 |
| `CountAsync<TResult>(predicate)` | 数量 | 计数 |

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
| DataService 内置事务 | 单 DataService 方法内 | 每个方法自动开启/提交，无需额外配置 |
| `[Transactional]` AOP 声明 | 跨 Service 调用 | 编译期生成事务环绕代码 |
| `DomainUser.BeginTransaction` | 手动精细控制 | 手动管理事务生命周期 |

## 参考

- [G06 — 领域数据服务与数据存取使用指南（源文档）](https://github.com/LoongBa/TKW.Framework/blob/master/docs/G06-%E9%A2%86%E5%9F%9F%E6%95%B0%E6%8D%AE%E6%9C%8D%E5%8A%A1%E4%B8%8E%E6%95%B0%E6%8D%AE%E5%AD%98%E5%8F%96%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md)
- [数据层架构](../explanation/data-layer-architecture.md)
- [条件构建器](../advanced/conditions-builder.md)
