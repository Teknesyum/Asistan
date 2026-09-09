# Arayuz Komple Yenileme

- tarih: 2026-09-07
- danisilan: agency/design-ui-designer,design-ui-finish-gate-reviewer
- maliyet: 119565 token, 169 sn

## Girdi

# Olgular — Asistan Nöbet arayüzü

## Ürün ne yapıyor

Bir hastanenin aylık asistan nöbet listesini üreten, çevrimdışı, çerçevesiz bir Electron
masaüstü uygulaması. Tek kullanıcı: nöbet listesini yapan kişi (bir hekim). Ayda birkaç
kez, tek oturumda 20-60 dakika kullanılıyor. Ağ isteği yok, tek HTML dosyası.

Ekran: tam ekran masaüstü, 1440x900 ve üzeri. Dokunmatik yok, fare + klavye.

## Şu anki yapı

Tek `arayuz.html` (~1400 satır) + `app.css` (~870 satır). Üstte 38px çerçevesiz başlık
çubuğu (marka + ay + pencere düğmeleri). Altında yatay sekme şeridi ve tek bir gövde.

Sekmeler ve içerikleri:

1. **Liste** — solda 31 satırlık ana tablo (Tarih | 4 nöbet sütunu), her hücre bir
   `<select>`; seçim yapılırsa o hücre "kilitlenir" (elle zorlanır). Sağda iki panel:
   "Durum" (Tur/Tohum sayı girdileri + 8 satırlık etiket/değer listesi + uyarılar) ve
   "Kişi Dengesi" (17 satırlık özet tablo). Üstte "Listeyi Oluştur" düğmesi.
2. **Asistanlar** — 17 satır × 17 sütunluk tablo: sıra no, ad, kısa ad, kota, 4 torba
   onay kutusu, 4 özel kural onay kutusu, ↑ ↓ × düğmeleri.
3. **İstek & İzin** — 17 satır × 31 gün matrisi. Hücreye tıklandıkça izin → istiyor →
   istemiyor → boş; Shift+tık haftayı izinli yapar. Hücre içeriği "İ", "+", "−", "·".
4. **Uzman** — 31 satır × 2 sütun, her hücre serbest metin girdisi (o gün nöbetçi olan
   yoğun bakım ve ameliyathane uzmanının adı). Bu veri elle giriliyor.
5. **Takvim** — resmî tatil gün düğmeleri (31 küçük kare), sunum günü onay kutuları,
   sunum yapılmayan gün düğmeleri.
6. **Kurallar** — 12 ağırlık için etiket + sayı girdisi + "sıfırla" düğmesi (iki sütunlu
   ızgara), bir "Oto Ayarla" düğmesi, altında sütun listesi.
7. **Analiz** — 17 satır × 21 sütunluk yoğun tablo (kişi başına saat, hedef, sapma, 7
   hafta gününün her biri, hafta sonu, sunum, gün aşırı, istek, uzman tekrarı) + Toplam
   satırı. Altında asistan × 15 uzman denk gelme matrisi.
8. **Çıktı** — 31 satırlık tam tablo (tarih, gün adı, 2 uzman sütunu, 4 nöbet sütunu) +
   "Tabloyu Kopyala" / "CSV Kopyala" düğmeleri.

Hiçbir sekme kaydırmıyor; her şey tek ekrana sığacak şekilde sıkıştırıldı.

## Tasarım dili (teknesyum-ui, zorunlu)

Koyu, neon temalı bir jeton kümesi. Değer uydurmak yasak; yalnız bu jetonlar kullanılır.

