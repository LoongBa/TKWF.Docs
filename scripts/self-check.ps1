# 综合自检（TKWF.Docs）— 对应《自检与优化机制》SC-01~05/07
# 用法：pwsh scripts/self-check.ps1   （有 L1 失败则退出码 1）
# 专项信息架构细节见 scripts/check-ia.ps1

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$docs = Join-Path $root 'docs'
$fails = New-Object 'System.Collections.Generic.List[string]'
$warns = New-Object 'System.Collections.Generic.List[string]'

function Result($id, $name, $ok, $detail) {
    $tag = if ($ok) { 'PASS' } else { 'FAIL' }
    Write-Host ("  [{0}] {1} — {2}" -f $tag, $id, $name)
    if ($detail) { Write-Host ("         {0}" -f $detail) }
    if (-not $ok) { $script:fails.Add($id) }
}

# ---------- SC-01 版本一致性 ----------
Write-Host "SC-01 版本一致性"
$verFiles = @{
    'README.md'                     = '当前同步版本[：:]\s*V?([\d.]+)'
    'docs\index.md'                 = '4\.10\.\d+'
    'docs\llms.txt'                 = '4\.10\.\d+'
    'docs\content\site.json'        = '"version"\s*:\s*"([\d.]+)"'
    'docs\content\home\versions.json' = '4\.10\.\d+'
    'docs\content\home\hero.json'   = '4\.10\.\d+'
}
$vers = @{}
foreach ($k in $verFiles.Keys) {
    $p = Join-Path $root $k
    if (-not (Test-Path -LiteralPath $p)) { continue }
    $m = Select-String -LiteralPath $p -Pattern $verFiles[$k] -Encoding utf8 | Select-Object -First 1
    if ($m) { $vers[$k] = ($m.Matches | Select-Object -First 1).Value -replace '.*?([0-9]+\.[0-9]+\.[0-9]+).*', '$1' }
}
$distinct = @($vers.Values | Sort-Object -Unique)
Result 'SC-01' '版本六处一致' ($distinct.Count -le 1) ("版本值: " + (($vers.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '; '))

# ---------- SC-02 / SC-03 toc 死链 / 真孤儿 ----------
Write-Host "SC-02/03 toc 死链与真孤儿"
$tocPath = Join-Path $docs 'toc.yml'
$tocHrefs = @()
if (Test-Path -LiteralPath $tocPath) {
    foreach ($l in Get-Content -LiteralPath $tocPath -Encoding utf8) {
        if ($l -match 'href:\s*(\S+)') { $tocHrefs += $matches[1] }
    }
}
$dead = @($tocHrefs | Where-Object { -not (Test-Path -LiteralPath (Join-Path $docs $_)) })
Result 'SC-02' 'toc 死链 = 0' ($dead.Count -eq 0) ("死链: " + ($dead -join ', '))

$artRoot = Join-Path $docs 'articles'
$content = @{}
foreach ($f in Get-ChildItem -LiteralPath $artRoot -Recurse -File -Filter '*.md') {
    $content[$f.FullName.Substring($artRoot.Length + 1)] = Get-Content -LiteralPath $f.FullName -Encoding utf8 -Raw
}
$tocRel = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($h in $tocHrefs) { if ($h -like 'articles/*') { [void]$tocRel.Add(($h.Substring('articles/'.Length) -replace '/', '\')) } }
$realOrphan = @()
foreach ($rel in $content.Keys) {
    if ($rel -match '(^|\\)(index\.md|toc\.yml)$') { continue }
    if ($tocRel.Contains($rel)) { continue }
    $name = [System.IO.Path]::GetFileNameWithoutExtension($rel)
    $inbound = 0
    foreach ($k in $content.Keys) { if ($k -ne $rel -and $content[$k].Contains($name)) { $inbound++ } }
    if ($inbound -eq 0) { $realOrphan += $rel }
}
Result 'SC-03' '真孤儿 = 0' ($realOrphan.Count -eq 0) ("真孤儿: " + ($realOrphan -join ', '))

# ---------- SC-04 articles 死链 ----------
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
Result 'SC-04' '文章死链 = 0' ($broken.Count -eq 0) (($broken | Select-Object -First 10) -join ' | ')

# ---------- SC-05 content-schema 配对 ----------
Write-Host "SC-05 content-schema 配对"
$schemaSet = @{}
$schemaDir = Join-Path $docs 'schemas'
if (Test-Path -LiteralPath $schemaDir) {
    foreach ($s in Get-ChildItem -LiteralPath $schemaDir -File -Filter '*.json') { $schemaSet[[IO.Path]::GetFileNameWithoutExtension($s.Name)] = $true }
}
$contentDir = Join-Path $docs 'content'
$missing = @()
if (Test-Path -LiteralPath $contentDir) {
    foreach ($c in Get-ChildItem -LiteralPath $contentDir -Recurse -File -Filter '*.json') {
        $key = $c.FullName.Substring($contentDir.Length + 1) -replace '\\', '-' -replace '\.json$', ''
        if (-not $schemaSet.ContainsKey($key)) { $missing += $key }
    }
}
Result 'SC-05' 'content 均有 schema' ($missing.Count -eq 0) ("缺 schema: " + ($missing -join ', '))

# ---------- SC-07 脚手架齐备 ----------
Write-Host "SC-07 脚手架"
$need = @('docs\prebuild.ps1', 'scripts\tag.ps1', 'scripts\check-ia.ps1', '.github\workflows\docfx.yml')
$miss = @($need | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root $_)) })
Result 'SC-07' '关键脚手架齐备' ($miss.Count -eq 0) ("缺: " + ($miss -join ', '))

# ---------- 汇总 ----------
Write-Host ""
if ($fails.Count -gt 0) {
    Write-Host ("自检失败（L1）: {0} 项 -> {1}" -f $fails.Count, ($fails -join ', ')) -ForegroundColor Red
    exit 1
}
Write-Host "自检通过：L1 全绿" -ForegroundColor Green
exit 0
