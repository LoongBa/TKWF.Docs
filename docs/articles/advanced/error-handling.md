---
title: 异常处理
description: 异常处理：框架异常体系与错误处理最佳实践
---
# 异常处理

TKWF 提供统一的异常处理机制，领域异常自动映射为 HTTP 响应。

---

## 领域异常

框架的领域异常统一继承 `DomainException`，按 `ErrorCode` 映射 HTTP 状态码（错误码全集见 `DomainException.ErrorCodes`，为传输层映射的唯一事实源）：

| 异常/错误码 | 说明 | HTTP 状态码 |
|:---------|:-----|:------------|
| `InvalidCredentials` | 凭据无效 | 401 |
| `UnauthorizedAccessException` | 未认证（GraphQL 侧映射 `FORBIDDEN`） | 401 / GraphQL 403 |
| `EntityNotFound` | 实体不存在 | 404 |
| `EntityDuplicated` | 重复实体 | 409 Conflict |
| `RateLimited` | 被限流 | 429 |
| `UpstreamService` | 上游服务异常 | 502 |
| `ServiceNotConfigured` | 服务未配置 | 503 |
| 其他 `DomainException` | 未显式映射 | 400 |

> **注**：`BusinessException`/`ForbiddenAccessException`/`ConcurrencyException`/`ValidationException` 等类型**不存在**于框架（历史文档虚构类型）。业务规则冲突请抛 `DomainException`（自定义 ErrorCode）或 `EntityDuplicated`。

## 抛出异常

```csharp
public async Task<Order> GetOrderAsync(long orderId)
{
    // 实体不存在（经 SG1 生成的 DataService——框架无 Repository 构件）
    var order = await _orderSvc.GetRequiredAsync(e => e.Id == orderId);

    // 权限检查（通常由 AuthorityFilter AOP 统一处理；此处仅示例显式抛出）
    if (order.UserId != User.UserId)
        throw new DomainException("Access denied");

    // 业务规则
    if (order.Status == OrderStatus.Cancelled)
        throw new DomainException("Cannot modify cancelled order");

    return order;
}
```

> **提示**：错误码以 `DomainException.ErrorCodes` 实际定义为准（上表为映射示意）；自定义异常继承 `DomainException` 并传 MessageKey/MessageArgs（i18n 错误码唯一事实权威，v4.10.33）。

## 全局异常处理

Web 集成自动捕获异常并返回 **RFC 9457 ProblemDetails** 标准响应（REST）：

```json
{
  "type": "https://httpstatuses.io/404",
  "title": "Not Found",
  "status": 404,
  "extensions": {
    "errorCode": "ENTITY_NOT_FOUND",
    "messageArgs": ["12345"]
  }
}
```

GraphQL 侧为 `error.code` + `extensions.messageArgs`/`translationKey`（`DomainErrorFilter`）。客户端在三层事件模型消费：`DomainClientUser.OnAuthRequired/OnAuthFailed/OnServiceError` + `isError`/`extensions.code`（详见 [ApiClient 详解](../client/api-client.md)）。

## 自定义异常

```csharp
public class InsufficientStockException : DomainException
{
    public InsufficientStockException(string productName, int available)
        : base($"Insufficient stock for {productName}. Available: {available}")
    {
    }
}
```

> 自定义异常如需独立 HTTP 语义，映射其 `ErrorCode`（见上文映射表）；未映射时回退 400 `DOMAIN_ERROR`。

## 参考

- [最佳实践](best-practices.md)
- [Web 集成](../integration/web.md)
- [AOP 管线](../core-concepts/aop-pipeline.md)