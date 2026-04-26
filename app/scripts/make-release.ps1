$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $root "dist"
$releaseRoot = Join-Path $root "release"
$releaseDir = Join-Path $releaseRoot "who-touched-production-singleplayer"
$zipPath = Join-Path $releaseRoot "who-touched-production-singleplayer.zip"
$packageJsonPath = Join-Path $root "package.json"

if (!(Test-Path $distDir)) {
  throw "dist not found. Run npm run build first."
}

if (Test-Path $releaseDir) {
  Remove-Item -LiteralPath $releaseDir -Recurse -Force
}

if (!(Test-Path $releaseRoot)) {
  New-Item -ItemType Directory -Path $releaseRoot | Out-Null
}

New-Item -ItemType Directory -Path $releaseDir | Out-Null
Copy-Item -Path (Join-Path $distDir "*") -Destination $releaseDir -Recurse -Force

$readme = @"
# 谁动了生产环境

这是可直接交付的单人版静态包。

## 打开方式

1. 直接双击 `index.html`
2. 或放到任意静态服务器中打开

## 包内容

- `index.html`
- `assets/`

## 说明

- 这是 1 人类 + 7 AI 的单人可玩版本
- 不依赖后端
- 建议使用 Chrome 或 Edge 打开
"@

Set-Content -LiteralPath (Join-Path $releaseDir "README.txt") -Value $readme -Encoding UTF8
Copy-Item -LiteralPath $packageJsonPath -Destination (Join-Path $releaseDir "package.json") -Force

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $releaseDir "*") -DestinationPath $zipPath -Force

Write-Output "Release ready:"
Write-Output $releaseDir
Write-Output $zipPath
