# Sisyphus 工作规则（TKWF.Docs）

> 本文件记录 Sisyphus 在 TKWF.Docs（public 文档站项目）中的持续维护职责与规则。
> 完整版（含私有仓库路径、内部目录结构）见 `_TKWF/docs/TKWF.Docs_设计文档/AGENTS_Docs.md`。

---

## 一、文档站设计方案维护规则

### 1.1 文档位置

| 项 | 值 |
|:---|:---|
| **方案主文档** | `../_TKWF/docs/TKWF.Docs_设计文档/TKW.Framework-文档站设计方案.md`（文件名固定，版本在头部元数据维护） |
| **设计方案变更记录** | `../_TKWF/docs/TKWF.Docs_设计文档/变更记录/V1.x.x-变更记录.md` |
| **内容变更记录** | `docs/变更记录/V4.9.x-内容对齐记录.md` |
| **对齐 TKWF 版本** | 以 `_TKWF/docs/CHANGELOG.md` 为准 |

> `../_TKWF/` 是私有仓库，方案文档存在此处避免公开。

### 1.2 版本管理规则

- **设计文档版本**与 TKWF 框架版本**无对应关系**
- **大版本**（V1→V2）：结构性重构时升级，旧版本备份到 `../_TKWF/docs/TKWF.Docs_设计文档/_Archive/V{n}/`
- **子版本**（V1.0→V1.1）：新增章节/内容调整时升级，文件名固定，旧内容只存 git 历史
- **修订**（V1.0→V1.0.1）：错别字/格式/术语修正，直接修改文件头部元数据

### 1.3 变更记录模板

每种子版本迭代完成后，在 `变更记录/` 下新建 `V1.x.x-变更记录.md`，内容结构：

```markdown
# TKWF.Docs 变更记录 — V1.x.x
> 对齐 TKWF：V4.9.x · 日期：YYYY-MM-DD · 状态：已实施/已审核/已发布
> 前置版本：V1.x.y（日期）

## 一、本次变更（新增/修改/删除 表格）
## 二、涉及文件（文件路径 + 变更类型）
## 三、变更背景（如适用）
## 四、审核记录
## 五、遗留事项
```

### 1.4 维护检查清单（每次会话开始/结束时检查）

- [ ] 方案主文档版本号是否与最新版本一致
- [ ] 是否缺少最近一次子版本迭代的变更记录
- [ ] 大版本切换时是否完成 `_Archive/V{n}/` 备份
- [ ] 术语是否与 TKWF CHANGELOG 同步
- [ ] 版本号/功能点是否以 `_TKWF` 源码与 `docs/CHANGELOG.md` 为准核对

### 1.5 设计文档目录存放规则

所有非公开设计文档统一保存到 `../_TKWF/docs/TKWF.Docs_设计文档/`，不进公开仓库。目录结构：

```
_TKWF/docs/TKWF.Docs_设计文档/
├── TKW.Framework-文档站设计方案.md          # 主方案文档
├── 变更记录/                                # 设计方案自身迭代的变更记录
├── 竞品分析/                                # 竞品对标、市场调研
├── 架构评审/                                # Oracle 架构评审结论
├── 内容策略/                                # 文档站内容规划、信息架构设计
├── 用户研究/                                # 用户反馈、使用场景分析
├── _Archive/                                # 旧大版本归档
├── AGENTS_Docs.md                           # 本规则完整版（含私有信息）
└── ...
```

产品规划类文档（如 V5 国际化规划）存 `01-产品规划/V{版本}/`，不进 `TKWF.Docs_设计文档/`。

---

## 二、TKWF.Docs 站点维护规则

> **单一事实来源原则**：所有内容以 `_TKWF` 仓库为准，依赖关系不可颠倒。

### 2.0 依赖方向（强制）

```
_TKWF（源码 + docs/ 源文档）  ←——— 唯一事实来源 ———  TKWF.Docs（展示/衍生层）
```

- `_TKWF` 是权威来源，TKWF.Docs 是衍生层，不得自创事实
- 更新顺序：`_TKWF` 先变 → 本仓库后同步
- 引用方式：引用 `_TKWF/docs/` 下的 D/G/T 编号，不引用本仓库转述作为依据
- 内容冲突时以 `_TKWF` 源码 + 源文档为准

### 2.1 构建与发布规则

- 文档站基于 DocFX（`docs/docfx.json`），构建 `articles/**`、`api/**`、`toc.yml`、`index.md`
- **`docs/` 根目录下的新 `.md` 文件不会出现在网页上，但会进公开仓库**——内部内容勿放此处
- 文档站内容修改提交前需确认无敏感信息
- 部署：推送 `main` 触发 GitHub Actions 自动构建到 GitHub Pages（DocFX + `webui/` SPA，产物合并后发布）
- **对外域名**：`https://tkwf.loongba.cn`（Cloudflare 橙云代理 → GitHub Pages）。旧地址 `loongba.github.io/TKWF.Docs/*` 由 GitHub 原生 301 至新域对应路径；SPA router 按 hostname 自适应双域名（见 `webui/src/router.tsx`）
- **关联站点**：`loongba.cn` 为跳转落地页（CF Worker 服务），横幅入口指向本站；主站内容在 `coffeedrunk.cn`

