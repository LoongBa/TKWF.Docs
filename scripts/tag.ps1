# tag.ps1 — 同步文档站版本到 TKWF 最新 tag
# 用法: pwsh scripts/tag.ps1
# 自动从 _TKWF 取最新版本 tag，同步到文档站

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot | Split-Path -Parent
Set-Location $root

# 取 TKWF 最新版本 tag
$tag = & git -C "../_TKWF" describe --tags --abbrev=0 --match "V*"
if (-not $tag) { throw "未找到 _TKWF 版本 tag" }
Write-Host "TKWF 最新版本: $tag" -ForegroundColor Cyan

# 同步版本
Write-Host "[1/3] 同步版本号..." -ForegroundColor Cyan
& pwsh -NoProfile docs/prebuild.ps1

# 提交 + tag + 推送
Write-Host "[2/3] 提交 + tag..." -ForegroundColor Cyan
git add -A
git commit -m "chore: 同步 $tag" -m "Ultraworked with [Sisyphus](https://github.com/code-yeongyu/oh-my-openagent)" -m "Co-authored-by: Sisyphus <clio-agent@sisyphuslabs.ai>"
git tag $tag

Write-Host "[3/3] 推送..." -ForegroundColor Cyan
git push origin main --tags

Write-Host "✅ $tag 已同步到文档站" -ForegroundColor Green