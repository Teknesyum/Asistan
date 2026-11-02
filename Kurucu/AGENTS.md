# Kurucu

Base'in tek tıkla kurduğu Windows kurucusu (issue #1). `Asistan-Setup-<sürüm>.exe` yalnız
Electron ve başlatıcıyı taşır; araçların kodu ve verisi git deposunda kalır, `senkron.js` günceller.

- `baslatici.js` — `Asistan.exe --arac gorevlendirme|nobet`: depoyu `Belgeler\Asistan` ya da
  `%LOCALAPPDATA%\Asistan\depo`da bulur, adı ve userData'yı aracın `productName`inden kurar,
  aracın `main.js`ini yükler. Argümansız ya da depo yoksa başlatıcı penceresi: Git yoksa indirme
  bağlantısı; "Kur" açık depoyu girişsiz https ile klonlar (credential helper kapalı); "GitHub ile Bağlan" https + Git Credential Manager, "Anahtar Dosyası Seç" anahtarı
  `%LOCALAPPDATA%\Asistan\anahtar`a kopyalayıp icacls ile kilitler, `core.sshCommand` yazar.
  PowerShell yok. Günlük `%LOCALAPPDATA%\Asistan\kurulum.log`.
- `baslatici.html/.ui.js/.css` + `tema/` (Görevlendirme `teknesyum-ui` kopyası, `panel.css` şablondan).
- `kaynak/kurucu.nsh` — iki kısayol (Masaüstü + Başlat): "Asistan Görevlendirme", "Asistan Nöbet".
- `kaynak/simge/` — araçların `simge.ico` kopyaları.
- `yayinla.js` — `node yayinla.js [--notlar "..."] [--gorevlendirme "..."] [--nobet "..."]`: varsayılan derle + yayınla (`--taslak` yalnız derler; notlar verilmezse son `v*` etiketinden bu yana commit başlıkları, `veri (` hariç):
  derler, `.sha256` yazar, araç sürümlerini yalnız git etiketi (`gorevlendirme-v*`, `nobet-v*`) atar,
  notlarını `v<sürüm>` sürümüne yazıp latest yayınlar. GitHub sürümü yalnız `v*`; araçlara release açılmaz.
  Manifest `.teknesyum/teknesyum.json` (`method: exe`).
- Kurulum: `npm install`, sonra `node node_modules/electron/install.js` (postinstall atlanıyor).
