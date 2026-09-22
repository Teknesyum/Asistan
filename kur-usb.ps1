Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$kaynak = Split-Path -Parent $MyInvocation.MyCommand.Path
$oturum = (Get-Process -Id $PID).SessionId
$masaSahibi = Get-CimInstance Win32_Process -Filter "Name='explorer.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.SessionId -eq $oturum } | Select-Object -First 1 | ForEach-Object { Invoke-CimMethod -InputObject $_ -MethodName GetOwner }
$yeniden = if ($env:ASISTAN_BAT) { $env:ASISTAN_BAT } elseif (-not $kaynak.StartsWith($env:TEMP, [StringComparison]::OrdinalIgnoreCase)) { Join-Path $kaynak "Kur.bat" }
if ($masaSahibi -and $masaSahibi.User -and ($masaSahibi.Domain + "\" + $masaSahibi.User) -ne ($env:USERDOMAIN + "\" + $env:USERNAME) -and $yeniden -and (Test-Path $yeniden)) {
  Start-Process explorer.exe ('"' + $yeniden + '"')
  exit
}
$S = [hashtable]::Synchronized(@{
  kaynak = $kaynak
  hedef = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Asistan"
  gunluk = Join-Path $env:LOCALAPPDATA "Asistan\kurulum.log"
  yuzde = 0
  tavan = 2
  adim = "Hazırlanıyor"
  log = [System.Collections.ArrayList]::Synchronized((New-Object System.Collections.ArrayList))
  durum = "calisiyor"
  cevrimdisi = $false
  prova = [bool]$env:ASISTAN_KUR_PROVA
})

$is = {
  param($S)
  $ErrorActionPreference = "Continue"
  New-Item -ItemType Directory -Force (Split-Path $S.gunluk) | Out-Null
  function Yaz([string]$m) {
    $satir = (Get-Date -Format "HH:mm:ss") + "  " + $m
    [void]$S.log.Add($satir)
    Add-Content -Path $S.gunluk -Value $satir -Encoding UTF8
  }
  function Adim([int]$y, [int]$t, [string]$m) { $S.yuzde = $y; $S.tavan = $t; $S.adim = $m; Yaz $m }
  function Kilitle([string]$f) {
    icacls $f /setowner "$env:USERDOMAIN\$env:USERNAME" 2>&1 | Out-Null
    icacls $f /inheritance:r /grant:r "$env:USERDOMAIN\$($env:USERNAME):(R)" "*S-1-5-18:(F)" | Out-Null
  }
  function SshKomut([string]$ssh, [string]$anahtar, [string]$bilinen) {
    '"{0}" -i "{1}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="{2}"' -f ($ssh -replace '\\', '/'), ($anahtar -replace '\\', '/'), ($bilinen -replace '\\', '/')
  }
  function Durdur([string]$kok) {
    Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($kok, [StringComparison]::OrdinalIgnoreCase) } | ForEach-Object {
      Yaz ("Kapatılıyor: " + $_.Name)
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 800
  }

  try {
    $kaynak = $S.kaynak
    $hedef = $S.hedef
    $kur = Join-Path $kaynak ".kurulum"
    $depo = "git@github.com:Teknesyum/Asistan.git"
    $araclar = "Görevlendirme", "Nöbet"
    $gecici = Join-Path $env:TEMP ("asistan-kur-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
    New-Item -ItemType Directory -Force $gecici | Out-Null
    Yaz "Kaynak: $kaynak"
    Yaz "Hedef : $hedef"

    Adim 2 6 "Git hazırlanıyor"
    $sistemGit = Get-Command git.exe -ErrorAction SilentlyContinue
    $usbGit = Join-Path $kur "git\cmd\git.exe"
    if ($sistemGit) {
      $git = $sistemGit.Source
      $gitSsh = Join-Path (Split-Path (Split-Path $git)) "usr\bin\ssh.exe"
      $ssh = if (Test-Path $gitSsh) { $gitSsh } else { "ssh" }
      Yaz "Bilgisayarda Git var: $git"
    }
    elseif (Test-Path $usbGit) { $git = $usbGit; $ssh = Join-Path $kur "git\usr\bin\ssh.exe"; Yaz "Bilgisayarda Git yok, taşınabilir Git kullanılacak" }
    else { throw "Git bulunamadı: ne bilgisayarda ne USB'de (.kurulum\git)" }

    $anahtarUsb = Join-Path $kur "anahtar\id_ed25519"
    $anahtar = $null
    if (Test-Path $anahtarUsb) {
      $anahtar = Join-Path $gecici "id_ed25519"
      $bilinen = Join-Path $gecici "known_hosts"
      Copy-Item $anahtarUsb $anahtar
      Kilitle $anahtar
      $env:GIT_SSH_COMMAND = SshKomut $ssh $anahtar $bilinen
      $env:GIT_TERMINAL_PROMPT = "0"
    } else {
      $depo = "https://github.com/Teknesyum/Asistan.git"
      Yaz "Erişim anahtarı yok, GitHub kimliğiyle (https) bağlanılacak"
    }

    Adim 6 12 "GitHub bağlantısı sınanıyor"
    $uzak = & $git ls-remote $depo HEAD 2>&1
    if ($LASTEXITCODE -eq 0) { Yaz "GitHub erişimi tamam" }
    else { $S.cevrimdisi = $true; Yaz ("GitHub'a ulaşılamadı: " + ($uzak | Select-Object -Last 1)) }

    Adim 12 16 "Eski kurulum aranıyor"
    $kabuk = New-Object -ComObject WScript.Shell
    $adaylar = New-Object System.Collections.Generic.List[string]
    if (Test-Path $hedef) { $adaylar.Add((Resolve-Path $hedef).Path) }
    $eskiKisayollar = @()
    foreach ($m in @([Environment]::GetFolderPath("Desktop"), [Environment]::GetFolderPath("CommonDesktopDirectory"))) {
      foreach ($ad in "Asistan Görevlendirme.lnk", "Asistan Nöbet.lnk") {
        $l = Join-Path $m $ad
        if (-not (Test-Path $l)) { continue }
        $eskiKisayollar += $l
        $arg = $kabuk.CreateShortcut($l).Arguments.Trim('"')
        if (-not $arg -or -not (Test-Path $arg)) { continue }
        $ust = Split-Path $arg -Parent
        $kok = if (Test-Path (Join-Path $ust ".git")) { $ust } else { $arg }
        if (-not $adaylar.Contains($kok)) { $adaylar.Add($kok) }
      }
    }
    if (-not $adaylar.Count) { Yaz "Eski kurulum yok" }

    $yedekKok = Join-Path $env:LOCALAPPDATA ("Asistan\yedek\" + (Get-Date -Format "yyyyMMdd-HHmmss"))
    $sira = 0
    foreach ($a in $adaylar) {
      $sira++
      $gitli = Test-Path (Join-Path $a ".git")
      $kurulum = ($a -eq $hedef) -or (Test-Path (Join-Path $a ".araclar\kurulum.json"))
      if ($gitli -and -not $kurulum) { Yaz "Geliştirme kopyası, dokunulmadı: $a"; continue }
      Adim 16 24 "Eski sürüm kaldırılıyor ($sira/$($adaylar.Count))"
      Yaz "Eski sürüm: $a"
      if ($S.prova) { Yaz "Prova: silinmedi"; continue }
      Durdur $a
      foreach ($d in @($a) + @(Get-ChildItem -LiteralPath $a -Directory -ErrorAction SilentlyContinue | ForEach-Object FullName)) {
        $v = Join-Path $d "veri"
        if (Test-Path $v) {
          $y = Join-Path $yedekKok ((Split-Path $a -Leaf) + "\" + (Split-Path $d -Leaf))
          robocopy $v $y /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
          Yaz "Veri yedeklendi: $y"
        }
      }
      if ($gitli -and -not $S.cevrimdisi) {
        foreach ($t in $araclar) { if (Test-Path (Join-Path $a "$t\veri")) { & $git -C $a add -- "$t/veri" 2>&1 | Out-Null } }
        & $git -C $a -c user.name=$env:USERNAME -c "user.email=$env:USERNAME@$env:COMPUTERNAME" commit -m "veri (kurulum öncesi, $env:COMPUTERNAME)" 2>&1 | Out-Null
        & $git -C $a -c user.name=$env:USERNAME -c "user.email=$env:USERNAME@$env:COMPUTERNAME" pull --no-rebase --no-edit -X ours $depo main 2>&1 | Out-Null
        & $git -C $a push $depo HEAD:main 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { Yaz "Eski kurulumdaki veri GitHub'a gönderildi" } else { Yaz "Eski veri gönderilemedi, yedekte duruyor" }
      }
      Remove-Item -LiteralPath $a -Recurse -Force -ErrorAction SilentlyContinue
      if (Test-Path $a) { throw "Eski kurulum silinemedi (açık bir dosya olabilir): $a" }
      Yaz "Silindi: $a"
    }
    if (-not $S.prova) { foreach ($l in $eskiKisayollar) { Remove-Item $l -Force -ErrorAction SilentlyContinue } }

    if ($S.prova) { $hedef = Join-Path $gecici "Asistan"; $S.hedef = $hedef; Yaz "Prova hedefi: $hedef" }

    if (-not $S.cevrimdisi) {
      Adim 24 52 "Güncel sürüm GitHub'dan indiriliyor"
      & $git clone --quiet $depo $hedef 2>&1 | ForEach-Object { Yaz "$_" }
      if ($LASTEXITCODE -ne 0) { $S.cevrimdisi = $true; Remove-Item -LiteralPath $hedef -Recurse -Force -ErrorAction SilentlyContinue }
    }
    if ($S.cevrimdisi) {
      Adim 24 52 "USB'deki sürüm kopyalanıyor"
      robocopy $kaynak $hedef /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /MT:16 /XD .kurulum .araclar trash node_modules /XF Kur.bat | Out-Null
      if ($LASTEXITCODE -ge 8) { throw "Kopyalama başarısız (robocopy $LASTEXITCODE)" }
      Yaz "Çevrimdışı kuruldu; program ilk bağlantıda kendini günceller"
    }
    if (-not (Test-Path (Join-Path $hedef ".git"))) { throw "Kurulum klasörü eksik: $hedef" }

    $arac = Join-Path $hedef ".araclar"
    New-Item -ItemType Directory -Force $arac | Out-Null
    if ($anahtar) {
      Adim 52 56 "Erişim anahtarı yerleştiriliyor"
      New-Item -ItemType Directory -Force (Join-Path $arac "anahtar") | Out-Null
      $kaliciAnahtar = Join-Path $arac "anahtar\id_ed25519"
      $kaliciBilinen = Join-Path $arac "known_hosts"
      Copy-Item $anahtar $kaliciAnahtar -Force
      Kilitle $kaliciAnahtar
      if (Test-Path $bilinen) { Copy-Item $bilinen $kaliciBilinen -Force }
    }
    $kaliciSsh = $ssh
    if (-not $sistemGit) {
      Adim 56 76 "Taşınabilir Git kuruluyor"
      robocopy (Join-Path $kur "git") (Join-Path $arac "git") /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /MT:16 | Out-Null
      if ($LASTEXITCODE -ge 8) { throw "Git kopyalanamadı (robocopy $LASTEXITCODE)" }
      $git = Join-Path $arac "git\cmd\git.exe"
      $kaliciSsh = Join-Path $arac "git\usr\bin\ssh.exe"
    }
    if ($anahtar) { & $git -C $hedef config core.sshCommand ((SshKomut $kaliciSsh $kaliciAnahtar $kaliciBilinen) -replace '"', '\"') }
    & $git -C $hedef config remote.origin.url $depo
    & $git -C $hedef config user.name $env:USERNAME
    & $git -C $hedef config user.email "$env:USERNAME@$env:COMPUTERNAME"
    & $git -C $hedef config core.quotepath false
    Yaz "Git ayarları yazıldı"
    $yonetici = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if ($yonetici -and -not $S.prova) {
      icacls $hedef /setowner "$env:USERDOMAIN\$env:USERNAME" /T /C /Q 2>&1 | Out-Null
      Yaz "Yönetici olarak çalıştı; klasörün sahibi $env:USERNAME yapıldı"
    }
    $guvenli = & $git config --global --get-all safe.directory 2>$null
    if (-not ($guvenli -contains "*")) { & $git config --global --add safe.directory "*" 2>&1 | Out-Null }

    Adim 76 92 "Program motoru kopyalanıyor"
    foreach ($t in $araclar) {
      $k = Join-Path $kaynak "$t\node_modules"
      $h = Join-Path $hedef "$t\node_modules"
      if (Test-Path $k) { robocopy $k $h /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /MT:16 | Out-Null }
      if (-not (Test-Path (Join-Path $h "electron\dist\electron.exe"))) {
        if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "$t için program motoru yok (USB'de node_modules eksik, Node.js de kurulu değil)" }
        Yaz "$t için npm install"
        Push-Location (Join-Path $hedef $t)
        npm install 2>&1 | Out-Null
        node node_modules/electron/install.js 2>&1 | Out-Null
        Pop-Location
      }
      Yaz "$t motoru hazır"
    }

    Adim 92 97 "Masaüstü kısayolları yazılıyor"
    if ($S.prova) { Yaz "Prova: kısayol yazılmadı" }
    else { foreach ($t in $araclar) { & (Join-Path $hedef "$t\kisayol.ps1") | Select-Object -First 1 | ForEach-Object { Yaz "$_" } } }

    $env:GIT_SSH_COMMAND = $null
    $sina = & $git -C $hedef ls-remote origin HEAD 2>&1
    if ($LASTEXITCODE -eq 0) { $senk = "senkron hazır"; Yaz "Senkron sınandı: GitHub'a bağlanıyor" }
    else {
      $senk = "senkron sınanamadı"
      Yaz ("UYARI: senkron sınaması başarısız: " + (($sina | ForEach-Object { "$_" } | Where-Object { $_ -and $_ -notmatch "Could not read from remote|correct access rights|repository exists" }) -join " · "))
    }
    $surum = (& $git -C $hedef rev-parse --short HEAD) | Select-Object -First 1
    @{ tarih = (Get-Date).ToString("s"); surum = "$surum"; bilgisayar = $env:COMPUTERNAME; cevrimdisi = [bool]$S.cevrimdisi } | ConvertTo-Json | Set-Content (Join-Path $arac "kurulum.json") -Encoding UTF8
    if (-not $S.prova) { Remove-Item $gecici -Recurse -Force -ErrorAction SilentlyContinue }
    Adim 100 100 "Kurulum tamamlandı · sürüm $surum · $senk"
    $S.durum = "bitti"
  } catch {
    Yaz ("HATA: " + $_)
    $S.adim = "Kurulum yarıda kaldı: " + $_
    $S.durum = "hata"
  }
}

function Renk([string]$h, [int]$a = 255) { [System.Drawing.Color]::FromArgb($a, [System.Drawing.ColorTranslator]::FromHtml($h)) }
function Yazi([int]$px, [string]$stil = "Regular", [string]$aile = "Segoe UI") { New-Object System.Drawing.Font($aile, $px, [System.Drawing.FontStyle]$stil, [System.Drawing.GraphicsUnit]::Pixel) }

$R = @{
  zemin = Renk "#08090a"; metin = Renk "#ffffff"; mavi = Renk "#00f3ff"; mor = Renk "#b026ff"
  basari = Renk "#34d399"; tehlike = Renk "#ff54eb"; sonuk = Renk "#71717a"
  kenar = Renk "#00f3ff" 128; iz = Renk "#00f3ff" 77
}
$YZ = @{ baslik = Yazi 24 "Bold"; adim = Yazi 16; kucuk = Yazi 14; log = Yazi 14 "Regular" "Consolas"; dugme = Yazi 14 "Bold" }
$B = @{}
foreach ($k in $R.Keys) { $B[$k] = New-Object System.Drawing.SolidBrush $R[$k] }
$G = @{ goster = 0.0; faz = 0.0; surukle = $null; sonlandi = $false; ikon = $null }

$f = New-Object System.Windows.Forms.Form
$f.Text = "Asistan Kurulum"
$f.FormBorderStyle = "None"
$f.StartPosition = "CenterScreen"
$f.ClientSize = New-Object System.Drawing.Size(560, 424)
$f.BackColor = $R.zemin
$f.ForeColor = $R.metin
$f.KeyPreview = $true
$f.GetType().GetProperty("DoubleBuffered", [Reflection.BindingFlags]"Instance,NonPublic").SetValue($f, $true, $null)
$simgeYol = Join-Path $kaynak "Görevlendirme\simge.ico"
if (Test-Path $simgeYol) {
  $f.Icon = New-Object System.Drawing.Icon($simgeYol)
  $G.ikon = (New-Object System.Drawing.Icon($simgeYol, 64, 64)).ToBitmap()
}

$f.Add_MouseDown({ if ($_.Button -eq "Left") { $G.surukle = $_.Location } })
$f.Add_MouseMove({ if ($G.surukle) { $f.Location = New-Object System.Drawing.Point(($f.Location.X + $_.X - $G.surukle.X), ($f.Location.Y + $_.Y - $G.surukle.Y)) } })
$f.Add_MouseUp({ $G.surukle = $null })

$f.Add_Paint({
  $cz = $_.Graphics
  $cz.SmoothingMode = "AntiAlias"
  $cz.TextRenderingHint = "ClearTypeGridFit"
  $w = $f.ClientSize.Width
  $h = $f.ClientSize.Height
  $cz.DrawRectangle((New-Object System.Drawing.Pen($R.kenar, 1)), 0, 0, $w - 1, $h - 1)
  if ($G.ikon) { $cz.DrawImage($G.ikon, 24, 24, 48, 48) }
  $cz.DrawString("Asistan", $YZ.baslik, $B.metin, 84, 20)
  $gen = $cz.MeasureString("Asistan", $YZ.baslik).Width
  $cz.DrawString("Kurulum", $YZ.baslik, $B.mavi, 84 + $gen - 4, 20)
  $cz.DrawString("Görevlendirme ve Nöbet  ·  " + $S.hedef, $YZ.kucuk, $B.sonuk, 86, 52)

  $renk = switch ($S.durum) { "bitti" { $R.basari } "hata" { $R.tehlike } default { $R.metin } }
  $yuzdeMetin = [string][math]::Floor($G.goster) + "%"
  $yg = $cz.MeasureString($yuzdeMetin, $YZ.adim).Width
  $alan = New-Object System.Drawing.RectangleF(24, 100, ($w - 60 - $yg), 22)
  $bicim = New-Object System.Drawing.StringFormat
  $bicim.Trimming = "EllipsisCharacter"
  $bicim.FormatFlags = "NoWrap"
  $cz.DrawString($S.adim, $YZ.adim, (New-Object System.Drawing.SolidBrush $renk), $alan, $bicim)
  $cz.DrawString($yuzdeMetin, $YZ.adim, $B.mavi, ($w - 24 - $yg), 100)

  $bx = 24; $by = 132; $bw = $w - 48; $bh = 8
  $cz.FillRectangle((New-Object System.Drawing.SolidBrush $R.iz), $bx, $by, $bw, $bh)
  $dolu = [int]($bw * [math]::Min(100, $G.goster) / 100)
  if ($dolu -gt 1) {
    $dik = New-Object System.Drawing.Rectangle($bx, $by, $dolu, $bh)
    if ($S.durum -eq "calisiyor") { $fr = New-Object System.Drawing.Drawing2D.LinearGradientBrush($dik, $R.mavi, $R.mor, 0.0) }
    else { $fr = New-Object System.Drawing.SolidBrush $renk }
    $cz.FillRectangle($fr, $dik)
    for ($i = 1; $i -le 3; $i++) { $cz.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb([int](40 / $i), $renk))), $bx, $by - $i, $dolu, $bh + 2 * $i) }
    if ($S.durum -eq "calisiyor") {
      $px = $bx + (($G.faz % 1.0) * ($dolu + 120)) - 120
      $pr = New-Object System.Drawing.Rectangle([int]$px, $by, 120, $bh)
      $pg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($pr, (Renk "#ffffff" 0), (Renk "#ffffff" 0), 0.0)
      $bl = New-Object System.Drawing.Drawing2D.ColorBlend(3)
      $bl.Colors = @((Renk "#ffffff" 0), (Renk "#ffffff" 150), (Renk "#ffffff" 0))
      $bl.Positions = @(0.0, 0.5, 1.0)
      $pg.InterpolationColors = $bl
      $cz.SetClip($dik)
      $cz.FillRectangle($pg, $pr)
      $cz.ResetClip()
    }
  }

  $satirlar = $S.log.ToArray()
  $n = $satirlar.Count
  $bas = [math]::Max(0, $n - 9)
  $y = 160
  for ($i = $bas; $i -lt $n; $i++) {
    $fircaLog = if ($i -eq $n - 1) { $B.mavi } else { $B.sonuk }
    $cz.DrawString($satirlar[$i], $YZ.log, $fircaLog, (New-Object System.Drawing.RectangleF(24, $y, ($w - 48), 20)), $bicim)
    $y += 20
  }
})

