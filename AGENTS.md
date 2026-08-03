# Sisyphus 工作规则（TKWF.Docs）

> 本文件记录 Sisyphus 在本仓库（TKWF.Docs，public 文档站项目）中的持续维护职责与规则。

---

## 一、TKWF.Docs 文档站设计方案维护规则

### 1.1 文档位置

| 项 | 值 |
|:---|:---|
| **方案主文档** | `../_TKWF/docs/TKWF.Docs_设计文档/TKW.Framework-文档站设计方案-V1.0.1.md`（即 `F:\LoongBa_Git\_TKWF\docs\TKWF.Docs_设计文档\`，**始终保留最新版本文件**） |
| **变更记录目录** | `../_TKWF/docs/TKWF.Docs_设计文档/变更记录/` |
| **版本命名** | `TKW.Framework-文档站设计方案-V{大}.{小}.{修订}.md` |
| **变更记录命名** | `V{大}.{小}.{修订}-变更记录.md` |
| **对齐 TKWF 版本** | 主文档与变更记录**开头**均须标注对齐的 TKWF 版本号 + 日期（如 `对齐 TKWF：V4.9.12 · 2026-08-04`），以 `_TKWF/docs/CHANGELOG.md` 为准 |

> **为什么存在 `../_TKWF/` 而不是本仓库？**
> - TKWF.Docs 是 **public 仓库**（GitHub Pages 站点），提交即公开
> - 方案文档属于内部规划，必须保存在私有仓库 `_TKWF` 的 `docs/` 下，既被 git 跟踪又不被公开
> - `_TKWF` 仓库的 `.gitignore` 已忽略 `.sisyphus/`，但 `docs/TKWF.Docs_设计文档/` 是被跟踪的

### 1.2 版本管理规则

- **大版本（V1 / V2 / V3…）**：结构性重构（导航架构、引用机制、设计原则变更）时升级。发布新大版本时，将旧大版本方案文档备份到 `../_TKWF/docs/TKWF.Docs_设计文档/_Archive/V{n}/` 子目录。
- **子版本（V1.0 / V1.1 / V1.2…）**：新增章节、内容调整、站点功能增强时升级。**主文档文件名随版本号更新（git mv 保留历史），内容保持最新**——旧版本通过 git 历史与变更记录追溯，不保留多份版本文件。
- **修订（V1.0.1…）**：错别字、格式修正、术语同步等小改动，可直接修改当前版本文件（必要时同样 git mv 更新文件名）。

### 1.3 每次子版本迭代必做

每次子版本迭代完成后，**必须**做两件事：

1. **编写变更记录**：在 `变更记录/` 目录下新增一份变更记录文档：

```
V1.x.x-变更记录.md
```

2. **更新主设计文档**：将 `TKW.Framework-文档站设计方案-V1.x.x.md` 的版本标记与文件名更新为最新版本号，**内容保持最新**（旧内容仅存于 git 历史，不在文档中堆叠）。

**变更记录模板**：

```markdown
# TKWF.Docs 变更记录 — V1.x.x

> 对齐 TKWF：V4.9.x · 日期：YYYY-MM-DD · 状态：已实施/已审核/已发布
> 前置版本：V1.x.y（日期，迭代来源）

## 一、本次变更

| 类型 | 说明 |
|:-----|:-----|
| 新增 | 新增了哪些文档/章节/页面 |
| 修改 | 修改了哪些现有内容 |
| 删除 | 删除了哪些内容 |

## 二、涉及文件

| 文件路径 | 变更类型 |
|:---------|:---------|
| `docs/TKWF.Docs_设计文档/TKW.Framework-文档站设计方案-V1.x.x.md` | 新增/修改 |
| … | … |

## 三、变更背景（如适用）

用户补充的需求 / 评审意见 / 事实核验结果……

## 四、审核记录

| 审核人/工具 | 结果 | 日期 | 意见摘要 |
|:-----------|:-----|:-----|:---------|
| Momus | ✅ 通过 | YYYY-MM-DD | … |

## 五、遗留事项

