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

/* ---------- motor (nobet.py aynası) ---------- */

const GUNADI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const GUNTAM = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const iki = x => String(x).padStart(2, "0");
function tarihStr(v, g) { return iki(g) + "." + iki(v.ay) + "." + iki(v.yil % 100); }
function tarihUzun(v, g) { return tarihStr(v, g) + " - " + GUNTAM[v._hg[g]]; }
const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

const VARSAYILAN_AGIRLIK = {
  saat_dengesi: 1.0, hafta_sonu: 3.0, sunum_yuku: 3.0, gun_asiri: 8.0,
  uzman_tekrari: 2.0, gun_dagilimi: 1.5,
  istemedigi_gun: 20.0, istedigi_gun: 6.0, ozel_kural: 10.0,
  kidem_avantaji: 0.10, isteksizlik_avantaji: 0.04
};
const AGIRLIK_ETIKET = {
  saat_dengesi: "Saat dengesi", hafta_sonu: "Hafta sonu dengesi", sunum_yuku: "Sunum yükü dengesi",
  gun_asiri: "Gün aşırı cezası", uzman_tekrari: "Aynı uzman tekrarı",
  gun_dagilimi: "Hafta günü dengesi", istemedigi_gun: "İstemediği gün",
  istedigi_gun: "İstediği gün ödülü", ozel_kural: "Kişiye özel kural",
  kidem_avantaji: "Kıdem avantajı", isteksizlik_avantaji: "İsteksizlik avantajı"
};
const VARSAYILAN_GUN_TILT = [0, 0, 0, -1, 0, 1, 1];
const OZEL_KURALLAR = [
  ["ay_basi_yogun", "Ay başında yoğun"],
  ["ay_sonu_yogun", "Ay sonunda yoğun"],
  ["ay_ortasi_bos", "Ay ortasında boş"],
  ["gun_asiri_serbest", "Gün aşırı serbest"]
];

function Zar(tohum) {
  let s = (tohum || 1) >>> 0;
  this.next = function () {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 4294967296;
  };
  this.sec = d => d[Math.floor(this.next() * d.length)];
}

