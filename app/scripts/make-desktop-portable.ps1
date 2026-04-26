$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $root "dist"
$releaseRoot = Join-Path $root "release"
$portableRoot = Join-Path $releaseRoot "desktop-portable"
$appRoot = Join-Path $portableRoot "WhoTouchedProduction"
$resourcesRoot = Join-Path $appRoot "resources"
$resourcesAppRoot = Join-Path $resourcesRoot "app"
$runtimeCacheRoot = Join-Path $releaseRoot ".runtime-cache"
$cachedRuntimeRoot = Join-Path $runtimeCacheRoot "electron-runtime"

$desktopRuntimeCandidates = @(
  (Join-Path $root "node_modules\electron\dist"),
  $appRoot
)
$desktopRuntime = $desktopRuntimeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (!$desktopRuntime) {
  $electronBinary = Get-ChildItem -Path "D:\codex" -Recurse -Filter "electron.exe" -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*\node_modules\electron\dist\electron.exe" } |
    Select-Object -First 1

  if ($electronBinary) {
    $desktopRuntime = Split-Path -Parent $electronBinary.FullName
  }
}

if (!$desktopRuntime) {
  throw "electron runtime not found."
}

if (!(Test-Path -LiteralPath $distDir)) {
  throw "dist not found. Run npm run build first."
}

if (Test-Path -LiteralPath $runtimeCacheRoot) {
  Remove-Item -LiteralPath $runtimeCacheRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $cachedRuntimeRoot -Force | Out-Null
Copy-Item -Path (Join-Path $desktopRuntime "*") -Destination $cachedRuntimeRoot -Recurse -Force

$desktopRuntime = $cachedRuntimeRoot
$exeSource = Join-Path $desktopRuntime "electron.exe"
$exeTarget = Join-Path $appRoot "WhoTouchedProduction.exe"

if (Test-Path -LiteralPath $portableRoot) {
  Remove-Item -LiteralPath $portableRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $resourcesAppRoot -Force | Out-Null

Copy-Item -Path (Join-Path $desktopRuntime "*") -Destination $appRoot -Recurse -Force
if (Test-Path -LiteralPath $exeTarget) {
  Remove-Item -LiteralPath $exeTarget -Force
}
Move-Item -LiteralPath $exeSource -Destination $exeTarget

Copy-Item -LiteralPath $distDir -Destination $resourcesAppRoot -Recurse -Force
Copy-Item -Path (Join-Path $root "electron") -Destination $resourcesAppRoot -Recurse -Force

$packageJson = @"
{
  "name": "who-touched-production-desktop",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "electron/main.mjs"
}
"@

Set-Content -LiteralPath (Join-Path $resourcesAppRoot "package.json") -Value $packageJson -Encoding UTF8

$readme = @"
# Who Touched Production Desktop Portable
## Launch

Double-click:
- WhoTouchedProduction.exe

## Notes

- This is a portable Electron desktop build.
- No installer is required.
- Keep the whole folder intact.
- Do not move only the exe by itself.
"@

Set-Content -LiteralPath (Join-Path $portableRoot "README.txt") -Value $readme -Encoding UTF8

Write-Output "Desktop portable release ready:"
Write-Output $portableRoot
