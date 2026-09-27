$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$kok = Split-Path -Parent $MyInvocation.MyCommand.Path
$sayfa = Join-Path $kok "arayuz.html"
$simge = Join-Path $kok "simge.ico"
$profil = Join-Path $env:APPDATA "asistan-nobet"

if (-not (Test-Path $sayfa)) { throw "arayuz.html bulunamadi: $sayfa" }

$motor = Join-Path $kok "node_modules\electron\dist\electron.exe"

if (-not (Test-Path $motor)) {
  throw "Electron kurulu degil. Once su iki komutu calistir: npm install ; node node_modules/electron/install.js"
}

$jeton = Get-Content -Raw -Encoding UTF8 (Join-Path $kok "teknesyum-ui\theme.tokens.json") | ConvertFrom-Json
$renk = { param($h) [System.Drawing.ColorTranslator]::FromHtml($h) }
$zeminR = & $renk $jeton.brand.surface.value
$birR = & $renk $jeton.brand."renk-1".value
$ciz = {
  param($n)
  $o = $n / 64
  $bmp = New-Object System.Drawing.Bitmap $n, $n
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = "AntiAlias"
  $g.TextRenderingHint = "AntiAliasGridFit"
  $g.Clear($zeminR)
  $g.DrawRectangle((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(128, $birR)), (2 * $o)), $o, $o, (61 * $o), (61 * $o))
  $font = New-Object System.Drawing.Font "Segoe UI", ([single](26 * 96 / 72 * $o)), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $orta = New-Object System.Drawing.StringFormat ([System.Drawing.StringFormatFlags] "NoWrap, NoClip")
  $orta.Alignment = "Center"
  $orta.LineAlignment = "Center"
  $g.DrawString("AN", $font, (New-Object System.Drawing.SolidBrush $birR), (New-Object System.Drawing.RectangleF (-$n / 2), (2 * $o), (2 * $n), (62 * $o)), $orta)
  $g.Dispose()
  $m = New-Object System.IO.MemoryStream
  $bmp.Save($m, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  , $m.ToArray()
}
$boylar = 256, 64, 48, 32, 16
$resimler = @($boylar | ForEach-Object { , (& $ciz $_) })
$akis = [System.IO.File]::Create($simge)
$y = New-Object System.IO.BinaryWriter $akis
$y.Write([uint16]0); $y.Write([uint16]1); $y.Write([uint16]$boylar.Count)
$konum = 6 + 16 * $boylar.Count
for ($i = 0; $i -lt $boylar.Count; $i++) {
  $b = $boylar[$i] % 256
  $y.Write([byte]$b); $y.Write([byte]$b); $y.Write([byte]0); $y.Write([byte]0)
  $y.Write([uint16]1); $y.Write([uint16]32)
  $y.Write([uint32]$resimler[$i].Length); $y.Write([uint32]$konum)
  $konum += $resimler[$i].Length
}
foreach ($r in $resimler) { $y.Write($r) }
$y.Close()

$kabuk = New-Object -ComObject WScript.Shell
foreach ($yer in [Environment]::GetFolderPath("Desktop"), [Environment]::GetFolderPath("Programs")) {
  $hedef = Join-Path $yer "Asistan Nöbet.lnk"
  $k = $kabuk.CreateShortcut($hedef)
  $k.TargetPath = $motor
  $k.Arguments = '"' + $kok + '"'
  $k.WorkingDirectory = $kok
  $k.IconLocation = $simge + ",0"
  $k.Description = "Asistan Nöbet"
  $k.Save()
  Write-Output "Kisayol: $hedef"
}

Write-Output "Motor  : $motor"
Write-Output "Veri   : $profil"
