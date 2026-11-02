const $ = id => document.getElementById(id);
const panel = $("panel");
const ADLAR = { "Görevlendirme": "Görevlendirme'yi Aç", "Nöbet": "Nöbet'i Aç" };
let bilgi = null, yuzde = 0, hedef = 0, tavan = 0, calisiyor = false;

function goster(id) {
  for (const s of document.querySelectorAll(".gorunum")) s.hidden = s.id !== id;
}

function dugme(metin, birincil, f) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tk-btn" + (birincil ? " tk-btn-primary" : "");
  b.textContent = metin;
  b.addEventListener("click", f);
  return b;
}

function secim(araclar) {
  $("baslik").textContent = "Başlatıcı";
  $("altbaslik").textContent = "Sürüm " + bilgi.surum;
  const k = $("secimDugmeler");
  k.replaceChildren(...araclar.map((a, i) => dugme(ADLAR[a] || a, i === 0, () => window.kur.ac(a))));
  goster("vSecim");
  k.firstChild && k.firstChild.focus();
}

function gunlukSatir(s) {
  const ul = $("gunluk");
  const li = document.createElement("li");
  li.textContent = s;
  ul.append(li);
  while (ul.children.length > 9) ul.firstChild.remove();
}

function cerceve(zorla) {
  if (!zorla && !calisiyor && yuzde >= hedef) return;
  if (yuzde < hedef) yuzde = Math.min(hedef, yuzde + Math.max((hedef - yuzde) * 0.08, 0.2));
  else if (yuzde < tavan) yuzde += (tavan - yuzde) * 0.006;
  const y = Math.floor(yuzde);
  $("dolgu").style.width = yuzde + "%";
  $("yuzde").textContent = y + "%";
  $("cubuk").setAttribute("aria-valuenow", y);
}
setInterval(cerceve, 16);

function basla(yol, anahtar) {
  $("baslik").textContent = "Kurulum";
  $("altbaslik").textContent = bilgi.hedef;
  $("gunluk").replaceChildren();
  $("sonDugmeler").replaceChildren();
  yuzde = hedef = tavan = 0;
  calisiyor = true;
  panel.dataset.status = "running";
  $("pKapat").disabled = true;
  goster("vIs");
  window.kur.bagla(yol, anahtar);
}

window.kur.durum(d => {
  if (d.tur === "adim") {
    hedef = Math.max(hedef, d.yuzde);
    tavan = Math.max(tavan, d.tavan);
    $("adim").textContent = d.cumle;
    gunlukSatir(d.cumle);
  } else if (d.tur === "yuzde") {
    hedef = Math.max(hedef, Math.min(d.yuzde, tavan));
  } else if (d.tur === "bitti" || d.tur === "hata") {
    calisiyor = false;
    $("pKapat").disabled = false;
    const k = $("sonDugmeler");
    if (d.tur === "bitti") {
      hedef = yuzde = 100;
      cerceve(true);
      panel.dataset.status = "done";
      k.replaceChildren(...d.araclar.map((a, i) => dugme(ADLAR[a] || a, i === 0, () => window.kur.ac(a))), dugme("Kapat", false, () => window.kur.kapat()));
    } else {
      panel.dataset.status = "error";
      $("adim").textContent = "Kurulum tamamlanamadı";
      gunlukSatir(d.ileti);
      k.replaceChildren(dugme("Günlüğü Aç", true, () => window.kur.gunluk()), dugme("Yeniden Dene", false, () => baslangic()), dugme("Kapat", false, () => window.kur.kapat()));
    }
    k.firstChild.focus();
  }
});

async function baslangic() {
  panel.dataset.status = "idle";
  bilgi = await window.kur.ilk();
  if (bilgi.araclar.length) return secim(bilgi.araclar);
  $("baslik").textContent = "Kurulum";
  $("altbaslik").textContent = "Sürüm " + bilgi.surum;
  if (!bilgi.git) { goster("vGitYok"); $("gitIndir").focus(); return; }
  $("hedefNot").textContent = "Kurulacağı yer: " + bilgi.hedef;
  goster("vBagla");
  $("acikBagla").focus();
}

$("pKucult").addEventListener("click", () => window.kur.kucult());
$("pKapat").addEventListener("click", () => window.kur.kapat());
$("gitIndir").addEventListener("click", () => window.kur.gitIndir());
$("gitKapat").addEventListener("click", () => window.kur.kapat());
$("acikBagla").addEventListener("click", () => basla("acik"));
$("githubBagla").addEventListener("click", () => basla("github"));
$("anahtarBagla").addEventListener("click", async () => {
  const f = await window.kur.anahtarSec();
  if (f) basla("anahtar", f);
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && !calisiyor) window.kur.kapat(); });
baslangic();
