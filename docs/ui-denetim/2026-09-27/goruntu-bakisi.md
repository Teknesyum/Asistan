# Görüntü Bakışı — Ham Çıktı

İşi yapmamış alt ajan (opus), yalnız PNG dosyalarına bakarak yazdı. Değiştirilmeden aktarıldı.

Görevlendirme'de 100% ölçekte dört resim yanlış ekranı gösteriyor. Nöbet'teki bulgular görsel kusur düzeyinde. Tüm ekranların `-100-sonra` ve `-150-sonra` resimlerine baktım. Karşılaştırma için 4 tane `-100-once`, yanlış çekilen ekranlar için de 4 tane `-125-sonra` açtım.

## Görevlendirme

**Üst çubuk (tüm ekranlar)**
- `*-100-sonra.png`, `*-150-sonra.png`: Başlık, sürüm, eşitleme durumu, QR, Teknesyum ve pencere düğmeleri düzgün; 150%'de de kırpılma yok. — sorun yok
- `gosterge-100-once.png` → `sonra`: QR ve Teknesyum çerçeveli düğmeydi, şimdi yalnız renkli yazı. Bağlantı gibi duruyor, düğme olduğu anlaşılmıyor. — düşük
- `*-100-sonra.png`: "Eylül 2026" ay alanının sağındaki takvim simgesi kaybolmuş. Alanın seçilebilir olduğu anlaşılmıyor. — düşük

**gosterge**
- `gosterge-100-sonra.png`: Sağ alttaki "Kurallar — 28 Eylül" panelinde yazılar çok küçük (~9–10px). "Otomatik ata", "Bugün gerekmiyor", Genel kurallar ve Dengeleme ağırlıkları zor okunuyor. Açılır kutular ve Pol/Ybü1 gibi küçük düğmeler de dar tıklama hedefi. — orta
- `gosterge-100-once.png` → `sonra`: Öncede hafta sonu (Cmt/Paz) satırları sönük gösteriliyordu, sonrada bütün günler aynı parlaklıkta. Hafta sonu ayrımı kaybolmuş. — orta (kötüleşme)
- `gosterge-150-sonra.png`: Taşma veya üst üste binme yok. — sorun yok

**asistanlar**
- `asistanlar-100-sonra.png`, `-150-sonra.png`: Temiz. "Sil" düğmeleri ve sürükleme tutamakları (⠿) küçük ama kullanılabilir. — düşük

**nobet**
- `nobet-100-sonra.png`: "Ameliyathane Uzmanı" sütunu dar; "Gülencan Yumuşa…" kırpılıyor. — düşük
- `nobet-150-sonra.png`: 150%'de aynı ad sığıyor. — sorun yok

**izinler**
- `izinler-100-sonra.png`, `-150-sonra.png`: Sorun yok.

**kural**
- `kural-100-sonra.png`, `-150-sonra.png`: Okunaklı, taşma yok. — sorun yok

**cikti**
- `cikti-100-sonra.png`: Resim Çıktı ekranını değil, Kural & Zorlama ekranını gösteriyor. Çekim hatası; 100%'de Çıktı denetlenemedi. — yüksek (denetim eksiği)
- `cikti-125-sonra.png`, `-150-sonra.png`: "Boş günleri de göster" kutusu işaretsizken koca, dolu beyaz kare olarak görünüyor. Siyah zeminde "işaretli" sanılabilir; öncede küçük, standart bir kutuydu. — orta (kötüleşme)
- `cikti-150-sonra.png`: 8 Eylül kartında "Kopyala" düğmesi ikinci satıra düşmüş (başlıkta "Zorlanan" rozeti olduğu için). Diğer kartlarla hizası bozuk. — düşük

**analiz**
- `analiz-100-sonra.png`: Bu resim de Kural & Zorlama ekranını gösteriyor. Çekim hatası. — yüksek (denetim eksiği)
- `analiz-125-sonra.png`, `-150-sonra.png`: Temiz. — sorun yok

