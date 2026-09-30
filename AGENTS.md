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
`.araclar/` gitignore'da. Yönetici olarak başka hesapla açılırsa kurulum `explorer.exe` ile masaüstü
kullanıcısı adına yeniden başlar (bat yolunu `ASISTAN_BAT` taşır); aynı hesapla yöneticiyse klasörün
sahibi kullanıcıya verilir. ssh, Git'in kendi `usr\bin\ssh.exe`'sidir. Kurulum sonunda `ls-remote origin`
ile senkron sınanır, sonuç son satırda. Deneme: `$env:ASISTAN_KUR_PROVA=1` — silmez, kısayol yazmaz, TEMP'e kurar.

## Senkron

`<araç>/senkron.js` (iki araçta da aynı, asenkron ve sıralı). Açılışta `git pull`; sonra her
dakika eşitler. Kod dosyaları (uzaktan gelen ya da aynı klasörde yerel commit edilen; uygulamanın açıldığı HEAD ile kıyaslanır) değiştiyse uygulama kendini yeniden başlatır, veri değiştiyse
arayüz yenilenir. Veri her değişiklikten ~5 sn sonra ve çıkışta commit + push edilir.
Başlık çubuğundaki gösterge durumu gösterir, tıklanınca hemen eşitler. Çakışmada çeken
makine kazanır (`-X ours`). Veri JSON'ları tek satır olduğundan `.gitattributes` onları `json-birlestir.js` sürücüsüne verir: üç yollu, alan alan birleştirir, yalnız aynı alan iki tarafta değiştiyse yerel kazanır. Sürücüyü `senkron.js` her makinede `git config merge.asistanjson.driver` ile tanıtır (Electron, `ELECTRON_RUN_AS_NODE=1`). Veri gelince arayüz yenilenir, seçili gün ve sekme korunur. Git sırası: `.araclar\git`, Program Files\Git, PATH; her çağrı
`safe.directory=*` ile gider. "Yalnız bu bilgisayar" ya da "Çevrimdışı" görünürse sebebi göstergenin ipucunda (`ozet()`:
git'in genel "repository exists" satırları atılır). Başlıkta sürüm: `v<package.json>`.

## Proje Kuralı

Kaydırma çubuğu olmaması baskındır: ekranı sığdıran zoom kalır. Hedef boyutu gibi genel
kurallar buna uyar; çakışırsa zoom kazanır. İki uygulamanın `teknesyum-ui.json` `note` alanında.
