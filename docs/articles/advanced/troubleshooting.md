---
title: 排障速查
description: 症状→层定位表：编译/启动/请求/查询/事务/事件/客户端 10 类故障的排查入口
---
# 排障速查

> 目标：**先定位到层，再动手查**。下表按「症状 → 大概率位置 → 先看哪」组织。
> 与 [异常处理](./error-handling.md)（异常如何映射 HTTP）互补；本文关注"为什么没生效 / 为什么报错"。

---

## 症状 → 层速查

| # | 症状 | 大概率位置 | 先看这里 |
|:--:|:-----|:-----------|:---------|
| 1 | 编译报 `TKWF_*` 诊断码 | SG 编译期门控 | 诊断码说明（见 [门控机制](../explanation/gates.md)），按提示修复声明/接线 |
| 2 | 启动抛「`[门控]` xxx」 | 门控级别 2（启动期一次） | 初始化器 `OnValidateRuntimeGatesAsync` 遍历的 GateRules；按诊断码补注册（如 `ITransactionManager` / `OutboxSender`） |
| 3 | 启动抛 "领域环境尚未就绪"（`DomainInitializationException`） | 自举未完成 | 初始化生命周期第 5~8 步（门控校验 / 建表视图 / SystemActor 自举 / 扩展初始化）哪一步抛了异常 |
| 4 | 启动抛「需完成 Setup」 | 消费方 Setup 未完成 | `SystemSetupRequiredException` 是**设计内**的封锁路径——按宿主配置完成 Setup 流程 |
| 5 | 端点 401 | `HttpAuthentication` 或 AOP `AuthorityFilter` | 认证链是否执行；端点是否需要匿名放行元数据 |
| 6 | 端点 404 | 路由未匹配 / 扩展未启用 | 路由两级前缀配置（`TKWF:Api:RestBasePath` + 模块前缀）；扩展是否已在白名单 `[TKWFEnabledExtension]` 声明 |
| 7 | 查询多了行 / 少了行 | 读侧横切 | `IGlobalQueryFilter`（软删除 / 多租户 / 数据权限）是否符合预期 |
| 8 | 事务没生效 | 事务接线 | 是否声明 `[Transactional]`；`ITransactionManager` 是否注册（未注册抛 `TKWF_TX_MANAGER_UNREGISTERED`——**不会静默自动提交**）；类级特性是否落在具体实现类上 |
| 9 | 事件丢了 | Outbox / 传输层 | `[DistributedEvent]` 的 Outbox 是否配置；传输层（RabbitMQ 等）是否绑定；级别 2 门控 `OutboxSenderRegistered` 是否通过 |
| 10 | 客户端 400 但服务端正常 | SG3 客户端契约 | `ApiMetadata` 是**契约唯一事实源**——服务端契约字段变了 → 客户端未重新生成 → 字段名不一致。重新生成 SG3 代理 |
| 11 | 客户端 401 循环 / 会话丢失 | 会话恢复 | 先分清"HTTP 中间件没跑"还是"会话恢复失败"；检查 `ISessionStore` 持久化与 `OnAuthRequired` 事件 |

---

## 读侧与写侧的隔离路径（快速定位多/少行问题）

```
DomainUser.Query<TEntity>()
  ├─ 域内（已在 AOP proceed 内，如 Service 里）
  │    → IEntityReadOnlyDAC<TEntity>.Query（3 跳，不过 AOP）
  │         → 逐个 IGlobalQueryFilter.Apply(...)（软删/多租户/数据权限都挂这里）
  └─ 域外（控制器外 / 客户端）
       → Use<IEntityQueryRoot>().Query<TEntity>()（走完整 AOP：AuthorityFilter 等）
            → EQR 实现内部同样直连 DAC + 策略
```

- **读侧横切只有一个点**：`IGlobalQueryFilter`（按注册序链式 Apply）。查询少行先查它。
- **写侧租户隔离不靠过滤器**：`IEntityDAC.UpdateWhereAsync` 自动注入 `TenantId` 谓词。写入缺租户条件先查这里。

---

## 事务边界（记这三句）

| 关注点 | 事实 |
|:-------|:-----|
| 一次请求一个 DI scope？ | **不是**——每次 AOP 调用**新建** scope（拦截器内 `CreateScope`）；HTTP scope 是另一回事 |
| `[Transactional]` 没生效？ | 检查声明位置（方法级 → 类级兜底）；类级特性必须落在**具体实现类**上（反射缓存键含 `Target.GetType()`） |
| 事件何时发？ | **Outbox 导出在 `CommitAsync()` 之前**（同一事务）——业务 + 事件原子；回滚不发事件 |

---

## 客户端错误三件套（`isError` / `extensions.code`）

| 层 | 表现 | 排查 |
|:---|:-----|:-----|
| 领域层 | `DomainException`（`ErrorCode`） | 服务端日志定位业务规则 |
| 服务端 | `WebExceptionMiddleware` → ProblemDetails 信封 | 响应体 `errorCode` 值存留（v4.10.82 起 RFC 9457） |
| 客户端 | `OnAuthRequired` / `OnAuthFailed` / `OnServiceError` 事件 + `isError`/`extensions.code` | 先看事件订阅是否齐全；400 时对照 #10 契约重生成 |

---

## 参考

- [门控机制](../explanation/gates.md) — 编译期/启动期/运行时三级门控与诊断码体系
- [异常处理](./error-handling.md) — `DomainException` → HTTP 状态码映射
- [事务管理](../core-concepts/transactions.md) — 事务抽象与 `[Transactional]`
- [增强查询 QueryBuilder](./query-guide.md) — `Query<T>()` 双路径与 EQR
- [AOP 管线](../core-concepts/aop-pipeline.md) — 拦截器时序与短接