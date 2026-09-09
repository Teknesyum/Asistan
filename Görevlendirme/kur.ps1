$ErrorActionPreference = "Stop"
$kok = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $kok

npm install
node node_modules/electron/install.js

& (Join-Path $kok "kisayol.ps1")
