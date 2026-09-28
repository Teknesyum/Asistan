& {
  $ErrorActionPreference = "Stop"
  $oturum = (Get-Process -Id $PID).SessionId
  $masaSahibi = Get-CimInstance Win32_Process -Filter "Name='explorer.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.SessionId -eq $oturum } | Select-Object -First 1 | ForEach-Object { Invoke-CimMethod -InputObject $_ -MethodName GetOwner }
  if ($masaSahibi -and $masaSahibi.User -and ($masaSahibi.Domain + "\" + $masaSahibi.User) -ne ($env:USERDOMAIN + "\" + $env:USERNAME) -and $env:ASISTAN_BAT -and (Test-Path $env:ASISTAN_BAT)) {
    Write-Host ("Kurulum " + $masaSahibi.User + " adına yeniden başlatılıyor") -ForegroundColor Cyan
    Start-Process explorer.exe ('"' + $env:ASISTAN_BAT + '"')
    return
  }
  $ProgressPreference = "SilentlyContinue"
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $t = Join-Path $env:TEMP ("asistan-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
  New-Item -ItemType Directory -Force $t | Out-Null
  $ua = @{ "User-Agent" = "asistan-kurulum" }

  Write-Host "1/4 Git indiriliyor" -ForegroundColor Cyan
  $surum = Invoke-RestMethod "https://api.github.com/repos/git-for-windows/git/releases/latest" -Headers $ua
  $pg = $surum.assets | Where-Object { $_.name -like "PortableGit-*-64-bit.7z.exe" } | Select-Object -First 1
  Invoke-WebRequest $pg.browser_download_url -OutFile "$t\pg.exe" -UseBasicParsing -Headers $ua
  Start-Process "$t\pg.exe" -ArgumentList ('-o"' + "$t\git" + '" -y') -Wait -WindowStyle Hidden
  $git = "$t\git\cmd\git.exe"
  if (-not (Test-Path $git)) { throw "Git açılamadı" }

  Write-Host "2/4 Node.js indiriliyor" -ForegroundColor Cyan
  $idx = Invoke-RestMethod "https://nodejs.org/dist/index.json"
  $lts = $idx | Where-Object { $_.lts } | Select-Object -First 1
  $nz = "node-" + $lts.version + "-win-x64"
  Invoke-WebRequest ("https://nodejs.org/dist/" + $lts.version + "/" + $nz + ".zip") -OutFile "$t\node.zip" -UseBasicParsing
  Expand-Archive "$t\node.zip" $t -Force
  $env:Path = "$t\$nz;" + $env:Path

  Write-Host "3/4 Güncel sürüm GitHub'dan çekiliyor" -ForegroundColor Cyan
  $a = "$t\id_ed25519"
  [IO.File]::WriteAllText($a, [Text.Encoding]::ASCII.GetString([Convert]::FromBase64String("__ANAHTAR__")))
  icacls $a /inheritance:r /grant:r "$($env:USERNAME):(R)" | Out-Null
  $env:GIT_SSH_COMMAND = '"{0}" -i "{1}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="{2}"' -f ("$t\git\usr\bin\ssh.exe" -replace '\\', '/'), ($a -replace '\\', '/'), ("$t\known_hosts" -replace '\\', '/')
  & $git clone --quiet --depth 1 git@github.com:Teknesyum/Asistan.git "$t\src"
  if ($LASTEXITCODE -ne 0) { throw "Depo çekilemedi" }
  Remove-Item Env:GIT_SSH_COMMAND
  New-Item -ItemType Directory -Force "$t\src\.kurulum\anahtar" | Out-Null
  Copy-Item $a "$t\src\.kurulum\anahtar\id_ed25519"
  Move-Item "$t\git" "$t\src\.kurulum\git"

  Write-Host "4/4 Kurulum penceresi açılıyor" -ForegroundColor Cyan
  powershell -NoProfile -ExecutionPolicy Bypass -STA -File "$t\src\kur-usb.ps1"
  Remove-Item $a, "$t\src\.kurulum\anahtar\id_ed25519" -Force -ErrorAction SilentlyContinue
  Write-Host "Bitti" -ForegroundColor Green
}
