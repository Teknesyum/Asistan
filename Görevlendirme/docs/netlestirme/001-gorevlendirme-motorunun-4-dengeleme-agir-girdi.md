[[netlestirme:001]]

# Netleştirme: Görevlendirme motorunun 4 dengeleme ağırlığını otomatik ayarlayacak bir 'oto mod

İşe başlamadan önce soruyu keskinleştir. Görüş verme, plan yazma, kod yazma.
Yalnız şunu döndür: soruda belirsiz kalan yerler, her biri için tek satırlık bir netleştirme sorusu, en fazla beş. Belirsizlik yoksa "net" yaz.

## Soru

Görevlendirme motorunun 4 dengeleme ağırlığını otomatik ayarlayacak bir 'oto mod' kuruyorum. Aramanın neyi en iyilemesi gerekir? Programın ürettiği uyarı sayısını en aza indirmek doğru amaç mı, yoksa açıkça yazılmış bir adalet ölçütü mü olmalı? Kıdem esas ama çömeze mobbing olmasın kısıtını ölçülebilir hale nasıl getiririm? Somut bir amaç fonksiyonu ve arama yöntemi öner.

## Elde olan olgular

# Olgular — Asistan Görevlendirme, dengeleme ağırlıkları

## Ne yapıyor bu program
Cerrahi kliniğinde 17 asistan var, sabit kıdem sırasında (1 = en kıdemli, 17 = en çömez).
Herkesin bir "kendi yeri" var (Pol, Ybü1, Ybü2, Bblok, Ortopedi, Kbb, Kvc, GenelCerrahi,
Üroloji, PlastikGöğüs, BaşAsistan, İzin). Dört yer zorunlu: **Pol, Ybü1, Ybü2, Bblok** —
her iş gününde bu dördünde en az bir kişi bulunmak zorunda.

Kişi o gün İzinli / Derste / Nöbet Ertesi ise yok sayılır. Bir zorunlu yerin **tüm** kadrosu
yoksa o yer "boş" olur. Boş yerler, ameliyathane havuzundaki asistanlardan doldurulur.
Havuz = kendi yeri zorunlu yerlerden ve havuz dışı yerlerden biri olmayan, o gün var olan
herkes. Ayda tipik olarak 20 iş günü, günde 0-3 boşluk çıkıyor; ay boyunca toplam ~31 atama.

## Karar mekanizması
Her gün, o günün boşlukları için havuzdaki adayların **tüm permütasyonları** denenir ve
toplam maliyeti en küçük olan seçilir. Tek bir adayın tek bir boşluğa maliyeti:

    maliyet = 1e6 * kademe_ihlali
            + w_kidem      * |kidem[aday] - hedef_kidem(yer)|
            + w_toplam     * o ana kadarki toplam görev sayısı[aday]
            + w_tekrar     * o ana kadar aynı yer grubuna gitme sayısı[aday][yer]
            + w_dun        * (aday dün de görevlendirildiyse 1)

- `kidem[aday]`: listedeki sıra numarası, 1..17.
- `hedef_kidem(yer)`: o yerin kendi kadrosunun ortalama kıdem numarası. Örn. Ybü2'nin kadrosu
  Bahtiyar(3) ve Büşra(12) ise hedef 7.5.
- Sayaçlar ay içinde ilerledikçe artar (greedy, gün gün); geriye dönük optimizasyon yok.
- `kademe_ihlali`: ayrı bir alan. Kişilerde `kademe` var (0 = çömez, 1 = normal) ve yerlerde
  `yer_min_kademe` var (Ybü1=1, Ybü2=1, Bblok=1, Pol yok). Kademesi eşiğin altındaki kişi
  o yere atanırsa 1e6 ceza — yani ancak başka aday hiç yoksa olur, ve gün işaretlenir.
  Pratikte kademe 0 olan üç kişi (FatihEren, Ömer, Alperen) yalnız Pol'e gidiyor.

## Şu anki ağırlıklar ve sonuç
w_kidem=1, w_toplam=4, w_tekrar=3, w_dun=3. Eylül 2026 çıktısı (ay boyu toplam, parantezde
yer dağılımı):

    Ayşe 2 (Bblok×1, Ybü×1)          Ali 3 (Bblok×1, Ybü×2)
    FatihTalha 3 (Bblok×1, Ybü×2)    Emrah 3 (Bblok×2, Ybü×1)
    SümeyyeD 4 (Bblok×2, Pol×1, Ybü×1)
    Hilal 4 (Bblok×3, Ybü×1)         Eyyüp 4 (Bblok×1, Pol×2, Ybü×1)
    FatihEren 3 (Pol×3)  Ömer 3 (Pol×3)  Alperen 3 (Pol×3)

Yük aralığı 2-4. Kıdem sırası: Ayşe 2, Ali 4, FatihTalha 5, Emrah 6, SümeyyeD 8, Hilal 9,
Eyyüp 10, FatihEren 15, Ömer 16, Alperen 17.

## Program şu an hangi uyarıları üretiyor
1. "Havuzdaki yük aralığı MIN – MAX görev. Fark N." (her zaman, bilgi amaçlı)
2. Fark > 2 ise: "Fark büyük. Çok görev almış olma cezası ağırlığını artırmayı deneyin."
3. Bir kişi 3+ görev aldıysa ve hepsi tek yer grubunda ise (ve o kişinin gidebileceği birden
   fazla grup varsa): "X her seferinde aynı yere gidiyor. Aynı yere tekrar ağırlığını artırın."
4. Bir günde bir zorunlu yer hiç doldurulamadıysa: "N günde en az bir zorunlu yer doldurulamadı."
5. Ay boyunca hiç görev almayan havuz üyeleri varsa listeler.

## Kullanıcı kim, ne istiyor
Kullanıcı kliniğin başasistanı. Kendi cümlesi:

> "dengeleme ağırlıklarını otomatik ayarlama modu ekle bunu neye göre yapmalıyız kısmını
> fable a danış — en az uyarıyı veren mi en adaletli yoksa başka bişey mi bizim branşta
> kıdem esastır ama çömeze de mobing olmasını isteyecek değiliz oto modu kur"

Yani: ağırlıkları elle çevirmek yerine programın kendi bulmasını istiyor. Amaç fonksiyonunun
ne olması gerektiğini soruyor. Kendi koyduğu iki sınır: **kıdem esastır** (kıdemliye çömez
işi yaptırılmaz, yerin kıdem profiline uygun kişi gitmeli) ama **çömeze mobbing olmamalı**
(çömezler ayın taşıyıcısı hâline gelmemeli).

## Teknik sınırlar
- Tek dosyalık Electron uygulaması, çevrimdışı, ağ yok. Arama tarayıcıda saniyeler içinde
  bitmeli — 4 ağırlık için ızgara/rastgele arama yapılabilir, bir ay hesabı ~20 gün ×
  permütasyon, tek koşu milisaniyeler sürüyor. Birkaç bin koşu bütçe içinde.
- Ağırlıklar ondalık, pratikte 0-10 aralığında.
- Aylar arası "devir" var: önceki aydan gelen sayaç başlangıç değeri olarak yükleniyor.