**qr**
- `qr-100-sonra.png`: Resim boş Analiz sekmesini gösteriyor, QR penceresi yok. Çekim hatası. — yüksek (denetim eksiği)
- `qr-125-sonra.png`, `-150-sonra.png`: QR penceresi, "Kapat" düğmesi ve adımlar okunaklı; arka plan karartılmış. — sorun yok

**bildirim**
- `bildirim-100-sonra.png`: Resim Analiz ekranını gösteriyor, bildirim görünmüyor. Çekim hatası. — yüksek (denetim eksiği)
- `bildirim-150-sonra.png`, `-125-sonra.png`: "Panoya kopyalandı" bildiriminin zemini yarı saydam. Alttaki uyarı satırları arkasından görünüp yazıya karışıyor. Öncede de aynıydı. — orta

## Nöbet

**Üst çubuk**
- `*-100-sonra.png`, `*-150-sonra.png`: Başlık, sürüm, eşitleme, QR, Teknesyum ve pencere düğmeleri düzgün. — sorun yok
- `*-100-sonra.png`: "Ekim 2026" ay alanında da takvim simgesi yok. — düşük

**kadro**
- `kadro-100-once.png` → `sonra`: Öncede kırpılan uzun adlar ("BAHTİYAR MAHMU", "FATİH TALHA KORU") artık tam görünüyor. — düzelme
- `kadro-100-sonra.png`: YK/AK/YÇ/AÇ/ABY/ASY/AOB/GAS rozetleri (~25×18px), ↑ ↓ × düğmeleri (~18px) ve sağ alttaki izin ızgarası hücreleri çok küçük tıklama hedefleri. Izgara yazısı da çok küçük. — orta
- `kadro-100-sonra.png`, `-150-sonra.png`: Takvimde adlar "AHMET…", "MUHAR…" diye kırpılıyor. Tasarım gereği olabilir ama kim olduğu okunmuyor. — düşük

**liste**
- `liste-100-sonra.png`, `-150-sonra.png`: "Liste hazır" bildirimi 30 ve 31 Ekim satırlarının Ameliyathane Çömez hücrelerinin üstüne biniyor ve yarı saydam. Öncede tablo daha kısaydı, bildirim boşluğa düşüyordu. — orta (kötüleşme)
- `liste-100-sonra.png`: Sağ tablo ve Durum paneli okunaklı. — sorun yok

**kisi**
- `kisi-100-sonra.png`, `-150-sonra.png`: Seçili kişinin satırları yalnız ince mavi çerçeveyle belli, zor fark ediliyor. Üstteki "·N··N·" şeridi çok küçük. — düşük

**kurallar**
- `kurallar-100-sonra.png`, `-150-sonra.png`: Çekmece bütün yüksekliği kaplıyor; açıkken sağ üstteki QR, Teknesyum ve pencere düğmeleri örtülüyor. Öncede de böyleydi. — orta
- Az/—/Çok ile Sunum günleri seçimleri yalnız ince mavi çerçeveyle ayrılıyor, seçili olan zor anlaşılıyor. — orta
- ↺ sıfırla simgeleri küçük ve sönük. — düşük
- `kurallar-100-sonra.png`: "Ağırlıkları Tara" açıklaması sağ kenara ve kaydırma çubuğuna dayanıyor. — düşük

**cikti**
- `cikti-100-sonra.png`, `-150-sonra.png`: Temiz ve okunaklı. — sorun yok

**qr**
- `qr-100-sonra.png`, `-150-sonra.png`: Pencere, karartma ve "Kapat" düzgün. 100%'de adım yazıları biraz küçük. — düşük

**bildirim**
- `bildirim-100-sonra.png`, `-150-sonra.png`: "Kopyalandı" bildirimi boş alana düşüyor, okunaklı. — sorun yok

**Genel hüküm:** Kullanılabilir. Engelleyici bir kırpılma ya da taşma yok, 150%'de düzen korunuyor. Ama Görevlendirme'nin 100% çekimlerinden dördü (Çıktı, Analiz, QR, bildirim) yanlış ekranı gösteriyor; o dört ekran 100%'de ancak yeniden çekimle doğrulanabilir.

Yok
