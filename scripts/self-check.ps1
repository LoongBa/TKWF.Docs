# 综合自检（TKWF.Docs）— 对应《自检与优化机制》SC-01~05/07/17
# 用法：pwsh scripts/self-check.ps1   （L1 失败退出码 1；SC-16 API 计数在 CI 侧执行）
# 判据与新增项见私有仓《自检与优化机制.md》§二

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$docs = Join-Path $root 'docs'
$fails = New-Object 'System.Collections.Generic.List[string]'
$warns = New-Object 'System.Collections.Generic.List[string]'

function Pass($id, $name, $detail) {
    Write-Host ("  [PASS] {0} — {1}" -f $id, $name)
    if ($detail) { Write-Host ("         {0}" -f $detail) }
}
function Fail($id, $name, $detail) {
    Write-Host ("  [FAIL] {0} — {1}" -f $id, $name)
    if ($detail) { Write-Host ("         {0}" -f $detail) }
    $script:fails.Add($id)
}
function Warn($id, $name, $detail) {
    Write-Host ("  [WARN] {0} — {1}" -f $id, $name)
    if ($detail) { Write-Host ("         {0}" -f $detail) }
    $script:warns.Add($id)
}

# ---------- SC-01 版本一致性（基准 = site.json.version；六处任一未命中即 FAIL） ----------
Write-Host "SC-01 版本一致性"
$siteJson = Join-Path $docs 'content\site.json'
if (-not (Test-Path -LiteralPath $siteJson)) {
    Fail 'SC-01' 'site.json 缺失，无法取基准版本' ''
} else {
    $base = (Get-Content -LiteralPath $siteJson -Encoding utf8 -Raw | ConvertFrom-Json).version
    $verFiles = @(
        'README.md',
        'docs\index.md',
        'docs\llms.txt',
        'docs\articles\agentic\source-doc-map.md',
        'docs\content\site.json',
        'docs\content\home\versions.json',
        'docs\content\home\hero.json'
    )
    $miss = @()
    foreach ($k in $verFiles) {
        $p = Join-Path $root $k
        if (-not (Test-Path -LiteralPath $p)) { $miss += "$k(缺失)"; continue }
        $hit = Select-String -LiteralPath $p -Pattern $base -SimpleMatch -Encoding utf8 | Select-Object -First 1
        if (-not $hit) { $miss += $k }
    }
    if ($miss.Count -eq 0) { Pass 'SC-01' "版本六处一致（基准=$base）" '' }
    else { Fail 'SC-01' "版本未命中（基准=$base）" ("未命中: " + ($miss -join ', ')) }
}

# ---------- SC-02 toc 死链 ----------
Write-Host "SC-02 toc 死链"
$tocPath = Join-Path $docs 'toc.yml'
$tocHrefs = @()
if (Test-Path -LiteralPath $tocPath) {
    foreach ($l in Get-Content -LiteralPath $tocPath -Encoding utf8) {
        if ($l -match 'href:\s*(\S+)') { $tocHrefs += $matches[1] }
    }
}
$dead = @($tocHrefs | Where-Object { -not (Test-Path -LiteralPath (Join-Path $docs $_)) })
if ($dead.Count -eq 0) { Pass 'SC-02' ("toc 死链 = 0（href {0}）" -f $tocHrefs.Count) '' }
else { Fail 'SC-02' 'toc 死链' ("死链: " + ($dead -join ', ')) }

