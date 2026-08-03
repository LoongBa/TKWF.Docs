# tag.ps1 — 一键打 tag：同步版本 → 构建验证 → 提交 → tag → 推送
# 用法: pwsh scripts/tag.ps1 V4.9.13
# 要求: 在 TKWF.Docs 仓库根目录执行

param([string]$Tag = $(throw "参数缺失: 请指定 tag 名，如 pwsh scripts/tag.ps1 V4.9.13"))

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot | Split-Path -Parent
Set-Location $root

# 1. 同步版本
Write-Host "`n[1/5] 同步版本号..." -ForegroundColor Cyan
& pwsh -NoProfile docs/prebuild.ps1

# 2. 构建验证
Write-Host "`n[2/5] 构建验证..." -ForegroundColor Cyan
docfx build docs/docfx.json 2>&1 | Tee-Object -Variable buildOutput
if ($buildOutput -match "warning|error") {
    Write-Host "⚠️ 构建出现 warning/error，请检查后重试" -ForegroundColor Yellow
    exit 1
}

# 3. 提交
Write-Host "`n[3/5] 提交 + tag..." -ForegroundColor Cyan
git add -A
git commit -m "chore: $Tag 版本同步" -m "Ultraworked with [Sisyphus](https://github.com/code-yeongyu/oh-my-openagent)" -m "Co-authored-by: Sisyphus <clio-agent@sisyphuslabs.ai>"
git tag $Tag

# 4. 推送
Write-Host "`n[4/5] 推送..." -ForegroundColor Cyan
git push origin main --tags

# 5. 完成
Write-Host "`n[5/5] ✅ $Tag 已发布" -ForegroundColor Green