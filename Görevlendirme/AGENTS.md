# AsistanGörevlendirme

Aylık nöbet + izin listesinden boş kalan zorunlu yerlere (Pol, Ybü1, Ybü2, Bblok)
havuzdaki asistanları kıdem ve dengeli dağılım gözeterek atar.

- `main.js` + `preload.js` + `package.json` — Electron kabuğu, çerçevesiz (`frame:false`);
  başlık çubuğunu `arayuz.html` çizer, düğmeler `window.pencere` IPC köprüsünden geçer. Masaüstü kısayolu bunu açar, tarayıcı yok.
  `npm start` ile de çalışır. Motor `node_modules/electron/dist/electron.exe`, veri
  `%APPDATA%/asistan-gorevlendirme`. Kurulum bozulursa: `npm install` sonra
  `node node_modules/electron/install.js` (npm'in postinstall'ı bu makinede sessizce atlanıyor).
- `kisayol.ps1` — simgeyi üretir, masaüstü kısayolunu yazar. Yol değişirse yeniden çalıştır.
- `arayuz.html` — arayüzün kendisi, çevrimdışı, ağ isteği yok. İlk sekme Gösterge:
  seçili gün + sonraki iki gün, ay matrisi, çetele — kaydırmasız. Kademe aşımı ve
  doldurulamayan yer uyarıları gün panelinin altında ayrı "Uyarılar" şeridinde toplanır. Boşluk sebebi "Ad(İzinli)" biçiminde. Sağ alttaki ekip tablosu: ad, rutin yer, farklıysa "→ güncel yer" (branşı olan Ameliyathane'deyse boş); İzinli/Nöbet Ertesi kırmızı. "Resmi Kopyala" gün panelini görünen içeriğe kırparak yakalar, altına bu tabloyu canvas'a tek sütun, içeriğe kırpılmış ve ortalı çizer (arayüz değişmez). İsim çipi başka çipe ya da bir yer satırına sürüklenebilir: Ameliyathane ↔ Pol/Ybü iki yönde; satırda kişi varsa yer değiştirirler, yoksa `force` yazılır. Veri uygulamada diske yazılır (`%APPDATA%/asistan-gorevlendirme/veri/`, her
  ay ayrı dosya), tarayıcıda localStorage'a. "Dosyaya Kaydet / Yükle" yalnız dışa/içe
  aktarma. Ay değişince önceki ayın sayacı kendiliğinden devredilir. Hesap motoru betikle birebir aynı.
- `app.css` — arayüzün kendi katmanı, her değer `--tk-*`. Değiştirince
  `node <teknesyum-ui>/scripts/scan.js .` sıfır hata vermeli. Sapmalar docs/danisma/001'de.
- `gorevlendir.py` — toplu/CLI çalıştırma. `python -X utf8 gorevlendir.py <ay>.json`, CSV üretir. `--oto` ağırlık ızgarasını tarayıp
  en dengeli dörtlüyü basar (arayüzde Kurallar → Oto Ayarla).
- `<ay>.json` — asistanlar (kıdem sırası + `kademe`), nöbet, izin, egitim, ders, force, sabit,
  gecmis, devir, yer_adet, kural, agirlik, gruplar, yer_min_kademe, yer_kadro, degisim, refakat. `havuz_disi_yerler` (BaşAsistan, İzin) kişisi
  hiçbir zaman sayılmaz: zorlansa bile çetele/analiz/devir sayacına girmez.
  `sabit` o gün kişiyi havuzdan çıkarır;
  `devir` önceki aydan gelen görev sayacıdır (`toplam`, `yer`); `yer_adet` o gün o yerde
  kaç kişi bulunması gerektiğidir (varsayılan 1). `kademe` küçükse çömez; `yer_min_kademe`
  o yere tek başına gidebilmek için gereken en küçük kademedir, aşılırsa gün işaretlenir.
  `yer_kadro` o yere kaç kişi gider: `tek` (varsayılan), `kidemli_tek` (eşiği geçen düşerse tek,
  düşmezse yanına ikinci kişi), `cift` (her zaman iki kişi). Kurallar panelindeki kısaltmalı
  düğme tıklandıkça bu üçü arasında döner. Gün için verilen `yer_adet` bu kuralı ezer.
  `gecmis` o günü kilitler: boş nesne `{}` de geçerlidir — o gün kimse gönderilmemiş sayılır,
  boş yer uyarısı çıkmaz. Toplu kilit (Kalanı Hesapla, kendiliğinden kilit) hafta sonlarına dokunmaz,
  kilit simgesiyle elle kilitlenebilir.
  `degisim` `[{gun, cikan, giren, karsi}]`: `gun` günü nöbeti çıkan yerine giren tutar; `karsi`
  verilirse o günü de giren yerine çıkan tutar — karşılıklı değişim, iki taraf da yer değiştirir.
  `karsi: 0` tek taraflıdır. Nöbet ertesi günlerinde (`gun+1`, `karsi+1`) iki kişinin rutin yerleri o gün için yer değiştirir: boşluk eski planın yerinde kalır, sebebinde fiilen nöbet ertesi olan yazar. Nöbet listesi olduğu gibi kalır; nöbetçi sayılan ve ertesi gün
  nöbet ertesi olan, o gün fiilen tutandır. Arayüz karşı günü girenin nöbetlerinden en yakınıyla
  (7 günü aşmıyorsa) önerir.
  `refakat` `[{ad, yer, gun}]`: kişi `gun` gün o yerin refakatçisi olur — kadroya sayılmaz,
  boşluğu başkası doldurur, yanında hep biri bulunur; süre dolmadan o yere tek başına
  gönderilmez. Günde tek refakatçi çıkar (sayacı en az olan) ve yalnız o yerde tek kişi
  planlandığı günlerde — yani bir yere aynı anda üçüncü kişi gitmez. Sayaç `devir.refakat` ile aya devrolur.
- `.claude/launch.json` — arayüzü localhost:8777'de servis eder (preview_start "arayuz").
