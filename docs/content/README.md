# 内容文件速查表

> 改什么 → 改哪个文件。详细 schema 见 `docs/CONTENT_MAP.md`。

## 首页区块

| 改什么 | 文件 | 格式 | 备注 |
|:---|:---|:---|:---|
| Hero 标题 / 副标题 / CTA 按钮 | `home/hero.json` | JSON | 徽章版本号由 prebuild 自动同步 |
| Agentic 评估分数 / 趋势信号 | `home/evaluation.json` | JSON | |
| 三方分工工作流 / 代码示例 | `home/workflow.json` | JSON | |
| 五大设计支柱 | `home/pillars.json` | JSON | |
| 路径卡片（快速探索等） | `home/paths.json` | JSON | |
| 核心特性卡片 | `home/features.json` | JSON | |
| 版本动态表 | `home/versions.json` | JSON | ⚠ prebuild 自动同步，勿手改 |
| V5.0 路线图 | `home/roadmap.json` | JSON | |
| 代码场景（10 个） | `home/scenarios/01-*.md` ~ `10-*.md` | MD | frontmatter + code fence |
| 首页区块顺序 | `home/sections.json` | JSON | 调顺序只改这个 |

## 子页面

| 改什么 | 文件 | 格式 |
|:---|:---|:---|
| NuGet 包列表 | `nuget/packages.json` | JSON |
| 架构分层 | `architecture/layers.json` | JSON |
| 最佳实践条目 | `best-practices/practices.json` | JSON |

## 共享

| 改什么 | 文件 | 格式 | 备注 |
|:---|:---|:---|:---|
| 导航栏链接 | `shared/nav.json` | JSON | 新增页面时加 `type: "spa"` |
| 页脚 | `shared/footer.json` | JSON | |
| 站点版本号 / URL / 许可证 | `site.json` | JSON | ⚠ version 由 prebuild 自动同步 |

## 版本同步（自动）

| 触发 | 动作 |
|:---|:---|
| `_TKWF` 发布新版本 | `pwsh docs/prebuild.ps1` 自动更新 `site.json` + `versions.json` + `hero.json` 版本徽章 |
| 不需要手动改版本号 | 脚本从 `_TKWF/docs/CHANGELOG.md` 提取 |

## 编辑提示

- VS Code 打开 JSON 文件时有**自动补全和校验**（已配置 JSON Schema）
- 图标 key 可用值见 `docs/CONTENT_MAP.md` §四
- 链接 `type` 字段：`spa`（SPA 内部）、`docfx`（DocFX 文章）、`external`（外链）
- 改完 `git add docs/content/ && git commit && git push` 即可
