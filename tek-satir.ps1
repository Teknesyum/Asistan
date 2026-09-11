$kok = Split-Path -Parent $MyInvocation.MyCommand.Path
$anahtar = Join-Path $kok ".kurulum\anahtar\id_ed25519"
if (-not (Test-Path $anahtar)) { throw "Anahtar yok: $anahtar" }
$metin = [IO.File]::ReadAllText($anahtar) -replace "`r`n", "`n"
$govde = [IO.File]::ReadAllText((Join-Path $kok "kur-tek.ps1")).Replace("__ANAHTAR__", [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($metin)))
$ham = New-Object IO.MemoryStream
$gz = New-Object IO.Compression.GZipStream($ham, [IO.Compression.CompressionMode]::Compress)
$bayt = [Text.Encoding]::UTF8.GetBytes($govde)
$gz.Write($bayt, 0, $bayt.Length)
$gz.Close()
$b64 = [Convert]::ToBase64String($ham.ToArray())
$komut = "iex ([IO.StreamReader]::new([IO.Compression.GZipStream]::new([IO.MemoryStream]::new([Convert]::FromBase64String('" + $b64 + "')), [IO.Compression.CompressionMode]::Decompress))).ReadToEnd()"
$cikti = Join-Path $kok ".kurulum\Kurulum-Komutu.txt"
[IO.File]::WriteAllText($cikti, $komut)
Write-Output "Komut: $cikti ($($komut.Length) karakter)"
$bat = "@echo off`r`ntitle Asistan Kurulum`r`npowershell -NoProfile -ExecutionPolicy Bypass -Command `"$komut`"`r`npause`r`n"
foreach ($yer in (Join-Path $kok ".kurulum\Asistan Kur.bat"), (Join-Path ([Environment]::GetFolderPath("Desktop")) "Asistan Kur.bat")) {
  [IO.File]::WriteAllText($yer, $bat, [Text.Encoding]::ASCII)
  Write-Output "Bat: $yer"
}
