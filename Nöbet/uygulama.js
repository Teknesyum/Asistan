"use strict";

const $ = s => document.querySelector(s);
const el = (t, p) => Object.assign(document.createElement(t), p || {});

let TOASTT = null;
function toast(m) {
  const t = $("#toast");
  t.textContent = m;
  t.dataset.acik = "1";
  clearTimeout(TOASTT);
  TOASTT = setTimeout(() => { t.dataset.acik = "0"; }, 2600);
}

function kopyala(m) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(m).then(() => toast("Kopyalandı"), () => fallback(m));
  } else fallback(m);
}
function fallback(m) {
  const a = el("textarea", {value: m});
  document.body.appendChild(a); a.select();
  try { document.execCommand("copy"); toast("Kopyalandı"); } catch (e) { toast("Kopyalanamadı"); }
  a.remove();
}

/* ---------- depo ---------- */

const LSKEY = "asistan-nobet";
function ayAnahtar(y, a) { return LSKEY + ":" + y + "-" + String(a).padStart(2, "0"); }

const DEPO = (window.pencere && window.pencere.veri)
  ? {disk: true,
     oku: k => { try { return window.pencere.veri.oku(k); } catch (e) { return null; } },
     yaz: (k, m) => window.pencere.veri.yaz(k, m)}
  : {disk: false,
     oku: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
     yaz: (k, m) => { try { localStorage.setItem(k, m); } catch (e) {} }};

function bosVeri() {
  const d = new Date();
  return normalize({yil: d.getFullYear(), ay: d.getMonth() + 1, asistanlar: []});
}

function temiz(v) {
  const o = {};
  Object.keys(v).forEach(k => { if (k.charAt(0) !== "_") o[k] = v[k]; });
  o.asistanlar = v.asistanlar.map(k => {
    const x = {};
    Object.keys(k).forEach(a => { if (a.charAt(0) !== "_") x[a] = k[a]; });
    return x;
  });
  return o;
}

let V = null;
let TUR = 60000;

function sakla() {
  const m = JSON.stringify(temiz(V));
  DEPO.yaz(LSKEY, m);
  DEPO.yaz(ayAnahtar(V.yil, V.ay), m);
}

const ET = window.ETIKET || {};
(() => {
  const ad = ET["app.title"] || "";
  const i = ad.indexOf(" ");
  document.title = ad;
  const b = document.getElementById("basbarAd");
  b.textContent = i < 0 ? ad : ad.slice(0, i + 1);
  if (i >= 0) { const v = document.createElement("span"); v.className = "tk-titlebar__accent"; v.textContent = ad.slice(i + 1); b.append(v); }
  const bag = (id, metin, ipucu, adres) => {
    const e = document.getElementById(id);
    e.textContent = ET[metin] || "";
    e.title = ET[ipucu] || "";
    e.onclick = () => { if (window.pencere && window.pencere.ac) window.pencere.ac(adres); else window.open(adres, "_blank", "noopener"); };
  };
  bag("imza", "sig.brand", "sig.brandTitle", "https://github.com/Teknesyum");
  bag("destek", "sig.support", "sig.supportTitle", "https://github.com/sponsors/Teknesyum");
})();

/* ---------- ortak ---------- */

function kisaltAd(t) {
  const p = String(t || "").trim().split(/\s+/);
  if (!p[0]) return "";
  if (p.length < 2) return p[0];
  return p[0] + " " + p[1].charAt(0).toLocaleUpperCase("tr") + ".";
}

function basHarfler(t) {
  return String(t || "").trim().split(/\s+/).map(w => w.charAt(0).toLocaleUpperCase("tr")).join("");
}

function turListe() {
  const t = [];
  V.sutunlar.forEach(s => { if (t.indexOf(s.tur) < 0) t.push(s.tur); });
  return t;
}
function turAdi(t) { return t === "yb" ? "YBÜ Uzmanı" : "Ameliyathane Uzmanı"; }

function hucreAd(metin, tam) {
  const td = el("td");
  td.appendChild(el("span", {className: "hucre-ad", textContent: metin, title: tam || metin}));
  return td;
}

function sayiHucre(deger, sinif, baslik) {
  const td = el("td", {className: "sayi" + (sinif ? " " + sinif : ""), textContent: String(deger)});
  if (baslik) td.title = baslik;
  return td;
}

function bosDurum(bas, metin, dgmAd, dgmIs) {
  const d = el("div", {className: "bos-durum"});
  d.appendChild(el("div", {className: "bos-durum-bas", textContent: bas}));
  d.appendChild(el("div", {className: "bilgi", textContent: metin}));
  if (dgmAd) {
    const b = el("button", {className: "dgm dgm-birincil", type: "button", textContent: dgmAd});
    b.onclick = dgmIs;
    d.appendChild(b);
  }
  return d;
}

function olcu(ana, etiket, deger) {
  const r = el("div", {className: "olcu-satir"});
  r.appendChild(el("span", {className: "olcu-etiket", textContent: etiket}));
  r.appendChild(el("span", {className: "olcu-nokta"}));
  r.appendChild(el("span", {className: "olcu-deger", textContent: deger}));
  ana.appendChild(r);
  return r;
}

function tablo(basliklar) {
  const t = el("table", {className: "tbl tbl-gridline"});
  const th = el("tr");
  basliklar.forEach(x => {
    const h = el("th", {textContent: Array.isArray(x) ? x[0] : x});
    if (Array.isArray(x)) h.title = x[1];
    th.appendChild(h);
  });
  t.appendChild(el("thead")).appendChild(th);
  const tb = el("tbody");
  t.appendChild(tb);
  return {t: t, tb: tb};
}

let IPUCU_ACIK = null;

function ipucuKapat() {
  if (!IPUCU_ACIK) return;
  IPUCU_ACIK.kutu.hidden = true;
  IPUCU_ACIK.dgm.setAttribute("aria-expanded", "false");
  IPUCU_ACIK = null;
}

function ipucu(metin) {
  const sar = el("span", {className: "ipucu-sar"});
  const dgm = el("button", {type: "button", className: "tk-ipucu", textContent: "?"});
  dgm.setAttribute("aria-expanded", "false");
  dgm.setAttribute("aria-label", "Açıklama");
  const kutu = el("div", {className: "tk-ipucu-kutu", textContent: metin, hidden: true});
  dgm.onclick = e => {
    e.stopPropagation();
    const acikti = !kutu.hidden;
    ipucuKapat();
    if (!acikti) {
      kutu.hidden = false;
      dgm.setAttribute("aria-expanded", "true");
      IPUCU_ACIK = {kutu: kutu, dgm: dgm};
    }
  };
  sar.appendChild(dgm);
  sar.appendChild(kutu);
  return sar;
}

function uyariListesi() {
  const uy = el("div", {className: "uyari-liste"});
  uy.ekle = (metin, agir, is) => {
    const b = el("button", {type: "button", className: "uyari" + (agir ? " uyari-agir" : "")});
    b.appendChild(el("span", {className: "uyari-im", textContent: agir ? "!" : "•"}));
    b.appendChild(el("span", {textContent: metin}));
    b.onclick = is || (() => {});
    uy.appendChild(b);
  };
  return uy;
}

function gunListe(gunler) { return gunler.map(g => String(g)).join(", "); }

/* ---------- gezinme ---------- */

let EKRAN = "ana";
let SECILI_GUN = 1;
let VURGU = new Set();
let SECILI_KISI = null;

const DURUM_AD = {onayli: "Onaylı", taslak: "Taslak", sirada: "Sırada", bekliyor: "Bekliyor"};

function siradaki() {
  for (let i = 0; i < V.sutunlar.length; i++) if (!V.onay[V._sut[i]]) return i;
  return V.sutunlar.length;
}

