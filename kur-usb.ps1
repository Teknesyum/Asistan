$kaynak = Split-Path -Parent $MyInvocation.MyCommand.Path
$hedef = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Asistan"

Write-Output "Kaynak: $kaynak"
Write-Output "Hedef : $hedef"

robocopy $kaynak $hedef /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /XD trash /XF Kur.bat | Out-Null
if ($LASTEXITCODE -ge 8) { Write-Output "Kopyalama basarisiz ($LASTEXITCODE)"; exit 1 }

foreach ($arac in "Görevlendirme", "Nöbet") {
  $kok = Join-Path $hedef $arac
  $motor = Join-Path $kok "node_modules\electron\dist\electron.exe"
  if (-not (Test-Path $motor)) {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
      Write-Output "$arac icin Electron yok ve Node.js kurulu degil: https://nodejs.org"
      continue
    }
    Push-Location $kok
    npm install
    node node_modules/electron/install.js
    Pop-Location
  }
  & (Join-Path $kok "kisayol.ps1")
}

Write-Output "Tamam."