Renk: `--tk-blue #00f3ff` (birincil, aynı zamanda kenarlık ve etiket rengi),
`--tk-pink #ff00ea` / `--tk-pink-text #ff54eb` (aynı zamanda `--tk-danger`),
`--tk-purple #b026ff` / `--tk-purple-text #c67eff`, `--tk-success #34d399`,
`--tk-warning #fbbf24`, `--tk-text #ffffff`, `--tk-text-label #00f3ff`,
`--tk-disabled #71717a`, `--tk-surface #08090a`, arka plan siyahtan #08090a'ya gradyan.
Kenarlık: `--tk-border rgba(0,243,255,0.5)`, `--tk-border-strong 0.6`,
`--tk-border-decorative 0.3`.

Ölçü: boşluk merdiveni 4/8/12/16/24px. Yazı 14/16/20/24/30px. Yarıçap 6px, pencere 12px.
Kenarlık kalınlığı 1px. En küçük dokunma hedefi 24px. Girdi yüksekliği 40px.
Satır yüksekliği: gövde 1.5, başlık 1.2, monospace 1.4. Harf aralığı etiketlerde 0.15em.

Bir denetleyici betik (`scan.js`) sabit renk/ölçü yazılmasını ve geçişsiz `:hover`
tanımını hata sayıyor.

Şu an sayısal hücreler `--tk-pink-text` ile yazılıyor (`.sayi` sınıfı), ikincil sayılar
`--tk-disabled` gri. Tablolarda yalnız isteğe bağlı bir alt çizgi sınıfı var
(`.grid-line`), dikey ayraç hiç yok. Hücreler sola dayalı.

## Kullanıcının bu turdaki şikâyetleri (kendi cümleleri, sırayla)

1. "burda pembe kullanma" — Kişi Dengesi tablosundaki pembe sayılar.
2. "başlıklar daha açıklayıcı olsun" — `HS`, `Sun`, `G±2`, `İst` gibi kısaltmalar.
3. "tüm projede tablolar var ama ara çizgiler yok tüm ara kenarlıkları yap"
4. "ayrıca hepsini ortalanmış bas"
5. "durumdaki açıklamayı ? içine koy" — Durum panelindeki iki cümlelik Tur/Tohum
   açıklaması yer kaplıyor.
6. "analiz kısmında uzman adlarını kısalt ilk isim ve ikinci ismin ilk harfi yeterli"
7. "kim gün aşırı oldu vb görebiliyim" — sayıyı görüyor ama hangi gün/kim olduğunu değil.
8. "beyazlar tam beyaz olsun gri olmasın"
9. "çıktıdaki tablo excele kopyalanabilir şekilde olmalı"
10. "bilgi satırları geniş olabilecekken hemen newline yapıyor" — etiket/değer satırları
    124px sabit etiket sütunuyla ızgaraya oturuyor, metin erken sarıyor.
11. "uzman sekmesinde niye bu kadar ayrık bi tablo var" — 31 satırın her birinde 40px'lik
    iki metin girdisi, aralarında bolca boşluk.
12. "uzman sekmesine ihtiyaç da yok" — sekme kaldırılsın (veri hâlâ gerekli, motor uzman
    çakışmasını cezalandırıyor; başka bir yere taşınmalı).
13. "kurallarda perşembenin eşit dağılımı ağırlığı gibi şeyler neden yok" — motorda
    `gun_dagilimi` diye tek bir ağırlık var ve hafta gününe göre eğim sabit kodlanmış
    (`GUN_TILT = [0,0,0,-1,0,1,1]`, Pzt..Paz); kullanıcı bunu ekranda ayarlanabilir
    istiyor.
14. "ayrıca orda da ayar nerde kutu nerde" — Kurallar sekmesinde etiket ile girdi
    arasındaki bağ görsel olarak kopuk.
15. "ui çok kötü dizayn edilmiş ... ui komple yenile"

## Değişmeyecek kısıtlar

- Tek dosya, çevrimdışı, dış kütüphane yok, ağ isteği yok.
- Yalnız `--tk-*` jetonları; yeni renk veya ölçü uydurulamaz.
- Hesap motoru Python `nobet.py` ile bit düzeyinde aynı çıktı vermek zorunda; motor
  mantığı değişirse iki tarafta birden değişir. Arayüz düzeni motoru etkilemez.
