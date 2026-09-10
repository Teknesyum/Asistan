$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$kok = Split-Path -Parent $MyInvocation.MyCommand.Path
$sayfa = Join-Path $kok "arayuz.html"
$simge = Join-Path $kok "simge.ico"
$profil = Join-Path $kok "veri"

if (-not (Test-Path $sayfa)) { throw "arayuz.html bulunamadi: $sayfa" }

$motor = Join-Path $kok "node_modules\electron\dist\electron.exe"

if (-not (Test-Path $motor)) {
  throw "Electron kurulu degil. Once su iki komutu calistir: npm install ; node node_modules/electron/install.js"
}

if (-not (Test-Path $simge)) {
  $bmp = New-Object System.Drawing.Bitmap 64, 64
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = "AntiAlias"
  $g.TextRenderingHint = "AntiAliasGridFit"
  $zemin = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(8, 9, 10))
  $g.FillRectangle($zemin, 0, 0, 64, 64)
  $kalem = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(128, 0, 243, 255)), 2
  $g.DrawRectangle($kalem, 1, 1, 61, 61)
  $font = New-Object System.Drawing.Font "Segoe UI", 26, ([System.Drawing.FontStyle]::Bold)
  $murekkep = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0, 243, 255))
  $orta = New-Object System.Drawing.StringFormat
  $orta.Alignment = "Center"
  $orta.LineAlignment = "Center"
  $g.DrawString("AG", $font, $murekkep, (New-Object System.Drawing.RectangleF 0, 2, 64, 62), $orta)
  $g.Dispose()
  $ikon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
  $akis = [System.IO.File]::Create($simge)
  $ikon.Save($akis)
  $akis.Close()
  $ikon.Dispose()
  $bmp.Dispose()
}


$hedef = Join-Path ([Environment]::GetFolderPath("Desktop")) "Asistan Görevlendirme.lnk"
$kabuk = New-Object -ComObject WScript.Shell
$k = $kabuk.CreateShortcut($hedef)
$k.TargetPath = $motor
$k.Arguments = '"' + $kok + '"'
$k.WorkingDirectory = $kok
$k.IconLocation = $simge
$k.Description = "Asistan Görevlendirme"
$k.Save()

Write-Output "Kisayol: $hedef"
Write-Output "Motor  : $motor"
Write-Output "Veri   : $profil"