function gunlerAc(x) {
  const out = [];
  if (x === null || x === undefined || typeof x === "boolean") return out;
  if (typeof x === "number") return [Math.trunc(x)];
  if (Array.isArray(x)) { x.forEach(y => out.push.apply(out, gunlerAc(y))); return out; }
  const p = String(x).split("-");
  const a = parseInt(p[0], 10);
  const b = p.length > 1 ? parseInt(p[1], 10) : a;
  if (isNaN(a) || isNaN(b)) return out;
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

function ayGun(y, a) { return new Date(y, a, 0).getDate(); }
function haftaGunu(v, g) { return (new Date(v.yil, v.ay - 1, g).getDay() + 6) % 7; }

function normalize(v) {
  if (!v.sutunlar) v.sutunlar = [
    {ad: "Ybü-1", tur: "yb"}, {ad: "Ybü-2", tur: "yb"},
    {ad: "Amel-1", tur: "amel"}, {ad: "Amel-2", tur: "amel"}];
  if (!v.uzman) v.uzman = {};
  if (!v.tatil) v.tatil = [];
  if (!v.sunum_gunleri) v.sunum_gunleri = [1, 2];
  if (!v.sunum_yok) v.sunum_yok = [];
  if (!v.kilit) v.kilit = {};
  if (!v.asistanlar) v.asistanlar = [];
  v.agirlik = Object.assign({}, VARSAYILAN_AGIRLIK, v.agirlik || {});
  const gt = (v.gun_tilt || []).slice(0, 7);
  for (let d = gt.length; d < 7; d++) gt.push(VARSAYILAN_GUN_TILT[d]);
  v.gun_tilt = gt.map(x => Number(x) || 0);
  const sut = v.sutunlar.map(s => s.ad);
  v.asistanlar.forEach((k, i) => {
    if (!k.kisa) k.kisa = k.ad;
    if (!k.torba) k.torba = sut.slice();
    if (typeof k.kota !== "number") k.kota = 0;
    if (!k.ozel) k.ozel = [];
    k.izin = gunlerAc(k.izin);
    k.istiyor = gunlerAc(k.istiyor);
    k.istemiyor = gunlerAc(k.istemiyor);
    k._kidem = i + 1;
  });
  v._gun = ayGun(v.yil, v.ay);
  v._kisi = {};
  v.asistanlar.forEach(k => { v._kisi[k.ad] = k; });
  v._sut = sut;
  v._tatil = new Set(gunlerAc(v.tatil));
  v._sunum_yok = new Set(gunlerAc(v.sunum_yok));
  hazirla(v);
  return v;
}

function bosGun(v, g) {
  if (g < 1 || g > v._gun) return true;
  return haftaGunu(v, g) >= 5 || v._tatil.has(g);
}

function saatHesap(v, g) {
  const bugun = bosGun(v, g), yarin = bosGun(v, g + 1);
  if (!bugun && yarin) return 16;
  if (bugun && yarin) return 24;
  if (bugun && !yarin) return 16;
  return 8;
}

function yorucu(v, g) {
  const e = g + 1;
  if (e > v._gun || v._sunum_yok.has(e)) return false;
  return v.sunum_gunleri.indexOf(haftaGunu(v, e)) >= 0;
}

function hazirla(v) {
  const n = v._gun;
  v._saat = {}; v._hs = {}; v._yor = {};
  for (let g = 1; g <= n; g++) { v._saat[g] = saatHesap(v, g); v._hs[g] = bosGun(v, g); v._yor[g] = yorucu(v, g); }
  const kisiler = v.asistanlar.filter(k => k.kota > 0);
  v._aktif = kisiler;
  const N = kisiler.length;
  let topKota = 0; kisiler.forEach(k => { topKota += k.kota; });
  if (!topKota) topKota = 1;
  const ns = v.sutunlar.length;
  let topSaat = 0, topHs = 0, topYor = 0;
  for (let g = 1; g <= n; g++) { topSaat += v._saat[g]; if (v._hs[g]) topHs++; if (v._yor[g]) topYor++; }
  const kat = topKota / n;
  topSaat *= kat; topHs *= kat; topYor *= kat;

  const kd = kisiler.slice().sort((a, b) => a._kidem - b._kidem);
  const istek = kisiler.slice().sort((a, b) =>
    (a.istiyor.length + a.istemiyor.length) - (b.istiyor.length + b.istemiyor.length));
  const adv = {};
  kisiler.forEach(k => {
    const rk = kd.indexOf(k), ri = istek.indexOf(k);
    const ak = N > 1 ? 1 - 2 * rk / (N - 1) : 0;
    const ai = N > 1 ? 1 - 2 * ri / (N - 1) : 0;
    adv[k.ad] = v.agirlik.kidem_avantaji * ak + v.agirlik.isteksizlik_avantaji * ai;
  });
  function hedefle(toplam, tilt) {
    const ham = {}; let s = 0;
    kisiler.forEach(k => { ham[k.ad] = toplam * k.kota / topKota * (1 - tilt * adv[k.ad]); s += ham[k.ad]; });
    if (!s) s = 1;
    const o = {};
    kisiler.forEach(k => { o[k.ad] = ham[k.ad] * toplam / s; });
    return o;
  }
  v._hedef_saat = hedefle(topSaat, 0);
  v._hedef_hs = hedefle(topHs, 1);
  v._hedef_yor = hedefle(topYor, 1);
  v._hg = {};
  const nd = [0, 0, 0, 0, 0, 0, 0];
  for (let g = 1; g <= n; g++) { v._hg[g] = haftaGunu(v, g); nd[v._hg[g]]++; }
  v._hedef_gun = {};
  kisiler.forEach(k => {
    const a = [];
    for (let d = 0; d < 7; d++) a.push(nd[d] * k.kota / n * (1 - v.gun_tilt[d] * adv[k.ad]));
    v._hedef_gun[k.ad] = a;
  });
  v._uygun = {};
  kisiler.forEach(k => {
    const s = new Set();
    for (let g = 1; g <= n; g++) if (k.izin.indexOf(g) < 0) s.add(g);
    v._uygun[k.ad] = s;
  });
  v._torba = {};
  v._ops = new Set();
  v.sutunlar.forEach((s, si) => {
    v._torba[si] = kisiler.filter(k => k.torba.indexOf(s.ad) >= 0).map(k => k.ad);
    if (s.opsiyonel) v._ops.add(si);
  });
}

function uzmanOGun(v, g, tur) {
  const u = v.uzman[String(g)];
  return u ? u[tur] : null;
}

function kisiMaliyet(v, ad, slotlar) {
  const w = v.agirlik, k = v._kisi[ad], n = v._gun;
  const gunler = new Set(); slotlar.forEach(s => gunler.add(s[0]));
  let saat = 0, hs = 0, yor = 0, asiri = 0;
  gunler.forEach(g => {
    saat += v._saat[g];
    if (v._hs[g]) hs++;
    if (v._yor[g]) yor++;
    if (gunler.has(g + 2)) asiri++;
  });
  let c = w.saat_dengesi * Math.abs(saat - v._hedef_saat[ad]);
  c += w.hafta_sonu * Math.abs(hs - v._hedef_hs[ad]);
  c += w.sunum_yuku * Math.abs(yor - v._hedef_yor[ad]);
  if (k.ozel.indexOf("gun_asiri_serbest") < 0) c += w.gun_asiri * asiri;
  let ist = 0, iste = 0;
  k.istemiyor.forEach(g => { if (gunler.has(g)) ist++; });
  k.istiyor.forEach(g => { if (gunler.has(g)) iste++; });
  c += w.istemedigi_gun * ist;
  c -= w.istedigi_gun * iste;
  const sg = [0, 0, 0, 0, 0, 0, 0];
  gunler.forEach(g => { sg[v._hg[g]]++; });
  const hgh = v._hedef_gun[ad];
  let sap = 0;
  for (let d = 0; d < 7; d++) sap += Math.abs(sg[d] - hgh[d]);
  c += w.gun_dagilimi * sap;
  const say = new Map();
  slotlar.forEach(s => {
    const u = uzmanOGun(v, s[0], v.sutunlar[s[1]].tur);
    if (u) say.set(u, (say.get(u) || 0) + 1);
  });
  say.forEach(x => { if (x > 1) c += w.uzman_tekrari * (x - 1); });
  if (gunler.size && n > 1 && k.ozel.length) {
    let top = 0, orta = 0;
    gunler.forEach(g => {
      const x = (g - 1) / (n - 1);
      top += x;
      if (x >= 1 / 3 && x <= 2 / 3) orta++;
    });
    const ort = top / gunler.size;
    if (k.ozel.indexOf("ay_basi_yogun") >= 0) c += w.ozel_kural * ort * gunler.size;
    if (k.ozel.indexOf("ay_sonu_yogun") >= 0) c += w.ozel_kural * (1 - ort) * gunler.size;
    if (k.ozel.indexOf("ay_ortasi_bos") >= 0) c += w.ozel_kural * orta;
  }
  return c;
}

function Plan(v) {
  this.v = v;
  this.atama = new Map();
  this.slot = {};
  this.gun = {};
  this.bos = [];
  this.bos_ops = [];
  this.eksik = {};
}
Plan.prototype.al = function (g, si) { return this.atama.get(g + "|" + si); };
Plan.prototype.kur = function (g, si, ad) {
  this.atama.set(g + "|" + si, ad);
  if (!this.slot[ad]) { this.slot[ad] = []; this.gun[ad] = new Set(); }
  this.slot[ad].push([g, si]);
  this.gun[ad].add(g);
};
Plan.prototype.sil = function (g, si) {
  const k = g + "|" + si, ad = this.atama.get(k);
  this.atama.delete(k);
  const s = this.slot[ad];
  for (let i = 0; i < s.length; i++) if (s[i][0] === g && s[i][1] === si) { s.splice(i, 1); break; }
  if (!s.some(x => x[0] === g)) this.gun[ad].delete(g);
  return ad;
};
Plan.prototype.slotlari = function (ad) { return this.slot[ad] || []; };
Plan.prototype.gunleri = function (ad) {
  if (!this.gun[ad]) { this.slot[ad] = []; this.gun[ad] = new Set(); }
  return this.gun[ad];
};
Plan.prototype.uygun = function (ad, g, si) {
  const v = this.v;
  if (v._kisi[ad].torba.indexOf(v.sutunlar[si].ad) < 0) return false;
  if (!v._uygun[ad].has(g)) return false;
  const gn = this.gunleri(ad);
  return !(gn.has(g - 1) || gn.has(g) || gn.has(g + 1));
};
Plan.prototype.maliyet = function () {
  let c = 0;
  for (const ad in this.slot) if (this.slot[ad].length) c += kisiMaliyet(this.v, ad, this.slot[ad]);
  return c;
};

function kurIlk(v, tohum) {
  const rnd = new Zar(tohum);
  const p = new Plan(v);
  const n = v._gun, ns = v.sutunlar.length;
  const kalan = {};
  v._aktif.forEach(k => { kalan[k.ad] = k.kota; });
  Object.keys(v.kilit).forEach(gs => {
    const g = parseInt(gs, 10), sec = v.kilit[gs];
    Object.keys(sec).forEach(sad => {
      const ad = sec[sad], si = v._sut.indexOf(sad);
      if (si >= 0 && kalan[ad] > 0) { p.kur(g, si, ad); kalan[ad]--; }
    });
  });
  const tum = [];
  for (let g = 1; g <= n; g++) for (let si = 0; si < ns; si++) if (!p.atama.has(g + "|" + si)) tum.push([g, si]);

  function kitlik(x) {
    let c = 0;
    v._torba[x[1]].forEach(ad => { if (kalan[ad] > 0 && p.uygun(ad, x[0], x[1])) c++; });
    return c;
  }

  [false, true].forEach(opsiyonel => {
    let slotlar = tum.filter(x => v._ops.has(x[1]) === opsiyonel);
    while (slotlar.length) {
      const k = slotlar.map(x => [kitlik(x), x]);
      k.sort((a, b) => a[0] - b[0]);
      slotlar = k.map(x => x[1]);
      const s0 = slotlar.shift(), g = s0[0], si = s0[1];
      const aday = v._torba[si].filter(ad => kalan[ad] > 0 && p.uygun(ad, g, si));
      if (!aday.length) { (opsiyonel ? p.bos_ops : p.bos).push([g, si]); continue; }
      let en = null, enp = 0;
      aday.forEach(ad => {
        const gn = p.gunleri(ad);
        const torba = [];
        for (let j = 0; j < ns; j++) if (v._kisi[ad].torba.indexOf(v.sutunlar[j].ad) >= 0) torba.push(j);
        let uygunKalan = 0;
        v._uygun[ad].forEach(d => {
          if (gn.has(d) || gn.has(d - 1) || gn.has(d + 1)) return;
          torba.forEach(j => { if (!p.atama.has(d + "|" + j)) uygunKalan++; });
        });
        const aciliyet = kalan[ad] / Math.max(1, uygunKalan);
        const eski = kisiMaliyet(v, ad, p.slotlari(ad));
        const yeni = kisiMaliyet(v, ad, p.slotlari(ad).concat([[g, si]]));
        const pu = (yeni - eski) - 1000 * aciliyet + rnd.next() * 0.01;
        if (en === null || pu < enp) { en = ad; enp = pu; }
      });
      p.kur(g, si, en);
      kalan[en]--;
    }
  });
  onar(p, kalan, 3);
  p.eksik = {};
  Object.keys(kalan).forEach(a => { if (kalan[a]) p.eksik[a] = kalan[a]; });
  return p;
}

function onar(p, kalan, tur) {
  const v = p.v;
  for (let t = 0; t < tur; t++) {
    if (!p.bos.length) return;
    const kaldi = [];
    p.bos.forEach(s => {
      const g = s[0], si = s[1];
      const aday = v._torba[si].filter(ad => kalan[ad] > 0 && p.uygun(ad, g, si));
      if (aday.length) {
        let en = null, enp = 0;
        aday.forEach(ad => {
          const pu = kisiMaliyet(v, ad, p.slotlari(ad).concat([[g, si]]));
          if (en === null || pu < enp) { en = ad; enp = pu; }
        });
        p.kur(g, si, en); kalan[en]--;
        return;
      }
      if (!tasi(p, kalan, g, si)) kaldi.push([g, si]);
    });
    if (kaldi.length === p.bos.length) { p.bos = kaldi; return; }
    p.bos = kaldi;
  }
}

function tasi(p, kalan, g, si) {
  const v = p.v;
  const liste = Array.from(p.atama.entries());
  for (let i = 0; i < liste.length; i++) {
    const par = liste[i][0].split("|");
    const g2 = parseInt(par[0], 10), si2 = parseInt(par[1], 10), r = liste[i][1];
    if (g2 === g && si2 === si) continue;
    if (r === p.al(g, si)) continue;
    if (v._kisi[r].torba.indexOf(v.sutunlar[si].ad) < 0) continue;
    if (!v._uygun[r].has(g)) continue;
    p.sil(g2, si2);
    if (p.uygun(r, g, si)) {
      const t = v._torba[si2];
      for (let j = 0; j < t.length; j++) {
        const q = t[j];
        if (kalan[q] > 0 && p.uygun(q, g2, si2)) {
          p.kur(g2, si2, q); p.kur(g, si, r); kalan[q]--;
          return true;
        }
      }
    }
    p.kur(g2, si2, r);
  }
  return false;
}

function iyilestir(p, tur, tohum) {
  const v = p.v, rnd = new Zar(tohum + 1);
  const kilitli = new Set();
  Object.keys(v.kilit).forEach(gs => {
    Object.keys(v.kilit[gs]).forEach(sad => {
      const si = v._sut.indexOf(sad);
      if (si >= 0) kilitli.add(parseInt(gs, 10) + "|" + si);
    });
  });
  const serbest = Array.from(p.atama.keys()).filter(x => !kilitli.has(x));
  if (serbest.length < 2) return p;
  const coz = k => { const q = k.split("|"); return [parseInt(q[0], 10), parseInt(q[1], 10)]; };
  for (let t = 0; t < tur; t++) {
    const ka = rnd.sec(serbest), kb = rnd.sec(serbest);
    if (ka === kb) continue;
    const ad1 = p.atama.get(ka), ad2 = p.atama.get(kb);
    if (ad1 === ad2) continue;
    const a = coz(ka), b = coz(kb);
    const eski = kisiMaliyet(v, ad1, p.slotlari(ad1)) + kisiMaliyet(v, ad2, p.slotlari(ad2));
    p.sil(a[0], a[1]); p.sil(b[0], b[1]);
    if (p.uygun(ad1, b[0], b[1]) && p.uygun(ad2, a[0], a[1])) {
      p.kur(b[0], b[1], ad1); p.kur(a[0], a[1], ad2);
      const yeni = kisiMaliyet(v, ad1, p.slotlari(ad1)) + kisiMaliyet(v, ad2, p.slotlari(ad2));
      if (yeni < eski - 1e-9) continue;
      p.sil(b[0], b[1]); p.sil(a[0], a[1]);
    }
    p.kur(a[0], a[1], ad1); p.kur(b[0], b[1], ad2);
  }
  return p;
}

function coz(v, tur, tohum) { return iyilestir(kurIlk(v, tohum), tur, tohum); }

function uzmanTekrar(v, slotlar) {
  const say = new Map();
  slotlar.forEach(s => {
    const u = uzmanOGun(v, s[0], v.sutunlar[s[1]].tur);
    if (u) say.set(u, (say.get(u) || 0) + 1);
  });
  let t = 0;
  say.forEach(x => { if (x > 1) t += x - 1; });
  return t;
}

const DENGE = {saat: 1.0, hs: 3.0, yor: 3.0, gun: 2.0, asiri: 10.0,
  istemedigi: 25.0, istedigi: -8.0, uzman: 4.0};
const OTO_ALAN = ["saat_dengesi", "hafta_sonu", "sunum_yuku", "gun_asiri", "uzman_tekrari",
  "istemedigi_gun", "istedigi_gun", "ozel_kural", "gun_dagilimi"];

function denge(v, p) {
  let t = 0;
  ozet(v, p).forEach(x => {
    const ad = x.ad, hg = v._hedef_gun[ad];
    t += DENGE.saat * Math.abs(x.saat - v._hedef_saat[ad]);
    t += DENGE.hs * Math.abs(x.hs - v._hedef_hs[ad]);
    t += DENGE.yor * Math.abs(x.yor - v._hedef_yor[ad]);
    let g = 0;
    for (let d = 0; d < 7; d++) g += Math.abs(x.gun[d] - hg[d]);
    t += DENGE.gun * g;
    t += DENGE.asiri * x.asiri;
    t += DENGE.istemedigi * x.istemedigi;
    t += DENGE.istedigi * x.istedigi;
    t += DENGE.uzman * x.uzman;
  });
  let eks = 0;
  Object.keys(p.eksik).forEach(a => { eks += p.eksik[a]; });
  return t + 1000 * (p.bos.length + eks);
}

function oto(v, deneme, tur, tohum) {
  const rnd = new Zar(tohum + 99);
  const esas = Object.assign({}, v.agirlik);
  let enA = Object.assign({}, esas), enS = null;
  for (let i = 0; i < deneme; i++) {
    const a = Object.assign({}, esas);
    if (i) OTO_ALAN.forEach(k => { a[k] = esas[k] * (0.35 + 3 * rnd.next()); });
    v.agirlik = a;
    hazirla(v);
    const s = denge(v, coz(v, tur, tohum));
    if (enS === null || s < enS) { enS = s; enA = Object.assign({}, a); }
  }
  v.agirlik = enA;
  hazirla(v);
  return {agirlik: enA, skor: enS};
}

function ozet(v, p) {
  return v._aktif.map(k => {
    const ad = k.ad, s = p.slotlari(ad);
    const gunler = new Set(); s.forEach(x => gunler.add(x[0]));
    let saat = 0, hs = 0, yor = 0, asiri = 0;
    gunler.forEach(g => {
      saat += v._saat[g];
      if (v._hs[g]) hs++;
      if (v._yor[g]) yor++;
      if (gunler.has(g + 2)) asiri++;
    });
    let ist = 0, iste = 0;
    k.istemiyor.forEach(g => { if (gunler.has(g)) ist++; });
    k.istiyor.forEach(g => { if (gunler.has(g)) iste++; });
    return {ad: ad, kisa: k.kisa, kidem: k._kidem, kota: k.kota, atanan: s.length,
      saat: saat, hedef_saat: v._hedef_saat[ad], hs: hs, yor: yor,
      asiri: asiri, istemedigi: ist, istedigi: iste,
      gun: (function () { const a = [0,0,0,0,0,0,0]; gunler.forEach(g => { a[v._hg[g]]++; }); return a; })(),
      uzman: uzmanTekrar(v, s)};
  });
}

/* ---------- depo ---------- */

const LSKEY = "asistan-nobet";
function ayAnahtar(y, a) { return LSKEY + ":" + y + "-" + String(a).padStart(2, "0"); }

const OLCU_ANAHTAR = "asistan-nobet-olcu";
const OLCU_VAR = {kadro: "--k-kol", kadroSag: "--ks-satir", kadroAy: "--ka-kol",
                  liste1: "--l-kol1", liste2: "--l-kol2"};
const OLCU = (() => { try { return JSON.parse(localStorage.getItem(OLCU_ANAHTAR)) || {}; } catch (e) { return {}; } })();

function olcuUygula() {
  const k = document.documentElement;
  for (const ad in OLCU_VAR) if (OLCU[ad]) k.style.setProperty(OLCU_VAR[ad], OLCU[ad] + "fr");
}

function autofit() {
  document.querySelectorAll("section:not([hidden]) .pnl-icerik").forEach(e => {
    e.style.zoom = "1";
    if (!e.clientHeight) return;
    const tasar = () => e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth;
    let z = 1;
    while (z > 0.5 && tasar()) { z -= 0.02; e.style.zoom = z.toFixed(2); }
  });
}

function ayiraclar() {
  document.querySelectorAll(".ayirac").forEach(a => {
    const ad = a.dataset.ayirac, kap = a.parentElement, dik = a.classList.contains("ayirac-dikey");
    const onceki = a.previousElementSibling, son = kap.lastElementChild;
    a.onmousedown = e => {
      e.preventDefault();
      const bas = dik ? onceki.getBoundingClientRect().left : onceki.getBoundingClientRect().top;
      const tasi = m => {
        const yeni = (dik ? m.clientX : m.clientY) - bas;
        const sr = son.getBoundingClientRect();
        const sp = dik ? sr.width : sr.height;
        if (yeni < 60 || sp < 40) return;
        OLCU[ad] = (yeni / sp).toFixed(3);
        document.documentElement.style.setProperty(OLCU_VAR[ad], OLCU[ad] + "fr");
        autofit();
      };
      const bit = () => {
        document.removeEventListener("mousemove", tasi);
        document.removeEventListener("mouseup", bit);
        document.body.classList.remove("ayirma");
        try { localStorage.setItem(OLCU_ANAHTAR, JSON.stringify(OLCU)); } catch (_) {}
        autofit();
      };
      document.body.classList.add("ayirma");
      document.addEventListener("mousemove", tasi);
      document.addEventListener("mouseup", bit);
    };
    a.ondblclick = () => {
      delete OLCU[ad];
      document.documentElement.style.removeProperty(OLCU_VAR[ad]);
      try { localStorage.setItem(OLCU_ANAHTAR, JSON.stringify(OLCU)); } catch (_) {}
      autofit();
    };
  });
}

olcuUygula();
ayiraclar();
addEventListener("resize", autofit);
addEventListener("load", () => setTimeout(autofit, 60));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(autofit, 0));

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
let P = null;
let TUR = 40000;
let TOHUM = 7;

