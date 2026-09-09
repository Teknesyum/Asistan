# Asistan

Özel depo. Her araç kendi klasöründe. Şimdilik tek klasör var: `Görevlendirme`.

Veri de depoda: `Görevlendirme/veri/` altındaki aylık JSON'lar commit edilir, böylece
her makinede aynı geçmiş görünür.

## Yeni makinede kurulum

```powershell
git clone https://github.com/Teknesyum/Asistan.git "$env:USERPROFILE\Desktop\Projeler\Asistan"
```

Sonra `Görevlendirme\kur.ps1` — Electron'u kurar, masaüstü kısayolunu yazar.
Gerekenler: Node.js, Git, GitHub kimliği (`gh auth login` yeter).

## Senkron

`Görevlendirme/senkron.js`. Açılışta `git pull`; kod dosyaları değiştiyse uygulama
kendini yeniden başlatır. Veri her değişiklikten ~5 sn sonra ve çıkışta commit + push
edilir. Çakışmada çeken makine kazanır (`-X ours`).
