# AsistanGörevlendirme

Aylık nöbet + izin listesinden boş kalan zorunlu yerlere (Pol, Ybü1, Ybü2, Bblok)
havuzdaki asistanları kıdem ve dengeli dağılım gözeterek atar.

- `main.js` + `preload.js` + `package.json` — Electron kabuğu, çerçevesiz (`frame:false`);
  başlık çubuğunu `arayuz.html` çizer, düğmeler `window.pencere` IPC köprüsünden geçer. Masaüstü kısayolu bunu açar, tarayıcı yok.
  `npm start` ile de çalışır. Motor `node_modules/electron/dist/electron.exe`, veri
  `%APPDATA%/asistan-gorevlendirme`. Kurulum bozulursa: `npm install` sonra
  `node node_modules/electron/install.js` (npm'in postinstall'ı bu makinede sessizce atlanıyor).
- `kisayol.ps1` — simgeyi token renklerinden üretir (PNG gömülü ICO), masaüstü ve Başlat menüsü kısayolunu yazar. Yol değişirse yeniden çalıştır.
- `arayuz.html` — arayüzün kendisi, çevrimdışı, ağ isteği yok. İlk sekme Gösterge:
  seçili gün + sonraki iki gün, ay matrisi, çetele — kaydırmasız. Kademe aşımı ve
  doldurulamayan yer uyarıları gün panelinin altında ayrı "Uyarılar" şeridinde toplanır. Boşluk sebebi "Ad(İzinli)" biçiminde. Sağ alttaki ekip tablosu: ad, rutin yer, farklıysa "→ güncel yer" (branşı olan Ameliyathane'deyse boş); İzinli/Nöbet Ertesi kırmızı. "Resmi Kopyala" gün panelini görünen içeriğe kırparak yakalar, altına bu tabloyu canvas'a tek sütun, içeriğe kırpılmış ve ortalı çizer (arayüz değişmez). Panel başlığındaki "QR" aynı resmi uguu.se'ye yükler (`main.js` `pencere:yukle`, 3 saat saklanır), bağlantının QR'ını gösterir; QR `qr.js` (qrcode-generator 1.4.4, MIT) ile çevrimdışı çizilir. Başlık çubuğunda Teknesyum yanındaki "QR" başlık altındaki tüm sekmeyi yakalayıp aynı yoldan gönderir. Zorunlu yer satırları (Pol, Ybü1, Ybü2, Bblok) görevlendirme olmasa da çıkar: önce görevlendirilenler (mavi çerçeve), sonra rutin yeri orası olup o gün orada çalışanlar (sarı çerçeve, `isim-yerinde`, `--tk-warning`); oklar aynı sütunda. İsim çipi başka çipe ya da bir yer satırına sürüklenebilir: Ameliyathane ↔ Pol/Ybü iki yönde; satırda kişi varsa yer değiştirirler, yoksa `force` yazılır. Veri uygulamada diske yazılır (`%APPDATA%/asistan-gorevlendirme/veri/`, her
  ay ayrı dosya), tarayıcıda localStorage'a. "Dosyaya Kaydet / Yükle" yalnız dışa/içe
  aktarma. Ay değişince önceki ayın sayacı kendiliğinden devredilir. Hesap motoru betikle birebir aynı.
- `app.css` — arayüzün kendi katmanı, her değer `--tk-*`. Değiştirince
  `node <teknesyum-ui>/scripts/scan.js .` sıfır hata vermeli. Sapmalar docs/danisma/001'de.
- `gorevlendir.py` — toplu/CLI çalıştırma. `python -X utf8 gorevlendir.py <ay>.json`, CSV üretir. `--oto` ağırlık ızgarasını tarayıp
  en dengeli dörtlüyü basar (arayüzde Kurallar → Oto Ayarla). Oto, kıdem farkı ağırlığını 2nin altına indirmez (elle inilebilir);
  karşılığında min-max farkı 6ya kadar cezasız (`FARK_SINIR`). Yedek başasistanlık yapan (`sayac.vekil`) min hesabına girmez, görev almaya devam eder.
- `<ay>.json` — asistanlar (kıdem sırası + `kademe`), nöbet, izin, egitim, ders, force, sabit,
  gecmis, devir, yer_adet, kural, agirlik, gruplar, yer_min_kademe, yer_kadro, degisim, refakat. `havuz_disi_yerler` (BaşAsistan, İzin) kişisi
  hiçbir zaman sayılmaz: zorlansa bile çetele/analiz/devir sayacına girmez. `rotasyon` (ör. Algoloji) yerindekiler izinli gibidir: havuza, vekilliğe, yük farkına girmez, ekip tablosunda Ameliyathane denmez;
  gün panelinde kendi satırında çıkar. Yük aralığı uyarısı yalnız fark `FARK_SINIR` (6) aşılınca. `devret` sonunda "yeri değişen var mı" sorulur. BaşAsistan nöbet ertesiyken
  ondan sonraki en kıdemli (havuz dışı olmayan, o gün var olan) vekil sayılır, havuzdan çıkar; etiketi yazılmaz.
  `sabit` o gün kişiyi havuzdan çıkarır;
  `devir` önceki aydan gelen görev sayacıdır (`toplam`, `yer`); `yer_adet` o gün o yerde
  kaç kişi bulunması gerektiğidir (varsayılan 1). `kademe` küçükse çömez; `yer_min_kademe`
  o yere tek başına gidebilmek için gereken en küçük kademedir, aşılırsa gün işaretlenir.
  `yer_kadro` o yere kaç kişi gider: `tek` (varsayılan), `kidemli_tek` (eşiği geçen düşerse tek,
  düşmezse yanına ikinci kişi), `cift` (her zaman iki kişi; yerde eşiği geçen biri varsa ikinci boşluk çömezdir: kademe ve kıdem farkı aranmaz, kademe 0 da gider). Kurallar panelindeki kısaltmalı
  düğme tıklandıkça bu üçü arasında döner. Gün için verilen `yer_adet` bu kuralı ezer.
  `gecmis` o günü kilitler: boş nesne `{}` de geçerlidir — o gün kimse gönderilmemiş sayılır,
  boş yer uyarısı çıkmaz. Toplu kilit (Kalanı Hesapla, kendiliğinden kilit) hafta sonlarına dokunmaz,
  kilit simgesiyle elle kilitlenebilir.
  `degisim` `[{gun, cikan, giren, karsi}]`: `gun` günü nöbeti çıkan yerine giren tutar; `karsi`
  verilirse o günü de giren yerine çıkan tutar — karşılıklı değişim.
  `karsi: 0` tek taraflıdır. Rutin yerler değişmez: nöbet ertesi olan kendi yerinden düşer, yeri zorunlu değilse boşluk açılmaz. Ay sonu değişimi `devret`/ay geçişinde `onceki_ay_son_gun_nobet`e yansır; `degisim` ve `yer_adet` yeni aya taşınmaz. İzin/eğitim `gunler` ay sonunu aşabilir (`28-2`): bu ay 28-son gün, sonraki ay 1-2 önceki ayın arşivinden kendiliğinden okunur, İzinler sekmesinde ve Kurallar panelinde sarı "Önceki Ay:" satırı olarak görünür (1. gün önceki ayın nöbet ertesileri de). Nöbet listesi olduğu gibi kalır; nöbetçi sayılan ve ertesi gün
  nöbet ertesi olan, o gün fiilen tutandır. Arayüz karşı günü girenin nöbetlerinden en yakınıyla
  (7 günü aşmıyorsa) önerir.
  `refakat` `[{ad, yer, gun}]`: kişi `gun` gün o yerin refakatçisi olur — kadroya sayılmaz,
  boşluğu başkası doldurur, yanında hep biri bulunur; süre dolmadan o yere tek başına
  gönderilmez. Günde tek refakatçi çıkar (sayacı en az olan) ve yalnız o yerde tek kişi
  planlandığı günlerde — yani bir yere aynı anda üçüncü kişi gitmez. Sayaç `devir.refakat` ile aya devrolur.
- `.claude/launch.json` — arayüzü localhost:8777'de servis eder (preview_start "arayuz").
- `uygulama.js` — arayüzün betiği; `arayuz.html` onu `veri.hazir()` (preload, `veri:hepsi` ile tüm veri JSONlarını tek seferde önbelleğe alır) çözüldükten sonra yükler. Başlık çubuğu `teknesyum-ui/ustcubuk/titlebar.css`, senkron rozeti `teknesyum-ui/durum/badge.css` şablonlarından; rozet durumu hâlâ `senkron.js` verir. `teknesyum-ui/` altı değişirse uygulama kendini yeniden başlatır. Denetim: `araclar/` ve `docs/ui-denetim/`. Yazılar (marka, destek, site, eşitleme, başlık) `teknesyum-ui/css/labels.tr.json`dan: `main.js` `etiket:hepsi` ile verir, `app.title`ı `package.json` `productName` doldurur; `arayuz.html` `window.ETIKET` kurar. Tema `setup.js --apply --template benim --project <uygulama> --force` ile tazelenir, `esle.js --denetle` 0 fark olmalı.
