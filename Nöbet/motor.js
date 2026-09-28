"use strict";

const GUNADI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const GUNTAM = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const iki = x => String(x).padStart(2, "0");
function tarihStr(v, g) { return iki(g) + "." + iki(v.ay) + "." + iki(v.yil % 100); }
function tarihUzun(v, g) { return tarihStr(v, g) + " - " + GUNTAM[v._hg[g]]; }

const GRUP_ADI = ["Pzt+Sal", "Per", "Cum", "Cmt/Tatil", "Paz"];
const HAFTA_GRUP = [0, 0, -1, 1, 2, 3, 4];
const GRUP_EGIM = [0, -1, 0, 1, 1];
const BOS_CEZA = 2000;

const VARSAYILAN_AGIRLIK = {
  grup_dengesi: 4, ucret_dengesi: 3, istemedigi_gun: 20, istedigi_gun: 6,
  rutin_ybu: 15, asiri_zincir: 40, gun_asiri: 1, uzman_tekrari: 1,
  odunc: 300, kidem_bonusu: 0.15, isteksizlik_bonusu: 0.05
};
const AGIRLIK_ETIKET = {
  grup_dengesi: "Gün grubu dengesi", ucret_dengesi: "Ücret dengesi",
  istemedigi_gun: "İstemediği gün", istedigi_gun: "İstediği gün",
  rutin_ybu: "Rutini YBÜ olanlar aynı gün", asiri_zincir: "Üç gün aşırı zinciri",
  gun_asiri: "Gün aşırı (1-3)", uzman_tekrari: "Aynı uzmanla tekrar",
  odunc: "Sonraki sütundan ödünç", kidem_bonusu: "Kıdem bonusu", isteksizlik_bonusu: "İsteksizlik bonusu"
};
const AGIRLIK_ACIKLAMA = {
  grup_dengesi: "Pzt+Sal, Per, Cum, Cmt/Tatil ve Paz nöbetleri kişinin nöbet sayısıyla orantılı dağılsın. Çarşamba dengelenmez.",
  ucret_dengesi: "Nöbet başına saat herkeste aynı olsun: 5 nöbet tutan 5 birim, 8 tutan 8 birim alsın. Hafta içi 8, Cuma ve Pazar 16, Cumartesi ve tatil 24 saat.",
  istemedigi_gun: "Kişinin istemediği güne yazılmasının cezası.",
  istedigi_gun: "Kişinin istediği güne yazılmasının ödülü.",
  rutin_ybu: "Rutin yeri YBÜ olan iki kişi, sütun fark etmeksizin aynı gün nöbette olursa ceza.",
  asiri_zincir: "1-3-5 gibi üst üste iki kez gün aşırı tutmanın cezası. Tek gün aşırı (1-3) serbesttir.",
  gun_asiri: "Tek gün aşırıya küçük ceza; nöbetler ay içine yayılsın diye.",
  uzman_tekrari: "Aynı uzmanla ikinci kez nöbet tutmanın cezası.",
  odunc: "Sütun kendi kişileriyle dolmazsa sonraki sütunun en çömezinden alınır; her ödünç nöbetin bedeli.",
  kidem_bonusu: "Kıdemliye biraz daha az hafta sonu, biraz daha çok perşembe; istekleri biraz daha ağır basar.",
  isteksizlik_bonusu: "Az istek belirtene aynı kıdem bonusu, daha küçük ölçüde."
};

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
    {ad: "YBÜ Kıdemli", tur: "yb"}, {ad: "Ameliyathane Kıdemli", tur: "amel"},
    {ad: "YBÜ Çömez", tur: "yb"}, {ad: "Ameliyathane Çömez", tur: "amel", opsiyonel: true}];
  if (!v.uzman) v.uzman = {};
  if (!v.tatil) v.tatil = [];
  if (!v.kilit) v.kilit = {};
  if (!v.liste) v.liste = {};
  if (!v.onay) v.onay = {};
  if (!v.dagitim) v.dagitim = {};
  if (!v.tohum) v.tohum = {};
  if (!v.asistanlar) v.asistanlar = [];
  const eski = v.motor === 2 ? (v.agirlik || {}) : {};
  v.motor = 2;
  v.agirlik = {};
  Object.keys(VARSAYILAN_AGIRLIK).forEach(a => {
    v.agirlik[a] = typeof eski[a] === "number" ? eski[a] : VARSAYILAN_AGIRLIK[a];
  });
  delete v.sunum_gunleri; delete v.sunum_yok; delete v.gun_tilt;
  const sut = v.sutunlar.map(s => s.ad);
  v.asistanlar.forEach((k, i) => {
    if (!k.kisa) k.kisa = k.ad;
    if (!k.torba) k.torba = sut.slice();
    if (typeof k.kota !== "number") k.kota = 0;
    if (k.rutin !== "yb" && k.rutin !== "amel") k.rutin = "";
    delete k.ozel;
    k.izin = gunlerAc(k.izin);
    k.istiyor = gunlerAc(k.istiyor);
    k.istemiyor = gunlerAc(k.istemiyor);
    k._kidem = i;
  });
  v._gun = ayGun(v.yil, v.ay);
  v._kisi = {};
  v.asistanlar.forEach(k => { v._kisi[k.ad] = k; });
  v._sut = sut;
  v._tatil = new Set(gunlerAc(v.tatil));
  hazirla(v);
  return v;
}

