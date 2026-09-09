# arayuz-hareket-baslik-cubugu-duzen

- tarih: 2026-09-06
- danisilan: agency/design-ui-designer,design-ui-finish-gate-reviewer
- maliyet: 51.174 token, 104 sn

## Girdi

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

## Donen

## 1. Izgara

İki sütun, üç değil. Çetele "bugün kim nerede" sorusunun parçası değil — denge denetimi için bakılır, günde bir kez.

```
┌─ başlık çubuğu 38px ────────────────────────┐
│ Ay matrisi (solda)   │ Dün    (özet)        │
│  1–30 tek blok       │ Bugün  (asıl)        │
│  kendi içinde kayar  │ Yarın  (özet)        │
│ ─────────────────────│                      │
│ Çetele (matrisin altı, aynı sütun)          │
└─────────────────────────────────────────────┘
```

- Sol sütun genişliği: içerik güdümlü, üst sınır ~%55. Matris 30 satır × 5 kolon; 14px mono ile hesap tutmuyorsa kolon başlıklarını kısalt, yazıyı küçültme.
- Sağ sütun `1fr`, üç panel `--tk-sp-4` (16px) aralıkla dikey.
- **Kayan tek şey sol sütun** (`overflow-y:auto`, sticky gün başlığı). Sağ sütun ve sayfa gövdesi kaymaz — panel içeriğinin boyunu alır. Bugün paneli 17 kişiyle bile 8-10 satır; sığar.
- Pencere daralırsa (<1100px) tek sütuna düşer ve **o zaman** gövde kayar. Bu bir kaçış, varsayılan değil.

**Dün paneli — tam olarak iki satır:**
```
Dün  05.09   YBÜ Kaya · AMH Demir
     Bugün izinli: Kaya, Demir
```
İkinci satır dünün nöbetinin bugüne etkisidir; asıl karar bilgisi budur, dünün tam atama tablosu değil.

**Yarın paneli — iki satır:**
```
Yarın 07.09  YBÜ Aslan · AMH Yıldız
      Havuzdan düşecek: Aslan, Yıldız
```
Dün/yarında atama satırı, çetele, sebep sütunu **yok**. Panele tıklayınca o gün Bugün panelinde açılır (aynı bileşen, tarih değişir) — özetin genişleme yolu bu, panelin şişmesi değil.

## 2. Hareket

Dört tür. Beşinciden itibaren gürültü — bu ürün günde birkaç kez, hızla açılıp kapanıyor; her açılışta tekrar eden animasyon üçüncü günde rahatsız eder.

| Ne | Süre | Easing | Not |
|---|---|---|---|
| Sekme geçişi | `--tk-t-instant` 90ms | `--tk-e-out` | Yalnız opacity. Kaydırma/slide yok, matris 30 satır kayarken titrer. |
| Panel girişi (ilk açılış) | `--tk-t-fast` 160ms | `--tk-e-out` | `--tk-entry-offset` kadar yukarıdan. Üç panele `--tk-stagger` 40ms. **Yalnızca uygulama açılışında**, sekme her dönüşünde değil. |
| Değişen hücre vurgusu | `--tk-t-base` 240ms | `--tk-e-out` | Yeniden hesaptan sonra **sadece değeri değişen** hücrelerde renk sönümü. Bu tek hareket, "elle değiştir + yeniden hesapla" işinin tamamını görünür kılar; en değerli olan bu. |
| Satır vurgusu (hover) | `--tk-t-instant` 90ms | `--tk-e-out` | Zemin rengi. `--tk-scale-hover` **kullanma** — tablo satırı büyüyünce ızgara oynar. |

**Olmayacaklar:** ok işareti (`→`) hareket etmez, statik glif. Çetele çubuğu ilk çizimde animasyonlu dolmaz; yalnız değer *değiştiğinde* 240ms genişlik geçişi. `--tk-e-spring` bu üründe hiçbir yerde yok (klinik veri, yaylanma anlam taşımaz).

`prefers-reduced-motion: reduce` altında kalan: **değişen hücre vurgusu** (süre 90ms, renk-only) ve hover. Panel girişi ve sekme fade tamamen kapanır. Kural: hareket bir *durum değişikliğini* anlatıyorsa kalır, dekoratifse gider.

## 3. Başlık çubuğu

