#Requires -Version 7.0
<#
.SYNOPSIS
    TKWF 框架一键安装（下载 → 解压 → 设置 TKWFDeployPath → 验证）。
.DESCRIPTION
    消费方只需一条命令即可获得可用的 TKWF 部署包，无需源码仓、无需手工配置。
    安装后可立即运行 new-solution 创建项目。
.PARAMETER Version
    框架版本（决定下载文件名 TKWF-<Version>.zip）。默认 latest。
.PARAMETER Destination
    解压目标目录。默认 %LOCALAPPDATA%\TKWF\<Version>。
.PARAMETER FromZip
    本地 zip 路径（离线安装；优先于下载）。
.PARAMETER BaseUrl
    下载根地址。默认 https://tkwf.loongba.cn/downloads。
.PARAMETER Force
    目标目录已存在时重新解压。
.EXAMPLE
    irm https://tkwf.loongba.cn/install.ps1 | iex
.EXAMPLE
    .\install.ps1 -FromZip F:\downloads\TKWF-v4.10.122.zip
.EXAMPLE
    .\install.ps1 -Version v4.10.122 -Destination D:\Tools\TKWF
#>
[CmdletBinding()]
param(
    [string]$Version = 'latest',
    [string]$Destination = '',
    [string]$FromZip = '',
    [string]$BaseUrl = 'https://tkwf.loongba.cn/downloads',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8

function Write-Step($m) { Write-Host "`n▶ $m" -ForegroundColor Cyan }
function Write-Ok($m) { Write-Host "  ✓ $m" -ForegroundColor Green }
function Write-Warn($m) { Write-Host "  ! $m" -ForegroundColor Yellow }
function Write-Err($m) { Write-Host "  ✗ $m" -ForegroundColor Red }

Write-Host ''
Write-Host '════════ TKWF 框架安装 ════════' -ForegroundColor White

# ── 1. .NET SDK 检查 ──────────────────────────────────────────────
Write-Step '检查 .NET SDK'
$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
$sdkMajor = 0
if ($dotnet) {
    $ver = (& dotnet --version 2>$null)
    if ($ver -match '^(\d+)\.') { $sdkMajor = [int]$Matches[1] }
}
if ($sdkMajor -ge 10) {
    Write-Ok ".NET SDK $ver"
} else {
    Write-Warn "未检测到 .NET SDK 10+（当前: $(if ($ver) { $ver } else { '未安装' })）"
    Write-Host '    请先安装: https://dotnet.microsoft.com/download/dotnet/10.0' -ForegroundColor Yellow
    if (-not $PSBoundParameters.ContainsKey('Force')) {
        Write-Host '    安装后重新运行本脚本（或加 -Force 跳过检查）。' -ForegroundColor Yellow
        exit 1
    }
}

# ── 2. 获取部署包 ────────────────────────────────────────────────
if (-not $Destination) {
    $Destination = Join-Path $env:LOCALAPPDATA "TKWF\$Version"
}
$Destination = [IO.Path]::GetFullPath($Destination)

Write-Step '获取部署包'
$zipPath = $null
if ($FromZip) {
    if (-not (Test-Path -LiteralPath $FromZip)) { Write-Err "找不到 zip: $FromZip"; exit 1 }
    $zipPath = (Resolve-Path -LiteralPath $FromZip).Path
    Write-Ok "使用本地包: $zipPath"
} else {
    if ($Version -eq 'latest') {
        Write-Warn '版本为 latest：将尝试 latest.zip；正式发布后建议指定具体版本'
    }
    $url = "$($BaseUrl.TrimEnd('/'))/TKWF-$Version.zip"
    $zipPath = Join-Path ([IO.Path]::GetTempPath()) "TKWF-$Version.zip"
    Write-Host "    下载: $url" -ForegroundColor DarkGray
    try {
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
        Write-Ok "已下载 → $zipPath"
    } catch {
        Write-Err "下载失败: $($_.Exception.Message)"
        Write-Host '    可选方案:' -ForegroundColor Yellow
        Write-Host '      · 手工下载 zip 后: .\install.ps1 -FromZip <path>' -ForegroundColor Yellow
        Write-Host '      · 或 git clone 框架源码仓并用 build\build-deployment.ps1 -Zip 生成' -ForegroundColor Yellow
        exit 1
    }
}

# ── 3. 解压 ──────────────────────────────────────────────────────
Write-Step "解压到 $Destination"
$hasProps = Test-Path -LiteralPath (Join-Path $Destination 'build\TKWF.Domain.props')
if ($hasProps -and -not $Force) {
    Write-Ok '目标目录已是有效部署包，跳过解压（如需重装加 -Force）'
} else {
    if (Test-Path -LiteralPath $Destination) {
        if (-not $Force) { Write-Err "目标目录已存在且非部署包: $Destination（加 -Force 覆盖）"; exit 1 }
        Remove-Item -LiteralPath $Destination -Recurse -Force
    }
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    Expand-Archive -LiteralPath $zipPath -DestinationPath $Destination -Force
    # 兼容 zip 内含顶层目录的情况
    if (-not (Test-Path -LiteralPath (Join-Path $Destination 'build\TKWF.Domain.props'))) {
        $inner = Get-ChildItem -LiteralPath $Destination -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'build\TKWF.Domain.props') } | Select-Object -First 1
        if ($inner) {
            Get-ChildItem -LiteralPath $inner.FullName -Force | Move-Item -Destination $Destination -Force
            Remove-Item -LiteralPath $inner.FullName -Recurse -Force
        }
    }
    Write-Ok "已解压 ($([math]::Round((Get-ChildItem $Destination -Recurse -File | Measure-Object Length -Sum).Sum/1MB,1)) MB)"
}

