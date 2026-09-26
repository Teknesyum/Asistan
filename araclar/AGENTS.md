# araclar

Arayüz denetim düzeneği. Gerçek Electron ile çalışır, IPC salt okunur taklit edilir (git ve yazma yok).

- `ui-cek.js` — ekranları yakalar; `--denetim denetim-snippet.js` ile her ekranda dinlenik, hover, odak, basılı, edilgen hâllerde kontrast (7:1) ve hedef boyutu (24 px) ölçer.
  `<arac>/node_modules/electron/dist/electron.exe araclar/ui-cek.js --arac <Uygulama> --cikti <klasör> --etiket once|sonra --olcek 1|1.25|1.5 --ekranlar araclar/ekranlar-<k>.js [--denetim araclar/denetim-snippet.js]`
- `ekranlar-<k>.js` — uygulamanın ekran listesi (ad, açan JS, bekleme, kapatan JS).
- `ozet.js <denetim.json>` — kontrast, hedef ve konsol hatalarını gruplar.
- `calisiyor.js --arac <Uygulama> --cikti <klasör>` — başsız çalışma testi, `calisiyor.json` yazar; çıkış kodu 0 = geçti.
