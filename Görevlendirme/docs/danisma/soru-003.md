# Soru — Asistan Görevlendirme Arayüzü: Hareket, Kendi Başlık Çubuğu, Gösterge Düzeni

Aşağıdaki olgular elimdekilerin tamamıdır. Dosya okuma, sadece bunlara dayan.

## Ürün

Bir cerrahi kliniğin başasistanının masaüstü uygulaması. 17 asistan var, kıdem
sırası sabit. Her gün nöbet ve izin yüzünden boş kalan zorunlu yerlere
(Pol, Ybü1, Ybü2, Bblok) ameliyathane havuzundan kişi atanıyor. Kullanıcı tek
kişi, uzman kullanıcı, günde birkaç kez açıyor, asıl işi "bugün kim nerede"
sorusunu 5 saniyede cevaplamak ve gerekirse bir günü elle değiştirip ayın
kalanını yeniden hesaplatmak.

## Teknik

- Electron 44 kabuğu, tek HTML dosyası, çevrimdışı, ağ isteği yok.
- Tasarım sistemi "teknesyum-ui": karanlık tema, tek yarıçap 6px (--tk-r),
  14px yazı tabanı, sayılar mono, orta griler yasak, iki katmanlı ve
  animasyonsuz odak halkası, en küçük dokunma hedefi 24px, boşluk merdiveni
  4/8/12/16/24 (--tk-sp-1..5). Renkler: zemin #08090A, neon mavi #00F3FF,
  pembe, mor. Bir tarayıcı betiği (scan.js) CSS'i denetliyor ve token dışı
  değer, ikinci yarıçap, orta gri, animasyonlu odak halkası bulursa hata veriyor.
- Hareket token'ları var: --tk-t-instant 90ms, --tk-t-fast 160ms,
  --tk-t-base 240ms, --tk-t-slow 360ms, --tk-e-in, --tk-e-out, --tk-e-spring,
  --tk-stagger 40ms, --tk-scale-hover, --tk-scale-press, --tk-entry-offset.
- Kardeş ürün VidShrink (Avalonia) kendi başlık çubuğunu çizmiş: pencerenin
  tamamı 1px neon mavi kenarlıklı ve 12px köşe yarıçaplı bir çerçeve; başlık
  çubuğu 38px, altında 1px mavi ayraç; sol tarafta 16px içeriden ürün adı
  (ikinci kelime pembe); sağda küçült / büyüt / kapat düğmeleri bitişik,
  aralarında boşluk yok, kapat düğmesi pencerenin sağ üst köşesine dayanıyor,
  üstüne gelince pembe zemin.

## Gösterge sekmesinin bugünkü hâli

Üç sütun: solda Dün paneli ve ayın 1-15 matrisi, ortada Bugün paneli ve
16-30 matrisi, sağda çetele (kişi × yer sayacı). Her şey tek ekrana
sığdırılmaya zorlanıyor, kaydırma yok.

Bugün paneli: YBÜ nöbeti, ameliyathane nöbeti, ameliyathanede kalanlar ve
"yer | yerinde olmayan kişi ve sebebi | → | yerine geçen" satırları.

## Kullanıcının istedikleri

1. Ay matrisinin tamamı solda tek blok olsun.
2. Dün paneli bugünün üstünde, yarın paneli altında olsun; dün ve yarın çok
   daha özet (bir iki satır) olsun.
3. Paneller içeriğinin boyutunu alsın, kendini ekrana sığdırmaya çalışmasın.
4. Arayüz "animatif" olsun.
5. Kendi başlık çubuğumuzu çizelim, işletim sisteminin çubuğunu sevmiyor.
6. Programın tamamının dışına mavi bir anahat.

## Sorular

1. Bu düzen için somut bir ızgara öner: hangi panel hangi sütunda, hangi
   genişlikte, hangisi kendi içinde kayar, sayfa gövdesi kayar mı. Dün ve
   yarın panelleri "bir iki satır" olacaksa içinde tam olarak ne durmalı?
2. Bu üründe hangi hareketler işe yarar, hangileri gürültüdür? Sekme geçişi,
   panel girişi, gün değişince tablo güncellenmesi, satır vurgusu, ok işareti,
   çetele çubuğu — hangisine ne kadar süre ve hangi easing? prefers-reduced-motion
   altında ne kalır? Kaç ayrı hareket çok sayılır?
3. Kendi başlık çubuğu: yükseklik, içerik, düğme boyutu ve sırası, sürükleme
   alanı, çift tıkla büyütme, klavye erişimi ve odak, büyütülmüş pencerede
   köşe yarıçapı ve anahat ne olmalı? Windows'ta kaçınılması gereken tuzaklar?
4. Mavi anahat: pencere kenarında mı, gövdenin içinde mi, kalınlık, parlama
   (glow) olmalı mı, odak halkasıyla karışır mı?
5. Bu ekranın "jenerik" olduğu yer var mı — bu üründe olmayıp olması gereken
   ya da olup gereksiz olan ne var?

Türkçe, kısa ve somut cevap ver. Ölçü uyduracaksan hangi token'a dayandığını yaz.