# ── 4. 校验部署包完整性 ──────────────────────────────────────────
Write-Step '校验部署包'
$required = @(
    'build\TKWF.Domain.props'
    'build\TKWF.Domain.targets'
    'build\refs'
    'xCodeGen\xCodeGen.Cli.exe'
    'xCodeGen\scripts'
    'xCodeGen\scaffolding'
)
$missing = @($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $Destination $_)) })
if ($missing.Count -gt 0) {
    Write-Err "部署包不完整，缺少: $($missing -join ', ')"
    exit 1
}
Write-Ok "四大件齐备（refs / props+targets / xCodeGen / scaffolding）"

# ── 5. 设置 TKWFDeployPath（User 级，无需管理员）──────────────────
Write-Step '设置 TKWFDeployPath'
$current = [Environment]::GetEnvironmentVariable('TKWFDeployPath', 'User')
if ($current -eq $Destination) {
    Write-Ok "已是该路径（User 级）"
} else {
    [Environment]::SetEnvironmentVariable('TKWFDeployPath', $Destination, 'User')
    Write-Ok "已写入 User 级: $Destination"
    if ($current) { Write-Warn "原值已被替换: $current" }
}
$env:TKWFDeployPath = $Destination

# ── 6. 验证 ──────────────────────────────────────────────────────
Write-Step '验证'
$cli = Join-Path $Destination 'xCodeGen\xCodeGen.Cli.exe'
try {
    $out = & $cli --help 2>&1 | Select-Object -First 1
    Write-Ok "CLI 可执行: $out"
} catch {
    Write-Warn "CLI 执行失败: $($_.Exception.Message)"
}
$refCount = @(Get-ChildItem -LiteralPath (Join-Path $Destination 'build\refs') -Filter 'TKWF*.dll' -ErrorAction SilentlyContinue).Count
Write-Ok "框架 DLL: $refCount 个"

# ── 7. 完成 ──────────────────────────────────────────────────────
Write-Host ''
Write-Host '════════ 安装完成 ════════' -ForegroundColor Green
Write-Host ''
Write-Host '下一步（任选其一）:' -ForegroundColor White
Write-Host '  A. 新建项目:'
Write-Host "     & `"$cli`" new-solution -n MyApp -m WebApi -t InMemory -r Dll" -ForegroundColor DarkGray
Write-Host '  B. 已有项目: 确保项目目录的上一级或 TKWFDeployPath 可用，然后'
Write-Host '     dotnet build <App>.slnx' -ForegroundColor DarkGray
Write-Host '  C. 让 Agent 接手: 把项目的 _HANDOVER.md 或 Agents_Use_TKWF.md 交给 Agent' -ForegroundColor DarkGray
Write-Host ''
Write-Host '提示: 环境变量已写入 User 级，新开的终端自动生效。' -ForegroundColor DarkGray
