# Netleştirme: Görevlendirme motorunun 4 dengeleme ağırlığını otomatik ayarlayacak bir 'oto mod

- tarih: 2026-09-06
- girdi: 001-gorevlendirme-motorunun-4-dengeleme-agir-girdi.md
- maliyet: 48.4k token, 12 sn

## Dönen

Belirsiz kalanlar:

1. "Uyarı sayısı" amaç olarak kullanılacaksa, ilk uyarı (yük aralığı, her zaman basılıyor) ve 4. uyarı (dolmayan yer, ağırlıklardan bağımsız) sayılacak mı, yoksa yalnız 2/3/5 mi sayılacak?
2. "Kıdem esastır" hangi yönde bağlayıcı: kıdemli çömez yerine gitmesin mi (tek yönlü), yoksa her yerin kıdem profili tutturulsun mu (iki yönlü, |kidem − hedef| şu anki gibi)?
3. "Çömeze mobbing olmasın" için eşik ne: havuzdaki en çömezin yükü ortalamadan en fazla kaç görev fazla olabilir (örn. +1), yoksa yalnız min–max aralığı mı sınırlanacak?
4. Kademe 0'lı üçlü (yalnız Pol) adalet ölçümüne dahil mi, yoksa ayrı bir havuz gibi ayrı mı değerlendirilecek?
5. Oto mod ağırlıkları ay içinde bir kez mi bulacak (o ayın verisiyle), yoksa geçmiş aylar + devir sayaçlarını da hesaba katarak mı?