function gunSaat(v, g) {
  if (v._tatil.has(g)) return 24;
  const h = v._hg[g];
  if (h === 5) return 24;
  if (h === 4 || h === 6) return 16;
  return 8;
}

function gunGrup(v, g) { return v._tatil.has(g) ? 3 : HAFTA_GRUP[v._hg[g]]; }

function hazirla(v) {
  const n = v._gun;
  v._hg = {}; v._saat = {}; v._grup = {}; v._hs = {};
  v._D = [0, 0, 0, 0, 0];
  let top = 0, nw = 0;
  for (let g = 1; g <= n; g++) {
    v._hg[g] = haftaGunu(v, g);
    v._saat[g] = gunSaat(v, g);
    v._grup[g] = gunGrup(v, g);
    v._hs[g] = v._hg[g] >= 5 || v._tatil.has(g);
    top += v._saat[g];
    if (v._grup[g] >= 0) { v._D[v._grup[g]]++; nw++; }
  }
  v._H = top / n;
  v._aktif = v.asistanlar.filter(k => k.kota > 0);
  const N = v._aktif.length;
  const istek = v._aktif.slice().sort((a, b) =>
    (a.istiyor.length + a.istemiyor.length) - (b.istiyor.length + b.istemiyor.length) || a._kidem - b._kidem);
  v._adv = {}; v._pay = {}; v._izin = {};
  v._aktif.forEach((k, rk) => {
    const ri = istek.indexOf(k);
    const ak = N > 1 ? 1 - 2 * rk / (N - 1) : 0;
    const ai = N > 1 ? 1 - 2 * ri / (N - 1) : 0;
    const adv = v.agirlik.kidem_bonusu * ak + v.agirlik.isteksizlik_bonusu * ai;
    v._adv[k.ad] = adv;
    const ham = v._D.map((d, i) => Math.max(0, d / (nw || 1) * (1 - GRUP_EGIM[i] * adv)));
    const s = ham.reduce((a, b) => a + b, 0) || 1;
    v._pay[k.ad] = ham.map(x => x / s);
    v._izin[k.ad] = new Set(k.izin);
  });
}

function uzmanOGun(v, g, tur) {
  const u = v.uzman[String(g)];
  return u ? u[tur] : null;
}

function sutunTorba(v, si) {
  const ad = v._sut[si];
  return v._aktif.filter(k => k.torba.indexOf(ad) >= 0).map(k => k.ad);
}

function tumSlotlar(v, haric) {
  const s = {};
  v._aktif.forEach(k => { s[k.ad] = []; });
  v.sutunlar.forEach((sut, si) => {
    if (si === haric) return;
    const l = v.liste[sut.ad] || {};
    Object.keys(l).forEach(gs => {
      const ad = l[gs], g = parseInt(gs, 10);
      if (s[ad] && g >= 1 && g <= v._gun) s[ad].push([g, si]);
    });
  });
  return s;
}

