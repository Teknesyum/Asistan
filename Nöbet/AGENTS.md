# Asistan Nöbet

Aylık nöbet listesini sıfırdan üretir. 4 sütun: YBÜ Kıdemli, Ameliyathane Kıdemli, YBÜ
Çömez, Ameliyathane Çömez (sonuncusu `opsiyonel` — kota yetmezse boş kalır, hata değil).
Katı kota, nöbet ertesi izni, istek/izin, uzman çakışması, sunum yükü, hafta günü dengesi.

- `nobet.py` — motor + CLI. `python -X utf8 nobet.py <ay>.json [--tur=N] [--oto]`, CSV yazar.
  Saat hedefi kotayla orantılı; kıdem avantajı hafta sonu, sunum ve hafta günü hedeflerine
  uygulanır. `GUN_TILT` kıdemliye hafta sonunu azaltır, perşembeyi bir tık artırır. İkinci
  ve zayıf etken isteksizlik kıdemi: en az istek belirten üstte. `--oto` 20 ağırlık bileşimi
  dener, ağırlıktan bağımsız `denge()` ile seçer (arayüzde Kurallar → Oto Ayarla).
- `arayuz.html` — motorun JS aynası + üç aşama: **1 Kadro** (asistan tablosu, ay ızgarası,
  gün paneli, istek matrisi), **2 Liste** (nöbet tablosu · durum ve tıklanabilir uyarılar ·
  kişi dengesi; bir kişiye tıklamak orta paneli o kişinin dökümüne çevirir), **3 Çıktı**
  (Excel'e Kopyala = TSV, CSV Kopyala = `;`). Ağırlıklar, hafta günü eğimi, sunum günleri,
  Oto Ayarla ve sütun listesi sağdan açılan **Kurallar çekmecesindedir** (`#cekmece`).
  Başlıkta Teknesyum yanındaki "QR", başlık altındaki açık sekmeyi yakalar, uguu.se'ye yükler
  (`main.js` `pencere:yukle`, 3 saat) ve bağlantının QR'ını gösterir; QR `qr.js` ile çevrimdışı.
  Açıklamalar `?` balonlarında. Çevrimdışı. Veri depoda (`Nöbet/veri/`),
  tarayıcıda localStorage. 1440×900'de yalnız nöbet tablosu dikey kaydırır.
- **İki motor birebir aynı listeyi üretir.** Ortak 32 bit xorshift (`Zar`) sayesinde aynı
  JSON + tur + tohum = aynı CSV. Motoru değiştirdiysen iki tarafı da değiştir ve `nobet.py`
  çıktısını arayüzün `csvMetin()` çıktısıyla karşılaştır. CSV başlıkları ve gün adları iki
  tarafta da uzun yazılır, isim alanı `ad`, dosya BOM'lu.
- `main.js`/`preload.js`/`package.json` — çerçevesiz Electron kabuğu. `kisayol.ps1` simgeyi token renklerinden üretir, masaüstü ve
  Başlat menüsü kısayolunu yazar; **BOM'lu UTF-8 kalmalı**, yoksa PS 5.1 adı bozar. `app.css` — her değer
  `--tk-*`; `node <teknesyum-ui>/scripts/scan.js .` sıfır hata.
- `<ay>.json` — sutunlar, asistanlar (kıdem sırası, `torba`, `kota`, `izin`, `istiyor`,
  `istemiyor`, `ozel`), tatil, sunum_gunleri, sunum_yok, uzman, kilit, agirlik.
- `.claude/launch.json` — arayüzü localhost:8778'de servis eder (8777 komşu projenin).

- `senkron.js` — git tabanlı güncelleme ve geçmiş eşitlemesi. Açılışta `git pull`; `IZLENEN`
  kod dosyaları değiştiyse uygulama kendini yeniden başlatır. Veri yazımından 5 sn sonra ve
  çıkışta commit + push. Çakışmada yerel kazanır (`-X ours`). Başlık çubuğundaki küçük not
  son senkron satırıdır, tıklayınca hemen eşitler. `kur.ps1` yeni makinede kurar.
- `uygulama.js` — arayüzün betiği; `arayuz.html` onu `veri.hazir()` (preload, `veri:hepsi` ile tüm veri JSONlarını tek seferde önbelleğe alır) çözüldükten sonra yükler. Başlık çubuğu `teknesyum-ui/ustcubuk/titlebar.css`, senkron rozeti `teknesyum-ui/durum/badge.css` şablonlarından; rozet durumu hâlâ `senkron.js` verir. `teknesyum-ui/` altı değişirse uygulama kendini yeniden başlatır. Denetim: `araclar/` ve `docs/ui-denetim/`. Yazılar (marka, destek, site, eşitleme, başlık) `teknesyum-ui/css/labels.tr.json`dan: `main.js` `etiket:hepsi` ile verir, `app.title`ı `package.json` `productName` doldurur; `arayuz.html` `window.ETIKET` kurar. Tema `setup.js --apply --template benim --project <uygulama> --force` ile tazelenir, `esle.js --denetle` 0 fark olmalı.
