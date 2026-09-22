# Asistan

Özel depo. Her araç kendi klasöründe: `Görevlendirme`, `Nöbet`.

Veri de depoda: her aracın `veri/` klasöründeki JSON'lar commit edilir, böylece
her makinede aynı geçmiş görünür.

## Yeni makinede kurulum

Girişsiz tek satır: `tek-satir.ps1`, `.kurulum\anahtar` deploy key'ini `kur-tek.ps1`'e gömüp
sıkıştırır, `.kurulum\Kurulum-Komutu.txt`'e ve aynısını çift tıklanır `Asistan Kur.bat` olarak
`.kurulum\` ile masaüstüne yazar. Komut PortableGit ve Node'u TEMP'e indirir,
depoyu anahtarla çeker, USB düzenini kurup `kur-usb.ps1`'i çalıştırır. Komut = depoya yazma
yetkisi; parola gibi saklanır, git'e girmez.

GitHub girişli yol:

Tek satır — Git/Node yoksa winget ile kurar, güncel sürümü geçici klasöre çeker,
`kur-usb.ps1`'i çalıştırır; anahtar yoksa https + GitHub girişiyle bağlanır, Belgeler\Asistan'a kurar:

```powershell
$w = "--accept-source-agreements", "--accept-package-agreements", "-e", "--silent"; if (-not (Get-Command git -ErrorAction SilentlyContinue)) { winget install --id Git.Git @w }; if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { winget install --id OpenJS.NodeJS.LTS @w }; $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User"); $k = Join-Path $env:TEMP ("asistan-" + [guid]::NewGuid().ToString("N").Substring(0, 8)); git clone --depth 1 https://github.com/Teknesyum/Asistan.git $k; if ($?) { powershell -NoProfile -ExecutionPolicy Bypass -STA -File "$k\kur-usb.ps1" }
```

Elle: `git clone`, sonra her araç klasöründe `kur.ps1` — Electron'u kurar, kısayolu yazar.
Gerekenler: Node.js, Git, GitHub kimliği (`gh auth login` yeter).

## USB kurulumu

`Kur.bat` → `kur-usb.ps1`: simgeli ilerleme penceresi. Eski kurulumu (Belgeler\Asistan ve
kısayolların gösterdiği klasörler) bulur, verisini `%LOCALAPPDATA%\Asistan\yedek`e alıp
GitHub'a iter, siler; güncel sürümü klonlar (çevrimdışıysa USB'den kopyalar) Belgeler\Asistan'a.
Git yoksa `.kurulum\git` (PortableGit) `.araclar\git`e kopyalanır. Özel depoya erişim
`.kurulum\anahtar` deploy key'i ile (okuma-yazma); anahtar depoya girmez, `.kurulum/` ve
`.araclar/` gitignore'da. Deneme: `$env:ASISTAN_KUR_PROVA=1` — silmez, kısayol yazmaz, TEMP'e kurar.

## Senkron

`<araç>/senkron.js` (iki araçta da aynı, asenkron ve sıralı). Açılışta `git pull`; sonra her
dakika eşitler. Kod dosyaları değiştiyse uygulama kendini yeniden başlatır, veri değiştiyse
arayüz yenilenir. Veri her değişiklikten ~5 sn sonra ve çıkışta commit + push edilir.
Başlık çubuğundaki gösterge durumu gösterir, tıklanınca hemen eşitler. Çakışmada çeken
makine kazanır (`-X ours`). Git sırası: `.araclar\git`, Program Files\Git, PATH; her çağrı
`safe.directory=*` ile gider. "Yalnız bu bilgisayar" görünürse sebebi göstergenin ipucunda.