- …
```

### 1.4 维护检查清单（每次会话开始/结束时检查）

- [ ] 方案主文档当前版本号是否与最新版本一致
- [ ] 是否缺少最近一次子版本迭代的变更记录
- [ ] 大版本切换时是否完成 `_Archive/V{n}/` 备份
- [ ] 术语是否与 TKWF 主仓库 CHANGELOG 同步（V4.9.12 当前）
- [ ] 本仓库引用的版本号/功能点是否以 `_TKWF` 源码与 `docs/CHANGELOG.md` 为准核对过（依赖方向不可颠倒）

---

## 二、TKWF.Docs 站点维护规则

> **单一事实来源（Source of Truth）原则**：所有内容以 `_TKWF` 仓库为准，依赖关系不可颠倒。

### 2.0 依赖方向（强制）

```
_TKWF（源码 + docs/ 源文档）  ←——— 唯一事实来源 ———  TKWF.Docs（展示/衍生层）
```

- **`_TKWF` 是权威来源**：框架源码、`docs/` 下 D/G/T 系列文档、CHANGELOG 版本历史，均为**事实**，任何情况下不得以 TKWF.Docs 内容反向推断事实
- **TKWF.Docs 是衍生层**：本仓库所有文章、README、方案文档，都是对 `_TKWF` 事实的**转述/组织/编排**，不得自创事实
- **更新顺序**：`_TKWF` 先变（源码/文档/版本发布）→ 本仓库后同步。禁止先改本仓库再等 `_TKWF` 追认
- **版本核对**：本仓库任何版本号（README"当前同步版本"、功能点描述）必须与 `_TKWF/docs/CHANGELOG.md` 及源码一致；不一致时以 `_TKWF` 为准修正本仓库
- **引用方式**：本仓库文章需引用源文档时，引用 `_TKWF/docs/` 下的 D/G/T 文档标题与编号（如 D07A、G06），不得引用本仓库自身的转述作为依据
- **内容冲突时**：以 `_TKWF` 源码 + 源文档为准，冲突方为本仓库，须修正

### 2.1 构建与发布规则

- 本文档站基于 DocFX（`docs/docfx.json`），只构建 `articles/**`、`api/**`、`toc.yml`、`index.md`
- **`docs/` 根目录下的新 `.md` 文件不会出现在网页上，但会进公开 git 仓库**——内部内容勿放此处
- 文档站内容修改（articles、toc、首页）提交到本 public 仓库前需确认无敏感信息
- 部署：推送 `main` 触发 GitHub Actions 自动构建到 GitHub Pages

### 2.2 版本同步机制（prebuild 脚本）

> 维护 3 处版本号同步点，避免手动更新遗漏。

**Pre-build 脚本**：`docs/prebuild.ps1`

- 在 `docfx build` 前执行，自动从 `_TKWF/docs/CHANGELOG.md` 提取最新 3 版本
- 同步 3 处维护点：
  1. `docs/llms.txt` — 当前同步版本号
  2. `docs/index.md` — 版本动态区块（最近 3 版本表格）
  3. `docs/articles/agentic/source-doc-map.md` — 对齐 TKWF 版本号
- 本地执行：`pwsh docs/prebuild.ps1`
- CI 集成：GitHub Actions workflow 中在 `docfx build` 前添加 `- run: pwsh docs/prebuild.ps1`

**打 tag 一句话**：`pwsh scripts/tag.ps1`（自动取 TKWF 最新 tag → 同步版本 → 提交 → tag → 推送）

### 2.3 版本号维护清单（每次打 tag 前检查）

- [ ] 运行 `pwsh docs/prebuild.ps1` 同步 3 处版本号
- [ ] 检查 `README.md` 的"当前同步版本"是否与 `_TKWF` CHANGELOG 一致
- [ ] 检查 `docs/articles/` 下文章中的版本引用是否过时
- [ ] 检查 `docs/404.md` / `docs/robots.txt` 中的版本/链接引用
- [ ] 构建验证：`docfx build docs/docfx.json` 零 warning

---

## 三、通用工作规则

- 文档改动前先读 `../_TKWF/docs/00-文档体系说明.md`，遵循 D/G/T 分类
- 术语变更（如 `UseNoAop<T>()` → `Use<T>()`）需跨仓库 grep 清理
- 提交前检查 git status，只 add 本次相关的文件