function kalanKota(v, si) {
  const s = tumSlotlar(v, si), o = {};
  v._aktif.forEach(k => { o[k.ad] = Math.max(0, k.kota - s[k.ad].length); });
  return o;
}

function otomatikDagitim(v, si) {
  const n = v._gun, kalan = kalanKota(v, si);
  const sut = [];
  for (let d = si; d < v.sutunlar.length; d++) sut.push(d);
  const yuk = {}, x = {};
  sut.forEach(d => { yuk[d] = 0; });
  const coklu = [];
  v._aktif.forEach(k => {
    const aday = sut.filter(d => k.torba.indexOf(v._sut[d]) >= 0);
    x[k.ad] = {};
    aday.forEach(d => { x[k.ad][d] = 0; });
    if (aday.length === 1) { x[k.ad][aday[0]] = kalan[k.ad]; yuk[aday[0]] += kalan[k.ad]; }
    else if (aday.length > 1) coklu.push({ad: k.ad, aday: aday, kalan: kalan[k.ad]});
  });
  let devam = true;
  while (devam) {
    devam = false;
    coklu.forEach(c => {
      if (c.kalan <= 0) return;
      devam = true;
      let en = null, enA = null;
      c.aday.forEach(d => {
        const acik = n - yuk[d];
        const a = [acik > 0 ? (v.sutunlar[d].opsiyonel ? 1 : 2) : 0, acik, -d];
        if (!enA || a[0] > enA[0] || (a[0] === enA[0] && (a[1] > enA[1] || (a[1] === enA[1] && a[2] > enA[2])))) { en = d; enA = a; }
      });
      x[c.ad][en]++; yuk[en]++; c.kalan--;
    });
  }
  const o = {};
  sutunTorba(v, si).forEach(ad => { o[ad] = x[ad][si] || 0; });
  return o;
}

function dagitimAl(v, si) {
  const oto = otomatikDagitim(v, si), el = v.dagitim[v._sut[si]] || {}, o = {};
  Object.keys(oto).forEach(ad => { o[ad] = typeof el[ad] === "number" ? el[ad] : oto[ad]; });
  return o;
}

function kisiMaliyet(v, ad, sl) {
  if (!sl.length) return 0;
  const w = v.agirlik, k = v._kisi[ad], adv = v._adv[ad] || 0;
  const gunler = new Set();
  const cnt = [0, 0, 0, 0, 0];
  let saat = 0, nw = 0;
  sl.forEach(s => {
    const g = s[0];
    gunler.add(g);
    saat += v._saat[g];
    const gr = v._grup[g];
    if (gr >= 0) { cnt[gr]++; nw++; }
  });
  let c = w.ucret_dengesi * Math.abs(saat - sl.length * v._H) / 8;
  const pay = v._pay[ad];
  for (let i = 0; i < 5; i++) c += w.grup_dengesi * Math.abs(cnt[i] - nw * pay[i]);
  let cift = 0, zincir = 0;
  gunler.forEach(g => {
    if (gunler.has(g + 2)) { cift++; if (gunler.has(g + 4)) zincir++; }
  });
  c += w.gun_asiri * cift + w.asiri_zincir * zincir;
  const m = 1 + 2 * adv;
  k.istemiyor.forEach(g => { if (gunler.has(g)) c += w.istemedigi_gun * m; });
  k.istiyor.forEach(g => { if (gunler.has(g)) c -= w.istedigi_gun * m; });
  if (w.uzman_tekrari) {
    const say = new Map();
    sl.forEach(s => {
      const u = uzmanOGun(v, s[0], v.sutunlar[s[1]].tur);
      if (u) say.set(u, (say.get(u) || 0) + 1);
    });
    say.forEach(x => { if (x > 1) c += w.uzman_tekrari * (x - 1); });
  }
  return c;
}

