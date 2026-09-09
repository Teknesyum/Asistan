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
  Açıklamalar `?` balonlarında. Çevrimdışı. Veri diskte (`%APPDATA%/asistan-nobet/veri`),
  tarayıcıda localStorage. 1440×900'de yalnız nöbet tablosu dikey kaydırır.
- **İki motor birebir aynı listeyi üretir.** Ortak 32 bit xorshift (`Zar`) sayesinde aynı
  JSON + tur + tohum = aynı CSV. Motoru değiştirdiysen iki tarafı da değiştir ve `nobet.py`
  çıktısını arayüzün `csvMetin()` çıktısıyla karşılaştır. CSV başlıkları ve gün adları iki
  tarafta da uzun yazılır, isim alanı `ad`, dosya BOM'lu.
- `main.js`/`preload.js`/`package.json` — çerçevesiz Electron kabuğu. `kisayol.ps1` masaüstü
  kısayolunu yazar; **BOM'lu UTF-8 kalmalı**, yoksa PS 5.1 adı bozar. `app.css` — her değer
  `--tk-*`; `node <teknesyum-ui>/scripts/scan.js .` sıfır hata.
- `<ay>.json` — sutunlar, asistanlar (kıdem sırası, `torba`, `kota`, `izin`, `istiyor`,
  `istemiyor`, `ozel`), tatil, sunum_gunleri, sunum_yok, uzman, kilit, agirlik.
- `.claude/launch.json` — arayüzü localhost:8778'de servis eder (8777 komşu projenin).
