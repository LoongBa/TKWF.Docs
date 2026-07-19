# 异常处理

TKWF 提供统一的异常处理机制，领域异常自动映射为 HTTP 响应。

---

## 领域异常

| 异常类型 | 说明 | HTTP 状态码 |
|:---------|:-----|:------------|
| `UnauthorizedAccessException` | 未认证 | 401 |
| `ForbiddenAccessException` | 无权限 | 403 |
| `EntityNotFoundException` | 实体不存在 | 404 |
| `ValidationException` | 参数验证失败 | 422 |
| `BusinessException` | 业务规则冲突 | 409 Conflict |
| `ConcurrencyException` | 并发冲突 | 409 Conflict |

## 抛出异常

```csharp
public async Task<Order> GetOrderAsync(long orderId)
{
    // 实体不存在
    var order = await Repository.FindAsync(orderId)
        ?? throw new EntityNotFoundException($"Order {orderId} not found");

    // 权限检查
    if (order.UserId != User.UserId)
        throw new ForbiddenAccessException("Access denied");

    // 业务规则
    if (order.Status == OrderStatus.Cancelled)
        throw new BusinessException("Cannot modify cancelled order");

    return order;
}
```

## 全局异常处理

Web 集成自动捕获异常并返回标准响应格式：

```json
{
  "error": {
    "code": "ENTITY_NOT_FOUND",
    "message": "Order 12345 not found",
    "details": null
  }
}
```

## 自定义异常

```csharp
public class InsufficientStockException : BusinessException
{
    public InsufficientStockException(string productName, int available)
        : base($"Insufficient stock for {productName}. Available: {available}")
    {
    }
}
```

## 参考

- [最佳实践](best-practices.md)
- [Web 集成](../integration/web.md)
- [AOP 管线](../core-concepts/aop-pipeline.md)