- **Yükseklik 38px** (kardeş ürün VidShrink ile aynı — iki üründe farklı olması bilinçsiz sapma olur). Altında 1px neon mavi ayraç.
- **Sol:** `--tk-sp-4` (16px) içeriden "Asistan **Görevlendirme**", ikinci kelime pembe. Yanına küçük ve soluk aktif ay (`Eylül 2026`) — üst çubuk boş oturmasın, ama düğme koyma.
- **Sağ:** küçült / büyüt / kapat, bu sıra, aralarında boşluk yok, kapat sağ üst köşeye dayalı. Düğme kutusu **46×38px** (Windows konvansiyonu; genişlik token'a değil platform beklentisine dayanır, 24px min-hedef fazlasıyla aşılıyor). Hover: küçült/büyüt hafif açık zemin, kapat pembe zemin.
- **Sürükleme:** çubuğun tamamı `-webkit-app-region: drag`, üç düğme ve ay etiketi `no-drag`. Drag alanında `user-select: none`.
- **Çift tık = büyüt/geri al** — Electron'da kendiliğinden gelmez, `dblclick` ile elle bağla.
- **Klavye:** üç düğme gerçek `<button>`, tab sırası küçült→büyüt→kapat, `aria-label` Türkçe. İki katmanlı animasyonsuz odak halkası aynen uygulanır; düğme kenara dayalı olduğu için halka `inset` çizilmeli, taşarsa kırpılır.

**Windows tuzakları:**
1. Büyütülmüş pencerede Windows çerçeveyi ekran dışına ~8px taşırır — `frame:false` ile bunu sen yönetmezsen kapat düğmesinin bir kısmı kesilir. Maximize'da gövdeye `padding` değil, `border-radius:0` + anahat kaldırma uygula.
2. Win11 **Snap Layouts**: büyüt düğmesine hover ile açılan düzen menüsü `frame:false` altında kaybolur. Kabul edilebilir kayıp; kullanıcı tek pencereyle çalışıyor.
3. Başlık çubuğuna sağ tık → sistem menüsü kaybolur. `Alt+Space` da gitmez. Tek kullanıcılı üründe ihmal edilebilir, ama kapat için `Alt+F4`'ün çalıştığını doğrula.
4. Kenarlardan yeniden boyutlandırma: 1px kenarlık tutma alanı olarak fazla dar. Kenara şeffaf 4px `no-drag` şerit bırak.
5. Yüksek DPI'da 1px kenarlık 1.5px'e yuvarlanıp bulanıklaşır — kenarlığı `outline` yerine `box-shadow: inset 0 0 0 1px` ile çiz.

## 4. Mavi anahat

- **Pencere kenarında**, gövdenin en dışında: `1px` neon mavi (#00F3FF), köşe yarıçapı **12px**. Bu, `--tk-r` (6px) değil — VidShrink'in pencere yarıçapıyla aynı olması gerekiyor ve scan.js "ikinci yarıçap" diye hata verir. **Bunu `--tk-r-window: 12px` olarak token'laştır**, ürün içi kart yarıçapı 6px kalsın.
- **Glow yok.** Gerekçe: odak halkası da neon mavi ve iki katmanlı. Pencere kenarında parlama olursa kullanıcı "neresi odaklı" ayrımını kaybeder.
- **Büyütülmüş pencerede anahat ve yarıçap kalkar.** Ekran kenarına yapışık 1px çizgi kirli görünür ve zaten kesilir.
- Pencere odağını kaybedince anahat opaklığı düşer (renk değişimi, glow değil) — hangi pencerenin aktif olduğu OS çubuğu olmadan başka türlü anlaşılmaz.

## 5. Jenerik olan / eksik olan

**Eksik ve bu ürüne özgü olması gerekenler:**

1. **Kural ihlali işareti.** `yer_min_kademe` aşıldığında gün işaretleniyor — bu arayüzde görünmüyor. Başasistanın tek gerçek risk sinyali bu. Matriste o güne pembe kenar, Bugün panelinde satırın başında pembe nokta + sebep.
2. **Kademe/kıdem rozeti.** "→ yerine geçen" satırında kişinin adı var, kademesi yok. Atamanın doğru olup olmadığı kademeyle anlaşılıyor; kullanıcı 17 ismi ezberden kademeye çevirmek zorunda kalmamalı.
3. **Yeniden hesap durumu.** Elle değişiklikten sonra "ayın kalanı yeniden hesaplandı, 6 gün değişti" satırı — değişen hücre vurgusuyla birlikte.
4. **`force` işareti.** Elle kilitlenmiş atama ile motorun ürettiği atama görsel olarak ayrılmalı; aksi halde ikinci yeniden hesapta kullanıcı kendi kararını kaybettiğini sanır.

**Gereksiz:**

- **Çetele Gösterge sekmesinde ana yer tutmuyor olmalı.** 5 saniyelik soruya cevap vermiyor. Sol sütun altına alınmalı.
- **Ayın 30 gününün eşit ağırlıkta gösterilmesi.** Geçmiş günler soluk, bugün belirgin, gelecek normal. Şu anki matriste 6 Eylül ile 28 Eylül aynı görsel ağırlıkta — bu jenerik takvim davranışı, bu ürünün değil.
- Sekme geçişinde slide, çetele dolma animasyonu, ok işaretine hareket: üçü de "tasarlanmış hissettirsin" kategorisi, silindi.

---

**Finish-Gate: HOLD** — düzen, hareket bütçesi ve başlık çubuğu geçer; kural ihlali işareti (`yer_min_kademe`) ve kademe rozeti eklenmeden gönderilmez, çünkü bu ekran şu hâliyle atamanın *geçerli* olup olmadığını kullanıcıdan gizliyor.