function listeDolu(si) { return Object.keys(V.liste[V._sut[si]] || {}).length; }

function sutunDurumu(si) {
  if (V.onay[V._sut[si]]) return "onayli";
  if (si === siradaki()) return listeDolu(si) ? "taslak" : "sirada";
  return "bekliyor";
}

function sutunNo(id) {
  const m = /^s(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : -1;
}

function erisilir(id) {
  const si = sutunNo(id);
  return si < 0 || si <= siradaki();
}

function ekranlar() {
  return [["ana", "Ana Ekran", "⌂"], ["kadro", "Kadro", "·"]]
    .concat(V.sutunlar.map((s, i) => ["s" + i, s.ad, String(i + 1)]))
    .concat([["cikti", "Çıktı", "↗"]]);
}

function adimlar() {
  const n = $("#adimlar"); n.innerHTML = "";
  ekranlar().forEach(([id, ad, no]) => {
    const b = el("button", {className: "adim", type: "button"});
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", id === EKRAN ? "true" : "false");
    const si = sutunNo(id);
    if (si >= 0) b.dataset.durum = sutunDurumu(si);
    b.appendChild(el("span", {className: "adim-no", textContent: si >= 0 && V.onay[V._sut[si]] ? "✓" : no}));
    b.appendChild(el("span", {textContent: ad}));
    b.disabled = !erisilir(id);
    b.onclick = () => git(id);
    n.appendChild(b);
  });
}

function git(id) {
  if (!erisilir(id)) return;
  EKRAN = id;
  VURGU = new Set(); SECILI_KISI = null;
  ciz();
}

function ciz() {
  const si = sutunNo(EKRAN);
  $("#s-ana").hidden = EKRAN !== "ana";
  $("#s-kadro").hidden = EKRAN !== "kadro";
  $("#s-sutun").hidden = si < 0;
  $("#s-cikti").hidden = EKRAN !== "cikti";
  $("#basbarAy").textContent = AYLAR[V.ay - 1] + " " + V.yil;
  adimlar();
  if (EKRAN === "ana") ciz_ana();
  if (EKRAN === "kadro") ciz_kadro();
  if (si >= 0) ciz_sutun(si);
  if (EKRAN === "cikti") ciz_cikti();
}

function tazele() {
  hazirla(V);
  sakla();
  ciz();
}

/* ---------- ana ekran ---------- */

function sonrakiAdim() {
  if (!V._aktif.length) return ["kadro", "Kadroyu Hazırla"];
  const s = siradaki();
  if (s < V.sutunlar.length) return ["s" + s, (s + 1) + ". Sütun: " + V._sut[s]];
  return ["cikti", "Çıktıyı Al"];
}

function ayKaydir(d) {
  let y = V.yil, a = V.ay + d;
  if (a < 1) { a = 12; y--; }
  if (a > 12) { a = 1; y++; }
  ayYukle(y, a);
}

function kart(ana, no, bas, durum, satirlar, is, kapali) {
  const k = el("button", {type: "button", className: "kart"});
  if (durum) k.dataset.durum = durum;
  k.disabled = !!kapali;
  const ust = el("div", {className: "kart-ust"});
  ust.appendChild(el("span", {className: "kart-no", textContent: no}));
  if (durum) ust.appendChild(el("span", {className: "rozet-durum", textContent: DURUM_AD[durum]}));
  k.appendChild(ust);
  k.appendChild(el("div", {className: "kart-bas", textContent: bas}));
  satirlar.forEach(s => k.appendChild(el("div", {className: "kart-satir", textContent: s})));
  k.onclick = is;
  ana.appendChild(k);
}

function ciz_ana() {
  const ic = $("#anaIc"); ic.innerHTML = "";
  const kutu = el("div", {className: "ana"});

  const bas = el("div", {className: "ana-bas"});
  const geri = el("button", {type: "button", className: "dgm ana-ok", textContent: "‹", title: "Önceki ay"});
  geri.onclick = () => ayKaydir(-1);
  const ileri = el("button", {type: "button", className: "dgm ana-ok", textContent: "›", title: "Sonraki ay"});
  ileri.onclick = () => ayKaydir(1);
  bas.appendChild(geri);
  bas.appendChild(el("h1", {className: "ana-ay", textContent: AYLAR[V.ay - 1] + " " + V.yil}));
  bas.appendChild(ileri);
  const ay = el("input", {className: "gir gir-orta", type: "month", value: V.yil + "-" + String(V.ay).padStart(2, "0")});
  ay.setAttribute("aria-label", "Ay seç");
  ay.onchange = () => {
    const p = ay.value.split("-");
    if (p.length === 2) ayYukle(parseInt(p[0], 10), parseInt(p[1], 10));
  };
  bas.appendChild(ay);
  kutu.appendChild(bas);

  let kota = 0, istek = 0, izin = 0;
  V._aktif.forEach(k => { kota += k.kota; istek += k.istiyor.length + k.istemiyor.length; izin += k.izin.length; });
  const zorunlu = V.sutunlar.filter(s => !s.opsiyonel).length;
  kutu.appendChild(el("p", {className: "ana-alt", textContent:
    V._gun + " gün · " + V._aktif.length + " kişi · toplam kota " + kota + " · " +
    zorunlu + " zorunlu sütun (" + zorunlu * V._gun + " nöbet)" +
    (V.sutunlar.length > zorunlu ? " + " + (V.sutunlar.length - zorunlu) + " opsiyonel" : "") +
    " · nöbet başı ortalama " + V._H.toFixed(1).replace(".", ",") + " saat"}));

  const kartlar = el("div", {className: "ana-kartlar"});
  kart(kartlar, "Kadro", "Kişiler ve İstekler", null,
    [V._aktif.length + " kişi · kota " + kota, istek + " istek · " + izin + " izin günü",
     V._tatil.size ? "Tatil: " + gunListe(Array.from(V._tatil).sort((a, b) => a - b)) : "Resmî tatil yok"],
    () => git("kadro"));
  const d = durum(V);
  V.sutunlar.forEach((s, si) => {
    const dolu = listeDolu(si);
    let odunc = 0;
    d.kisiler.forEach(x => { odunc += x.odunc.filter(y => y[1] === si).length; });
    const sat = [dolu ? dolu + " / " + V._gun + " gün dolu" : (s.opsiyonel ? "Opsiyonel · boş kalabilir" : "Henüz oluşturulmadı")];
    if (dolu) sat.push(odunc ? odunc + " ödünç nöbet" : "Ödünç yok");
    sat.push(sutunTorba(V, si).length + " kişilik torba");
    kart(kartlar, (si + 1) + ". Sütun", s.ad, sutunDurumu(si), sat, () => git("s" + si), !erisilir("s" + si));
  });
  kart(kartlar, "Son", "Çıktı", null,
    [siradaki() >= V.sutunlar.length ? "Tüm sütunlar onaylı" : "Onaylananlar hazır", "Excel'e kopyala · CSV"],
    () => git("cikti"));
  kutu.appendChild(kartlar);

  const [hedef, ad] = sonrakiAdim();
  const devam = el("button", {type: "button", className: "dgm dgm-birincil dgm-buyuk", textContent: "Devam Et · " + ad});
  devam.onclick = () => git(hedef);
  kutu.appendChild(devam);
  ic.appendChild(kutu);
}

/* ---------- kadro ---------- */

function ciz_kadro() { ciz_asistan(); ciz_ay(); ciz_gun(); ciz_istek(); }

function ciz_asistan() {
  $("#kadroYardim").innerHTML = "";
  $("#kadroYardim").appendChild(ipucu(
    "Sıra kıdemdir: en üstteki en kıdemli. Kota o ay tutacağı nöbet sayısıdır; 0 ise kişi listeye girmez. " +
    "Nöbet yeri, kişinin girebileceği sütunların baş harfleridir. Rutin yeri YBÜ olanlar, sütun fark etmeksizin " +
    "aynı gün nöbet tutmamaya çalışır."));
  const ic = $("#asistanIc"); ic.innerHTML = "";
  const {t, tb} = tablo(["Sıra", "Asistan", "Kısa Ad", "Kota", "Nöbet Yeri", "Rutin", "Düzen"]);
  V.asistanlar.forEach((k, i) => {
    const tr = el("tr");
    tr.appendChild(sayiHucre(i + 1, "sayi-ikincil"));

    const tdAd = el("td", {className: "hucre-doldur"});
    const ad = el("input", {className: "gir gir-mini gir-sol", value: k.ad});
    ad.onchange = () => {
      const eski = k.ad, yeni = ad.value.trim();
      if (!yeni || V._kisi[yeni]) { ad.value = eski; return; }
      if (k.kisa === eski) k.kisa = yeni;
      k.ad = yeni;
      Object.keys(V.kilit).forEach(g => Object.keys(V.kilit[g]).forEach(x => {
        if (V.kilit[g][x] === eski) V.kilit[g][x] = yeni;
      }));
      Object.keys(V.liste).forEach(s => Object.keys(V.liste[s]).forEach(g => {
        if (V.liste[s][g] === eski) V.liste[s][g] = yeni;
      }));
      Object.keys(V.dagitim).forEach(s => {
        if (eski in V.dagitim[s]) { V.dagitim[s][yeni] = V.dagitim[s][eski]; delete V.dagitim[s][eski]; }
      });
      normalize(V); tazele();
    };
    tdAd.appendChild(ad); tr.appendChild(tdAd);

    const tdKisa = el("td", {className: "hucre-doldur"});
    const kisa = el("input", {className: "gir gir-mini", value: k.kisa});
    kisa.onchange = () => { k.kisa = kisa.value.trim() || k.ad; tazele(); };
    tdKisa.appendChild(kisa); tr.appendChild(tdKisa);

    const tdKota = el("td", {className: "hucre-doldur"});
    const kota = el("input", {className: "gir gir-mini", type: "number", min: "0", value: String(k.kota)});
    kota.onchange = () => { k.kota = Math.max(0, parseInt(kota.value, 10) || 0); tazele(); };
    tdKota.appendChild(kota); tr.appendChild(tdKota);

    const tdYer = el("td");
    const yer = el("div", {className: "rozet-grup"});
    V.sutunlar.forEach(s => {
      const b = el("button", {type: "button", className: "acma acma-rozet", textContent: basHarfler(s.ad), title: s.ad});
      b.setAttribute("aria-pressed", k.torba.indexOf(s.ad) >= 0 ? "true" : "false");
      b.onclick = () => {
        if (k.torba.indexOf(s.ad) < 0) k.torba.push(s.ad);
        else k.torba = k.torba.filter(y => y !== s.ad);
        tazele();
      };
      yer.appendChild(b);
    });
    tdYer.appendChild(yer); tr.appendChild(tdYer);

    const tdRutin = el("td");
    const rut = el("div", {className: "rozet-grup"});
    [["yb", "YBÜ"], ["amel", "Amel"]].forEach(([id, et]) => {
      const b = el("button", {type: "button", className: "acma acma-rozet", textContent: et,
        title: "Rutin yeri: " + (id === "yb" ? "Yoğun bakım" : "Ameliyathane")});
      b.setAttribute("aria-pressed", k.rutin === id ? "true" : "false");
      b.onclick = () => { k.rutin = k.rutin === id ? "" : id; tazele(); };
      rut.appendChild(b);
    });
    tdRutin.appendChild(rut); tr.appendChild(tdRutin);

    const tdD = el("td");
    const d = el("div", {className: "duzen-grup"});
    const yuk = el("button", {className: "dgm dgm-mini", type: "button", textContent: "↑", title: "Kıdemde yükselt"});
    yuk.onclick = () => { if (i > 0) { const q = V.asistanlar; q.splice(i - 1, 0, q.splice(i, 1)[0]); normalize(V); tazele(); } };
    const asa = el("button", {className: "dgm dgm-mini", type: "button", textContent: "↓", title: "Kıdemde indir"});
    asa.onclick = () => { const q = V.asistanlar; if (i < q.length - 1) { q.splice(i + 1, 0, q.splice(i, 1)[0]); normalize(V); tazele(); } };
    const sil = el("button", {className: "dgm dgm-mini", type: "button", textContent: "×", title: "Listeden çıkar"});
    sil.onclick = () => { V.asistanlar.splice(i, 1); normalize(V); tazele(); };
    d.appendChild(yuk); d.appendChild(asa); d.appendChild(sil);
    tdD.appendChild(d); tr.appendChild(tdD);
    tb.appendChild(tr);
  });
  ic.appendChild(t);

  const ekle = $("#kadroEkle"); ekle.innerHTML = "";
  const yeni = el("input", {className: "gir gir-orta gir-sol", placeholder: "Yeni asistan adı"});
  const bd = el("button", {className: "dgm", type: "button", textContent: "Ekle"});
  bd.onclick = () => {
    const ad = yeni.value.trim();
    if (!ad || V._kisi[ad]) return;
    V.asistanlar.push({ad: ad, kisa: ad, torba: V._sut.slice(), kota: 0, rutin: "",
      izin: [], istiyor: [], istemiyor: []});
    normalize(V); tazele();
  };
  ekle.appendChild(yeni); ekle.appendChild(bd);
}

function uzmanKisa(g) {
  return turListe().map(t => kisaltAd(uzmanOGun(V, g, t) || "")).filter(x => x).join(" · ");
}

function ciz_ay() {
  $("#ayYardim").innerHTML = "";
  $("#ayYardim").appendChild(ipucu(
    "Bir güne tıkla: sağda o günün resmî tatil durumu ve nöbetçi uzmanları açılır. " +
    "Sarı gün numarası hafta sonunu, mor numara resmî tatili gösterir. Resmî tatil 24 saat sayılır."));
  const ic = $("#ayIc"); ic.innerHTML = "";
  const iz = el("div", {className: "ay-izgara"});
  GUNADI.forEach(a => iz.appendChild(el("div", {className: "ay-bas", textContent: a})));
  for (let b = 0; b < V._hg[1]; b++) {
    const d = el("div", {className: "ay-hucre ay-bosluk"});
    d.setAttribute("aria-hidden", "true");
    iz.appendChild(d);
  }
  for (let g = 1; g <= V._gun; g++) {
    const h = el("button", {type: "button", className: "ay-hucre"
      + (V._hs[g] ? " ay-hs" : "") + (V._tatil.has(g) ? " ay-tatil" : "")
      + (g === SECILI_GUN ? " ay-secili" : ""), title: tarihUzun(V, g)});
    h.appendChild(el("span", {className: "ay-no", textContent: String(g)}));
    const u = uzmanKisa(g);
    if (u) h.appendChild(el("span", {className: "ay-not", textContent: u}));
    if (V._tatil.has(g)) h.appendChild(el("span", {className: "ay-im", textContent: "tatil"}));
    h.onclick = () => { SECILI_GUN = g; ciz_ay(); ciz_gun(); };
    iz.appendChild(h);
  }
  ic.appendChild(iz);
}

function ciz_gun() {
  const g = SECILI_GUN;
  $("#gunBas").textContent = tarihUzun(V, g);
  const ic = $("#gunIc"); ic.innerHTML = "";
  const p = el("div", {className: "gun-panel"});

  const tatil = el("button", {type: "button", className: "acma", textContent: "Resmî tatil"});
  tatil.setAttribute("aria-pressed", V._tatil.has(g) ? "true" : "false");
  tatil.onclick = () => {
    const s = new Set(gunlerAc(V.tatil));
    if (s.has(g)) s.delete(g); else s.add(g);
    V.tatil = Array.from(s).sort((a, b) => a - b);
    normalize(V); tazele();
  };
  p.appendChild(tatil);
  olcu(p, "Ücret", V._saat[g] + " saat");

  const liste = el("datalist", {id: "uzmanAdlari"});
  const gorulen = [];
  for (let x = 1; x <= V._gun; x++) turListe().forEach(t => {
    const u = uzmanOGun(V, x, t);
    if (u && gorulen.indexOf(u) < 0) { gorulen.push(u); liste.appendChild(el("option", {value: u})); }
  });
  p.appendChild(liste);

  turListe().forEach(t => {
    const alan = el("div", {className: "gun-alan"});
    alan.appendChild(el("span", {className: "gun-alan-bas", textContent: turAdi(t)}));
    const inp = el("input", {className: "gir gir-mini", value: uzmanOGun(V, g, t) || ""});
    inp.setAttribute("list", "uzmanAdlari");
    inp.onchange = () => {
      if (!V.uzman[String(g)]) V.uzman[String(g)] = {};
      const x = inp.value.trim();
      if (x) V.uzman[String(g)][t] = x; else delete V.uzman[String(g)][t];
      sakla(); ciz_ay();
    };
    alan.appendChild(inp);
    p.appendChild(alan);
  });

  const alan = el("div", {className: "gun-alan"});
  alan.appendChild(el("span", {className: "gun-alan-bas", textContent: "Bu günün nöbetçileri"}));
  V.sutunlar.forEach(s => {
    const ad = (V.liste[s.ad] || {})[String(g)];
    olcu(alan, s.ad, ad && V._kisi[ad] ? V._kisi[ad].kisa : "—");
  });
  p.appendChild(alan);
  ic.appendChild(p);
}

function gunDurum(k, g) {
  if (k.izin.indexOf(g) >= 0) return "izin";
  if (k.istiyor.indexOf(g) >= 0) return "istiyor";
  if (k.istemiyor.indexOf(g) >= 0) return "istemiyor";
  return "";
}

function gunAyar(k, g, d) {
  k.izin = k.izin.filter(x => x !== g);
  k.istiyor = k.istiyor.filter(x => x !== g);
  k.istemiyor = k.istemiyor.filter(x => x !== g);
  if (d === "izin") k.izin.push(g);
  if (d === "istiyor") k.istiyor.push(g);
  if (d === "istemiyor") k.istemiyor.push(g);
}

const DONGU = ["", "izin", "istiyor", "istemiyor"];
const DURUM_ETIKET = {izin: "İ", istiyor: "+", istemiyor: "−"};

function haftalarAy(v) {
  const h = [];
  for (let g = 1; g <= v._gun; g++) {
    if (!h.length || v._hg[g] === 0) h.push([]);
    h[h.length - 1].push(g);
  }
  return h;
}

function ciz_istek() {
  $("#istekYardim").innerHTML = "";
  $("#istekYardim").appendChild(ipucu(
    "Bir hücreye tıkladıkça sırayla: İ izin, + istiyor, − istemiyor, boş. Shift ile tıklamak o haftanın tamamını izinli yapar. " +
    "N, o gün listede nöbeti olduğunu gösterir. Az istek belirten kişi isteksizlik bonusu alır."));
  const ic = $("#istekIc"); ic.innerHTML = "";
  const haftalar = haftalarAy(V);
  const d = durum(V);
  const nobet = {};
  d.kisiler.forEach(x => { nobet[x.ad] = x.gunler; });
  const {t, tb} = tablo(["Asistan"]);
  const th = t.querySelector("thead tr");
  for (let g = 1; g <= V._gun; g++) {
    th.appendChild(el("th", {className: "mat-gun-bas" + (V._hs[g] ? " mat-hs" : ""),
      textContent: String(g), title: tarihUzun(V, g)}));
  }
  th.appendChild(el("th", {textContent: "İzin / + / −", title: "izin / istiyor / istemiyor"}));
  V.asistanlar.forEach(k => {
    const tr = el("tr");
    tr.appendChild(hucreAd(k.kisa, k.ad));
    const n = nobet[k.ad] || new Set();
    for (let g = 1; g <= V._gun; g++) {
      const dr = gunDurum(k, g);
      const td = el("td", {className: "mat-td"});
      const b = el("button", {type: "button",
        className: "mat-hucre" + (dr ? " gd-" + dr : " mat-bos") + (n.has(g) ? " mat-nobet" : ""),
        textContent: n.has(g) ? "N" : (dr ? DURUM_ETIKET[dr] : "·"),
        title: k.kisa + " · " + tarihUzun(V, g)});
      b.onclick = e => {
        if (e.shiftKey) {
          const h = haftalar.filter(x => x.indexOf(g) >= 0)[0] || [g];
          const hepsi = h.every(x => k.izin.indexOf(x) >= 0);
          h.forEach(x => gunAyar(k, x, hepsi ? "" : "izin"));
        } else {
          gunAyar(k, g, DONGU[(DONGU.indexOf(dr) + 1) % DONGU.length]);
        }
        tazele();
      };
      td.appendChild(b);
      tr.appendChild(td);
    }
    tr.appendChild(el("td", {className: "sayi sayi-ikincil",
      textContent: k.izin.length + " / " + k.istiyor.length + " / " + k.istemiyor.length}));
    tb.appendChild(tr);
  });
  ic.appendChild(t);
}

/* ---------- sütun sihirbazı ---------- */

function havuzAdlari(si) {
  if (si + 1 >= V.sutunlar.length) return [];
  const kendi = sutunTorba(V, si);
  return sutunTorba(V, si + 1).filter(ad => kendi.indexOf(ad) < 0)
    .sort((a, b) => V._kisi[b]._kidem - V._kisi[a]._kidem);
}

function sutunOlustur(si) {
  const ad = V._sut[si];
  if (listeDolu(si)) V.tohum[ad] = (V.tohum[ad] || 1) + 1;
  const t0 = Date.now();
  const r = sutunKur(V, si, V.tohum[ad] || 1, TUR);
  V.liste[ad] = r.atama;
  VURGU = new Set(); SECILI_KISI = null;
  sakla(); ciz();
  const not = [];
  if (r.bos.length) not.push(r.bos.length + " gün boş");
  if (r.odunc.length) not.push(r.odunc.length + " ödünç");
  toast("Liste hazır" + (not.length ? " · " + not.join(" · ") : "") + " · " + ((Date.now() - t0) / 1000).toFixed(1) + " sn");
}

function sonrakileriTemizle(si) {
  for (let j = si + 1; j < V.sutunlar.length; j++) {
    const ad = V._sut[j];
    delete V.liste[ad]; delete V.onay[ad]; delete V.dagitim[ad];
  }
}

function sutunOnayla(si) {
  V.onay[V._sut[si]] = true;
  sonrakileriTemizle(si);
  sakla();
  if (si + 1 < V.sutunlar.length) git("s" + (si + 1)); else git("cikti");
  toast((si + 1) + ". sütun onaylandı");
}

function sutunGeriAl(si) {
  const etkilenen = [];
  for (let j = si + 1; j < V.sutunlar.length; j++) if (listeDolu(j)) etkilenen.push(V._sut[j]);
  if (etkilenen.length && !confirm("Onay kaldırılırsa sonraki sütunların listesi silinir: " + etkilenen.join(", ") + ". Devam edilsin mi?")) return;
  delete V.onay[V._sut[si]];
  sonrakileriTemizle(si);
  sakla(); ciz();
}

function ciz_sutun(si) {
  const sut = V.sutunlar[si], ad = sut.ad, dr = sutunDurumu(si), onayli = dr === "onayli";
  const ust = $("#sutunUst"); ust.innerHTML = "";
  ust.appendChild(el("h2", {className: "sutun-bas", textContent: (si + 1) + " · " + ad}));
  const rz = el("span", {className: "rozet-durum", textContent: DURUM_AD[dr]});
  rz.dataset.durum = dr;
  ust.appendChild(rz);
  if (sut.opsiyonel) ust.appendChild(el("span", {className: "bilgi", textContent: "Opsiyonel: kota yetmezse boş kalır"}));
  ust.appendChild(el("span", {className: "bosluk"}));
  if (si > 0) {
    const g = el("button", {type: "button", className: "dgm", textContent: "← " + si + ". Sütun"});
    g.onclick = () => git("s" + (si - 1));
    ust.appendChild(g);
  }
  if (onayli) {
    const b = el("button", {type: "button", className: "dgm", textContent: "Onayı Kaldır"});
    b.onclick = () => sutunGeriAl(si);
    ust.appendChild(b);
    const s = el("button", {type: "button", className: "dgm dgm-birincil",
      textContent: si + 1 < V.sutunlar.length ? (si + 2) + ". Sütuna Geç →" : "Çıktıya Geç →"});
    s.onclick = () => git(si + 1 < V.sutunlar.length ? "s" + (si + 1) : "cikti");
    ust.appendChild(s);
  } else {
    const o = el("button", {type: "button", className: listeDolu(si) ? "dgm" : "dgm dgm-birincil",
      textContent: listeDolu(si) ? "Yeniden Oluştur" : "Listeyi Oluştur"});
    o.onclick = () => { o.disabled = true; toast("Oluşturuluyor…"); setTimeout(() => sutunOlustur(si), 30); };
    ust.appendChild(o);
    const k = el("button", {type: "button", className: "dgm dgm-birincil", textContent: "Onayla ve Devam Et →"});
    k.disabled = !listeDolu(si);
    k.onclick = () => sutunOnayla(si);
    ust.appendChild(k);
  }
  ciz_ayar(si, onayli);
  ciz_sliste(si, onayli);
  ciz_sdenge(si);
}

function ciz_ayar(si, onayli) {
  const ad = V._sut[si];
  const bas = $("#ayarBas"); bas.innerHTML = "";
  bas.appendChild(el("span", {textContent: "Ayarlar"}));
  bas.appendChild(el("span", {className: "bosluk"}));
  bas.appendChild(ipucu(
    "\"Bu sütunda\" kişinin bu sütunda tutacağı nöbet sayısıdır; kalan kotası sonraki sütunlara kalır. " +
    "Otomatik dağıtım, birden çok sütuna girebilen kişilerin kotasını açığı büyük olan sütuna verir. " +
    "Uygun gün, izni ve önceki sütunlardaki nöbetleri çıkınca kalan gün sayısıdır."));
  const ic = $("#ayarIc"); ic.innerHTML = "";
  const p = el("div", {className: "ayar-ic"});

  const kalan = kalanKota(V, si), dag = dagitimAl(V, si), oto = otomatikDagitim(V, si);
  const ts = tumSlotlar(V, si), sabit = {};
  Object.keys(ts).forEach(a => { sabit[a] = new Set(ts[a].map(s => s[0])); });
  const kendi = sutunTorba(V, si);
  const {t, tb} = tablo(["Kişi", ["Kalan", "Kalan kota"], ["Bu Sütunda", "Bu sütunda tutacağı nöbet"], ["Uygun", "Uygun gün"]]);
  let top = 0;
  kendi.forEach(a => {
    const k = V._kisi[a];
    const tr = el("tr");
    tr.appendChild(hucreAd(k.kisa, k.ad));
    tr.appendChild(sayiHucre(kalan[a], "sayi-ikincil"));
    const td = el("td", {className: "hucre-doldur"});
    const inp = el("input", {className: "gir gir-mini", type: "number", min: "0", max: String(kalan[a]), value: String(dag[a])});
    inp.disabled = onayli;
    if (dag[a] !== oto[a]) td.className = "hucre-doldur zorla-hucre";
    inp.onchange = () => {
      const x = Math.max(0, Math.min(kalan[a], parseInt(inp.value, 10) || 0));
      if (!V.dagitim[ad]) V.dagitim[ad] = {};
      if (x === oto[a]) delete V.dagitim[ad][a]; else V.dagitim[ad][a] = x;
      sakla(); ciz_ayar(si, onayli);
    };
    td.appendChild(inp); tr.appendChild(td);
    let uy = 0;
    const s = sabit[a] || new Set();
    for (let g = 1; g <= V._gun; g++) if (!V._izin[a].has(g) && !s.has(g - 1) && !s.has(g) && !s.has(g + 1)) uy++;
    tr.appendChild(sayiHucre(uy, uy < dag[a] * 2 ? "sayi-sinir" : "sayi-ikincil"));
    top += dag[a];
    tb.appendChild(tr);
  });
  const tr = el("tr", {className: "toplam-satir"});
  tr.appendChild(hucreAd("Toplam"));
  tr.appendChild(sayiHucre("—"));
  tr.appendChild(sayiHucre(top + " / " + V._gun, top < V._gun && !V.sutunlar[si].opsiyonel ? "sayi-ihlal" : ""));
  tr.appendChild(sayiHucre(""));
  tb.appendChild(tr);
  p.appendChild(t);

  const sat = el("div", {className: "satir"});
  const od = el("button", {type: "button", className: "dgm dgm-mini", textContent: "Otomatik Dağıt"});
  od.disabled = onayli || !Object.keys(V.dagitim[ad] || {}).length;
  od.onclick = () => { delete V.dagitim[ad]; sakla(); ciz_ayar(si, onayli); };
  sat.appendChild(od);
  p.appendChild(sat);

  const hv = havuzAdlari(si);
  p.appendChild(el("div", {className: "blok-bas", textContent: "Boş kalırsa ödünç sırası"}));
  p.appendChild(el("div", {className: "bilgi", textContent: hv.length
    ? V._sut[si + 1] + ": " + hv.map(a => V._kisi[a].kisa + " (" + kalan[a] + ")").join(" → ")
    : (si + 1 < V.sutunlar.length ? "Sonraki sütunda ödünç verecek kimse yok." : "Son sütun: boş günler boş kalır.")}));

  const kb = el("div", {className: "blok-bas blok-bas-ipucu"});
  kb.appendChild(el("span", {textContent: "Kurallar"}));
  kb.appendChild(el("span", {className: "bosluk"}));
  kb.appendChild(ipucu("Büyük değer o kurala daha çok önem verir. Kota, izin, nöbet ertesi boş gün ve aynı gün iki sütun " +
    "katıdır, ağırlıkla delinmez. Ağırlıklar bütün sütunlar için ortaktır."));
  p.appendChild(kb);
  Object.keys(VARSAYILAN_AGIRLIK).forEach(a => {
    const r = el("div", {className: "ayar-satir"});
    const et = el("span", {className: "ayar-etiket", title: AGIRLIK_ACIKLAMA[a] || ""});
    et.appendChild(el("span", {textContent: AGIRLIK_ETIKET[a] || a}));
    et.appendChild(el("span", {className: "ayar-nokta"}));
    r.appendChild(et);
    const inp = el("input", {className: "gir gir-mini", type: "number", step: a.indexOf("bonus") >= 0 ? "0.01" : "1",
      value: String(V.agirlik[a])});
    inp.setAttribute("aria-label", AGIRLIK_ETIKET[a] || a);
    inp.disabled = onayli;
    inp.onchange = () => {
      const x = parseFloat(inp.value);
      V.agirlik[a] = isNaN(x) ? VARSAYILAN_AGIRLIK[a] : x;
      tazele();
    };
    r.appendChild(inp);
    const vr = el("button", {type: "button", className: "ayar-sifirla", textContent: "↺",
      title: "Varsayılana dön (" + VARSAYILAN_AGIRLIK[a] + ")"});
    vr.disabled = onayli || V.agirlik[a] === VARSAYILAN_AGIRLIK[a];
    vr.onclick = () => { V.agirlik[a] = VARSAYILAN_AGIRLIK[a]; tazele(); };
    r.appendChild(vr);
    p.appendChild(r);
  });
  ic.appendChild(p);
}

let SURUKLE = null;

function hucreKilit(ad, g, kisi) {
  const k = String(g);
  if (kisi) {
    if (!V.kilit[k]) V.kilit[k] = {};
    V.kilit[k][ad] = kisi;
  } else if (V.kilit[k]) {
    delete V.kilit[k][ad];
    if (!Object.keys(V.kilit[k]).length) delete V.kilit[k];
  }
}

function hucreYaz(sutAd, g, kisi) {
  if (!V.liste[sutAd]) V.liste[sutAd] = {};
  if (kisi) V.liste[sutAd][String(g)] = kisi; else delete V.liste[sutAd][String(g)];
  hucreKilit(sutAd, g, kisi);
}

function birak(sutAd, g) {
  const s = SURUKLE; SURUKLE = null;
  if (!s) return;
  const eski = (V.liste[sutAd] || {})[String(g)] || "";
  if (s.sut === sutAd && s.g === g) return;
  if (s.sut) hucreYaz(s.sut, s.g, eski && eski !== s.ad ? eski : "");
  hucreYaz(sutAd, g, s.ad);
  sakla(); ciz();
}

function surukleKur(td, sutAd, g, ad) {
  if (ad) {
    td.draggable = true;
    td.addEventListener("dragstart", e => {
      SURUKLE = {ad: ad, sut: sutAd, g: g};
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", ad);
    });
    td.addEventListener("dragend", () => { SURUKLE = null; });
  }
  td.addEventListener("dragover", e => {
    if (!SURUKLE) return;
    e.preventDefault();
    td.classList.add("surukle-uzeri");
  });
  td.addEventListener("dragleave", () => td.classList.remove("surukle-uzeri"));
  td.addEventListener("drop", e => {
    e.preventDefault();
    td.classList.remove("surukle-uzeri");
    birak(sutAd, g);
  });
}

function ciz_sliste(si, onayli) {
  const ic = $("#sListeIc"); ic.innerHTML = "";
  const sutAd = V._sut[si];
  const basliklar = ["Tarih", "Gün"].concat(V.sutunlar.map((s, i) => [(i + 1) + " · " + basHarfler(s.ad), s.ad]));
  const {t, tb} = tablo(basliklar);
  Array.prototype.forEach.call(t.querySelectorAll("thead th"), (h, i) => {
    if (i - 2 === si) h.className = "kol-aktif";
  });
  const secenek = sutunTorba(V, si).concat(havuzAdlari(si));
  const kendi = new Set(sutunTorba(V, si));
  for (let g = 1; g <= V._gun; g++) {
    const tr = el("tr");
    let sinif = V._hs[g] ? "hafta-sonu" : "";
    if (V._tatil.has(g)) sinif = "tatil-satir";
    if (VURGU.has(g)) sinif += " secili";
    if (sinif) tr.className = sinif;
    tr.appendChild(el("td", {className: "tarih-hucre", textContent: tarihStr(V, g), title: tarihUzun(V, g)}));
    tr.appendChild(el("td", {className: "gun-hucre", textContent: GUNADI[V._hg[g]] + (V._tatil.has(g) ? " · tatil" : "")}));
    V.sutunlar.forEach((s, j) => {
      const atanan = (V.liste[s.ad] || {})[String(g)];
      if (j !== si || onayli) {
        const td = hucreAd(atanan && V._kisi[atanan] ? V._kisi[atanan].kisa : (j > si ? "" : "—"),
          atanan || "");
        if (j === si) td.classList.add("kol-aktif");
        if (j > si) td.classList.add("kol-sonra");
        if (atanan && V._kisi[atanan] && V._kisi[atanan].torba.indexOf(s.ad) < 0) td.classList.add("hucre-odunc");
        if (atanan && atanan === SECILI_KISI) td.classList.add("hucre-secili");
        surukleKur(td, s.ad, g, atanan && V._kisi[atanan] ? atanan : "");
        tr.appendChild(td);
        return;
      }
      const td = el("td", {className: "hucre-doldur kol-aktif"});
      const kilit = (V.kilit[String(g)] || {})[sutAd];
      const sel = el("select", {className: "gir gir-mini"});
      sel.appendChild(el("option", {value: "", textContent: atanan && V._kisi[atanan] ? V._kisi[atanan].kisa : "— boş —"}));
      secenek.forEach(a => sel.appendChild(el("option", {value: a,
        textContent: V._kisi[a].kisa + (kendi.has(a) ? "" : " (ödünç)") + " · sabit"})));
      sel.value = kilit && V._kisi[kilit] ? kilit : "";
      if (sel.value) td.classList.add("zorla-hucre");
      if (atanan && !kendi.has(atanan)) td.classList.add("hucre-odunc");
      if (atanan && atanan === SECILI_KISI) td.classList.add("hucre-secili");
      sel.title = "Sabitlenen kişi yeniden oluşturmada yerinde kalır";
      sel.onchange = () => {
        if (!V.kilit[String(g)]) V.kilit[String(g)] = {};
        if (sel.value) {
          V.kilit[String(g)][sutAd] = sel.value;
          if (!V.liste[sutAd]) V.liste[sutAd] = {};
          V.liste[sutAd][String(g)] = sel.value;
        } else {
          delete V.kilit[String(g)][sutAd];
          if (!Object.keys(V.kilit[String(g)]).length) delete V.kilit[String(g)];
        }
        sakla(); ciz();
      };
      td.appendChild(sel);
      surukleKur(td, sutAd, g, atanan && V._kisi[atanan] ? atanan : "");
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  }
  ic.appendChild(t);
}

function kisiSec(ad) {
  if (SECILI_KISI === ad) { SECILI_KISI = null; VURGU = new Set(); }
  else {
    SECILI_KISI = ad;
    const x = durum(V).kisiler.filter(k => k.ad === ad)[0];
    VURGU = x ? new Set(x.gunler) : new Set();
  }
  ciz();
}

function gunVurgula(gunler) { SECILI_KISI = null; VURGU = new Set(gunler); ciz(); }

function ciz_sdenge(si) {
  const sutAd = V._sut[si];
  const bas = $("#sDengeBas"); bas.innerHTML = "";
  bas.appendChild(el("span", {textContent: "Denge"}));
  bas.appendChild(el("span", {className: "bosluk"}));
  bas.appendChild(ipucu(
    "Gün grubu hücreleri tutulan / hedef nöbettir; hedef kişinin nöbet sayısıyla orantılıdır, kıdem bonusu kıdemliye hafta sonunu " +
    "biraz azaltır. Çarşamba dengelenmez. Ücret, nöbet başına saatin ay ortalamasına oranıdır: herkes 100'e yakın olmalı. " +
    "Satıra tıklamak o kişinin günlerini listede işaretler."));
  const ic = $("#sDengeIc"); ic.innerHTML = "";
  const d = durum(V);
  const l = V.liste[sutAd] || {};
  const burada = new Set(sutunTorba(V, si));
  Object.keys(l).forEach(g => { if (V._kisi[l[g]]) burada.add(l[g]); });
  const kisiler = d.kisiler.filter(x => burada.has(x.ad)).sort((a, b) => a.kidem - b.kidem);

  if (!listeDolu(si)) {
    ic.appendChild(bosDurum("Liste yok", "Soldaki ayarlara bak, sonra listeyi oluştur.", "Listeyi Oluştur",
      () => sutunOlustur(si)));
    return;
  }

  const {t, tb} = tablo(["Kişi", ["Nöbet", "Bu sütun / toplam / kota"]].concat(GRUP_ADI)
    .concat([["Çar", "Çarşamba (dengelenmez)"], "Saat", ["Ücret", "Nöbet başı saat / ay ortalaması"],
      ["İstek", "Tutulan istek + / istemediği gün −"], ["Aşırı", "Gün aşırı sayısı (1-3-5 zinciri kırmızı)"]]));
  kisiler.forEach(x => {
    const tr = el("tr");
    if (x.ad === SECILI_KISI) tr.className = "secili";
    const bu = x.slot.filter(s => s[1] === si).length;
    const adH = hucreAd(x.kisa + (V._kisi[x.ad].rutin === "yb" ? " · YBÜ" : ""), x.ad);
    if (!V._kisi[x.ad].torba.includes(sutAd)) adH.classList.add("hucre-odunc");
    tr.appendChild(adH);
    tr.appendChild(sayiHucre(bu + " / " + x.nobet + " / " + x.kota, x.nobet > x.kota ? "sayi-ihlal" : ""));
    x.grup.forEach((c, i) => {
      const f = c - x.hedef[i];
      tr.appendChild(sayiHucre(c, Math.abs(f) > 1 ? "sayi-sinir" : "", "hedef " + x.hedef[i].toFixed(1)));
    });
    tr.appendChild(sayiHucre(x.car, "sayi-ikincil"));
    tr.appendChild(sayiHucre(x.saat));
    const e = Math.round(x.endeks * 100);
    tr.appendChild(sayiHucre(x.nobet ? e : "—", Math.abs(e - 100) > 12 && x.nobet ? "sayi-sinir" : ""));
    tr.appendChild(sayiHucre("+" + x.istedigi.length + " −" + x.istemedigi.length, x.istemedigi.length ? "sayi-ihlal" : ""));
    tr.appendChild(sayiHucre(x.cift.length, x.zincir.length ? "sayi-ihlal" : (x.cift.length ? "sayi-sinir" : "")));
    tr.onclick = () => kisiSec(x.ad);
    tr.draggable = true;
    tr.title = "Listede bir güne sürükle";
    tr.addEventListener("dragstart", e => {
      SURUKLE = {ad: x.ad, sut: "", g: 0};
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", x.ad);
    });
    tr.addEventListener("dragend", () => { SURUKLE = null; });
    tb.appendChild(tr);
  });
  ic.appendChild(t);
  ic.ondragover = e => { if (SURUKLE && SURUKLE.sut) e.preventDefault(); };
  ic.ondrop = e => {
    const s = SURUKLE; SURUKLE = null;
    if (!s || !s.sut) return;
    e.preventDefault();
    hucreYaz(s.sut, s.g, "");
    sakla(); ciz();
  };

  const p = el("div", {className: "durum-ic"});
  const uy = uyariListesi();
  const bos = d.bos[sutAd] || [];
  if (bos.length) uy.ekle("Boş gün: " + gunListe(bos), !V.sutunlar[si].opsiyonel, () => gunVurgula(bos));
  kisiler.forEach(x => {
    const od = x.odunc.filter(s => s[1] === si).map(s => s[0]);
    if (od.length) uy.ekle(x.kisa + " ödünç geldi: " + gunListe(od), false, () => kisiSec(x.ad));
  });
  d.kisiler.forEach(x => {
    if (x.bitisik.length) uy.ekle(x.kisa + " · art arda gün: " + gunListe(x.bitisik), true, () => kisiSec(x.ad));
    if (x.cokGun) uy.ekle(x.kisa + " · aynı gün iki sütunda", true, () => kisiSec(x.ad));
    if (x.izinde.length) uy.ekle(x.kisa + " · izinli olduğu gün: " + gunListe(x.izinde), true, () => kisiSec(x.ad));
    if (x.nobet > x.kota) uy.ekle(x.kisa + " · kotayı " + (x.nobet - x.kota) + " aştı", true, () => kisiSec(x.ad));
  });
  kisiler.forEach(x => {
    if (x.zincir.length) uy.ekle(x.kisa + " · üç gün aşırı: " + x.zincir.map(g => g + "-" + (g + 2) + "-" + (g + 4)).join(", "),
      false, () => kisiSec(x.ad));
    if (x.istemedigi.length) uy.ekle(x.kisa + " · istemediği gün: " + gunListe(x.istemedigi), true, () => kisiSec(x.ad));
  });
  d.ybGun.forEach(y => {
    if (!y.adlar.some(a => burada.has(a) && (l[String(y.g)] === a))) return;
    uy.ekle(y.g + ". gün rutini YBÜ olan " + y.adlar.length + " kişi: " + y.adlar.map(a => V._kisi[a].kisa).join(", "),
      false, () => gunVurgula([y.g]));
  });
  if (!uy.children.length) p.appendChild(el("div", {className: "bilgi", textContent: "Uyarı yok."}));
  p.appendChild(uy);
  ic.appendChild(p);
}

/* ---------- çıktı ---------- */

function ciktiSatirlar() {
  const turler = turListe();
  const bas = ["Tarih", "Gün"].concat(turler.map(turAdi)).concat(V._sut);
  const sat = [bas];
  for (let g = 1; g <= V._gun; g++) {
    const r = [tarihStr(V, g), GUNTAM[V._hg[g]]];
    turler.forEach(t => r.push(uzmanOGun(V, g, t) || ""));
    V.sutunlar.forEach(s => {
      const ad = (V.liste[s.ad] || {})[String(g)];
      r.push(ad && V._kisi[ad] ? V._kisi[ad].ad : "");
    });
    sat.push(r);
  }
  return sat;
}

function tsvMetin() {
  return ciktiSatirlar().map(r => r.map(h => h.replace(/[\t\r\n]/g, " ")).join("\t")).join("\r\n");
}

function csvMetin() {
  return "﻿" + ciktiSatirlar().map(r => r.join(";")).join("\r\n");
}

function ciz_cikti() {
  const ic = $("#ciktiIc"); ic.innerHTML = "";
  const hic = V.sutunlar.every((s, i) => !listeDolu(i));
  if (hic) {
    ic.appendChild(bosDurum("Çıktı yok", "Önce 1. sütunu oluştur ve onayla.", "1. Sütuna Git", () => git("s0")));
    $("#ucretIc").innerHTML = "";
    return;
  }
  const sat = ciktiSatirlar();
  const turler = turListe();
  const {t, tb} = tablo(sat[0]);
  sat.slice(1).forEach((r, i) => {
    const g = i + 1;
    const tr = el("tr");
    if (V._tatil.has(g)) tr.className = "tatil-satir";
    else if (V._hs[g]) tr.className = "hafta-sonu";
    r.forEach((x, j) => {
      if (j < 2) tr.appendChild(el("td", {className: "tarih-hucre", textContent: x}));
      else if (j < 2 + turler.length) tr.appendChild(hucreAd(x || "—"));
      else tr.appendChild(hucreAd(x && V._kisi[x] ? V._kisi[x].kisa : "—", x));
    });
    tb.appendChild(tr);
  });
  ic.appendChild(t);

  const u = $("#ucretIc"); u.innerHTML = "";
  const d = durum(V);
  const o = tablo(["Kişi", "Nöbet", "Saat", ["Saat/Nöbet", "Nöbet başı saat"], ["Ücret", "Ay ortalamasına oran"]]);
  let tn = 0, ts = 0;
  d.kisiler.slice().sort((a, b) => a.kidem - b.kidem).forEach(x => {
    const tr = el("tr");
    tr.appendChild(hucreAd(x.kisa, x.ad));
    tr.appendChild(sayiHucre(x.nobet + " / " + x.kota, x.nobet < x.kota ? "sayi-sinir" : ""));
    tr.appendChild(sayiHucre(x.saat));
    tr.appendChild(sayiHucre(x.nobet ? (x.saat / x.nobet).toFixed(1).replace(".", ",") : "—"));
    const e = Math.round(x.endeks * 100);
    tr.appendChild(sayiHucre(x.nobet ? e : "—", x.nobet && Math.abs(e - 100) > 12 ? "sayi-sinir" : ""));
    o.tb.appendChild(tr);
    tn += x.nobet; ts += x.saat;
  });
  const tr = el("tr", {className: "toplam-satir"});
  tr.appendChild(hucreAd("Toplam"));
  tr.appendChild(sayiHucre(tn));
  tr.appendChild(sayiHucre(ts));
  tr.appendChild(sayiHucre(tn ? (ts / tn).toFixed(1).replace(".", ",") : "—"));
  tr.appendChild(sayiHucre("—"));
  o.tb.appendChild(tr);
  u.appendChild(o.t);
}

/* ---------- kabuk ---------- */

function ayYukle(y, a) {
  const arsiv = DEPO.oku(ayAnahtar(y, a));
  if (arsiv) { V = normalize(JSON.parse(arsiv)); toast(AYLAR[a - 1] + " " + y + " arşivden açıldı"); }
  else {
    V.yil = y; V.ay = a;
    V.kilit = {}; V.uzman = {}; V.tatil = []; V.liste = {}; V.onay = {}; V.dagitim = {}; V.tohum = {};
    V.asistanlar.forEach(k => { k.izin = []; k.istiyor = []; k.istemiyor = []; });
    normalize(V);
  }
  VURGU = new Set(); SECILI_KISI = null; SECILI_GUN = 1;
  if (!erisilir(EKRAN)) EKRAN = "ana";
  sakla(); ciz();
}

const ilk = DEPO.oku(LSKEY);
V = ilk ? normalize(JSON.parse(ilk)) : bosVeri();
ciz();

document.addEventListener("click", ipucuKapat);
document.addEventListener("keydown", e => { if (e.key === "Escape") ipucuKapat(); });

$("#btnKopyaTablo").onclick = () => kopyala(tsvMetin());
$("#btnKopyaCsv").onclick = () => kopyala(csvMetin());

$("#btnKaydet").onclick = () => {
  const m = JSON.stringify(temiz(V), null, 2);
  const a = el("a", {href: URL.createObjectURL(new Blob([m], {type: "application/json"})),
    download: V.yil + "-" + String(V.ay).padStart(2, "0") + "-nobet.json"});
  document.body.appendChild(a); a.click(); a.remove();
};

$("#btnYukle").onclick = () => $("#fileIn").click();
$("#fileIn").onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      V = normalize(JSON.parse(r.result));
      VURGU = new Set(); SECILI_KISI = null; SECILI_GUN = 1; EKRAN = "ana";
      sakla(); ciz(); toast("Yüklendi");
    } catch (x) { toast("Okunamadı"); }
  };
  r.readAsText(f);
  e.target.value = "";
};

