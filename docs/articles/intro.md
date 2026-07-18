# 框架概览

## 核心理念

TKWF.Domain 围绕 **"领域自治"** 设计——领域层的实例化由当前用户（`DomainUser`）控制，而非 DI 容器。这杜绝了"串号"问题：

```text
传统模式：
  DI 容器 → 创建 Service(DomainUser User, ...)
  → DomainUser 来自 DI
  → Service 与 User 连接池中随机一个，可能"串号"

领域自治模式：
  User.UseNoAop<TService>() → 显式传入 this（当前 User）
  → Service 的 User 就是调用方的 User，不可能串号
```

## 三层架构

```text
┌─────────────────────────────────────────────┐
│             Controller / API 层              │ ← AOP 边界
│  [AuthorityFilter] [Transactional] [...]     │
│  User.Use<IAopContract>() ───→ AOP 管线     │
├─────────────────────────────────────────────┤
│              Service / 业务层                │
│  User.UseNoAop<TService>() ─→ 域内调用      │
├─────────────────────────────────────────────┤
│              DataService / 数据层            │
│  CRUD + Conditions 查询                     │
└─────────────────────────────────────────────┘
```

## 代码生成管线（Source Generator）

| SG | 职责 | 生成物 |
|:---|:-----|:-------|
| SG#1 | 扫描框架内置 Controller | API 表面元数据 |
| SG#2 | 生成 GraphQL Resolver / REST 端点 | `*Resolver.g.cs`, `*RestEndpoints.g.cs` |
| SG#3 | 生成客户端代理 | `*Client.g.cs` |
| SG#4 | 为 `[GenerateController]` 生成 AOP 控制器 | `I*Controller.g.cs`, `*ControllerDecorator.g.cs` |

## 两条控制器路径

| 路径 | 模式 | 示例 |
|:----|:-----|:-----|
| **A — 契约先行** | 手写 Controller + IAopContract 接口 | `AuthController<TUserInfo>` |
| **B — 标注驱动** | `[GenerateController]` 标注 Service | `PingService` |

两条路径均为一等公民。SG#2 统一为它们生成 Resolver，无需手写。