# ---------- 全量文章读入 ----------
$artRoot = Join-Path $docs 'articles'
$content = @{}
foreach ($f in Get-ChildItem -LiteralPath $artRoot -Recurse -File -Filter '*.md') {
    $content[$f.FullName.Substring($artRoot.Length + 1)] = Get-Content -LiteralPath $f.FullName -Encoding utf8 -Raw
}
$tocRel = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($h in $tocHrefs) { if ($h -like 'articles/*') { [void]$tocRel.Add(($h.Substring('articles/'.Length) -replace '/', '\')) } }

# ---------- SC-03 真孤儿（入链按链接形态判定，非子串） ----------
Write-Host "SC-03 真孤儿"
$realOrphan = @()
$softOrphan = @()
foreach ($rel in $content.Keys) {
    if ($rel -match '(^|\\)(index\.md|toc\.yml)$') { continue }
    if ($tocRel.Contains($rel)) { continue }
    $name = [System.IO.Path]::GetFileNameWithoutExtension($rel)
    $linkPat = '\]\(([^)]*/)?' + [regex]::Escape($name) + '(\.md)?([#\)])'
    $inbound = 0
    foreach ($k in $content.Keys) {
        if ($k -eq $rel) { continue }
        if ([regex]::IsMatch($content[$k], $linkPat)) { $inbound++ }
    }
    if ($inbound -eq 0) { $realOrphan += $rel } else { $softOrphan += $rel }
}
if ($realOrphan.Count -eq 0) { Pass 'SC-03' ("真孤儿 = 0（软孤儿 {0}）" -f $softOrphan.Count) '' }
else { Fail 'SC-03' '存在真孤儿（既不在 toc 又无链接入链）' ("真孤儿: " + ($realOrphan -join ', ')) }

# ---------- SC-04 站点文章死链 ----------
Write-Host "SC-04 站点文章死链"
$rx = '\]\((?!https?:|#|mailto:)([^)]+?)\)'
$broken = @()
foreach ($f in Get-ChildItem -LiteralPath $artRoot -Recurse -File -Filter '*.md') {
    $lines = Get-Content -LiteralPath $f.FullName -Encoding utf8
    for ($i = 0; $i -lt $lines.Count; $i++) {
        foreach ($m in [regex]::Matches($lines[$i], $rx)) {
            $t = $m.Groups[1].Value.Trim()
            if ($t -match '#') { $t = $t.Substring(0, $t.IndexOf('#')) }
            $t = [uri]::UnescapeDataString($t).Trim()
            if ([string]::IsNullOrWhiteSpace($t)) { continue }
            if ($t -match '\s+"') { $t = ($t -split '\s+"')[0] }
            $cand = ($t -replace '/', '\') -replace '\.html$', '.md'
            if (-not (Test-Path -LiteralPath (Join-Path $f.DirectoryName $cand)) -and
                -not (Test-Path -LiteralPath (Join-Path $docs $cand))) {
                $broken += ("{0}:{1}->{2}" -f $f.FullName.Substring($artRoot.Length + 1), ($i + 1), $t)
            }
        }
    }
}
if ($broken.Count -eq 0) { Pass 'SC-04' '文章死链 = 0' '' }
else { Fail 'SC-04' '文章死链' (($broken | Select-Object -First 10) -join ' | ') }

# ---------- SC-05 content-schema 配对 ----------
Write-Host "SC-05 content-schema 配对"
$schemaSet = @{}
$schemaDir = Join-Path $docs 'schemas'
if (Test-Path -LiteralPath $schemaDir) {
    foreach ($s in Get-ChildItem -LiteralPath $schemaDir -File -Filter '*.json') { $schemaSet[[IO.Path]::GetFileNameWithoutExtension($s.Name)] = $true }
}
$contentDir = Join-Path $docs 'content'
$noSchema = @()
if (Test-Path -LiteralPath $contentDir) {
    foreach ($c in Get-ChildItem -LiteralPath $contentDir -Recurse -File -Filter '*.json') {
        $key = $c.FullName.Substring($contentDir.Length + 1) -replace '\\', '-' -replace '\.json$', ''
        if (-not $schemaSet.ContainsKey($key)) { $noSchema += $key }
    }
}
if ($noSchema.Count -eq 0) { Pass 'SC-05' 'content 均有 schema' '' }
else { Fail 'SC-05' 'content 缺 schema' ("缺: " + ($noSchema -join ', ')) }

# ---------- SC-07 脚手架齐备 ----------
Write-Host "SC-07 脚手架"
$need = @('docs\prebuild.ps1', 'scripts\tag.ps1', 'scripts\check-ia.ps1', '.github\workflows\docfx.yml')
$missScaffold = @($need | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root $_)) })
if ($missScaffold.Count -eq 0) { Pass 'SC-07' '关键脚手架齐备' '' }
else { Fail 'SC-07' '脚手架缺失' ("缺: " + ($missScaffold -join ', ')) }

# ---------- SC-17 CONTENT_MAP 登记（L2 提示，不阻断） ----------
Write-Host "SC-17 CONTENT_MAP 登记"
$cmapPath = Join-Path $docs 'CONTENT_MAP.md'
if (-not (Test-Path -LiteralPath $cmapPath)) {
    Warn 'SC-17' 'CONTENT_MAP.md 缺失' ''
} else {
    $cmapText = Get-Content -LiteralPath $cmapPath -Encoding utf8 -Raw
    $unreg = @()
    foreach ($c in Get-ChildItem -LiteralPath $contentDir -Recurse -File) {
        if ($c.Name -eq 'README.md') { continue }
        $rel = ($c.FullName.Substring($contentDir.Length + 1) -replace '\\', '/')
        if (-not $cmapText.Contains($rel) -and -not $cmapText.Contains($c.Name)) { $unreg += $rel }
    }
    if ($unreg.Count -eq 0) { Pass 'SC-17' 'content 均已登记 CONTENT_MAP' '' }
    else { Warn 'SC-17' 'CONTENT_MAP 未登记项' ("未登记: " + ($unreg -join ', ')) }
}

# ---------- 汇总 ----------
Write-Host ""
if ($fails.Count -gt 0) {
    Write-Host ("自检失败（L1）: {0} 项 -> {1}" -f $fails.Count, ($fails -join ', ')) -ForegroundColor Red
    if ($warns.Count -gt 0) { Write-Host ("另有 L2 提示: " + ($warns -join ', ')) -ForegroundColor Yellow }
    exit 1
}
if ($warns.Count -gt 0) { Write-Host ("自检通过（L1 全绿）；L2 提示: {0}" -f ($warns -join ', ')) -ForegroundColor Yellow }
else { Write-Host "自检通过：L1 全绿、无 L2 提示" -ForegroundColor Green }
exit 0