function sakla() {
  const m = JSON.stringify(temiz(V));
  DEPO.yaz(LSKEY, m);
  DEPO.yaz(ayAnahtar(V.yil, V.ay), m);
}


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

function sayiHucre(deger, sinif) {
  return el("td", {className: "sayi" + (sinif ? " " + sinif : ""), textContent: String(deger)});
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

/* ---------- ipucu balonu ---------- */

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

/* ---------- aşamalar ---------- */

const ADIM = [["kadro", "Kadro"], ["liste", "Liste"], ["cikti", "Çıktı"]];
let AKTIF = "liste";
let SECILI_GUN = 1;
let SECILI_KISI = null;
let VURGU = new Set();

function adimlar() {
  const n = $("#adimlar"); n.innerHTML = "";
  ADIM.forEach(([id, ad], i) => {
    const b = el("button", {className: "adim", type: "button"});
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", "false");
    b.appendChild(el("span", {className: "adim-no", textContent: String(i + 1)}));
    b.appendChild(el("span", {textContent: ad}));
    b.onclick = () => adimSec(id);
    n.appendChild(b);
  });
}

function adimSec(id) {
  AKTIF = id;
  ADIM.forEach(([x]) => { $("#s-" + x).hidden = x !== id; });
  Array.prototype.forEach.call($("#adimlar").children, (b, i) =>
    b.setAttribute("aria-selected", ADIM[i][0] === id ? "true" : "false"));
  ciz(id);
}

function ciz(id) {
  if (id === "kadro") ciz_kadro();
  if (id === "liste") ciz_liste();
  if (id === "cikti") ciz_cikti();
  requestAnimationFrame(() => requestAnimationFrame(autofit));
  setTimeout(autofit, 80);
}

function tazele() {
  hazirla(V);
  sakla();
  ciz(AKTIF);
  if ($("#cekmece").dataset.acik === "1") ciz_kural();
}

/* ---------- 1 · kadro ---------- */

function ciz_kadro() { ciz_asistan(); ciz_ay(); ciz_gun(); ciz_istek(); }

function ciz_asistan() {
  $("#kadroYardim").innerHTML = "";
  $("#kadroYardim").appendChild(ipucu(
    "Sıra kıdemdir: en üstteki en kıdemli. Kota o ay tutacağı nöbet sayısıdır; 0 ise kişi listeye girmez. " +
    "Nöbet yeri, kişinin girebileceği sütunların baş harfleridir. Özel kural rozetlerinin üstüne gelince tam adı görünür."));
  const ic = $("#asistanIc"); ic.innerHTML = "";
  const t = el("table", {className: "tbl tbl-gridline"});
  const th = el("tr");
  ["Sıra", "Asistan", "Kısa Ad", "Kota", "Nöbet Yeri", "Özel Kural", "Düzen"]
    .forEach(x => th.appendChild(el("th", {textContent: x})));
  t.appendChild(el("thead")).appendChild(th);
  const tb = el("tbody");
  V.asistanlar.forEach((k, i) => {
    const tr = el("tr");
    tr.appendChild(sayiHucre(i + 1, "sayi-ikincil"));

    const tdAd = el("td", {className: "hucre-doldur"});
    const ad = el("input", {className: "gir gir-mini", value: k.ad});
    ad.onchange = () => {
      const eski = k.ad, yeni = ad.value.trim();
      if (!yeni) { ad.value = eski; return; }
      if (k.kisa === eski) k.kisa = yeni;
      k.ad = yeni;
      Object.keys(V.kilit).forEach(g => Object.keys(V.kilit[g]).forEach(x => {
        if (V.kilit[g][x] === eski) V.kilit[g][x] = yeni;
      }));
      P = null; SECILI_KISI = null; tazele();
    };
    tdAd.appendChild(ad); tr.appendChild(tdAd);

    const tdKisa = el("td", {className: "hucre-doldur"});
    const kisa = el("input", {className: "gir gir-mini", value: k.kisa});
    kisa.onchange = () => { k.kisa = kisa.value.trim() || k.ad; tazele(); };
    tdKisa.appendChild(kisa); tr.appendChild(tdKisa);

    const tdKota = el("td", {className: "hucre-doldur"});
    const kota = el("input", {className: "gir gir-mini", type: "number", min: "0", value: String(k.kota)});
    kota.onchange = () => { k.kota = Math.max(0, parseInt(kota.value, 10) || 0); P = null; tazele(); };
    tdKota.appendChild(kota); tr.appendChild(tdKota);

    const tdYer = el("td");
    const yer = el("div", {className: "rozet-grup"});
    V.sutunlar.forEach(s => {
      const b = el("button", {type: "button", className: "acma acma-rozet", textContent: basHarfler(s.ad), title: s.ad});
      b.setAttribute("aria-pressed", k.torba.indexOf(s.ad) >= 0 ? "true" : "false");
      b.onclick = () => {
        if (k.torba.indexOf(s.ad) < 0) k.torba.push(s.ad);
        else k.torba = k.torba.filter(y => y !== s.ad);
        P = null; tazele();
      };
      yer.appendChild(b);
    });
    tdYer.appendChild(yer); tr.appendChild(tdYer);

    const tdOzel = el("td");
    const ozel = el("div", {className: "rozet-grup"});
    OZEL_KURALLAR.forEach(([id, et]) => {
      const b = el("button", {type: "button", className: "acma acma-rozet", textContent: basHarfler(et), title: et});
      b.setAttribute("aria-pressed", k.ozel.indexOf(id) >= 0 ? "true" : "false");
      b.onclick = () => {
        if (k.ozel.indexOf(id) < 0) k.ozel.push(id);
        else k.ozel = k.ozel.filter(y => y !== id);
        tazele();
      };
      ozel.appendChild(b);
    });
    tdOzel.appendChild(ozel); tr.appendChild(tdOzel);

    const tdD = el("td");
    const d = el("div", {className: "duzen-grup"});
    const yuk = el("button", {className: "dgm dgm-mini", type: "button", textContent: "↑", title: "Kıdemde yükselt"});
    yuk.onclick = () => { if (i > 0) { const q = V.asistanlar; q.splice(i - 1, 0, q.splice(i, 1)[0]); P = null; normalize(V); tazele(); } };
    const asa = el("button", {className: "dgm dgm-mini", type: "button", textContent: "↓", title: "Kıdemde indir"});
    asa.onclick = () => { const q = V.asistanlar; if (i < q.length - 1) { q.splice(i + 1, 0, q.splice(i, 1)[0]); P = null; normalize(V); tazele(); } };
    const sil = el("button", {className: "dgm dgm-mini", type: "button", textContent: "×", title: "Listeden çıkar"});
    sil.onclick = () => { V.asistanlar.splice(i, 1); P = null; SECILI_KISI = null; normalize(V); tazele(); };
    d.appendChild(yuk); d.appendChild(asa); d.appendChild(sil);
    tdD.appendChild(d); tr.appendChild(tdD);
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  ic.appendChild(t);

  const ekle = $("#kadroEkle"); ekle.innerHTML = "";
  const yeni = el("input", {className: "gir gir-orta", placeholder: "Yeni asistan adı"});
  const bd = el("button", {className: "dgm", type: "button", textContent: "Ekle"});
  bd.onclick = () => {
    const ad = yeni.value.trim();
    if (!ad) return;
    V.asistanlar.push({ad: ad, kisa: ad, torba: V._sut.slice(), kota: 0, ozel: [],
      izin: [], istiyor: [], istemiyor: []});
    P = null; normalize(V); tazele();
  };
  ekle.appendChild(yeni); ekle.appendChild(bd);
}

function uzmanKisa(g) {
  return turListe().map(t => kisaltAd(uzmanOGun(V, g, t) || "")).filter(x => x).join(" · ");
}

function ciz_ay() {
  $("#ayYardim").innerHTML = "";
  $("#ayYardim").appendChild(ipucu(
    "Bir güne tıkla: sağdaki panelde o günün resmî tatil ve sunum durumu ile nöbetçi uzmanları açılır. " +
    "Sarı gün numarası hafta sonunu, mor numara resmî tatili gösterir. Hücrede yazan isimler o günün uzmanlarıdır."));
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
    const im = [];
    if (V._tatil.has(g)) im.push("tatil");
    if (V._sunum_yok.has(g)) im.push("sunum yok");
    if (im.length) h.appendChild(el("span", {className: "ay-im", textContent: im.join(" · ")}));
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
    P = null; normalize(V); tazele();
  };
  p.appendChild(tatil);

  const sy = el("button", {type: "button", className: "acma", textContent: "Sunum yapılmaz"});
  sy.setAttribute("aria-pressed", V._sunum_yok.has(g) ? "true" : "false");
  sy.onclick = () => {
    const s = new Set(gunlerAc(V.sunum_yok));
    if (s.has(g)) s.delete(g); else s.add(g);
    V.sunum_yok = Array.from(s).sort((a, b) => a - b);
    P = null; normalize(V); tazele();
  };
  p.appendChild(sy);

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

  if (P) {
    const alan = el("div", {className: "gun-alan"});
    alan.appendChild(el("span", {className: "gun-alan-bas", textContent: "Bu günün nöbetçileri"}));
    V.sutunlar.forEach((s, si) => {
      const ad = P.al(g, si);
      const r = el("div", {className: "olcu-satir"});
      r.appendChild(el("span", {className: "olcu-etiket", textContent: s.ad}));
      r.appendChild(el("span", {className: "olcu-nokta"}));
      r.appendChild(el("span", {className: "olcu-deger", textContent: ad ? V._kisi[ad].kisa : "—"}));
      alan.appendChild(r);
    });
    p.appendChild(alan);
  }
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
    "Sağdaki üç sayı izin / istiyor / istemiyor adedidir. Az istek belirten kişi isteksizlik kıdeminde üste çıkar; " +
    "\"bu günü istemiyorum\" da bir istektir."));
  const ic = $("#istekIc"); ic.innerHTML = "";
  const haftalar = haftalarAy(V);
  const t = el("table", {className: "tbl tbl-gridline"});
  const th = el("tr");
  th.appendChild(el("th", {textContent: "Asistan"}));
  for (let g = 1; g <= V._gun; g++) {
    th.appendChild(el("th", {className: "mat-gun-bas" + (V._hs[g] ? " mat-hs" : ""),
      textContent: String(g), title: tarihUzun(V, g)}));
  }
  th.appendChild(el("th", {textContent: "İzin / İstek", title: "izin / istiyor / istemiyor"}));
  t.appendChild(el("thead")).appendChild(th);
  const tb = el("tbody");
  V.asistanlar.forEach(k => {
    const tr = el("tr");
    tr.appendChild(hucreAd(k.kisa, k.ad));
    const nobet = P ? new Set(P.slotlari(k.ad).map(x => x[0])) : new Set();
    for (let g = 1; g <= V._gun; g++) {
      const d = gunDurum(k, g);
      const td = el("td", {className: "mat-td"});
      const b = el("button", {type: "button",
        className: "mat-hucre" + (d ? " gd-" + d : " mat-bos") + (nobet.has(g) ? " mat-nobet" : ""),
        textContent: nobet.has(g) ? "N" : (d ? DURUM_ETIKET[d] : "·"),
        title: k.kisa + " · " + tarihUzun(V, g)});
      b.onclick = e => {
        if (e.shiftKey) {
          const h = haftalar.filter(x => x.indexOf(g) >= 0)[0] || [g];
          const hepsi = h.every(x => k.izin.indexOf(x) >= 0);
          h.forEach(x => gunAyar(k, x, hepsi ? "" : "izin"));
        } else {
          gunAyar(k, g, DONGU[(DONGU.indexOf(d) + 1) % DONGU.length]);
        }
        P = null; tazele();
      };
      td.appendChild(b);
      tr.appendChild(td);
    }
    tr.appendChild(el("td", {className: "sayi sayi-ikincil",
      textContent: k.izin.length + " / " + k.istiyor.length + " / " + k.istemiyor.length}));
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  ic.appendChild(t);
}

/* ---------- 2 · liste ---------- */

function coz_et() {
  hazirla(V);
  const t0 = Date.now();
  P = coz(V, TUR, TOHUM);
  SECILI_KISI = null; VURGU = new Set();
  sakla(); ciz_liste();
  toast("Liste hazır · maliyet " + P.maliyet().toFixed(1) + " · " + ((Date.now() - t0) / 1000).toFixed(1) + " sn");
}

function ciz_liste() {
  const ic = $("#listeIc"); ic.innerHTML = "";
  const t = el("table", {className: "tbl tbl-gridline"});
  const th = el("tr");
  th.appendChild(el("th", {textContent: "Tarih"}));
  V.sutunlar.forEach(s => th.appendChild(el("th", {textContent: s.ad})));
  t.appendChild(el("thead")).appendChild(th);
  const tb = el("tbody");
  for (let g = 1; g <= V._gun; g++) {
    const tr = el("tr");
    let sinif = V._hs[g] ? "hafta-sonu" : "";
    if (V._tatil.has(g)) sinif = "tatil-satir";
    if (VURGU.has(g)) sinif += " secili";
    if (sinif) tr.className = sinif;
    const im = [];
    if (V._tatil.has(g)) im.push("tatil");
    if (V._yor[g]) im.push("sunum");
    tr.appendChild(el("td", {className: "tarih-hucre", title: tarihUzun(V, g),
      textContent: tarihStr(V, g) + " " + GUNADI[V._hg[g]] + (im.length ? " · " + im.join(" · ") : "")}));
    V.sutunlar.forEach((s, si) => {
      const td = el("td", {className: "hucre-doldur"});
      const kilit = (V.kilit[String(g)] || {})[s.ad];
      const atanan = P ? P.al(g, si) : null;
      const sel = el("select", {className: "gir gir-mini"});
      sel.appendChild(el("option", {value: "", textContent: atanan ? V._kisi[atanan].kisa : "—"}));
      V._torba[si].forEach(ad => sel.appendChild(el("option", {value: ad, textContent: V._kisi[ad].kisa + " (sabit)"})));
      sel.value = kilit && V._kisi[kilit] ? kilit : "";
      if (sel.value) td.className = "hucre-doldur zorla-hucre";
      sel.onchange = () => {
        if (!V.kilit[String(g)]) V.kilit[String(g)] = {};
        if (sel.value) V.kilit[String(g)][s.ad] = sel.value;
        else {
          delete V.kilit[String(g)][s.ad];
          if (!Object.keys(V.kilit[String(g)]).length) delete V.kilit[String(g)];
        }
        sakla(); ciz_liste();
      };
      td.appendChild(sel);
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  }
  t.appendChild(tb);
  ic.appendChild(t);
  ciz_orta();
  ciz_denge();
}

function olcu(ana, etiket, deger) {
  const r = el("div", {className: "olcu-satir"});
  r.appendChild(el("span", {className: "olcu-etiket", textContent: etiket}));
  r.appendChild(el("span", {className: "olcu-nokta"}));
  r.appendChild(el("span", {className: "olcu-deger", textContent: deger}));
  ana.appendChild(r);
  return r;
}

function asiriGunler(gunler) {
  const g = Array.from(gunler).sort((a, b) => a - b), c = [];
  g.forEach(x => { if (gunler.has(x + 2)) c.push(x + " → " + (x + 2)); });
  return c;
}

function uzmanSay(ad) {
  const say = {};
  P.slotlari(ad).forEach(sl => {
    const u = uzmanOGun(V, sl[0], V.sutunlar[sl[1]].tur);
    if (u) say[u] = (say[u] || 0) + 1;
  });
  return say;
}

function ciz_orta() {
  const bas = $("#ortaBas"); bas.innerHTML = "";
  const ic = $("#durumIc"); ic.innerHTML = "";
  if (SECILI_KISI) { ciz_detay(bas, ic); return; }

  bas.appendChild(el("span", {textContent: "Durum"}));
  bas.appendChild(el("span", {className: "bosluk"}));
  bas.appendChild(ipucu(
    "Tur, liste kurulduktan sonra denenecek ikili takas sayısıdır: büyüdükçe liste dengelenir, süre uzar. " +
    "Tohum, rastgeleliğin başlangıç sayısıdır: aynı tohum her seferinde aynı listeyi verir, " +
    "değiştirmek aynı kalitede başka bir liste üretir. Denge puanı ağırlıklardan bağımsızdır; küçük olan iyidir."));

  const p = el("div", {className: "durum-ic"});
  const s1 = el("div", {className: "satir"});
  s1.appendChild(el("label", {textContent: "Tur", htmlFor: "girTur"}));
  const gt = el("input", {className: "gir gir-dar", type: "number", id: "girTur",
    value: String(TUR), min: "1000", step: "1000"});
  gt.onchange = () => { TUR = parseInt(gt.value, 10) || 40000; };
  s1.appendChild(gt);
  s1.appendChild(el("label", {textContent: "Tohum", htmlFor: "girTohum"}));
  const gh = el("input", {className: "gir gir-dar", type: "number", id: "girTohum", value: String(TOHUM), min: "1"});
  gh.onchange = () => { TOHUM = parseInt(gh.value, 10) || 7; };
  s1.appendChild(gh);
  p.appendChild(s1);

  let topKota = 0;
  V._aktif.forEach(k => { topKota += k.kota; });
  const zor = V.sutunlar.filter(s => !s.opsiyonel).length;
  const ops = V.sutunlar.length - zor;
  const zorSlot = V._gun * zor, opsSlot = V._gun * ops;
  olcu(p, "Ay", V._gun + " gün · " + V.sutunlar.length + " sütun");
  olcu(p, "Doldurulacak", zorSlot + " zorunlu" + (opsSlot ? " + " + opsSlot + " opsiyonel" : ""));
  olcu(p, "Nöbet hakkı", topKota + " nöbet · " + V._aktif.length + " kişi");

  const uy = el("div", {className: "uyari-liste"});
  const uyari = (metin, agir, is) => {
    const b = el("button", {type: "button", className: "uyari" + (agir ? " uyari-agir" : "")});
    b.appendChild(el("span", {className: "uyari-im", textContent: agir ? "!" : "•"}));
    b.appendChild(el("span", {textContent: metin}));
    b.onclick = is || (() => {});
    uy.appendChild(b);
  };

  if (topKota < zorSlot) uyari("Kotalar zorunlu slotları " + (zorSlot - topKota) + " nöbet eksik karşılıyor.", true);
  if (topKota > zorSlot + opsSlot) uyari("Kotalar tüm slotları " + (topKota - zorSlot - opsSlot) + " nöbet aşıyor.", true);

  if (!P) {
    p.appendChild(uy);
    ic.appendChild(p);
    ic.appendChild(bosDurum("Liste yok", "Sol üstteki düğme listeyi kurar.", "Listeyi Oluştur", coz_et));
    return;
  }

  const oz = ozet(V, P);
  let sapT = 0, sapE = 0, asiri = 0, kotu = 0, iyi = 0, uzm = 0;
  oz.forEach(x => {
    const d = Math.abs(x.saat - x.hedef_saat);
    sapT += d; if (d > sapE) sapE = d;
    asiri += x.asiri; kotu += x.istemedigi; iyi += x.istedigi; uzm += x.uzman;
  });
  olcu(p, "Denge puanı", denge(V, P).toFixed(0));
  olcu(p, "Saat sapması", "ortalama " + (sapT / (oz.length || 1)).toFixed(1) + " · en çok " + sapE.toFixed(0));
  olcu(p, "Tutulan istek", iyi + " gün");
  if (P.bos_ops.length) olcu(p, "Opsiyonel boş", P.bos_ops.length + " slot");

  P.bos.forEach(x => uyari("Zorunlu slot boş: " + tarihStr(V, x[0]) + " · " + V._sut[x[1]], true,
    () => { VURGU = new Set([x[0]]); SECILI_GUN = x[0]; ciz_liste(); }));
  Object.keys(P.eksik).forEach(a => uyari(V._kisi[a].kisa + " kotasını " + P.eksik[a] + " nöbet dolduramadı", true,
    () => kisiSec(a)));
  oz.forEach(x => {
    const gunler = new Set(P.slotlari(x.ad).map(s => s[0]));
    const c = asiriGunler(gunler);
    if (c.length) uyari(x.kisa + " · gün aşırı: " + c.join(", "), false,
      () => { kisiSec(x.ad); });
  });
  oz.forEach(x => {
    if (!x.istemedigi) return;
    const gunler = new Set(P.slotlari(x.ad).map(s => s[0]));
    const g = V._kisi[x.ad].istemiyor.filter(d => gunler.has(d));
    uyari(x.kisa + " · istemediği gün: " + g.join(", "), true, () => kisiSec(x.ad));
  });
  oz.forEach(x => {
    if (!x.uzman) return;
    const say = uzmanSay(x.ad);
    const c = Object.keys(say).filter(u => say[u] > 1).map(u => kisaltAd(u) + " ×" + say[u]);
    uyari(x.kisa + " · aynı uzman: " + c.join(", "), false, () => kisiSec(x.ad));
  });
  if (!uy.children.length) {
    const b = el("div", {className: "bilgi", textContent: "Uyarı yok."});
    p.appendChild(b);
  }
  p.appendChild(uy);
  ic.appendChild(p);
}

function kisiSec(ad) {
  SECILI_KISI = ad;
  VURGU = P ? new Set(P.slotlari(ad).map(s => s[0])) : new Set();
  ciz_liste();
}

function ciz_detay(bas, ic) {
  const k = V._kisi[SECILI_KISI];
  const x = ozet(V, P).filter(o => o.ad === SECILI_KISI)[0];
  bas.appendChild(el("span", {textContent: k.ad}));
  bas.appendChild(el("span", {className: "bosluk"}));
  const geri = el("button", {className: "dgm dgm-mini", type: "button", textContent: "Geri"});
  geri.onclick = () => { SECILI_KISI = null; VURGU = new Set(); ciz_liste(); };
  bas.appendChild(geri);
  if (!x) { ic.appendChild(el("div", {className: "bilgi", textContent: "Bu kişi bu ay listede değil."})); return; }

  const p = el("div", {className: "durum-ic"});
  const gunler = new Set(P.slotlari(x.ad).map(s => s[0]));

  const serit = el("div", {className: "serit-gridline"});
  for (let g = 1; g <= V._gun; g++) {
    const d = gunDurum(k, g);
    let sinif = "serit-hucre";
    if (gunler.has(g)) sinif += " serit-nobet";
    else if (V._hs[g]) sinif += " serit-hs";
    if (gunler.has(g) && d === "istemiyor") sinif += " serit-ihlal";
    serit.appendChild(el("div", {className: sinif,
      textContent: gunler.has(g) ? "N" : (d ? DURUM_ETIKET[d] : "·"),
      title: tarihUzun(V, g)}));
  }
  p.appendChild(serit);

  olcu(p, "Kıdem", String(x.kidem + 1) + ". sırada");
  olcu(p, "Nöbet", x.atanan + " / " + x.kota);
  olcu(p, "Saat", x.saat + " · hedef " + Math.round(x.hedef_saat));
  olcu(p, "Hafta sonu", x.hs + " · hedef " + V._hedef_hs[x.ad].toFixed(1));
  olcu(p, "Sunum yükü", x.yor + " · hedef " + V._hedef_yor[x.ad].toFixed(1));
  const c = asiriGunler(gunler);
  olcu(p, "Gün aşırı", c.length ? c.join(", ") : "yok");
  const ist = k.istiyor.filter(g => gunler.has(g));
  olcu(p, "Tutulan istek", ist.length ? ist.join(", ") : "yok");
  const kar = k.istemiyor.filter(g => gunler.has(g));
  olcu(p, "İstemediği gün", kar.length ? kar.join(", ") : "yok");
  const say = uzmanSay(x.ad);
  const tk = Object.keys(say).filter(u => say[u] > 1).map(u => kisaltAd(u) + " ×" + say[u]);
  olcu(p, "Aynı uzman", tk.length ? tk.join(", ") : "yok");

  p.appendChild(el("div", {className: "detay-bas", textContent: "Hafta günü dağılımı"}));
  const t = el("table", {className: "tbl tbl-gridline"});
  const th = el("tr");
  th.appendChild(el("th", {textContent: "Gün"}));
  GUNADI.forEach(a => th.appendChild(el("th", {textContent: a})));
  t.appendChild(el("thead")).appendChild(th);
  const tb = el("tbody");
  const r1 = el("tr");
  r1.appendChild(hucreAd("Nöbet"));
  for (let d = 0; d < 7; d++) r1.appendChild(sayiHucre(x.gun[d]));
  tb.appendChild(r1);
  const r2 = el("tr");
  r2.appendChild(hucreAd("Hedef"));
  for (let d = 0; d < 7; d++) r2.appendChild(sayiHucre(V._hedef_gun[x.ad][d].toFixed(1), "sayi-ikincil"));
  tb.appendChild(r2);
  t.appendChild(tb);
  p.appendChild(t);
  ic.appendChild(p);
}

function ciz_denge() {
  $("#dengeYardim").innerHTML = "";
  $("#dengeYardim").appendChild(ipucu(
    "Sapma, kişinin saat toplamı ile kotasından beklenen saat arasındaki farktır; sekiz saati aşınca sarı yanar. " +
    "İstek sütunu tutulan ve çiğnenen istek sayısıdır; çiğnenen varsa kırmızıdır. " +
    "Bir satıra tıklamak ortadaki paneli o kişinin tam dökümüne çevirir."));
  const ic = $("#dengeIc"); ic.innerHTML = "";
  if (!P) {
    ic.appendChild(bosDurum("Denge yok", "Liste oluşturulunca kişi dengesi burada çıkar."));
    return;
  }
  const t = el("table", {className: "tbl tbl-gridline"});
  const th = el("tr");
  ["Asistan", "Nöbet", "Saat", "Sapma", "Hafta Sonu", "Gün Aşırı", "İstek"]
    .forEach(x => th.appendChild(el("th", {textContent: x})));
  t.appendChild(el("thead")).appendChild(th);
  const tb = el("tbody");
  const oz = ozet(V, P).sort((a, b) => a.kidem - b.kidem);
  const top = {nobet: 0, kota: 0, saat: 0, hs: 0, asiri: 0, iyi: 0, kotu: 0};
  oz.forEach(x => {
    const tr = el("tr");
    if (x.ad === SECILI_KISI) tr.className = "secili";
    tr.appendChild(hucreAd(x.kisa, x.ad));
    tr.appendChild(sayiHucre(x.atanan + "/" + x.kota));
    tr.appendChild(sayiHucre(x.saat));
    const f = Math.round(x.saat - x.hedef_saat);
    tr.appendChild(sayiHucre((f > 0 ? "+" : "") + f, Math.abs(f) > 8 ? "sayi-sinir" : ""));
    tr.appendChild(sayiHucre(x.hs));
    tr.appendChild(sayiHucre(x.asiri, x.asiri ? "sayi-sinir" : ""));
    tr.appendChild(sayiHucre("+" + x.istedigi + " −" + x.istemedigi, x.istemedigi ? "sayi-ihlal" : ""));
    tr.onclick = () => kisiSec(x.ad);
    tb.appendChild(tr);
    top.nobet += x.atanan; top.kota += x.kota; top.saat += x.saat;
    top.hs += x.hs; top.asiri += x.asiri; top.iyi += x.istedigi; top.kotu += x.istemedigi;
  });
  const tr = el("tr", {className: "toplam-satir"});
  tr.appendChild(hucreAd("Toplam"));
  tr.appendChild(sayiHucre(top.nobet + "/" + top.kota));
  tr.appendChild(sayiHucre(top.saat));
  tr.appendChild(sayiHucre("—"));
  tr.appendChild(sayiHucre(top.hs));
  tr.appendChild(sayiHucre(top.asiri));
  tr.appendChild(sayiHucre("+" + top.iyi + " −" + top.kotu));
  tb.appendChild(tr);
  t.appendChild(tb);
  ic.appendChild(t);
}

/* ---------- 3 · çıktı ---------- */

function ciktiSatirlar() {
  const turler = turListe();
  const bas = ["Tarih", "Gün"].concat(turler.map(turAdi)).concat(V._sut);
  const sat = [bas];
  for (let g = 1; g <= V._gun; g++) {
    const r = [tarihStr(V, g), GUNTAM[V._hg[g]]];
    turler.forEach(t => r.push(uzmanOGun(V, g, t) || ""));
    V.sutunlar.forEach((s, si) => {
      const ad = P ? P.al(g, si) : null;
      r.push(ad ? V._kisi[ad].ad : "");
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
  if (!P) {
    ic.appendChild(bosDurum("Çıktı yok", "Önce 2 · Liste aşamasında listeyi oluştur.",
      "Listeyi Oluştur", () => { coz_et(); ciz_cikti(); }));
    return;
  }
  const sat = ciktiSatirlar();
  const t = el("table", {className: "tbl tbl-gridline"});
  const th = el("tr");
  sat[0].forEach(x => th.appendChild(el("th", {textContent: x})));
  t.appendChild(el("thead")).appendChild(th);
  const tb = el("tbody");
  sat.slice(1).forEach((r, i) => {
    const g = i + 1;
    const tr = el("tr");
    if (V._tatil.has(g)) tr.className = "tatil-satir";
    else if (V._hs[g]) tr.className = "hafta-sonu";
    r.forEach((x, j) => {
      if (j < 2) tr.appendChild(el("td", {className: "tarih-hucre", textContent: x}));
      else tr.appendChild(hucreAd(x || "—"));
    });
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  ic.appendChild(t);
}

/* ---------- kurallar çekmecesi ---------- */

const EGIM = [[-1, "Az"], [0, "—"], [1, "Çok"]];

function kuralAc() {
  $("#perde").dataset.acik = "1";
  $("#cekmece").dataset.acik = "1";
  ciz_kural();
}
function kuralKapat() {
  $("#perde").dataset.acik = "0";
  $("#cekmece").dataset.acik = "0";
}

function ciz_kural() {
  const ic = $("#kuralIc"); ic.innerHTML = "";

  const b1 = el("div", {className: "blok-bas"});
  b1.appendChild(el("span", {textContent: "Ağırlıklar"}));
  b1.appendChild(el("span", {className: "bosluk"}));
  b1.appendChild(ipucu(
    "Büyük değer o başlığa daha çok önem verir. Kota ve nöbet ertesi izni ağırlıklarla delinemez; onlar katıdır. " +
    "Sağdaki ok düğmesi o ağırlığı varsayılanına döndürür."));
  b1.style.display = "flex";
  b1.style.alignItems = "center";
  b1.style.gap = "var(--tk-sp-2)";
  ic.appendChild(b1);

  Object.keys(VARSAYILAN_AGIRLIK).forEach(a => {
    const r = el("div", {className: "ayar-satir"});
    const et = el("span", {className: "ayar-etiket"});
    et.appendChild(el("span", {textContent: AGIRLIK_ETIKET[a] || a}));
    et.appendChild(el("span", {className: "ayar-nokta"}));
    r.appendChild(et);
    const inp = el("input", {className: "gir gir-mini", type: "number", step: "0.01", value: String(V.agirlik[a])});
    inp.setAttribute("aria-label", AGIRLIK_ETIKET[a] || a);
    inp.onchange = () => {
      const x = parseFloat(inp.value);
      V.agirlik[a] = isNaN(x) ? VARSAYILAN_AGIRLIK[a] : x;
      P = null; tazele();
    };
    r.appendChild(inp);
    const vr = el("button", {type: "button", className: "ayar-sifirla", textContent: "↺",
      title: "Varsayılana dön (" + VARSAYILAN_AGIRLIK[a] + ")"});
    vr.disabled = V.agirlik[a] === VARSAYILAN_AGIRLIK[a];
    vr.onclick = () => { V.agirlik[a] = VARSAYILAN_AGIRLIK[a]; P = null; tazele(); };
    r.appendChild(vr);
    ic.appendChild(r);
  });

  const b2 = el("div", {className: "blok-bas"});
  b2.appendChild(el("span", {textContent: "Hafta günü eğimi"}));
  b2.appendChild(el("span", {className: "bosluk"}));
  b2.appendChild(ipucu(
    "Kıdemlinin o günden ne kadar alacağını belirler. Çok: kıdemli o günü daha az tutar, çömeze kayar. " +
    "Az: kıdemli o günü bir tık daha çok tutar — perşembe böyle ayarlıdır, çünkü perşembe nöbeti tercih edilir. " +
    "Etkinin büyüklüğü Hafta günü dengesi ağırlığına bağlıdır."));
  b2.style.display = "flex";
  b2.style.alignItems = "center";
  b2.style.gap = "var(--tk-sp-2)";
  ic.appendChild(b2);

  const serit = el("div", {className: "egim-serit"});
  GUNADI.forEach((ad, d) => {
    const s = el("div", {className: "egim-sutun"});
    s.appendChild(el("div", {className: "egim-bas", textContent: ad}));
    EGIM.forEach(([deger, et]) => {
      const b = el("button", {type: "button", className: "egim-dgm", textContent: et,
        title: ad + " · " + et});
      b.setAttribute("aria-pressed", V.gun_tilt[d] === deger ? "true" : "false");
      b.onclick = () => { V.gun_tilt[d] = deger; P = null; tazele(); };
      s.appendChild(b);
    });
    serit.appendChild(s);
  });
  ic.appendChild(serit);

  ic.appendChild(el("div", {className: "blok-bas", textContent: "Sunum günleri"}));
  const sg = el("div", {className: "satir"});
  GUNADI.forEach((ad, i) => {
    const b = el("button", {type: "button", className: "acma", textContent: ad});
    b.setAttribute("aria-pressed", V.sunum_gunleri.indexOf(i) >= 0 ? "true" : "false");
    b.onclick = () => {
      if (V.sunum_gunleri.indexOf(i) < 0) V.sunum_gunleri.push(i);
      else V.sunum_gunleri = V.sunum_gunleri.filter(x => x !== i);
      P = null; normalize(V); tazele();
    };
    sg.appendChild(b);
  });
  ic.appendChild(sg);

  ic.appendChild(el("div", {className: "blok-bas", textContent: "Otomatik ayar"}));
  const so = el("div", {className: "satir"});
  const bo = el("button", {className: "dgm dgm-birincil", type: "button", textContent: "Ağırlıkları Tara"});
  bo.onclick = () => {
    bo.disabled = true;
    toast("Ağırlıklar taranıyor…");
    setTimeout(() => {
      const t0 = Date.now();
      const r = oto(V, 20, 8000, TOHUM);
      P = coz(V, TUR, TOHUM);
      SECILI_KISI = null; VURGU = new Set();
      sakla(); ciz_kural(); ciz_liste();
      toast("Ağırlık ayarlandı · denge " + r.skor.toFixed(0) + " · " + ((Date.now() - t0) / 1000).toFixed(1) + " sn");
    }, 30);
  };
  so.appendChild(bo);
  ic.appendChild(so);
  ic.appendChild(el("div", {className: "bilgi", textContent:
    "Ağırlıkların 20 farklı bileşimini dener, her birini ağırlıklardan bağımsız bir denge ölçüsüyle puanlar, " +
    "en dengeli çıkanı bırakır ve listeyi yeniden kurar. Birkaç saniye sürer."}));

  ic.appendChild(el("div", {className: "blok-bas", textContent: "Sütunlar"}));
  const st = el("table", {className: "tbl tbl-gridline"});
  const sth = el("tr");
  ["Sütun", "Tür", "Zorunluluk"].forEach(x => sth.appendChild(el("th", {textContent: x})));
  st.appendChild(el("thead")).appendChild(sth);
  const stb = el("tbody");
  V.sutunlar.forEach(s => {
    const tr = el("tr");
    tr.appendChild(hucreAd(s.ad));
    tr.appendChild(hucreAd(s.tur === "yb" ? "Yoğun bakım" : "Ameliyathane"));
    tr.appendChild(hucreAd(s.opsiyonel ? "Opsiyonel" : "Zorunlu"));
    stb.appendChild(tr);
  });
  st.appendChild(stb);
  ic.appendChild(st);
}

/* ---------- kabuk ---------- */

function baslat() {
  $("#ay").value = V.yil + "-" + String(V.ay).padStart(2, "0");
  $("#basbarAy").textContent = AYLAR[V.ay - 1] + " " + V.yil;
  if (SECILI_GUN > V._gun) SECILI_GUN = 1;
  adimSec(AKTIF);
}

function ayYukle(y, a) {
  const arsiv = DEPO.oku(ayAnahtar(y, a));
  if (arsiv) { V = normalize(JSON.parse(arsiv)); toast(AYLAR[a - 1] + " " + y + " arşivden açıldı"); }
  else {
    V.yil = y; V.ay = a;
    V.kilit = {}; V.uzman = {}; V.tatil = []; V.sunum_yok = [];
    V.asistanlar.forEach(k => { k.izin = []; k.istiyor = []; k.istemiyor = []; });
    normalize(V);
  }
  P = null; SECILI_KISI = null; VURGU = new Set(); SECILI_GUN = 1;
  sakla(); baslat();
}

const ilk = DEPO.oku(LSKEY);
V = ilk ? normalize(JSON.parse(ilk)) : bosVeri();

adimlar();
baslat();

document.addEventListener("click", ipucuKapat);
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (IPUCU_ACIK) { ipucuKapat(); return; }
  kuralKapat();
});

$("#ay").onchange = () => {
  const p = $("#ay").value.split("-");
  if (p.length === 2) ayYukle(parseInt(p[0], 10), parseInt(p[1], 10));
};

$("#btnCoz").onclick = coz_et;
$("#btnKurallar").onclick = kuralAc;
$("#btnKuralKapat").onclick = kuralKapat;
$("#perde").onclick = kuralKapat;

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
      P = null; SECILI_KISI = null; VURGU = new Set(); SECILI_GUN = 1;
      sakla(); baslat(); toast("Yüklendi");
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
    else if (d.tur === "veri") { try { sessionStorage.setItem("senkBildirim", "Başka bilgisayardaki değişiklikler geldi"); } catch (_) {} location.reload(); }
    else if (d.tur === "kod") toast("Yeni sürüm geldi, program yenileniyor…");
  });
  e.onclick = () => { goster({ asama: "esitleniyor" }); S.simdi(); };
  try { const m = sessionStorage.getItem("senkBildirim"); if (m) { sessionStorage.removeItem("senkBildirim"); setTimeout(() => toast(m), 400); } } catch (_) {}
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
