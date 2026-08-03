---
title: REST 客户端
description: REST 客户端：REST 客户端配置与调用
---
# REST 客户端

`TKWF.Domain.ApiClient.Rest` 提供基于 REST 的 RPC 客户端实现。

---

## 安装

```shell
dotnet add package TKWF.Domain.ApiClient.Rest
```

## 配置

```csharp
builder.Services.AddApiClient<AppUserInfo>(options =>
{
    options.BaseUrl = "https://api.example.com";
    options.Transport = TransportType.Rest;
});
```

## 特性

- **标准 HTTP** — 基于 RESTful 设计，易于调试
- **OpenAPI 兼容** — 自动生成的 OpenAPI 文档
- **缓存支持** — 内置 HTTP 缓存策略
- **文件上传** — 支持 multipart/form-data

## 示例

```csharp
// 文件上传
var file = await FileSystem.OpenAppPackageFileAsync("photo.jpg");
var result = await _client.UploadAvatarAsync(file, "photo.jpg");

// 带进度回调
var result = await _client.UploadLargeFileAsync(
    stream, "video.mp4",
    progress: p => Console.WriteLine($"{p.Percent}%"));
```

## 参考

- [ApiClient 核心](api-client.md)
- [GraphQL 客户端](graphql-client.md)
- [REST 传输](../transport/rest-minimal-api.md)