function Dugme([string]$metin, [bool]$birincil, [int]$x) {
  $dg = New-Object System.Windows.Forms.Button
  $dg.Text = $metin
  $dg.FlatStyle = "Flat"
  $dg.Font = $YZ.dugme
  $dg.Size = New-Object System.Drawing.Size(160, 36)
  $dg.Location = New-Object System.Drawing.Point($x, 364)
  $dg.Cursor = "Hand"
  if ($birincil) { $dg.BackColor = $R.mavi; $dg.ForeColor = $R.zemin; $dg.FlatAppearance.BorderSize = 0 }
  else { $dg.BackColor = $R.zemin; $dg.ForeColor = $R.mavi; $dg.FlatAppearance.BorderColor = $R.mavi }
  $dg.Visible = $false
  $f.Controls.Add($dg)
  $dg
}
$acG = Dugme "Görevlendirme'yi Aç" $true 24
$acN = Dugme "Nöbet'i Aç" $true 200
$kapat = Dugme "Kapat" $false 376
$gunlukAc = Dugme "Günlüğü Aç" $true 200
$masa = [Environment]::GetFolderPath("Desktop")
$acG.Add_Click({ Start-Process (Join-Path $masa "Asistan Görevlendirme.lnk"); $f.Close() })
$acN.Add_Click({ Start-Process (Join-Path $masa "Asistan Nöbet.lnk"); $f.Close() })
$kapat.Add_Click({ $f.Close() })
$gunlukAc.Add_Click({ Start-Process notepad.exe $S.gunluk })
$f.Add_KeyDown({ if ($_.KeyCode -eq "Escape" -and $S.durum -ne "calisiyor") { $f.Close() } })
$f.Add_FormClosing({ if ($S.durum -eq "calisiyor") { $_.Cancel = $true } })

