---
title: REST 客户端
description: REST 客户端：REST 客户端配置与调用
---
# REST 客户端

`TKWF.Domain.Api.Rest` 提供基于 REST 的 RPC 客户端实现（csproj 项目名 `ApiClient.Rest`，发布包名 `TKWF.Domain.Api.Rest`）。

---

## 安装

```shell
dotnet add package TKWF.Domain.Api.Rest
```

## 配置

`RestClient` 构造入参为 `HttpClient`（无 string 构造）。协议选择器是 `ApiClientType`，**无 Transport/TransportType 选项**：

```csharp
// 直建 RestClient（REST 作为附加传输经 UseRestClient 注册）
var restClient = new RestClient(new HttpClient
{
    BaseAddress = new Uri("https://api.example.com/api")
});
DomainClient<AppUserInfo>.Root!.UseRestClient(restClient);

// WASM 宿主链式形态（先 GraphQL 初始化，再 UseRest 附加 REST 传输）：
// services.ConfigWasmClient<AppUserInfo>("https://api.example.com", options => { })
//     .UseApiClient(ApiClientType.GraphQL)
//     .UseRest();
```

## 特性

- **标准 HTTP** — 基于 RESTful 设计，易于调试
- **OpenAPI 兼容** — 可消费服务端 OpenAPI 描述的 RESTful 接口（OpenAPI 文档由服务端生成，客户端无生成逻辑）
- **缓存支持** — 底层 HttpClient 可插缓存策略（客户端自身无内置缓存）
- **文件上传** — 支持 multipart/form-data

## 示例

```csharp
// 文件上传（multipart/form-data）
// 真实签名：UploadFileAsync<TResponse>(string url, Stream fileStream, string fileName,
//             Dictionary<string,string>? additionalFields = null, CancellationToken ct = default)
// 无进度回调；首参为上传目标 URL 路径（如 "merchant/upload"）
var file = await FileSystem.OpenAppPackageFileAsync("photo.jpg");
var result = await _client.UploadFileAsync<UploadResult>(
    "merchant/upload", file, "photo.jpg");
```

## 参考

- [ApiClient 核心](api-client.md)
- [GraphQL 客户端](graphql-client.md)
- [REST 传输](../transport/rest-minimal-api.md)