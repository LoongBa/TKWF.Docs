<#
.SYNOPSIS
    TKWF Docs 本地预览脚本 — 无需私有源码即可预览文章内容
.DESCRIPTION
    使用 docfx.local.json 只构建文章，跳过 API 参考生成，
    启动本地预览服务器。浏览器打开 http://localhost:8080 即可查看。
.NOTES
    需要先安装 docfx: dotnet tool install -g docfx
#>

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TKWF Docs — 本地预览" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 docfx 是否安装
$docfx = Get-Command "docfx" -ErrorAction SilentlyContinue
if (-not $docfx) {
    Write-Host "[!] docfx 未安装，正在安装..." -ForegroundColor Yellow
    dotnet tool install -g docfx
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] 安装失败，请手动安装: dotnet tool install -g docfx" -ForegroundColor Red
        exit 1
    }
}

# 构建并预览（使用本地配置，跳过 API 参考）
Write-Host "[1/2] 清理旧构建产物..." -ForegroundColor Green
Set-Location $rootDir
if (Test-Path "docs/_site_local") {
    Remove-Item -LiteralPath "docs/_site_local" -Recurse -Force
    Write-Host "  已删除 docs/_site_local（防止嵌套构建）" -ForegroundColor Yellow
}

Write-Host "[2/2] 构建文档（仅文章，跳过 API 参考）..." -ForegroundColor Green
docfx docs/docfx.local.json --serve

# 注意：上面的命令会阻塞，Ctrl+C 停止