### 2.2 版本同步机制（prebuild 脚本）

**Pre-build 脚本**：`docs/prebuild.ps1`

- 在 `docfx build` 前执行，自动从 `_TKWF/docs/CHANGELOG.md` 提取最新 3 版本
- 同步 3 处维护点：
  1. `docs/llms.txt` — 当前同步版本号
  2. `docs/index.md` — 版本动态区块（最近 3 版本表格）
  3. `docs/articles/agentic/source-doc-map.md` — 对齐 TKWF 版本号
- 本地执行：`pwsh docs/prebuild.ps1`；CI 集成：workflow 中 `docfx build` 前添加 `- run: pwsh docs/prebuild.ps1`

**打 tag**：`pwsh scripts/tag.ps1`（自动取 TKWF 最新 v* tag → 同步版本 → 提交 → tag → 推送）

**tag 触发规则**：仅当 `_TKWF` 发布新版本（需同步版本号）时打 tag；文档内容微调（版本号不变）不需要 tag，普通 `git commit` + `git push` 即可。

### 2.3 内容对齐流程（TKWF 新版本发布时）

| 步骤 | 动作 | 说明 |
|:-----|:------|:------|
| 1 | **更新文档内容** | 对齐 TKWF 最新版本（新增特性、修正 API 名、更新示例代码） |
| 2 | **审核 + 记录** | 创建 `docs/变更记录/V4.9.x-内容对齐记录.md` |
| 3 | **提交 + 推送 + tag** | `pwsh scripts/tag.ps1` |

内容变更记录模板见 `docs/变更记录/` 下已有文件。

### 2.4 版本号维护清单（每次打 tag 前检查）

- [ ] 运行 `pwsh docs/prebuild.ps1` 同步 3 处版本号
- [ ] 检查 `README.md` 的"当前同步版本"与 `_TKWF` CHANGELOG 一致
- [ ] 检查 `docs/articles/` 下文章中的版本引用是否过时
- [ ] 检查 `docs/404.md` / `docs/robots.txt` 中的版本/链接引用
- [ ] 构建验证：`docfx build docs/docfx.json` 零 warning

---

## 三、通用工作规则

- 文档改动前先读 `../_TKWF/docs/00-文档体系说明.md`，遵循 D/G/T 分类
- 术语变更（如 `UseNoAop<T>()` → `Use<T>()`）需跨仓库 grep 清理
- 提交前检查 git status，只 add 本次相关的文件

---

## 四、文档同步规则（_TKWF/docs → TKWF.Docs）

> **适用场景**：`_TKWF/docs/` 发生文档变更（新增/修改/重命名/归档/重编号），需同步到 TKWF.Docs 站点。
> 与 §二.3 的区别：§二.3 针对框架版本发布（tag 级别），本节针对**源文档体系自身的结构性变更**。

### 4.1 同步触发条件

收到 "同步文档" 指令时，按以下步骤判定范围：

1. `git -C ../_TKWF log --since='<上次同步时间>' --name-status --format='--- %h %s' -- docs/` — 列出文件变更
2. 读 `../_TKWF/docs/00-文档体系说明.md` — 获取最新文档体系全貌
3. `git -C ../_TKWF tag --list 'v*' --sort=-v:refname | Select-Object -First 3` — 确认最新 TKWF 版本
4. `git log --oneline -5` — 确认本仓库上次同步点

### 4.2 变更类型与同步动作矩阵

| `_TKWF/docs/` 变更类型 | TKWF.Docs 同步动作 |
|:-----------------------|:-------------------|
| **新增源文档** | source-doc-map 新增行 |
| **源文档重编号** | source-doc-map 更新编号；grep 全仓库旧编号引用并替换 |
| **源文档归档** | source-doc-map 删除对应行或标注"已归档" |
| **源文档内容修改** | 检查 articles 是否有衍生内容需同步；source-doc-map 描述按需更新 |
| **新增文档系列** | source-doc-map 新增分节；设计方案 §3.2 更新 |
| **文档体系整理** | 全量对比 source-doc-map 与 00-文档体系说明，补齐缺失条目 |

### 4.3 source-doc-map.md 更新规则

- 分区与 `00-文档体系说明.md` 的 D/G/T/AC 分类对应
- 编号与源文档**逐字一致**，重编号后旧编号不保留
- 每个条目描述控制在 1-2 句，含版本/状态标注
- 有对应公开文章的填链接，无对应的填 `—`
- 末尾 `> 对齐 TKWF：V{x.y.z}` 由 prebuild.ps1 自动同步，不手动修改
- 重编号后直接使用新编号，不在映射表中保留旧编号→新编号映射

### 4.4 articles 内容同步规则

| 判定条件 | 动作 |
|:---------|:-----|
| 公开文章引用了被修改源文档的具体内容（API 名、代码示例、架构描述） | 同步更新 |
| 公开文章只引用源文档编号/标题作为"进一步阅读"链接 | 无需同步 |
| 源文档重编号，公开文章引用旧编号 | grep 全仓库替换 |
| 源文档归档，公开文章引用该文档 | 更新引用为替代文档或删除 |