function sutunKur(v, si, tohum, tur) {
  const n = v._gun, w = v.agirlik, sutAd = v._sut[si];
  const rnd = new Zar((tohum || 1) * 7919 + si * 104729 + 1);
  const sabit = tumSlotlar(v, si);
  const kalan = kalanKota(v, si);
  const dag = dagitimAl(v, si);
  const kendi = sutunTorba(v, si);
  const cap = {}, ceza = {}, odunc = new Set();
  kendi.forEach(ad => { cap[ad] = Math.min(dag[ad] || 0, kalan[ad]); ceza[ad] = 0; });
  const havuz = [];
  if (si + 1 < v.sutunlar.length) {
    sutunTorba(v, si + 1).filter(ad => kendi.indexOf(ad) < 0 && kalan[ad] > 0)
      .sort((a, b) => v._kisi[b]._kidem - v._kisi[a]._kidem)
      .forEach((ad, i) => { havuz.push(ad); odunc.add(ad); cap[ad] = kalan[ad]; ceza[ad] = w.odunc * (1 + 0.25 * i); });
  }
  const aday = kendi.concat(havuz);
  const gunSet = {}, say = {}, kol = {};
  aday.forEach(ad => {
    gunSet[ad] = new Set(sabit[ad].map(s => s[0]));
    say[ad] = 0;
    kol[ad] = new Set();
  });
  const ybSabit = {};
  for (let g = 1; g <= n; g++) ybSabit[g] = 0;
  v._aktif.forEach(k => {
    if (k.rutin !== "yb") return;
    sabit[k.ad].forEach(s => { ybSabit[s[0]]++; });
  });
  const at = new Array(n + 1).fill(null);
  const kilitli = new Set();

  const uygun = (ad, g) => {
    if (v._izin[ad].has(g)) return false;
    const gs = gunSet[ad];
    if (gs.has(g - 1) || gs.has(g) || gs.has(g + 1)) return false;
    return say[ad] < cap[ad];
  };
  const ata = (g, ad) => { at[g] = ad; gunSet[ad].add(g); kol[ad].add(g); say[ad]++; };
  const bosalt = g => {
    const ad = at[g];
    if (!ad) return null;
    at[g] = null; gunSet[ad].delete(g); kol[ad].delete(g); say[ad]--;
    return ad;
  };
  const sl = ad => {
    const a = sabit[ad].slice();
    kol[ad].forEach(g => a.push([g, si]));
    return a;
  };
  const kisiC = ad => kisiMaliyet(v, ad, sl(ad)) + ceza[ad] * say[ad] * (1 + 0.5 * Math.max(0, say[ad] - 1));
  const gunC = g => {
    const ad = at[g];
    if (!ad) return BOS_CEZA;
    const x = ybSabit[g] + (v._kisi[ad].rutin === "yb" ? 1 : 0);
    return x > 1 ? w.rutin_ybu * x * (x - 1) / 2 : 0;
  };
  const yerel = (adlar, gunler) => {
    let c = 0;
    adlar.forEach(ad => { if (ad) c += kisiC(ad); });
    gunler.forEach(g => { c += gunC(g); });
    return c;
  };

  Object.keys(v.kilit).forEach(gs => {
    const ad = (v.kilit[gs] || {})[sutAd], g = parseInt(gs, 10);
    if (!ad || !gunSet[ad] || g < 1 || g > n || at[g]) return;
    const eskiCap = cap[ad];
    cap[ad] = Math.max(cap[ad], say[ad] + 1);
    if (uygun(ad, g)) { ata(g, ad); kilitli.add(g); } else cap[ad] = eskiCap;
  });

  let kalanGun = [];
  for (let g = 1; g <= n; g++) if (!at[g]) kalanGun.push(g);
  const uygunSay = g => kendi.filter(ad => uygun(ad, g)).length;
  const bos = [];
  while (kalanGun.length) {
    let ei = 0, es = Infinity;
    kalanGun.forEach((g, i) => {
      const s = uygunSay(g) + rnd.next() * 0.1;
      if (s < es) { es = s; ei = i; }
    });
    const g = kalanGun.splice(ei, 1)[0];
    const adaylar = kendi.filter(ad => uygun(ad, g));
    if (!adaylar.length) { bos.push(g); continue; }
    let en = null, enp = 0;
    adaylar.forEach(ad => {
      let serbest = 0;
      kalanGun.forEach(d => { if (uygun(ad, d)) serbest++; });
      const aciliyet = (cap[ad] - say[ad]) / Math.max(1, serbest);
      const once = kisiC(ad);
      ata(g, ad);
      const sonra = kisiC(ad) + gunC(g);
      bosalt(g);
      const p = (sonra - once) - 1000 * aciliyet + rnd.next() * 0.01;
      if (en === null || p < enp) { en = ad; enp = p; }
    });
    ata(g, en);
  }

  const doldur = (g, grup) => {
    let en = null, enp = 0;
    grup.forEach(ad => {
      if (!uygun(ad, g)) return;
      const once = kisiC(ad);
      ata(g, ad);
      const p = kisiC(ad) - once + gunC(g);
      bosalt(g);
      if (en === null || p < enp) { en = ad; enp = p; }
    });
    if (en) { ata(g, en); return true; }
    return false;
  };
  const tasi = (g, dolduran) => {
    for (let g2 = 1; g2 <= n; g2++) {
      if (!at[g2] || kilitli.has(g2)) continue;
      const r = bosalt(g2);
      if (uygun(r, g)) {
        ata(g, r);
        if (doldur(g2, dolduran)) return true;
        bosalt(g);
      }
      ata(g2, r);
    }
    return false;
  };
  const acik = bos.slice();
  bos.length = 0;
  acik.forEach(g => {
    if (at[g]) return;
    if (doldur(g, kendi) || tasi(g, kendi)) return;
    if (doldur(g, havuz) || tasi(g, havuz)) return;
    bos.push(g);
  });

  const serbestGun = [];
  for (let g = 1; g <= n; g++) if (!kilitli.has(g)) serbestGun.push(g);
  let toplam = 0;
  aday.forEach(ad => { toplam += kisiC(ad); });
  for (let g = 1; g <= n; g++) toplam += gunC(g);
  let enIyi = toplam, enAt = at.slice();
  const T0 = 3, T1 = 0.02;
  tur = tur || 30000;
  if (serbestGun.length) for (let t = 0; t < tur; t++) {
    const T = T0 * Math.pow(T1 / T0, t / tur);
    if (rnd.next() < 0.5) {
      const g1 = rnd.sec(serbestGun), g2 = rnd.sec(serbestGun);
      const a = at[g1], b = at[g2];
      if (g1 === g2 || !a || !b || a === b) continue;
      const once = yerel([a, b], [g1, g2]);
      bosalt(g1); bosalt(g2);
      if (uygun(a, g2) && uygun(b, g1)) {
        ata(g2, a); ata(g1, b);
        const d = yerel([a, b], [g1, g2]) - once;
        if (d <= 0 || rnd.next() < Math.exp(-d / T)) {
          toplam += d;
          if (toplam < enIyi - 1e-9) { enIyi = toplam; enAt = at.slice(); }
          continue;
        }
        bosalt(g1); bosalt(g2);
      }
      ata(g1, a); ata(g2, b);
    } else {
      const g = rnd.sec(serbestGun), q = rnd.sec(aday), eski = at[g];
      if (q === eski) continue;
      const once = yerel([eski, q], [g]);
      bosalt(g);
      if (uygun(q, g)) {
        ata(g, q);
        const d = yerel([eski, q], [g]) - once;
        if (d <= 0 || rnd.next() < Math.exp(-d / T)) {
          toplam += d;
          if (toplam < enIyi - 1e-9) { enIyi = toplam; enAt = at.slice(); }
          continue;
        }
        bosalt(g);
      }
      if (eski) ata(g, eski);
    }
  }

  const atama = {}, bosG = [], oduncG = [];
  for (let g = 1; g <= n; g++) {
    if (enAt[g]) {
      atama[String(g)] = enAt[g];
      if (odunc.has(enAt[g])) oduncG.push(g);
    } else bosG.push(g);
  }
  return {atama: atama, bos: bosG, odunc: oduncG, maliyet: enIyi};
}

