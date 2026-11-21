# 信息架构一致性校验（TKWF.Docs）
# 用法：pwsh scripts/check-ia.ps1
# 校验：toc.yml 死链 / 文章导航可见性（真孤儿 vs 软孤儿）/ nav.json 链接
# 规则见私有仓《信息架构规则.md》

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$docs = Join-Path $PSScriptRoot '..\docs'
$docs = (Resolve-Path -LiteralPath $docs).Path
$artRoot = Join-Path $docs 'articles'

# ---------- 1. 解析 toc.yml ----------
$tocPath = Join-Path $docs 'toc.yml'
if (-not (Test-Path -LiteralPath $tocPath)) { throw "未找到 toc.yml: $tocPath" }
$tocHrefs = New-Object 'System.Collections.Generic.List[string]'
foreach ($l in Get-Content -LiteralPath $tocPath -Encoding utf8) {
    if ($l -match 'href:\s*(\S+)') { $tocHrefs.Add($matches[1]) }
}
Write-Host ("=== toc.yml href 总数: {0} ===" -f $tocHrefs.Count)

# ---------- 2. 死链 ----------
$dead = New-Object 'System.Collections.Generic.List[string]'
foreach ($h in $tocHrefs) {
    if (-not (Test-Path -LiteralPath (Join-Path $docs $h))) { $dead.Add($h) }
}
Write-Host ("=== 死链: {0} ===" -f $dead.Count)
foreach ($d in $dead) { Write-Host ("   缺: {0}" -f $d) }

# ---------- 3. 全量文章读入（一次） ----------
$content = @{}
foreach ($f in Get-ChildItem -LiteralPath $artRoot -Recurse -File -Filter '*.md') {
    $rel = ($f.FullName.Substring($artRoot.Length + 1) -replace '\\', '/')
    $content[$rel] = Get-Content -LiteralPath $f.FullName -Encoding utf8 -Raw
}
Write-Host ("=== articles .md 总数: {0} ===" -f $content.Count)

# ---------- 4. toc 引用集合 ----------
$tocRel = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($h in $tocHrefs) {
    if ($h -like 'articles/*') { [void]$tocRel.Add($h.Substring('articles/'.Length)) }
}

# ---------- 5. 孤儿 + 入链 ----------
$realOrphan = @(); $softOrphan = @()
$orphans = New-Object 'System.Collections.Generic.List[string]'
foreach ($rel in $content.Keys) {
    if ($rel -match '(^|/)(index\.md|toc\.yml)$') { continue }
    if (-not $tocRel.Contains($rel)) { $orphans.Add($rel) }
}
$orphans.Sort()
Write-Host ""
Write-Host ("=== 不在 toc 的文章: {0} ===" -f $orphans.Count)
foreach ($o in $orphans) {
    $name = [System.IO.Path]::GetFileNameWithoutExtension($o)
    $inbound = 0
    foreach ($k in $content.Keys) {
        if ($k -ne $o -and $content[$k].Contains($name)) { $inbound++ }
    }
    if ($inbound -gt 0) { $softOrphan += $o; Write-Host ("   [软孤儿 入链{0}] {1}" -f $inbound, $o) }
    else { $realOrphan += $o; Write-Host ("   [真孤儿 无入链] {0}" -f $o) }
}
Write-Host ""
Write-Host ("汇总: 真孤儿 {0} 篇 · 软孤儿 {1} 篇" -f $realOrphan.Count, $softOrphan.Count)

# ---------- 6. nav.json ----------
$navPath = Join-Path $docs 'content\shared\nav.json'
if (Test-Path -LiteralPath $navPath) {
    $nav = Get-Content -LiteralPath $navPath -Encoding utf8 -Raw | ConvertFrom-Json
    Write-Host ""
    Write-Host "=== nav.json 校验 ==="
    foreach ($lk in $nav.links) {
        if ($lk.type -eq 'docfx') {
            $ok = Test-Path -LiteralPath (Join-Path $docs ($lk.href -replace '\.html$', '.md'))
            Write-Host ("   [{0}] {1} -> {2}" -f $(if ($ok) { 'OK' } else { '缺' }), $lk.label, $lk.href)
        } else {
            $route = if ($lk.href -eq '/') { 'index.tsx' } else { ($lk.href.TrimStart('/') + '.tsx') }
            $routePath = Join-Path (Split-Path $docs -Parent) ('webui/src/routes/' + $route)
            $ok = Test-Path -LiteralPath $routePath
            Write-Host ("   [SPA {0}] {1} -> {2} ({3})" -f $(if ($ok) { 'OK' } else { '缺' }), $lk.label, $lk.href, $route)
        }
    }
}

# ---------- 7. 退出码（供 CI 使用） ----------
if ($dead.Count -gt 0 -or $realOrphan.Count -gt 0) {
    Write-Host ""
    Write-Host "校验失败：存在死链或真孤儿" -ForegroundColor Red
    exit 1
}
Write-Host ""
Write-Host "校验通过：0 死链、0 真孤儿" -ForegroundColor Green