$zaman = New-Object System.Windows.Forms.Timer
$zaman.Interval = 16
$zaman.Add_Tick({
  $hy = [double]$S.yuzde
  if ($G.goster -lt $hy) { $G.goster = [math]::Min($hy, $G.goster + [math]::Max(0.2, ($hy - $G.goster) * 0.08)) }
  elseif ($S.durum -eq "calisiyor" -and $G.goster -lt ($S.tavan - 0.5)) { $G.goster += ($S.tavan - $G.goster) * 0.006 }
  $G.faz += 0.012
  if ($S.durum -ne "calisiyor" -and -not $G.sonlandi) {
    $G.sonlandi = $true
    $kapat.Visible = $true
    if ($S.durum -eq "bitti") {
      if (-not $S.prova) { $acG.Visible = $true; $acN.Visible = $true; $acG.Focus() }
    } else { $gunlukAc.Visible = $true }
  }
  $f.Invalidate()
})

$rs = [runspacefactory]::CreateRunspace()
$rs.ApartmentState = "STA"
$rs.Open()
$ps = [powershell]::Create()
$ps.Runspace = $rs
[void]$ps.AddScript($is).AddArgument($S)
$f.Add_Shown({ [void]$ps.BeginInvoke(); $zaman.Start() })
[System.Windows.Forms.Application]::Run($f)
$zaman.Stop()
$rs.Close()
