# Asistan

Özel depo. Her araç kendi klasöründe: `Görevlendirme`, `Nöbet`.

Veri de depoda: her aracın `veri/` klasöründeki JSON'lar commit edilir, böylece
her makinede aynı geçmiş görünür.

## Yeni makinede kurulum

Tek satır — güncel sürümü geçici klasöre çeker, `kur-usb.ps1`'i çalıştırır; anahtar yoksa
https + GitHub kimliğiyle bağlanır, Belgeler\Asistan'a kurar:

```powershell
$k = Join-Path $env:TEMP ("asistan-" + [guid]::NewGuid().ToString("N").Substring(0, 8)); git clone --depth 1 https://github.com/Teknesyum/Asistan.git $k; if ($?) { powershell -NoProfile -ExecutionPolicy Bypass -STA -File "$k\kur-usb.ps1" }
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
makine kazanır (`-X ours`). `.araclar\git` varsa onu kullanır.
