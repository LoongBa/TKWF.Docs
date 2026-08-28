---
title: AOP 为什么编译期生成
description: 深度理解 TKWF 为什么选择编译期 Source Generator 而非运行时动态代理实现 AOP
---
# AOP 为什么编译期生成

> 源文档：[D04](https://github.com/LoongBa/TKW.Framework/blob/master/docs/D03-AOP%E6%8B%A6%E6%88%AA%E4%B8%8E%E4%BA%8B%E5%8A%A1%E4%B8%8E%E9%AA%8C%E8%AF%81.md) · V4.9.9

---

## 一句话总结

TKWF 选择 **Source Generator 在编译期生成 AOP 代码**（装饰器模式），而非运行时动态代理（如 Castle DynamicProxy / Autofac）——核心原因：**编译期确定性**（编译即验证）、**零反射开销**、**调试友好**。

---

## 两种 AOP 实现方式对比

| 维度 | 编译期 SG（TKWF） | 运行时动态代理（Castle / Autofac） |
|:--|:--|:--|
| **生成时机** | 编译期（`dotnet build`） | 运行时（首次调用） |
| **实现方式** | 源码生成装饰器类 | 运行时 Emit 生成代理类 |
| **反射使用** | 零反射（编译期确定） | 大量反射（类型发现、方法拦截） |
| **调试体验** | 可断点、可单步 | 难以调试（代理类不透明） |
| **性能** | 零运行时开销（与手写代码等效） | 有运行时代理创建开销 |
| **错误暴露** | 编译期（SG 诊断 + 生成失败） | 运行时（首次调用异常） |
| **可预测性** | 编译即验证 | 运行时才暴露问题 |

---

## 编译期确定性

### 编译即验证

```csharp
[Transactional]  // 编译期检查：方法签名是否合法、依赖是否注入
public async Task TransferFundsAsync(decimal amount) { /* ... */ }

// SG1 编译期生成：
// ✅ 生成成功 → 方法可被 AOP 拦截
// ❌ 生成失败 → 编译错误（如缺少 ITransactionManager 注册）
```

**对比运行时**：

```csharp
// 运行时代理：编译期无检查，运行时才抛异常
// ❌ 编译通过
// ❌ 运行时抛出 Autofac.ActivationException: 无法解析 ITransactionManager
```

### 编译期依赖校验

SG1 在编译期检查依赖链：
- `[Transactional]` → 需要 `ITransactionManager` 注册
- `[AuthorityFilter]` → 需要 `DomainUser<TUserInfo>` 注册
- `[ContentCacheFilter]` → 需要 `ICacheProvider` 注册

未注册 → 编译期错误（不是运行时异常）。

---

## 零反射开销

### 编译期生成（TKWF）

```
编译期：
  SG1 扫描 [Transactional] 标记
  → 生成 OrderServiceDecorator : IOrderService
  → 编译到程序集（与手写代码等效）

运行时：
  DI 解析 IOrderService → 返回 OrderServiceDecorator（无反射）
  → 直接调用装饰器方法（无代理创建开销）
```

### 运行时代理（Castle / Autofac）

```
编译期：
  无特殊处理（只是标记）

运行时：
  首次调用 IOrderService
  → Castle.DynamicProxy 创建代理类（Emit 生成，反射发现方法）
  → 创建代理实例（反射调用构造函数）
  → 每次方法调用经过拦截器链（反射调用）
```

**性能对比**：

| 操作 | 编译期 SG | 运行时代理 |
|:--|:--|:--|
| 首次调用 | 0ms（已编译） | ~5ms（Emit 生成代理） |
| 后续调用 | 0ms（与手写等效） | ~0.01ms（拦截器链开销） |
| 内存占用 | 无额外开销 | 代理类 + 拦截器实例 |

---

## 调试友好

### 编译期生成（TKWF）

```csharp
// 生成的代码是可读的 C# 源码
public class OrderServiceDecorator : IOrderService
{
    private readonly OrderService _inner;
    private readonly ITransactionManager _tx;

    public async Task TransferFundsAsync(decimal amount)
    {
        using var scope = _tx.Begin();  // ← 可断点
        await _inner.TransferFundsAsync(amount);  // ← 可单步
        scope.Commit();  // ← 可断点
    }
}
```

**调试体验**：
- ✅ 可断点（在装饰器方法上）
- ✅ 可单步（进入/跳出拦截逻辑）
- ✅ 可查看变量（`_inner`、`_tx`）
- ✅ 调用栈清晰（装饰器 → 真实方法）

### 运行时代理（Castle / Autofac）

```csharp
// 运行时生成的代理类（不透明）
// 调试时看到的是：
// Castle.DynamicProxy.OrderService_Interceptor
// → 难以理解拦截逻辑
// → 调用栈混乱（代理 → 拦截器 → 真实方法）
```

**调试体验**：
- ❌ 难以断点（代理类不透明）
- ❌ 调用栈混乱（多层代理）
- ❌ 变量难以查看（拦截器链不透明）

---

## 编译期 AOP 的权衡

### 权衡 1：灵活性

| 场景 | 编译期 SG | 运行时代理 |
|:--|:--|:--|
| 固定拦截模式 | ✅ 完全支持 | ✅ 完全支持 |
| 动态添加拦截器 | ❌ 编译期确定 | ✅ 运行时动态 |
| 条件拦截 | ⚠️ 需要运行时条件 | ✅ 运行时条件 |

**TKWF 的选择**：固定拦截模式（`[Transactional]` / `[AuthorityFilter]` 等）已覆盖 95%+ 场景，动态拦截留待 V5.x 扩展。

### 权衡 2：编译时间

编译期 SG 增加编译时间（~100-500ms），但换来：
- 运行时零开销
- 编译即验证
- 调试友好

**结论**：编译时间增加可接受（增量编译更快）。

---

## 为什么不用 Fody / PostSharp

| 工具 | 原理 | 问题 |
|:--|:--|:--|
| **Fody** | IL 编织（编译后修改 IL） | 调试困难（IL 层面）、不透明 |
| **PostSharp** | IL 编织 + 自定义属性 | 商业许可、调试困难 |
| **Castle DynamicProxy** | 运行时 Emit | 反射开销、调试困难 |
| **TKWF SG** | 编译期源码生成 | 零反射、调试友好、编译即验证 |

**核心区别**：SG 生成的是**可读的 C# 源码**（不是 IL），开发者可以查看、调试、理解。

---

## 进一步阅读

- [AOP 拦截器使用指南](../core-concepts/filters.md) — 内置过滤器参考
- [全局过滤器体系](../core-concepts/filters.md) — FilterTier / AuthorityFilter / EntityHistoryFilter
- [三层 SG 管线解剖](./sg-pipeline-anatomy.md) — SG1/SG2/SG3 分层职责
- [为什么领域自治](./why-domain-autonomy.md) — DomainUser + Use\<T\>() 设计原理