- Hiçbir sekme kaydırmamalı (kullanıcının açık isteği), 1440x900'de her şey sığmalı.
- Türkçe arayüz.

---

## Sorulan (iki role birden, ayrı ayrı)

**design-ui-designer'a:** Bu arayüzü baştan tasarla — bilgi mimarisi, ana ekran düzeni,
tablo dili (tam ızgara / ortalama / renk), ayar formu dili ve hafta günü eğimi denetimi,
yoğunluk ve tipografi, "?" yardım kutusu, ilk 20 dakika yolculuğu ve şu anki düzenin
kırıldığı üç yer. Somut: sınıf adı, ızgara oranı, jeton adı.

**design-ui-finish-gate-reviewer'a:** Bu arayüzü bitiş kapısında denetle — jeneriklik
teşhisi, en ağır üç kusur, ham sayıdan görsel kodlamaya geçiş noktası, sekme koleksiyonu
sendromu, ölçülebilir kabul kriterleri, reddedilecek üç şey.

## Donen

# design-ui-designer — cevap

## 1. Bilgi mimarisi

8 sekme yanlış, çünkü sekmeler *işe* değil *veri tablosuna* göre bölünmüş. Hekimin işi üç aşamalı: **hazırla → üret → dışa ver**. Sekme sayısı 3 olmalı, sekme değil **aşama** (`.tk-adim` şeridi, sol üstte, sıra numaralı).

- **1 · Kadro** — Asistanlar + İstek&İzin + Takvim + Uzman tek ekranda. Solda kişi listesi (`.kadro-kisi`, ad + kıdem + kota + torba rozetleri), sağda o kişinin 31 günlük şeridi. Kişi seçilince şerit değişir; 17×31 dev matris yerine 1×31 şerit. Ay geneli görmek için üstte `.kadro-ozet` mini ısı şeridi.
- **2 · Liste** (varsayılan açılış) — üretim + denge + analiz aynı ekranda. Aşağıda.
- **3 · Çıktı** — tam tablo + kopyala düğmeleri.

**Kurallar sekme değil, çekmece**: sağdan açılan `.tk-panel-kurallar` (420px), Liste ekranındaki "Kurallar" düğmesiyle. Ağırlık değişince arkadaki liste yerinde duruyor — sebep-sonuç görünüyor, sekme atlaması yok.

**Uzman verisi**: kendi sekmesi olmayacak. Kadro ekranında takvimin altında **iki satırlık yatay şerit** (`.uzman-serit`), 31 sütun, satır 1 = YBÜ, satır 2 = Ameliyathane. Hücre 40px değil 28px, `<input>` değil tıklayınca açılan **datalist'li tek satır** — çünkü aynı 15 isim tekrar giriliyor. Sağ okla bir sonraki güne geçiş. 62 girdi 2×31 kompakt ızgarada, dikey 31 satır yerine yatay: ekranda 90px yer kaplar.

## 2. Ana ekran düzeni

Evet, üçü aynı anda. `grid-template-columns: 3fr 2fr 2fr` — 1440'ta yaklaşık 590 / 390 / 390px, aralar `24px`.

- **Sol (`.panel-liste`)** — 31 satır × 5 sütun nöbet tablosu. Karar burada, en geniş sütun bu.
- **Orta (`.panel-durum`)** — üstte Oluştur düğmesi + Tur/Tohum, altında uyarı yığını (`.uyari-liste`). Uyarı **tıklanabilir**: soldaki ilgili günü seçer. "Kim gün aşırı oldu" sorusu böyle cevaplanır — uyarı satırı "Demir · 12→14 Eyl" yazar, tıklayınca satır vurgulanır.
- **Sağ (`.panel-denge`)** — 17 kişi × 4 sütun (Saat, Hedef, Sapma, Bayrak). Analiz sekmesinin 21 sütunu buraya sığmaz; kişiye tıklayınca orta panel o kişinin tam dökümüne (7 gün, HS, sunum, uzman denk gelme) döner. Analiz = ayrı sekme değil, **detay görünümü**.