function durum(v) {
  const s = tumSlotlar(v, -1), n = v._gun;
  const kisiler = v._aktif.map(k => {
    const sl = s[k.ad];
    const gunler = new Set(sl.map(x => x[0]));
    const cnt = [0, 0, 0, 0, 0];
    let saat = 0, nw = 0, car = 0;
    gunler.forEach(g => {
      saat += v._saat[g];
      const gr = v._grup[g];
      if (gr >= 0) { cnt[gr]++; nw++; } else car++;
    });
    const cift = [], zincir = [];
    Array.from(gunler).sort((a, b) => a - b).forEach(g => {
      if (gunler.has(g + 2)) { cift.push(g); if (gunler.has(g + 4)) zincir.push(g); }
    });
    return {
      ad: k.ad, kisa: k.kisa, kidem: k._kidem, kota: k.kota, rutin: k.rutin,
      slot: sl, gunler: gunler, nobet: sl.length, saat: saat, car: car,
      grup: cnt, hedef: v._pay[k.ad].map(p => p * nw),
      endeks: sl.length ? saat / (sl.length * v._H) : 0,
      cift: cift, zincir: zincir,
      istedigi: k.istiyor.filter(g => gunler.has(g)),
      istemedigi: k.istemiyor.filter(g => gunler.has(g)),
      izinde: k.izin.filter(g => gunler.has(g)),
      bitisik: Array.from(gunler).filter(g => gunler.has(g + 1)),
      cokGun: sl.length - gunler.size,
      odunc: sl.filter(x => k.torba.indexOf(v._sut[x[1]]) < 0)
    };
  });
  const ybGun = [];
  for (let g = 1; g <= n; g++) {
    const ad = kisiler.filter(x => x.rutin === "yb" && x.gunler.has(g)).map(x => x.ad);
    if (ad.length > 1) ybGun.push({g: g, adlar: ad});
  }
  const bos = {};
  v.sutunlar.forEach(sut => {
    const l = v.liste[sut.ad] || {}, b = [];
    for (let g = 1; g <= n; g++) if (!l[String(g)]) b.push(g);
    bos[sut.ad] = b;
  });
  return {kisiler: kisiler, ybGun: ybGun, bos: bos};
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {normalize, sutunKur, durum, otomatikDagitim, dagitimAl, kalanKota, sutunTorba,
    tarihStr, GRUP_ADI, GUNADI};
  if (require.main === module) {
    const fs = require("fs");
    const v = normalize(JSON.parse(fs.readFileSync(process.argv[2], "utf-8")));
    const tur = parseInt(process.argv[3] || "30000", 10);
    v.liste = {}; v.onay = {};
    v.sutunlar.forEach((sut, si) => {
      const t0 = Date.now();
      const r = sutunKur(v, si, 7, tur);
      v.liste[sut.ad] = r.atama;
      v.onay[sut.ad] = true;
      console.log(sut.ad, "| dolu", Object.keys(r.atama).length + "/" + v._gun, "| boş", r.bos.join(",") || "-",
        "| ödünç", r.odunc.map(g => g + ":" + v._kisi[r.atama[g]].kisa).join(" ") || "-",
        "| maliyet", r.maliyet.toFixed(1), "|", (Date.now() - t0) + " ms");
    });
    const d = durum(v);
    console.log("\nkişi        nöbet/kota  " + GRUP_ADI.join(" ") + " Çar  saat  endeks  zincir  ödünç");
    d.kisiler.forEach(x => {
      console.log(x.kisa.padEnd(12), (x.nobet + "/" + x.kota).padEnd(11),
        x.grup.map((c, i) => (c + "~" + x.hedef[i].toFixed(1)).padEnd(Math.max(GRUP_ADI[i].length, 6) + 1)).join(""),
        String(x.car).padEnd(4), String(x.saat).padEnd(5), (x.endeks * 100).toFixed(0).padEnd(7) + "%",
        x.zincir.join(",") || "-", x.odunc.length ? x.odunc.map(s => s[0]).join(",") : "");
    });
    console.log("\nrutin YBÜ çakışma:", d.ybGun.map(x => x.g + "(" + x.adlar.length + ")").join(" ") || "yok");
  }
}
