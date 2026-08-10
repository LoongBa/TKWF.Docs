# prebuild.ps1 — 在 docfx build 前同步 TKWF 版本号到文档站
# 从 _TKWF/docs/CHANGELOG.md 提取最新 3 版本，更新 3 处维护点
#
# 用法: pwsh docs/prebuild.ps1
# 依赖: ../_TKWF 仓库已 checkout（CI 中由 workflow 控制）

param(
    [string]$TkwfRoot = "../_TKWF",
    [string]$DocsRoot = "docs"
)

$ErrorActionPreference = "Stop"

# ---- 1. 读取 CHANGELOG ----
$changelog = Join-Path $TkwfRoot "docs" "CHANGELOG.md"
if (-not (Test-Path $changelog)) {
    Write-Warning "未找到 CHANGELOG: $changelog，跳过版本同步"
    exit 0
}

$content = Get-Content $changelog -Raw

# 解析版本条目: ## [{version}] — {date}
$versionPattern = '^## \[(\d+\.\d+\.\d+)\]\s*—\s*(\d{4}-\d{2}-\d{2})\s*$'
$entries = [System.Collections.ArrayList]@()
$currentVer = $null
$currentDate = $null
$currentDesc = ""

foreach ($line in $content -split "`n") {
    $line = $line.Trim()
    if ($line -match $versionPattern) {
        # 保存前一条
        if ($currentVer) {
            $null = $entries.Add(@{Ver=$currentVer; Date=$currentDate; Desc=$currentDesc.Trim()})
        }
        $currentVer = $Matches[1]
        $currentDate = $Matches[2]
        $currentDesc = ""
    } elseif ($currentVer -and $line -match '^> (.+)') {
        $currentDesc += $Matches[1] + " "
    }
}
# 保存最后一条
if ($currentVer) {
    $null = $entries.Add(@{Ver=$currentVer; Date=$currentDate; Desc=$currentDesc.Trim()})
}

# 取最新 3 版本（按日期排序，取最新的 3 个）
$latest = $entries | Sort-Object { [DateTime]::ParseExact($_.Date, "yyyy-MM-dd", $null) } -Descending | Select-Object -First 3
if ($latest.Count -eq 0) {
    Write-Warning "CHANGELOG 中未解析到版本条目"
    exit 0
}

$newestVer = $latest[0].Ver
Write-Host "当前最新版本: V$newestVer"

# ---- 2. 更新 llms.txt ----
$llms = Join-Path $DocsRoot "llms.txt"
if (Test-Path $llms) {
    $llmsContent = Get-Content $llms -Raw
    $llmsContent = $llmsContent -replace '- 当前同步版本：V[\d\.]+', "- 当前同步版本：V$newestVer"
    Set-Content $llms -Value $llmsContent -Encoding UTF8
    Write-Host "  ✅ llms.txt  → V$newestVer"
}

# ---- 3. 更新 index.md 版本动态区块 ----
$index = Join-Path $DocsRoot "index.md"
if (Test-Path $index) {
    $indexContent = Get-Content $index -Raw

    $tableRows = ""
    # 从新到旧排列（$latest[0] 最新）
    for ($i = 0; $i -lt $latest.Count; $i++) {
        $e = $latest[$i]
        $shortDesc = $e.Desc
        if ($shortDesc.Length -gt 80) { $shortDesc = $shortDesc.Substring(0, 80) + "…" }
        $tableRows += "| **$($e.Ver)** | $($e.Date) | $shortDesc |`n"
    }

    # 替换版本动态区块中的表格（从 header 后到 CHANGELOG 链接前的表格内容）
    $tablePattern = '(?s)(?<=<!-- ===== 区块 7: 版本动态 ===== -->\n## 最近版本动态\n\n).*?(?=\n> 完整变更历史)'
    if ($indexContent -match $tablePattern) {
        $newBlock = "| 版本 | 日期 | 核心内容 |`n|:-----|:-----|:---------|`n$tableRows`n"
        $indexContent = $indexContent -replace $tablePattern, $newBlock
        Set-Content $index -Value $indexContent -Encoding UTF8
        Write-Host "  ✅ index.md  → V$newestVer 及前 2 版本"
    }
}

# ---- 4. 更新 source-doc-map.md 对齐版本行 ----
$sdm = Join-Path $DocsRoot "articles" "agentic" "source-doc-map.md"
if (Test-Path $sdm) {
    $sdmContent = Get-Content $sdm -Raw
    $sdmContent = $sdmContent -replace '> 对齐 TKWF：V[\d\.]+', "> 对齐 TKWF：V$newestVer"
    if ($sdmContent -notmatch '> 对齐 TKWF：') {
        # 在末尾追加
        $sdmContent = $sdmContent.TrimEnd() + "`n`n---`n`n> 对齐 TKWF：V$newestVer · $(Get-Date -Format 'yyyy-MM-dd')`n"
    }
    Set-Content $sdm -Value $sdmContent -Encoding UTF8
    Write-Host "  ✅ source-doc-map.md → V$newestVer"
}

Write-Host "版本同步完成: V$newestVer"