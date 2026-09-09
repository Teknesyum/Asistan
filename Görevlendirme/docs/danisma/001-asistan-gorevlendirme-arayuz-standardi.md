# Asistan Gorevlendirme arayuz standardi

- tarih: 2026-09-06
- danisilan: agency/design-ui-designer,design-ui-finish-gate-reviewer
- maliyet: 1 tur Explore alt ajani, ~18k token

## Girdi

# Soru — Asistan Görevlendirme arayüzü

Bağlam: Tek dosyalık, internetsiz çalışan bir hastane asistan görevlendirme arayüzü var
(arayuz.html). Sekmeli: Asistanlar, Nöbet, İzinler, Kural & Zorlama, Çıktı, Analiz.
Veri 30 günlük nöbet listesi, izinler ve dört zorunlu yere (Pol, Ybü1, Ybü2, Bblok)
yapılan günlük atamalar.

Kullanıcının yeni istekleri:
1. teknesyum-ui standardına uy (neon, dark-only, tek yarıçap 6, 14px taban, mono sayı,
   ara gri yasak).
2. Ekrana bakınca dünkü ve bugünkü nöbetçiler görülsün.
3. Asistanların geçmişini gösteren bir çetele görünsün.
4. Tüm veriler tam ekrana sığsın, scroll gerekmesin.
5. İnternet gerektirmesin.

Soru: Bu beş isteği tek ekranda karşılayan bilgi hiyerarşisi nasıl kurulmalı? Hangi
yaygın varsayılan kalıplar bu ürün için yasaklanmalı? Scroll'suz sığdırma için hangi
düzen kararları alınmalı?

## Donen

# Cevap — design-ui-designer + design-ui-finish-gate-reviewer

Koltuklar: design-ui-designer, design-ui-finish-gate-reviewer
(üçüncü aday specialized-mcp-builder konuyla ilgisiz çıktı, kullanılmadı).

## Ürün merceği (finish-gate-reviewer, Adım 1)

- Kullanıcı: başasistan. İş: bugünün görevlendirmesini bakar bakmaz doğrulamak.
- İlk okunan nesne: BUGÜN. Ay tablosu ikinci, çetele üçüncü sırada.
- Günlük tekrar eden: bugünün nöbetçileri ve boş yerler. Nadir ama riskli: bir kişinin
  aylardır aynı yere gönderildiğinin fark edilmemesi. Çetele tam olarak bu riski görünür
  kılmak için var.

## Bilgi hiyerarşisi

1. Üst şerit: DÜN ve BUGÜN yan yana iki panel. Bugün önce ve daha ağır.
2. Orta: ay matrisi, satır = gün, sütun = yer. Tarama tablosu, kart ızgarası değil.
3. Sağ: çetele. Kişi × yer sayıları, tek bakışta dengesizlik.

## Yasaklanan varsayılanlar (bu ürüne özgü)

- Eşit ağırlıklı dört metrik kartı. Sayıların hepsi aynı aciliyette değil.
- Kart ızgarası. Otuz gün otuz kart olmaz, tablo olur.
- Dekoratif gradyan, cam efekti, büyük yuvarlak kart. Ürünü tasarlanmış göstermek için
  eklenen hiçbir şey.
- Boş durumu "Veri yok" ile geçiştirmek. Hangi verinin girilmesi gerektiği yazılmalı.
- Grinin ikincil metin olarak kullanılması. teknesyum-ui §2 zaten yasaklıyor: ikincil
  metnin cevabı griye almak değil, silmektir.

## Scroll'suz sığdırma kararları

- Ay matrisini iki sütuna böl: 1-15 ve 16-30. Otuz satır yerine on beş satır yüksekliği.
- Sabit satır yüksekliği ve tabular-nums. 14px taban korunur, altına inilmez.
- Yoğunluk kararı: compact. Panel iç boşluğu merdivenin 3. basamağı, 5. değil; bu tek
  sapma yazılı olarak beyan edilir.
- Düzenleme sekmeleri (Asistanlar, Nöbet, İzinler) scroll'suz kuralının dışında tutulur.
  Kural "bakınca görülsün" isteğine ait, otuz satırlık form düzenlemesine değil.

## Durumlar (finish-gate, Adım 4.4)

- Boş: nöbet listesi girilmemişse matris "Nöbet sekmesinden liste girin" der.
- Hata: doldurulamayan zorunlu yer, renkle değil metinle işaretlenir.
- Odak: iki katmanlı halka, animasyonsuz.
- Devre dışı: gri tek başına yetmez, title metni zorunlu.

## PASS ölçütü

- Bugünün nöbetçileri ve bugünün ataması ilk ekranda, scroll'suz görünür.
- Çetele aynı ekranda, kişi başı toplam ve yer kırılımıyla.
- Hiçbir renk tek başına bilgi taşımaz.
- scan.js çıkışı 0.

## Uygulama Notları — 6 Eylül 2026

Arayüz `arayuz.html` + `app.css` olarak yeniden yazıldı. Sistem renk anahtar
kelimeleri (Canvas, GrayText, AccentColor) tümüyle kaldırıldı; her değer
`teknesyum-ui/css/theme.css` içindeki `--tk-*` özelliğinden geliyor.

`scan.js .` sonucu: **9 files · 0 open · 0 fixed · 0 error(s)**.

### Yazılı beyan edilen sapmalar

1. **Panel iç boşluğu merdivenin 3. basamağı (12px), 5. basamak (24px) değil.**
   Gerekçe: tek ekrana sığma şartı. Çetele panelinde tablo hücreleri 1. basamağa
   (4px) iniyor, aynı gerekçeyle.
2. **`--font-sans` gövdesi olan Atkinson Hyperlegible Next gömülmedi.** Program
   internet gerektirmiyor, font dosyası da elimizde yok. Tarayıcı theme.css
   içindeki yedek zincire düşüyor: Segoe UI. Font dosyası temin edilirse
   `@font-face` ile gömülür, başka değişiklik gerekmez.

### Kaydırma

Gösterge sekmesi kaydırmaz, 1440×900'de tamamı sığar. Düzenleme sekmeleri
(Asistanlar, Nöbet, İzinler, Kural, Çıktı, Analiz) kaydırır — otuz satırlık form
düzenleme "bakınca görülsün" isteğinin kapsamı dışında.

### Tablo ayraçları

Satır ayraçları `/30` opaklıkta kalsın diye tablolara `grid-line` sınıfı verildi;
standardın tarayıcısı dekoratif çizgiyi seçici adından tanıyor.