function senkronBagla() {
  const S = window.pencere && window.pencere.senkron;
  const e = $("#basbarSenk");
  if (!S || !e) return;
  const saat = t => t ? new Date(t).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "";
  const DURUM = { bekliyor: "waiting", esitleniyor: "syncing", esitlendi: "synced", cevrimdisi: "offline", yerel: "local" };
  const METIN = { bekliyor: "Bağlanıyor…", esitleniyor: "Eşitleniyor…", esitlendi: ET["sync.synced"], cevrimdisi: ET["sync.offline"], yerel: "Yalnız bu bilgisayar" };
  const goster = d => {
    if (!d) return;
    const a = METIN[d.asama] ? d.asama : "bekliyor";
    e.dataset.state = DURUM[a];
    e.classList.toggle("tk-sync-progress", a === "esitleniyor");
    e.hidden = false;
    e.textContent = METIN[a] + ((a === "esitlendi" || a === "cevrimdisi") && d.zaman ? " · " + saat(d.zaman) : "");
    e.title = (d.hata ? d.hata + "\n" : "") + (ET["sync.now"] || "");
    const sr = $("#basbarSurum");
    if (sr && d.uygulama) { sr.textContent = "v" + d.uygulama; }
  };
  S.durum().then(goster).catch(() => {});
  if (S.olay) S.olay(d => {
    if (d.tur === "durum") goster(d.durum);
    else if (d.tur === "veri") { try { sessionStorage.setItem("senkBildirim", "Başka bilgisayardaki değişiklikler geldi"); sessionStorage.setItem("senkEkran", EKRAN); } catch (_) {} location.reload(); }
    else if (d.tur === "kod") toast("Yeni sürüm geldi, program yenileniyor…");
  });
  e.onclick = () => { goster({ asama: "esitleniyor" }); S.simdi(); };
  const sb = $("#basbarSurum");
  if (sb) {
    const bas = ET["update.check"] || "";
    sb.title = bas; sb.setAttribute("aria-label", bas);
    sb.onclick = () => { toast(bas + "…"); e.onclick(); };
  }
  try {
    const m = sessionStorage.getItem("senkBildirim");
    if (m) { sessionStorage.removeItem("senkBildirim"); setTimeout(() => toast(m), 400); }
    const x = sessionStorage.getItem("senkEkran");
    if (x) { sessionStorage.removeItem("senkEkran"); if (erisilir(x)) { EKRAN = x; ciz(); } }
  } catch (_) {}
}

