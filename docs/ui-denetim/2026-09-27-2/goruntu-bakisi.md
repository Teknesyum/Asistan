# Görüntü Bakışı — Ham Çıktı

İşi yapmamış alt ajan (sonnet), yalnız `*-sonra.png` görüntüleri verildi, kural verilmedi. Dönüşü aynen:

---

Tüm görüntüleri inceledim. Sonuç:

gosterge (100/125/150), asistanlar, nobet(gorevlendirme), izinler, kural, cikti(gorevlendirme), qr, bildirim(gorevlendirme), kadro, liste, kisi, kurallar, qr(nöbet), bildirim(nöbet) — tüm ölçeklerde sorunsuz.

Bulunan sorunlar:
- `gorevlendirme/analiz-125-sonra.png` — Analiz sekmesi içeriği tamamen boş; yalnız üst çubuk ve sekme başlıkları görünüyor, tablo ve dağılım verisi hiç render olmamış.
- `nobet/cikti-150-sonra.png` — Sağ üst köşede "CSV Kopyala" düğmesi tek başına bir satırda, hemen altında "Excel'e Kopyala" ve "CSV Kopyala" tekrar görünüyor; iki düğme satırı üst üste binmiş/çakışmış durumda.

Not: `gorevlendirme/kural-125-sonra.png` ve `gorevlendirme/cikti-125-sonra.png` dosyaları beklenen sekme yerine İzinler ekranını gösteriyor — bu görsel bir bozukluk değil, muhtemelen ekran görüntüsü alma sırasında yanlış sekmenin yakalanmış olması; içerik kendi içinde tutarlı ve sağlıklı görünüyor.

Genel hüküm: 47 görüntüden 45'i sorunsuz; 125% ölçekte Analiz sekmesinde boş render ve 150% ölçekte Nöbet çıktısında çift/çakışan kopyalama düğmeleri iki gerçek arayüz sorunu tespit edildi, geri kalanında kesik/örtüşen yazı, okunmaz düğme veya taşma görülmedi.