> `docs/变更记录/` 下的历史记录文件**不修改**——保留旧编号以反映当时事实。

### 4.5 同步验证清单

- [ ] source-doc-map 条目数量与 `00-文档体系说明.md` 的 D/G/T/AC 表格一致
- [ ] source-doc-map 中无已归档文档的残留条目（或已标注"已归档"）
- [ ] 全仓库 grep 无旧编号残留
- [ ] `README.md` "当前同步版本"与 `_TKWF` 最新 tag 一致
- [ ] `pwsh docs/prebuild.ps1` 执行通过
- [ ] `docfx build docs/docfx.json` 零 warning

---

## 五、设计方案更新触发规则

### 5.1 更新触发条件

| 触发条件 | 升版本类型 |
|:---------|:-----------|
| 新增/删除顶层导航分类（toc.yml 结构性变更） | 子版本 |
| 新增/删除文章（§3.2 新文章清单变化） | 子版本 |
| 引用模式变更（链接策略调整） | 子版本 |
| 首页设计变更（Hero 文案、对比表、场景卡片） | 子版本 |
| 新增文档系列且需在站点引用 | 子版本 |
| 源文档大规模重编号 | 修订 |
| 源文档新增内容需在站点文章中体现 | 修订 |
| 错别字、格式修正、术语同步 | 修订 |

### 5.2 不需要更新设计方案的情况

- 源文档内容修改（无编号变化）→ source-doc-map 同步即可
- 源文档归档（不影响站点导航）→ source-doc-map 标注即可
- TKWF 框架版本升级（无文档结构变化）→ prebuild.ps1 + 内容对齐记录即可

### 5.3 设计方案与文档同步的协作关系

```
_TKWF/docs 发生变更
  ├── 文档结构变化 → 文档同步（§四）→ 是否影响导航/文章清单/引用策略？
  │     ├── 是 → 更新设计方案（§五）→ 升版本 + 变更记录
  │     └── 否 → 仅文档同步，设计方案不动
  └── 纯内容修改 → 文档同步（§四）
```

### 5.4 设计方案版本判定流程

```
文档同步完成 → 检查 §5.4 清单（全否→不动；修订级→V1.x.y+1；子版本级→V1.x+1）
```

---

## 六、SPA 首页内容地图维护规则

> **核心文件**：`docs/CONTENT_MAP.md` — 内容维护者与 UI Agent 之间的唯一契约。
> 完整规则见 CONTENT_MAP.md 本身，本节仅记录 SOP 与版本规则。

### 6.1 角色分工

| 角色 | 职责 | 碰的文件 |
|:---|:---|:---|
| **内容维护者**（本项目） | 写/改内容 JSON/MD、维护 CONTENT_MAP.md | `docs/content/**`、`docs/CONTENT_MAP.md` |
| **UI Agent** | 按 CONTENT_MAP.md 接线，组件纯渲染，零硬编码 | `webui/src/components/**`、`webui/src/routes/**` |

### 6.2 接收 UI Agent 输出包（SOP）

| 步骤 | 命令 | 说明 |
|:-----|:------|:------|
| 1 | `Remove-Item -Recurse -Force webui/` | 删干净，不留旧文件 |
| 2 | 解压包 → `webui/` | 放入新文件 |
| 3 | `Remove-Item -Recurse -Force webui/src/content/` | 删除 UI Agent 本地副本，事实来源是 `docs/content/` |
| 4 | `cd webui && pnpm install` | 装依赖 |
| 5 | `cd webui && pnpm build` | 验证编译通过 |
| 6 | `git status` + `git diff` | 审查变更 |
| 7 | `git add webui/ && git commit` | 提交 |

**UI Agent 交付时需附带变更说明**：如果设计调整中修改了 `docs/content/` 下的文件，交付包应附一份变更摘要，列明修改了什么（文件路径 + 改动说明），以便核对和同步。

### 6.3 CONTENT_MAP.md 版本号规则

| 级别 | 触发条件 | 示例 |
|:---|:---|:---|
| **大版本**（V1→V2） | 结构性重构（接入协议、角色分工变更） | V1→V2 |
| **子版本**（V1.0→V1.1） | 新增 schema/规则/章节/页面映射 | V1.0→V1.1 |
| **修订**（V1.0→V1.0.1） | 错别字、格式修正、路径修正 | V1.0→V1.0.1 |

**不需要升版本的情况**：内容文件数据更新（改文案/版本号/代码示例），只需更新 §八 映射表。

### 6.4 维护检查清单

- [ ] CONTENT_MAP.md 的 schema 与实际内容文件一致
- [ ] 新增内容文件后 CONTENT_MAP.md §八 映射表已更新
- [ ] `versions.json` 和 `site.json` 的版本号与 `_TKWF` CHANGELOG 一致
- [ ] 内容文件中的图标 key 在 `icon-map.ts` 中有对应映射
- [ ] 新增 Section 后 `sections.json` 注册表已更新