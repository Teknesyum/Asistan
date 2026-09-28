# Asistan Nöbet

Aylık nöbet listesi, sütun sütun: 1 YBÜ Kıdemli → 2 Ameliyathane Kıdemli → 3 YBÜ Çömez →
4 Ameliyathane Çömez (`opsiyonel`, boş kalabilir). Her sütun onaylanınca sıradaki kurulur.

- `motor.js` — tek motor, tarayıcıda ve node'da. `node motor.js <ay>.json [tur]` dört sütunu sırayla kurar, tablo basar.
  `sutunKur(v, si)`: kendi torbası `dagitimAl` kadar, açık kalırsa sonraki sütunun en çömezinden ödünç
  (`odunc` cezası). Katı: kota, izin, ertesi gün boş, aynı gün tek sütun. Yumuşak: gün grubu dengesi
  (Pzt+Sal · Per · Cum · Cmt/Tatil · Paz; Çarşamba dengelenmez), ücret dengesi (hafta içi 8, Cum/Paz 16,
  Cmt/tatil 24 saat), 1-3-5 zinciri, rutini YBÜ olanların aynı günü, istek/istemez, kıdem ve isteksizlik bonusu.
- `uygulama.js` — ekranlar: Ana Ekran (ay, sütun kartları, Devam Et) · Kadro (asistan, rutin, takvim, istek
  matrisi) · Sütun (ayarlar · 4 sütunlu liste, seçim = sabitleme · denge ve uyarılar) · Çıktı (TSV/CSV, ücret).
  Onay kaldırılırsa sonraki sütunların listesi silinir.
- `<ay>.json` — `sutunlar`, `asistanlar` (kıdem sırası, `torba`, `kota`, `rutin`, `izin`, `istiyor`,
  `istemiyor`), `tatil`, `uzman`, `kilit[g][sütun]`, `liste[sütun][g]`, `onay`, `dagitim[sütun][ad]`, `tohum`, `agirlik`, `motor: 2`.
- `app.css` — her değer `--tk-*`; `node <teknesyum-ui>/scripts/scan.js .` sıfır hata.
- `senkron.js` — git eşitleme; `IZLENEN` kod dosyası değişince uygulama yeniden başlar. `main.js`/`preload.js` — Electron kabuğu; `kisayol.ps1` BOM'lu UTF-8 kalmalı.
- Önizleme: kökteki `.claude/launch.json` `nobet` (localhost:8778).