Dikey bütçe: 38 başlık + 44 aşama şeridi + 24 boşluk + 31×22px satır (682) + 40 tablo başlığı + 24 alt boşluk = 852. 900'e sığar, kaydırma yok.

## 3. Tablo dili

**Tam ızgara.** Kullanıcı "tüm ara kenarlıklar" dedi; yarım çözüm (satır ayracı + seçili dikey) isteğini karşılamaz ve bu kadar sayısal veride sütun takibi zaten dikey çizgi ister. `border-collapse: collapse`, her `td`/`th` 1px `--tk-border-decorative`. Dış çerçeve `--tk-border` (0.5) — ızgara içeride soluk, dışarıda net.

**Ortalama:** hepsi ortalanır — ama tam ortalama uzun ad sütununda tarama bozar. Çözüm: ad sütunu `text-align: center` **kalır**, içindeki metin `.hucre-ad { display:block; width:max-content; margin-inline:auto; text-align:left }`. Blok ortalanır, harfler sola dayanır — kullanıcının gördüğü şey ortalanmış bir sütun, gözün gördüğü şey hizalı bir sol kenar. İkisi de karşılanır.

**Renk:**
- Başlık `th`: `--tk-text-label` (#00f3ff), 0.15em harf aralığı, kısaltma yok ("Hafta Sonu", "Sunum", "Gün Aşırı", "İstek").
- Birincil sayı: `--tk-text` tam beyaz. Pembe gider.
- İkincil/hedef sayı: `--tk-purple-text` (#c67eff). Gri yasak, mor ikinciliği taşır.
- Sapma: negatif/pozitif fark etmeksizin |sapma| ≤ tolerans → `--tk-success`, aşan → `--tk-warning`.
- Uyarı/ihlal: `--tk-danger`. Pembe **yalnız** burada; kullanıcının "pembe kullanma"sı denge tablosuna ait, tehlike rengi olarak meşru.

## 4. Ayar formu dili

Satır anatomisi (`.ayar-satir`), tek sütun, `grid-template-columns: 1fr 88px 24px`:

`[etiket + ? ] [sayı kutusu] [sıfırla]`

Etiket ve kutu **aynı satırda, alt kenarları hizalı**, aralarında noktalı doldurucu (`.ayar-nokta`, `--tk-border-decorative` üzerine `repeating-linear-gradient`) — "ayar nerde kutu nerde" sorunu, gözün etiketten kutuya kesintisiz gidebilmesiyle çözülür. İki sütunlu ızgara terk edilir; 12 satır × 40px = 480px, çekmeceye rahat sığar.

**Hafta günü eğimi:** 7 sayı kutusu da kaydıraç da değil — **7 sütunlu üç-durumlu düğme şeridi** (`.egim-serit`). Her gün için üst/orta/alt üç kare: "Az", "—", "Çok". Değer aralığı zaten −1/0/+1 ve mevcut sabit kod bu üç değeri kullanıyor; sürekli kaydıraç sahte hassasiyet satar. Şerit tek bakışta okunur ve "kıdemli cumartesiyi çok alsın" cümlesi doğrudan görünür.

## 5. Yoğunluk ve tipografi

14px tek boyut kalır; yoğunluk **satır yüksekliğinden** alınır: tablo gövdesi `line-height: 1.2`, hücre dolgusu `4px 8px` → 22px satır. 31 satır = 682px. Panel içi boşluk 16px, paneller arası 24px, panel başlığıyla tablo arası 12px — merdiven bozulmaz.

Monospace/sistem ayrımı doğru ve şart: sayı sütunlarında `--tk-font-mono` sekmeli rakam, sütun genişliği sabitlenir ve dikey tarama işler. Adlar sistem yazı tipinde. Karışık hücre yok.

## 6. Yardım

`.tk-ipucu`: 16px daire, 1px `--tk-border-decorative` kenarlık, içinde 14px `--tk-text-label` "?". **Tıklama** — üstüne gelme değil; hekim fareyi tablo üzerinde gezdirirken kazara açılan kutular gürültü olur, ayrıca metin seçilebilir kalmalı. Açılan kutu `.tk-ipucu-kutu`: tetikleyicinin altına, sola hizalı, max 280px, `--tk-surface` zemin, `--tk-border` kenarlık, 12px dolgu, Esc/dışa tık kapatır.

Sayı: **en fazla 6**. Tur/Tohum (1), her ağırlık grubu başlığı (3), sapma sütunu (1), uzman şeridi (1). Her satıra "?" koymak yeni bir gürültü katmanıdır.

## 7. İlk 20 dakika

Hekim **2 · Liste** ekranını görür; sol panelde boş 31 satır, ortada tek parlak düğme "Listeyi Oluştur" (`--tk-blue` dolgu, ekranın tek dolgu düğmesi), sağda soluk denge tablosu. Göz sola-boş tabloya, sonra ortadaki tek renkli şeye gider; basar; tablo dolar, sağ panel canlanır. Öğrendiği şey: bu program bir düğmeye basılınca çalışıyor.

Şu anki düzenin kırıldığı üç yer:

1. **Sekme şeridi ilk kararı boşa harcatıyor.** 8 eşit ağırlıklı sekme "önce hangisi" sorusunu sorar; cevabı yok, çünkü sıra bilgisi taşınmıyor. Numaralı 3 aşama bunu yok eder.
2. **Uyarılar ölü metin.** Sayıyı gösterip yerini göstermiyor; hekim ihlali bulmak için Analiz sekmesine gidip geri dönüyor, dönüşte bağlam kayboluyor. Uyarı → satır seçimi bağı bu gidiş-gelişi siler.
3. **Kurallar sekmesi geri bildirimi kesiyor.** Ağırlığı değiştirip listeyi görmek için sekme değiştirmek gerekiyor, iki durumu yan yana karşılaştırmak imkânsız. Çekmece, ağırlık ile sonucu aynı ekranda tutar.

---

# design-ui-finish-gate-reviewer — cevap

## Karar: HOLD

## 1. Jeneriklik teşhisi

Bu ekranı herhangi bir yönetim panelinden ayıran **hiçbir şey yok**. Sekme şeridi + tablo + sağda iki panel — bu şablonu stok takibinden CRM'e kadar her yere koyabilirsin. Domain nesnesi ("31 günlük bir ay") hiçbir yerde **kendi biçimiyle** görünmüyor.

Alanın kendine has görsel dili şunlar ve hiçbiri kullanılmamış:

- **Ay ızgarası.** Bir nöbet listesi zamansal bir nesne: 4-5 hafta satırı × 7 gün sütunu. Hafta sonu, tatil, gün aşırı gibi kavramların hepsi bu ızgarada *konumsal* olarak okunur. Sen bunu 31 satırlık düz bir listeye düzleştirdin — hafta ritmi yok oldu, "cumartesi cumartesiye kim düşüyor" sorusu gözle cevaplanamaz hale geldi.
- **Kişi şeritleri (Gantt/heat şeridi).** 17 kişi × 31 gün, kişi başına tek satır. Bir hekim "bu adam ayın ilk yarısına yığılmış" cümlesini bir bakışta bu şeritten kurar. İstek & İzin sekmesinde bu ızgara *zaten var* ama sadece girdi olarak; sonuç (atanan nöbetler) aynı ızgarada gösterilmiyor. Aynı matris iki kez çizilip birbirine bindirilmemiş — bu ürünün en büyük kaçırılmış fırsatı.
- **Yük çubukları.** Kota, hedef saat, sapma — hepsi hedefe göre bir *doluluk*. Çubuk bunun doğal biçimi; sen 21 sütunluk sayı tablosu yapmışsın.
- **Çakışma işaretçisi.** Nöbet ertesi, uzman tekrarı, min kademe ihlali — bunlar ızgarada *iki hücre arası ilişki*. Şu an sadece toplam sayı olarak var, yeri yok.

Ayrıca: 12 ağırlık girdisi ile 31 günlük sonuç arasında hiçbir görsel bağ yok. Kullanıcı bir sayıyı değiştirip "ne değişti" sorusunu ancak iki sekme arası mekik dokuyarak cevaplıyor.

## 2. En ağır üç kusur

**1. Sonuç ile denetim aynı ekranda değil.** Liste sekmesinde atama var, Analiz sekmesinde sonucun iyi olup olmadığı var. Hekim "oluştur → bak → düzelt" döngüsünü sekme değiştirerek yapıyor; bu döngü bu üründe onlarca kez tekrarlanıyor. Kaynağı: **sekme = veri kategorisi** kararı. Sekmeler işe göre değil, veri tipine göre bölünmüş.

**2. Zaman ekseni yok edilmiş.** 31 satırlık düz liste, "gün aşırı", "hafta sonu dengesi", "perşembe dağılımı" gibi bu ürünün *tüm* kalite ölçütlerini gözle görünmez kılıyor. Kullanıcının 7. şikâyeti ("kim gün aşırı oldu görebileyim") doğrudan buradan doğuyor — sayıyı görüyor, yerini göremiyor. Kaynağı: **tablo = satır listesi** kararı, ay matrisi kararı yerine.

**3. Sayı yığını hiyerarşisiz.** 17×21 tablo, hepsi aynı ağırlıkta, hepsi aynı renkte. Hangi hücre sorunlu, hangisi normal — hiçbir görsel fark yok. Hekim satır satır okumak zorunda. Kaynağı: **her veri bir sütun hak eder** kararı; sinyal ile döküm ayrılmamış.

## 3. Sayıların anlamı

Ham sayı **girdide** ve **tek bir doğrulama anında** kalır: kota "6", ağırlık "12", hedef "81 saat". Bunlar kullanıcının yazdığı veya tam değerini bilmek zorunda olduğu şeyler.

Ham sayıdan **görsel kodlamaya geçiş noktası: 17 satırın tamamını tarayıp karşılaştırma gerektiren her yer.** Yani Kişi Dengesi ve Analiz'in tamamı. Orada asıl soru "80 mi 81 mi" değil, "kim sapmış".

Kodlama şöyle olmalı, gösterge tablosu klişesine düşmeden:

- **Sapma çubuğu, sıfır ortada.** Hedefe göre sola/sağa taşan ince bir çubuk. Değeri okumak isteyen üstüne gelir. Bu bir "KPI kartı" değil, tablo hücresinin içine gömülü mikro-form.
- **İyi/kötü ayrımı yalnız eşik aşıldığında.** Normal olan hiçbir şey renk almaz — beyaz kalır. Sadece ihlal ve sınırdaki değer işaret alır. Bu ürünün "iyi"si zaten sessizliktir; hekim sorunu arıyor, başarıyı değil. `--tk-warning` sınırda, `--tk-danger` ihlalde, `--tk-success` **kullanılmaz** (yeşil onay rozeti tam da klişenin kendisi).
- **Sayaç değil, konum.** "G±2: 2" yerine ay ızgarasında o iki günün işaretlenmesi. Tıklanınca ilgili günlere atlanması. Sayı, kendi kanıtına giden bir kapı olmalı.

## 4. Sekme koleksiyonu sendromu

8 sekmenin ancak 3'ü ayrı olmayı hak ediyor.

- **Liste + Analiz + Çıktı = tek iş.** Üçü de aynı nesnenin (üretilmiş liste) üç görünümü. Ayrılmaları hata; hekim üretir, denetler, kopyalar — bu tek bir akış. Analiz bir sekme değil, listenin yanındaki denetim şeridi olmalı.
- **Asistanlar + İstek&İzin + Uzman = tek iş.** Üçü de "ayın girdisi". Uzman zaten kullanıcının kendi ifadesiyle sekme olmayı hak etmiyor; İstek&İzin matrisine iki ek satır olarak girer. Asistanlar tablosu o matrisin satır başlığıdır — ayrı sekmede olması, aynı 17 kişiyi iki kez çizmek demek.
- **Kurallar + Takvim = ayarlar.** İkisi de ayda bir dokunulan, sonucu dolaylı etkileyen parametreler. Takvim'in ayrı sekme olması, 31 tatil düğmesinin ay ızgarasında zaten görünebilecek olmasını gözden kaçırıyor.

Kural: **sekme, kullanıcının işi arasında değil, oturumun evreleri arasında bölünmeli** — Hazırla / Üret ve Denetle / Ayarla.

## 5. Kabul kriterleri (PASS için)

1. Ay ızgarası (hafta × gün) ekranda var; hafta sonu, tatil, sunum günü ızgarada konumsal olarak ayırt ediliyor — ayrı bir sekmeye bakmadan.
2. Sekme sayısı **8 → en fazla 3**. Uzman sekmesi yok; uzman verisi girdi matrisine gömülü.
3. "Oluştur"dan sonra sonucu denetlemek için **sıfır sekme değişimi** gerekiyor: atama + sapma + uyarılar aynı ekranda.
4. Gün aşırı, uzman tekrarı ve min-kademe ihlallerinin her biri **ızgarada işaretli**; sayacın üstüne tıklamak ilgili günü seçili hale getiriyor.
5. Her asistan için tek satırlık **31 günlük şerit** var ve atama + izin aynı şeritte okunuyor.
6. Analiz'deki 21 sütun **en fazla 8 sütuna** iniyor; kalanlar satır açılınca gelen ayrıntıda.
7. Hedefine uygun hiçbir hücre renk taşımıyor; renk yalnız eşik/ihlal hücrelerinde. Renkli hücre sayısı temiz bir listede **0**.
8. Kişi Dengesi'nde pembe sayı **0 adet**; ikincil metin `--tk-disabled` değil `--tk-text`.
9. Her tablonun tam iç kenarlık ızgarası var, sayısal hücreler ortalı; `scan.js` **0 hata**.
10. 1440×900'de üç ekranın hiçbiri kaydırmıyor; hiçbir bilgi satırı 2 satıra sarmıyor.
11. Ayarlanan bir ağırlık ile etkilediği sonuç arasında görünür bağ var (değişince yeniden üretilen alan işaretleniyor).
12. Boş durum (liste henüz üretilmemiş) tasarlanmış — gri boş tablo değil.

## 6. Reddedilecekler

**1. Gösterge paneli açılışı.** "Bu ay 137 nöbet / 17 asistan / %94 doluluk" tarzında dört büyük metrik kartı. Bu tek kullanıcılı, ayda birkaç kez açılan bir üretim aracı — özet ekranı istemiyor, doğrudan işin kendisini istiyor. Kart ızgarası bu üründe saf dolgu.

**2. Neon süsleme.** Jeton kümesi koyu-neon diye her kenarlığa parlama, gradyan başlık, `--tk-blue` kenarlıklı yuvarlak kartlar eklemek. Bu ekranda 500+ hücre var; her birinin etrafında ışıldayan bir çerçeve okunabilirliği bitirir. Neon **yalnız sinyal taşıyan yerde** kullanılmalı, dekor olarak değil.

**3. Sekme yerine akordeon/modal.** "8 sekmeyi 3'e indir" talimatını, aynı 8 bloğu açılır-kapanır panellere doldurarak yerine getirmek. Bu, sorunu çözmez — sadece sekme şeridini gizler. Bloklar **birleşmeli**, saklanmamalı.
