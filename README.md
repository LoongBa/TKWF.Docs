# TKWF Framework Documentation

> TKWF 领域自治框架的官方文档站点。

## 内容

- **入门指南** — 5 分钟创建第一个领域服务
- **框架概览** — 核心概念与架构设计
- **API 参考** — 自动从代码 XML 注释生成

## 本地构建

```shell
# 需要先获取源码（用 PAT 或从本地复制）
git clone https://github.com/LoongBa/TKW.Framework.git src/TKW.Framework
dotnet build src/TKW.Framework/TKW.Framework.sln

# 安装 DocFX
dotnet tool install -g docfx

# 构建文档
docfx docs/docfx.json

# 预览
docfx docs/docfx.json --serve
```

## 部署

GitHub Actions 自动部署到 `gh-pages` 分支。每次推送 `main` 时自动构建。