const PENCERE = window.pencere;
if (PENCERE) {
  senkronBagla();
  $("#pKucult").onclick = () => PENCERE.kucult();
  $("#pBuyult").onclick = () => PENCERE.buyult();
  $("#pKapat").onclick = () => PENCERE.kapat();
  $("#basbar").ondblclick = e => { if (!e.target.closest("button")) PENCERE.buyult(); };
  PENCERE.durum(buyuk => $("#cerceve").classList.toggle("buyuk", buyuk));
} else {
  $("#pGrup").hidden = true;
}
function qrCiz(cv, metin) {
  const q = qrcode(0, "M");
  q.addData(metin);
  q.make();
  const n = q.getModuleCount(), kenar = 4, h = 8;
  cv.width = cv.height = (n + kenar * 2) * h;
  const x = cv.getContext("2d");
  x.fillStyle = "#fff";
  x.fillRect(0, 0, cv.width, cv.height);
  x.fillStyle = "#000";
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + kenar) * h, (r + kenar) * h, h, h);
}
async function qrGoster(dugme, uret) {
  if (!PENCERE || !PENCERE.yukle) { toast("QR yalnız uygulamada çalışır"); return; }
  dugme.disabled = true;
  try {
    const bayt = await uret();
    toast("Yükleniyor…");
    const u = await PENCERE.yukle(bayt);
    qrCiz($("#telQr"), u);
    $("#telLink").textContent = u;
    $("#telDlg").showModal();
  } catch (e) {
    toast("Yüklenemedi: " + String(e.message).replace(/^.*Error: /, ""));
  } finally {
    dugme.disabled = false;
  }
}
async function sayfaBayt() {
  const b = $("#basbar").getBoundingClientRect(), c = $("#cerceve").getBoundingClientRect();
  const png = await PENCERE.kopyala({x: Math.round(c.left), y: Math.ceil(b.bottom), width: Math.round(c.width), height: Math.floor(c.bottom - b.bottom)});
  if (!png || !png.length) throw new Error("görüntü alınamadı");
  return new Uint8Array(png);
}
$("#btnSayfaQr").onclick = () => qrGoster($("#btnSayfaQr"), sayfaBayt);
$("#telKapat").onclick = () => $("#telDlg").close();
$("#telLink").onclick = () => kopyala($("#telLink").textContent);
