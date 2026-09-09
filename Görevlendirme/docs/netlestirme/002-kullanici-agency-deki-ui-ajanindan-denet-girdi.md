[[netlestirme:002]]

# Netleştirme: Kullanıcı "agency'deki UI ajanından denetlemeci birini bul, arayüzümüzü değerlen

İşe başlamadan önce soruyu keskinleştir. Görüş verme, plan yazma, kod yazma.
Yalnız şunu döndür: soruda belirsiz kalan yerler, her biri için tek satırlık bir netleştirme sorusu, en fazla beş. Belirsizlik yoksa "net" yaz.

## Soru

Kullanıcı "agency'deki UI ajanından denetlemeci birini bul, arayüzümüzü değerlendirsin, ona göre öneriler yapsın" dedi. Denetimi başlatmadan önce netleşmesi gereken şu: denetim yalnız Gösterge sekmesinin tam ekran halini mi kapsasın, yoksa yedi sekmenin tamamını mı; ve denetçi teknesyum-ui token setini sabit kabul edip yalnız bu tokenlarla çözülebilecek öneriler mi getirsin, yoksa token setinin kendisini de sorgulayabilsin mi? Kullanıcının cümlesinden hangisi anlaşılıyor?

## Elde olan olgular

# Olgular — AsistanGörevlendirme

- Ürün: cerrahi kliniğin başasistanı (tek kullanıcı) için çevrimdışı Electron masaüstü uygulaması.
  17 asistanı, aylık nöbet ve izin listesinden boşalan zorunlu yerlere (Pol, Ybü1, Ybü2, Bblok) atar.
- Kullanım anı: günde 1-3 kez, 10-60 saniyelik açılışlar. Asıl soru "bugün kim nerede, boş kalan var mı".
- Ekranlar: 7 sekme — Gösterge (asıl ekran), Asistanlar, Nöbet, İzinler, Kural & Zorlama, Çıktı, Analiz.
- Gösterge yerleşimi: solda Ay Matrisi + altında Geçmiş (Kişi × Yer) ve Kişi × Bölüm; sağda Dün, Bugün, Yarın ve Kurallar panelleri. Tam ekranda kaydırmasız sığması hedef.
- Görsel dil: teknesyum-ui neon standardı. Zemin #08090a, vurgu neon mavi #00F3FF ve pembe. Bütün renk/ölçü `--tk-*` token'ı; token dışına çıkmak yasak, `scan.js` denetliyor.
- Çerçevesiz pencere; başlık çubuğunu uygulama çiziyor, küçült/büyüt/kapat sağ üstte.
- Veri localStorage'da; "Dosyaya Kaydet / Yükle" ile JSON. Ağ isteği yok.
- Daha önce aynı danışman koltuğundan bir tur alındı (docs/danisma/001): düzen, hareket bütçesi ve başlık çubuğu geçti; kural ihlali işareti ve kademe rozeti eksik diye HOLD verildi. İkisi de sonradan eklendi.
- Ekran görüntüsü mevcut: Gösterge sekmesi, 1800×1128, tam ekran.
