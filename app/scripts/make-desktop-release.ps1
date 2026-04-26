$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$desktopOut = Join-Path $root "desktop-dist"
$releaseRoot = Join-Path $root "release"
$desktopRelease = Join-Path $releaseRoot "desktop"

Push-Location $root
try {
  npm run build
  npx electron-builder --win portable

  if (Test-Path $desktopRelease) {
    Remove-Item -LiteralPath $desktopRelease -Recurse -Force
  }

  New-Item -ItemType Directory -Path $desktopRelease -Force | Out-Null

  Copy-Item -Path (Join-Path $desktopOut "*") -Destination $desktopRelease -Recurse -Force

  $readme = @"
# 谁动了生产环境 桌面版

## 使用方式

1. 进入当前目录
2. 双击 `.exe` 文件启动

## 说明

- 这是 Electron 封装的 Windows 单文件桌面版
- 首次启动可能需要数秒解压运行环境
- 如遇系统安全提示，选择“仍要运行”即可
"@

  Set-Content -LiteralPath (Join-Path $desktopRelease "README.txt") -Value $readme -Encoding UTF8
}
finally {
  Pop-Location
}

Write-Output "Desktop release ready:"
Write-Output $desktopRelease
