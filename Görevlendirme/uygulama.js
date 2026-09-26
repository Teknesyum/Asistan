"use strict";

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const GUNADI = ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
const GUNADI_UZUN = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
const LSKEY = "asistan-gorevlendirme-v2";
const ayAnahtar = (y, a) => LSKEY + ":" + y + "-" + String(a).padStart(2, "0");
const OLCU_ANAHTAR = "asistan-gorevlendirme-olcu";
const OLCU_VAR = {gosterge: "--g-kol", sol: "--sol-satir", solAlt: "--sa-kol", sag: "--sag-satir"};
const OLCU = (() => { try { return JSON.parse(localStorage.getItem(OLCU_ANAHTAR)) || {}; } catch (e) { return {}; } })();

function olcuUygula() {
  const k = document.documentElement;
  for (const ad in OLCU_VAR) if (OLCU[ad]) k.style.setProperty(OLCU_VAR[ad], OLCU[ad] + "fr");
}

function autofitHemen() {
  document.querySelectorAll("#s-gosterge .pnl-icerik").forEach(e => {
    e.style.zoom = "1";
    e.style.setProperty("--satir-y", "0px");
    if (!e.clientHeight) return;
    const tasar = () => e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth;
    if (tasar()) {
      let alt = 0.5, ust = 1;
      while (ust - alt > 0.01) {
        const z = (alt + ust) / 2;
        e.style.zoom = z.toFixed(3);
        if (tasar()) ust = z; else alt = z;
      }
      e.style.zoom = alt.toFixed(3);
      return;
    }
    let alt = 0, ust = 12;
    e.style.setProperty("--satir-y", ust + "px");
    if (!tasar()) return;
    while (ust - alt > 0.05) {
      const y = (alt + ust) / 2;
      e.style.setProperty("--satir-y", y.toFixed(2) + "px");
      if (tasar()) ust = y; else alt = y;
    }
    e.style.setProperty("--satir-y", alt.toFixed(2) + "px");
  });
}
let autofitIstek = 0;
function autofit() {
  if (autofitIstek) return;
  autofitIstek = requestAnimationFrame(() => { autofitIstek = 0; autofitHemen(); });
}

function ayiraclar() {
  document.querySelectorAll(".ayirac").forEach(a => {
    const ad = a.dataset.ayirac, kap = a.parentElement, dik = a.classList.contains("ayirac-dikey");
    a.onmousedown = e => {
      e.preventDefault();
      const r = kap.getBoundingClientRect();
      const tasi = m => {
        const p = dik ? (m.clientX - r.left) / r.width : (m.clientY - r.top) / r.height;
        const o = Math.min(0.85, Math.max(0.15, p));
        OLCU[ad] = (o / (1 - o)).toFixed(3);
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

const IMZA_ADRES = "https://github.com/Teknesyum";
document.getElementById("imza").onclick = () => {
  if (window.pencere && window.pencere.ac) window.pencere.ac(IMZA_ADRES);
  else window.open(IMZA_ADRES, "_blank", "noopener");
};

const DEPO = (window.pencere && window.pencere.veri)
  ? {disk: true,
     oku: k => { try { return window.pencere.veri.oku(k); } catch (e) { return null; } },
     yaz: (k, m) => window.pencere.veri.yaz(k, m)}
  : {disk: false,
     oku: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
     yaz: (k, m) => localStorage.setItem(k, m)};

if (DEPO.disk && !DEPO.oku(LSKEY)) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === LSKEY || k.indexOf(LSKEY + ":") === 0) DEPO.yaz(k, localStorage.getItem(k));
    }
  } catch (e) {}
}

const VARSAYILAN = {
  yil: 2026, ay: 9,
  asistanlar: [
    {ad:"MustafaÖ", kisa:"MustafaÖ", yer:"BaşAsistan"},
    {ad:"Ayşe", kisa:"Ayşe", yer:"GenelCerrahi"},
    {ad:"Bahtiyar", kisa:"Bahtiyar", yer:"Ybü2"},
    {ad:"Ali", kisa:"Ali", yer:"Ortopedi"},
    {ad:"FatihTalha", kisa:"F.Talha", yer:"Ortopedi"},
    {ad:"Emrah", kisa:"Emrah", yer:"GenelCerrahi"},
    {ad:"MustafaD", kisa:"MustafaD", yer:"Ybü1"},
    {ad:"SümeyyeD", kisa:"SümeyyeD", yer:"Kbb"},
    {ad:"Hilal", kisa:"Hilal", yer:"Kvc"},
    {ad:"Eyyüp", kisa:"Eyyüp", yer:"PlastikGöğüs"},
    {ad:"BayramAli", kisa:"B.Ali", yer:"İzin"},
    {ad:"Büşra", kisa:"Büşra", yer:"Ybü2"},
    {ad:"Rümeysa", kisa:"Rümeysa", yer:"Bblok"},
    {ad:"Harun", kisa:"Harun", yer:"Pol"},
    {ad:"FatihEren", kisa:"FatihE", yer:"Üroloji", kademe:0},
    {ad:"Ömer", kisa:"Ömer", yer:"GenelCerrahi", kademe:0},
    {ad:"Alperen", kisa:"Alperen", yer:"GenelCerrahi", kademe:0}
  ],
  zorunlu_yerler: ["Pol","Ybü1","Ybü2","Bblok"],
  havuz_disi_yerler: ["BaşAsistan","İzin"],
  gruplar: {"Ybü1":"Ybü","Ybü2":"Ybü"},
  yer_min_kademe: {"Ybü1":1,"Ybü2":1},
  yer_kadro: {"Ybü1":"tek","Ybü2":"tek"},
  kural: {
    yb_nobetci_o_gun_yok: false,
    amel_nobetci_o_gun_yok: false,
    nobet_ertesi_yok: true,
  },
  agirlik: { kidem_farki: 1, toplam_gorev: 4, ayni_yer_tekrari: 3, dun_de_gonderildi: 3 },
  sabit: {},
  yer_adet: {},
  refakat: [
    {ad:"Alperen", yer:"Pol", gun:10},
    {ad:"Ömer", yer:"Pol", gun:10}
  ],
  onceki_ay_son_gun_nobet: { yb: [], amel: [] },
  nobet: {
    "1":{yb:["Ayşe","Büşra"],amel:["Rümeysa","Alperen"]},
    "2":{yb:["MustafaD","FatihEren"],amel:["SümeyyeD","Ömer"]},
    "3":{yb:["Ali","Büşra"],amel:["Emrah","Rümeysa"]},
    "4":{yb:["Bahtiyar","FatihEren"],amel:["Ayşe","Alperen"]},
    "5":{yb:["MustafaÖ","Harun"],amel:["Eyyüp","Ömer"]},
    "6":{yb:["Bahtiyar","FatihEren"],amel:["Ayşe","Alperen"]},
    "7":{yb:["MustafaD","Harun"],amel:["SümeyyeD"]},
    "8":{yb:["MustafaÖ","Ömer"],amel:["Eyyüp"]},
    "9":{yb:["MustafaD","Alperen"],amel:["Hilal"]},
    "10":{yb:["MustafaÖ","FatihEren"],amel:["FatihTalha"]},
    "11":{yb:["Bahtiyar","Harun"],amel:["Emrah","Ömer"]},
    "12":{yb:["MustafaD"],amel:["SümeyyeD"]},
    "13":{yb:["Bahtiyar","Harun"],amel:["Eyyüp","Ömer"]},
    "14":{yb:["Ayşe","Büşra"],amel:["SümeyyeD","Alperen"]},
    "15":{yb:["MustafaD","Rümeysa"],amel:["FatihTalha","Harun"]},
    "16":{yb:["Ayşe","Büşra"],amel:["Ali","Ömer"]},
    "17":{yb:["Bahtiyar","Harun"],amel:["Eyyüp","Alperen"]},
    "18":{yb:["MustafaD","Rümeysa"],amel:["FatihTalha"]},
    "19":{yb:["Ali","Büşra"],amel:["Hilal"]},
    "20":{yb:["MustafaD","Rümeysa"],amel:["SümeyyeD"]},
    "21":{yb:["Bahtiyar","FatihEren"],amel:["Hilal","Ömer"]},
    "22":{yb:["MustafaÖ","Büşra"],amel:["FatihTalha","Alperen"]},
    "23":{yb:["Ali","FatihEren"],amel:["Emrah"]},
    "24":{yb:["MustafaD","Rümeysa"],amel:["SümeyyeD","Ömer"]},
    "25":{yb:["Ali","Büşra"],amel:["Hilal"]},
    "26":{yb:["Bahtiyar","FatihEren"],amel:["Emrah","Alperen"]},
    "27":{yb:["FatihTalha","Harun"],amel:["Hilal"]},
    "28":{yb:["MustafaÖ","Büşra"],amel:["Eyyüp","Rümeysa"]},
    "29":{yb:["Bahtiyar","Harun"],amel:["Hilal","FatihEren"]},
    "30":{yb:["Emrah","Rümeysa"],amel:["Eyyüp"]}
  },
  ders: {},
  izin: [
    {gunler:"1-4", kisiler:["FatihTalha","Hilal"]},
    {gunler:"7-11", kisiler:["Ali","Büşra","Rümeysa"]},
    {gunler:"14-18", kisiler:["MustafaÖ","FatihEren"]},
    {gunler:"21-25", kisiler:["Ayşe","Eyyüp","Harun"]}
  ],
  egitim: [
    {gunler:"1-11", kisiler:["FatihEren","Ömer","Alperen"]}
  ],
  force: {},
  degisim: [],
  gecmis: {
    "1":{"SümeyyeD":"Pol"},
    "2":{"Emrah":"Ybü1","Eyyüp":"Bblok"},
    "3":{"Ayşe":"Ybü1"},
    "4":{"SümeyyeD":"Bblok","Eyyüp":"Ybü2"}
  }
};

const KURAL_ETIKET = {
  yb_nobetci_o_gun_yok: "Yoğun bakım nöbetçisi nöbet günü başka yere gönderilmez",
  amel_nobetci_o_gun_yok: "Ameliyathane nöbetçisi nöbet günü başka yere gönderilmez",
  yb_nobetci_ybu_tercih: "Boş YBÜ görevine o günün yoğun bakım nöbetçisi tercih edilir"
};
const KURAL_DURUM = ["yb_nobetci_o_gun_yok", "amel_nobetci_o_gun_yok", "yb_nobetci_ybu_tercih"];
function kuralRozet(k, isaretli) {
  if (k === "yb_nobetci_ybu_tercih") {
    if (V.kural.yb_nobetci_o_gun_yok)
      return {metin: "1. kural açıkken geçersiz", hayir: true, pasif: true};
    return {metin: isaretli ? "Tercih edilir" : "Tercih yok", hayir: false, pasif: false};
  }
  return {metin: isaretli ? "Mümkün değil" : "Mümkün", hayir: isaretli, pasif: false};
}
const KADRO_SIRA = ["tek", "kidemli_tek", "cift"];
const KADRO_KISA = { tek: "Tek", kidemli_tek: "Kıd.Tek", cift: "Çift" };
const KADRO_ETIKET = {
  tek: "Her zaman tek kişi gönderilir",
  kidemli_tek: "Kıdem eşiğini geçen biri düşerse tek, düşmezse yanına ikinci kişi",
  cift: "Her zaman çift kişi gönderilir"
};
const AGIRLIK_KISA = {
  kidem_farki: "Kıdem farkı",
  toplam_gorev: "Toplam yük",
  ayni_yer_tekrari: "Aynı yer",
  dun_de_gonderildi: "Dün de gitti",
  kidem_yuku: "Kıdem yükü"
};
const AGIRLIK_ETIKET = {
  kidem_farki: "Kıdem uyumsuzluğu cezası",
  toplam_gorev: "Çok görev almış olma cezası",
  ayni_yer_tekrari: "Aynı yere tekrar gitme cezası",
  dun_de_gonderildi: "Dün de görevlendirilmiş olma cezası",
  kidem_yuku: "Kıdemli olma cezası (üsttekiler daha az gitsin)"
};

let V = yukle();
let SON = null;
let BUGUN = 1;

function yukle() {
  try {
    const s = DEPO.oku(LSKEY);
    if (s) return normalize(JSON.parse(s));
  } catch (e) {}
  return normalize(JSON.parse(JSON.stringify(VARSAYILAN)));
}
function normalize(v) {
  v.ders = v.ders || {};
  v.force = v.force || {};
  v.sabit = v.sabit || {};
  v.devir = v.devir || {toplam:{}, yer:{}, kaynak:""};
  v.devir.refakat = v.devir.refakat || {};
  v.yer_adet = v.yer_adet || {};
  if (v.refakat === undefined) v.refakat = JSON.parse(JSON.stringify(VARSAYILAN.refakat));
  const _ad = new Set((v.asistanlar || []).map(a => a.ad));
  v.refakat = (v.refakat || []).filter(r => r && r.ad && r.yer && _ad.has(r.ad));
  v.refakat.forEach(r => {
    if (r.gun === undefined) r.gun = (+r.adet || 1) * 2;
    r.gun = +r.gun || 1;
    delete r.adet;
  });
  v.gecmis = v.gecmis || {};
  v.onceki_ay_son_gun_nobet = v.onceki_ay_son_gun_nobet || {yb:[],amel:[]};
  v.kural = v.kural || {};
  v.agirlik = v.agirlik || {};
  if (v.agirlik.kidem_yuku === undefined) v.agirlik.kidem_yuku = 0;
  v.kural.nobet_ertesi_yok = true;
  if (!v.gruplar) v.gruplar = {"Ybü1":"Ybü","Ybü2":"Ybü"};
  if (!v.yer_min_kademe) v.yer_min_kademe = {"Ybü1":1,"Ybü2":1};
  v.yer_kadro = v.yer_kadro || {};
  v.degisim = (v.degisim || []).filter(d => d && d.gun && d.cikan && d.giren)
    .map(d => ({gun: +d.gun, cikan: d.cikan, giren: d.giren, karsi: +d.karsi || 0}));
  for (const y in v.yer_kadro) if (KADRO_SIRA.indexOf(v.yer_kadro[y]) < 0) delete v.yer_kadro[y];
  v.egitim = v.egitim || [];
  v.asistanlar.forEach(a => {
    if (!a.kisa) a.kisa = a.ad;
    if (a.havuz === undefined) a.havuz = true;
    if (a.kademe === undefined) a.kademe = 1;
  });
  return v;
}
let saklaUyari = false;
function sakla() {
  try {
    const m = JSON.stringify(V);
    DEPO.yaz(LSKEY, m);
    DEPO.yaz(ayAnahtar(V.yil, V.ay), m);
  }
  catch (e) {
    if (!saklaUyari) {
      saklaUyari = true;
      alert("Veri saklanamıyor, değişiklikler kapanınca kaybolur. Çalışmanızı 'Dosyaya Kaydet' ile JSON olarak kaydedin.");
    }
  }
}

function gunSayisi() { return new Date(V.yil, V.ay, 0).getDate(); }
function haftaGunu(g) { return new Date(V.yil, V.ay - 1, g).getDay(); }
function kidem() { const m = {}; V.asistanlar.forEach((a,i) => m[a.ad] = i + 1); return m; }
function yerHarita(g) {
  const m = {};
  V.asistanlar.forEach(a => m[a.ad] = a.yer);
  if (g) V.degisim.forEach(d => {
    if (+d.gun + 1 !== g && !(d.karsi && +d.karsi + 1 === g)) return;
    if (m[d.cikan] == null || m[d.giren] == null) return;
    const t = m[d.cikan]; m[d.cikan] = m[d.giren]; m[d.giren] = t;
  });
  return m;
}
function kisaAd(ad) { const a = V.asistanlar.find(x => x.ad === ad); return a ? (a.kisa || a.ad) : ad; }
function adlar() { return V.asistanlar.map(a => a.ad); }
function grup(yer) { return V.gruplar[yer] || yer; }
function gruplar() {
  const out = [];
  V.zorunlu_yerler.forEach(y => { const g = grup(y); if (out.indexOf(g) < 0) out.push(g); });
  return out;
}
function haftaIci(g) {
  const n = gunSayisi();
  let x = Math.max(1, Math.min(g, n));
  let adim = 0;
  while (adim < 7 && (haftaGunu(x) === 0 || haftaGunu(x) === 6)) {
    x = x >= n ? 1 : x + 1;
    adim++;
  }
  return x;
}
function varsayilanBugun() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const g = (d.getFullYear() === V.yil && d.getMonth() + 1 === V.ay) ? d.getDate() : 1;
  return haftaIci(g);
}

function araliklar(liste) {
  const m = {};
  for (const k of liste) {
    const p = String(k.gunler).split("-");
    const a = parseInt(p[0], 10), b = parseInt(p[1] !== undefined ? p[1] : p[0], 10);
    if (isNaN(a) || isNaN(b)) continue;
    for (let g = a; g <= b; g++) { m[g] = m[g] || new Set(); k.kisiler.forEach(x => m[g].add(x)); }
  }
  return m;
}
function izinGun() { return araliklar(V.izin); }
function egitimGun() { return araliklar(V.egitim); }
function kademesi(ad) {
  const a = V.asistanlar.find(x => x.ad === ad);
  return a && a.kademe !== undefined ? a.kademe : 1;
}
function yasak(ad, yer) { return kademesi(ad) < (V.yer_min_kademe[yer] || 0); }
function kadroKurali(yer) { return KADRO_SIRA.indexOf(V.yer_kadro[yer]) >= 0 ? V.yer_kadro[yer] : "tek"; }
function nobetGun(g) {
  let n;
  if (g >= 1) {
    const k = V.nobet[String(g)];
    n = k ? {yb:(k.yb||[]).slice(), amel:(k.amel||[]).slice(), uzman_yb:k.uzman_yb||[], uzman_amel:k.uzman_amel||[]}
          : {yb:[], amel:[], uzman_yb:[], uzman_amel:[]};
  } else {
    n = {yb:(V.onceki_ay_son_gun_nobet.yb||[]).slice(), amel:(V.onceki_ay_son_gun_nobet.amel||[]).slice(),
         uzman_yb:[], uzman_amel:[]};
  }
  V.degisim.forEach(d => {
    const ters = d.karsi && +d.karsi === g;
    if (+d.gun !== g && !ters) return;
    const cik = ters ? d.giren : d.cikan, gir = ters ? d.cikan : d.giren;
    ["yb", "amel"].forEach(t => {
      const i = n[t].indexOf(cik);
      if (i >= 0) n[t][i] = gir;
    });
  });
  return n;
}
function nobetGunleri(ad) {
  const out = [];
  for (let g = 1; g <= gunSayisi(); g++) {
    const k = V.nobet[String(g)];
    if (k && (k.yb || []).concat(k.amel || []).indexOf(ad) >= 0) out.push(g);
  }
  return out;
}
function refakatKaydi(ad) { return V.refakat.find(r => r.ad === ad); }
function refakatSuruyor(ad, sayilan) {
  const r = refakatKaydi(ad);
  return !!r && (sayilan[ad] || 0) < r.gun;
}
function zorlandi(gun, ad) {
  return (V.force[String(gun)] || []).some(z => z.ad === ad);
}
function isimCip(ad, rozet, zorla, ek, tasi) {
  const c = el("span", {className: "isim" + (zorla ? " isim-zorla" : "") + (ek ? " isim-refakat" : "")});
  if (zorla) c.title = "Elle zorlandı";
  if (ek) c.title = "Refakatçi — kadroya sayılmaz, tek başına bırakılmaz";
  c.appendChild(el("span", {textContent: kisaAd(ad)}));
  if (rozet) c.appendChild(el("span", {className: "rozet", textContent: "K" + kademesi(ad)}));
  if (ek) c.appendChild(el("span", {className: "rozet", textContent: "R"}));
  if (tasi) cipTasi(c, ad, tasi.gun, tasi.yer);
  return c;
}
function cipTasi(c, ad, gun, yer) {
  c.draggable = true;
  c.classList.add("isim-tasinir");
  if (!c.title) c.title = "Sürükleyip başka bir ismin üstüne bırakın: yerleri değişir";
  c.ondragstart = e => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ad, yer}));
    e.dataTransfer.effectAllowed = "move";
    c.classList.add("isim-tasiniyor");
  };
  c.ondragend = () => c.classList.remove("isim-tasiniyor", "isim-hedef");
  c.ondragover = e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; c.classList.add("isim-hedef"); };
  c.ondragleave = () => c.classList.remove("isim-hedef");
  c.ondrop = e => {
    e.preventDefault(); e.stopPropagation();
    c.classList.remove("isim-hedef");
    let k = null;
    try { k = JSON.parse(e.dataTransfer.getData("text/plain")); } catch (_) { return; }
    if (!k || !k.ad || k.ad === ad) return;
    yerTakas(gun, k.ad, k.yer, ad, yer);
  };
}
function yerTakas(g, a, ya, b, yb) {
  const gs = String(g);
  if (V.gecmis[gs]) { toast(g + ". gün kilitli, önce kilidi açın"); return; }
  if (ya === yb) return;
  const l = V.force[gs] = V.force[gs] || [];
  const koy = (ad, yer) => {
    const i = l.findIndex(z => z.ad === ad);
    if (i >= 0) l.splice(i, 1);
    if (yer) l.push({ad, yer});
    if (yer && V.sabit[gs]) { V.sabit[gs] = V.sabit[gs].filter(x => x !== ad); if (!V.sabit[gs].length) delete V.sabit[gs]; }
  };
  koy(a, yb); koy(b, ya);
  if (!l.length) delete V.force[gs];
  sakla(); ciz_gosterge(); ciz_kural();
  toast(kisaAd(a) + " → " + (yb || "Ameliyathane") + ", " + kisaAd(b) + " → " + (ya || "Ameliyathane"));
}
function cipSeritDuz(liste) {
  const d = el("div", {className: "isim-serit"});
  liste.forEach(ad => d.appendChild(isimCip(ad, false, false)));
  return d;
}
function isimSerit(liste, kd, rozet, gun, rf, tasiYer) {
  const d = el("div", {className: "isim-serit"});
  liste.slice().sort((x,y) => kd[x] - kd[y]).forEach(ad =>
    d.appendChild(isimCip(ad, rozet, gun ? zorlandi(gun, ad) : false, rf ? rf[ad] : 0,
      (gun && tasiYer !== undefined) ? {gun, yer: tasiYer} : null)));
  return d;
}
function bugunDurum(s, ad) {
  const yh = yerHarita(s && s.gun);
  if (!s) return yh[ad] || "";
  if (s.atama[ad]) return s.atama[ad];
  if (s.yok[ad]) return s.yok[ad];
  const y = yh[ad] || "";
  if (V.havuz_disi_yerler.indexOf(y) >= 0 || V.zorunlu_yerler.indexOf(y) >= 0) return y;
  return "Ameliyathane";
}
function nobetTablo(n, sirala) {
  const t = el("table", {className: "grid-line nobet-tablo"});
  t.innerHTML = "<thead><tr><th></th><th>Uzman</th><th>Asistan</th></tr></thead>";
  const tb = el("tbody");
  const kd = kidem();
  const serit = (liste, sirali) => {
    if (!liste.length) return el("td", {textContent: "—"});
    const td = el("td");
    td.appendChild(sirali ? isimSerit(liste, kd, false) : cipSeritDuz(liste));
    return td;
  };
  [["YBÜ Nöbeti", n.uzman_yb, n.yb], ["Ameliyathane Nöbeti", n.uzman_amel, n.amel]].forEach(r => {
    const tr = el("tr");
    tr.appendChild(el("td", {className: "nobet-tur", textContent: r[0]}));
    tr.appendChild(serit(r[1], false));
    tr.appendChild(serit(r[2], true));
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  return t;
}
function yokOlanlar(g, iz, eg) {
  const k = V.kural, s = {};
  eg = eg || egitimGun();
  (iz[g] ? [...iz[g]] : []).forEach(ad => s[ad] = "İzinli");
  (eg[g] ? [...eg[g]] : []).forEach(ad => { if (!s[ad]) s[ad] = "Derste"; });
  if (k.nobet_ertesi_yok) {
    const d = nobetGun(g - 1);
    d.yb.concat(d.amel).forEach(ad => { if (!s[ad]) s[ad] = "Nöbet Ertesi"; });
  }
  return s;
}
function kalanlar(g, yok) {
  const k = V.kural, s = {};
  const bugun = nobetGun(g);
  if (k.yb_nobetci_o_gun_yok) bugun.yb.forEach(ad => { if (!s[ad]) s[ad] = "YBÜ Nöbeti"; });
  if (k.amel_nobetci_o_gun_yok) bugun.amel.forEach(ad => { if (!s[ad]) s[ad] = "Ameliyathane Nöbeti"; });
  (V.sabit[String(g)] || []).forEach(ad => { if (!s[ad]) s[ad] = "Sabit"; });
  for (const ad in yok) delete s[ad];
  return s;
}
function dolmayanlar(boslar, atama, zorla, refakat) {
  const kalan = {};
  for (const ad in atama) kalan[atama[ad]] = (kalan[atama[ad]] || 0) + 1;
  zorla.forEach(z => { kalan[z.yer] = (kalan[z.yer] || 0) - 1; });
  (refakat || []).forEach(r => { kalan[r.yer] = (kalan[r.yer] || 0) - 1; });
  const out = [];
  boslar.forEach(b => {
    if (kalan[b.yer] > 0) kalan[b.yer]--;
    else out.push(b.yer);
  });
  return out;
}
function bosluklar(yok, g) {
  const yh = yerHarita(g), kd = kidem(), out = [];
  const adet = V.yer_adet[String(g)] || {};
  for (const yer of V.zorunlu_yerler) {
    const kadro = adlar().filter(ad => yh[ad] === yer);
    const gerek = adet[yer] == null ? (kadroKurali(yer) === "cift" ? 2 : 1) : adet[yer];
    const yalniz = gerek <= 1;
    if (!kadro.length) {
      for (let i = 0; i < gerek; i++) out.push({yer, eksik: [["—","Kadro yok"]], hedef: 9, yalniz});
      continue;
    }
    const hedef = kadro.reduce((s,ad) => s + kd[ad], 0) / kadro.length;
    const mevcut = kadro.filter(ad => !yok[ad]);
    const eksik = gerek - mevcut.length;
    const yoklar = kadro.filter(ad => yok[ad]).map(ad => [ad, yok[ad]]);
    for (let i = 0; i < eksik; i++) {
      out.push({
        yer, yalniz,
        eksik: i >= yoklar.length ? [["—", "Ek kadro isteniyor"]]
             : i < eksik - 1 ? [yoklar[i]] : yoklar.slice(i),
        hedef
      });
    }
  }
  return out;
}
function yerdekiler(atama, yok, yh, yer) {
  return adlar().filter(ad => atama[ad] === yer || (yh[ad] === yer && !yok[ad] && !atama[ad]));
}
function ekBosluk(atama, yok, yh, g) {
  const adet = V.yer_adet[String(g)] || {}, kd = kidem(), out = [];
  for (const yer of V.zorunlu_yerler) {
    if (kadroKurali(yer) !== "kidemli_tek" || adet[yer] != null) continue;
    const kisiler = yerdekiler(atama, yok, yh, yer);
    if (kisiler.length !== 1 || !yasak(kisiler[0], yer)) continue;
    const kadro = adlar().filter(ad => yh[ad] === yer);
    out.push({
      yer, yalniz: false,
      eksik: [["—", "Kıdem eşiğinin altı, yanına ikinci kişi"]],
      hedef: kadro.length ? kadro.reduce((s, ad) => s + kd[ad], 0) / kadro.length : 9
    });
  }
  return out;
}
function havuz(yok, kalsin, g) {
  kalsin = kalsin || {};
  const yh = yerHarita(g);
  return V.asistanlar.filter(a =>
    a.havuz !== false &&
    V.havuz_disi_yerler.indexOf(yh[a.ad]) < 0 &&
    V.zorunlu_yerler.indexOf(yh[a.ad]) < 0 &&
    !yok[a.ad] && !kalsin[a.ad]
  ).map(a => a.ad);
}
function istisna(ad) {
  const a = V.asistanlar.find(x => x.ad === ad);
  return !!a && V.havuz_disi_yerler.indexOf(a.yer) >= 0;
}
function refakatBekliyor(ad, sayilan, yer) {
  const r = refakatKaydi(ad);
  return !!(r && grup(r.yer) === grup(yer) && refakatSuruyor(ad, sayilan || {}));
}
function maliyet(ad, bos, sayac, dun, kd, ybn) {
  const w = V.agirlik;
  const tercih = (V.kural.yb_nobetci_ybu_tercih && ybn && ybn.has(ad) && grup(bos.yer) === "Ybü") ? 1 : 0;
  return 1e6 * (bos.yalniz !== false && yasak(ad, bos.yer) ? 1 : 0)
       + 1e6 * (refakatBekliyor(ad, sayac.refakat, bos.yer) ? 1 : 0)
       - 1e3 * tercih
       + (w.kidem_farki||0) * Math.abs(kd[ad] - bos.hedef)
       + (w.toplam_gorev||0) * (sayac.toplam[ad]||0)
       + (w.ayni_yer_tekrari||0) * (sayac.yer[ad + "|" + grup(bos.yer)]||0)
       + (w.dun_de_gonderildi||0) * (dun.has(ad) ? 1 : 0)
       + (w.kidem_yuku||0) * (V.asistanlar.length - kd[ad]);
}
function permute(arr, k, cb) {
  const n = arr.length, kul = new Array(n).fill(false), cur = [];
  (function rec() {
    if (cur.length === k) { cb(cur); return; }
    for (let i = 0; i < n; i++) if (!kul[i]) { kul[i]=true; cur.push(arr[i]); rec(); cur.pop(); kul[i]=false; }
  })();
}
function gunAta(boslar, adaylar, sayac, dun, kd, ybn) {
  if (!boslar.length || !adaylar.length) return {};
  const b = boslar.slice(0, Math.min(boslar.length, adaylar.length));
  let best = null, bestM = Infinity;
  permute(adaylar, b.length, sec => {
    let m = 0;
    for (let i = 0; i < b.length; i++) m += maliyet(sec[i], b[i], sayac, dun, kd, ybn);
    if (m < bestM) { bestM = m; best = sec.slice(); }
  });
  const r = {};
  best.forEach((ad, i) => r[ad] = b[i].yer);
  return r;
}

function hesapla() {
  const kd = kidem(), iz = izinGun(), eg = egitimGun(), n = gunSayisi();
  const sayac = {toplam:{}, yer:{}, sonGun:{}, refakat:{}};
  Object.assign(sayac.toplam, V.devir.toplam || {});
  Object.assign(sayac.yer, V.devir.yer || {});
  Object.assign(sayac.refakat, V.devir.refakat || {});
  const satirlar = [];
  let dun = new Set();
  for (let g = 1; g <= n; g++) {
    const hg = haftaGunu(g);
    const yh = yerHarita(g);
    const yok = yokOlanlar(g, iz, eg);
    const kalsin = kalanlar(g, yok);
    let boslar = bosluklar(yok, g);
    let atama = {}, kaynak = "hesap", refakat = [];
    const onceSayac = {toplam: Object.assign({}, sayac.toplam), yer: Object.assign({}, sayac.yer),
      refakat: Object.assign({}, sayac.refakat)};

    const zorla = V.force[String(g)] || [];
    zorla.forEach(z => { atama[z.ad] = z.yer; });
    zorla.forEach(z => {
      const i = boslar.findIndex(b => b.yer === z.yer);
      if (i >= 0) boslar.splice(i, 1);
    });

    if (V.gecmis[String(g)]) {
      atama = Object.assign({}, V.gecmis[String(g)], atama);
      kaynak = "geçmiş";
      if (!Object.keys(atama).length) boslar = [];
    } else if (hg === 0 || hg === 6) {
      kaynak = "hafta sonu";
      boslar = [];
    } else {
      let ad = havuz(yok, kalsin, g).filter(x => !atama[x]);
      const sira = V.refakat.slice().sort((x, y) =>
        (dun.has(x.ad) - dun.has(y.ad)) || (sayac.refakat[x.ad] || 0) - (sayac.refakat[y.ad] || 0));
      for (const r of sira) {
        if (refakat.length) break;
        if (atama[r.ad] || ad.indexOf(r.ad) < 0) continue;
        if (!refakatSuruyor(r.ad, sayac.refakat)) continue;
        if (ad.length - 1 < boslar.length) continue;
        const planlanan = adlar().filter(a => yh[a] === r.yer && !yok[a] && !atama[a]).length
          + Object.keys(atama).filter(a => atama[a] === r.yer).length
          + boslar.filter(b => b.yer === r.yer).length;
        if (planlanan > 1) continue;
        atama[r.ad] = r.yer;
        refakat.push({ad: r.ad, yer: r.yer});
        ad = ad.filter(x => x !== r.ad);
      }
      Object.assign(atama, gunAta(boslar, ad, sayac, dun, kd, new Set(nobetGun(g).yb)));
      const ek = ekBosluk(atama, yok, yh, g);
      if (ek.length) {
        const kalan = havuz(yok, kalsin, g).filter(x => !atama[x]);
        Object.assign(atama, gunAta(ek, kalan, sayac, dun, kd, new Set(nobetGun(g).yb)));
        boslar = boslar.concat(ek);
      }
    }
    refakat = refakat.filter(r => {
      const baska = Object.keys(atama).some(a => a !== r.ad && atama[a] === r.yer) ||
        adlar().some(a => yh[a] === r.yer && !yok[a] && !atama[a]);
      if (!baska) delete atama[r.ad];
      return baska;
    });
    refakat.forEach(r => { sayac.refakat[r.ad] = (sayac.refakat[r.ad] || 0) + 1; });

    for (const ad in atama) {
      if (istisna(ad)) continue;
      sayac.toplam[ad] = (sayac.toplam[ad]||0) + 1;
      const k = ad + "|" + grup(atama[ad]);
      sayac.yer[k] = (sayac.yer[k]||0) + 1;
      sayac.sonGun[ad] = g;
    }
    satirlar.push({
      gun: g, gunAdi: GUNADI[hg], hafta: hg, kaynak,
      yok, kalsin, boslar, refakat, onceSayac,
      atama: Object.assign({}, atama),
      dolmayan: dolmayanlar(boslar, atama, zorla, refakat),
      zorla: zorla.map(z => z.ad),
      kademeAsimi: Object.keys(atama).filter(ad =>
        yasak(ad, atama[ad]) && yerdekiler(atama, yok, yh, atama[ad]).length < 2)
    });
    dun = new Set(Object.keys(atama));
  }
  SON = {satirlar, sayac};
  return SON;
}

function dogrula() {
  const set = new Set(adlar()), h = [], iz = izinGun();
  for (const g in V.nobet) {
    const n = V.nobet[g];
    (n.yb||[]).concat(n.amel||[]).forEach(ad => {
      if (!set.has(ad)) h.push(g + ". gün nöbet listesinde tanınmayan ad: " + ad);
      else if (iz[g] && iz[g].has(ad)) h.push(g + ". gün " + ad + " hem izinli hem nöbetçi");
    });
  }
  V.izin.forEach(k => k.kisiler.forEach(ad => { if (!set.has(ad)) h.push("İzin listesinde tanınmayan ad: " + ad); }));
  for (const g in V.gecmis) for (const ad in V.gecmis[g]) if (!set.has(ad)) h.push("Geçmiş " + g + ". günde tanınmayan ad: " + ad);
  return h;
}

/* ---------- çıktı metni ---------- */

function gunSatirlari(s) {
  const iz = [], ne = [], yerler = {};
  for (const ad in s.yok) {
    if (s.atama[ad]) continue;
    if (s.yok[ad] === "İzinli") iz.push(ad);
    else if (s.yok[ad] === "Nöbet Ertesi") ne.push(ad);
  }
  for (const ad in s.atama) {
    const y = s.atama[ad];
    (yerler[y] = yerler[y] || []).push(ad);
  }
  const kd = kidem();
  const sirala = a => a.slice().sort((x,y) => kd[x] - kd[y]).map(kisaAd);
  const rows = [];
  if (iz.length) rows.push([sirala(iz).join(" "), "İzinli"]);
  if (ne.length) rows.push([sirala(ne).join(" "), "Nöbet Ertesi"]);
  V.zorunlu_yerler.forEach(y => { if (yerler[y]) rows.push([sirala(yerler[y]).join(" "), y]); });
  Object.keys(yerler).forEach(y => {
    if (V.zorunlu_yerler.indexOf(y) < 0) rows.push([sirala(yerler[y]).join(" "), y]);
  });
  const d = (V.ders[String(s.gun)] || "").trim();
  if (d) rows.push([d, "Ders"]);
  return rows;
}
function gunMetin(s) {
  return gunSatirlari(s).map(r => r[0] + "\t" + r[1]).join("\n");
}
function gunBaslik(s) {
  return s.gun + " " + AYLAR[V.ay-1] + " " + V.yil + " " + s.gunAdi;
}

/* ---------- YZ promptu ---------- */

function promptMetni() {
  const liste = V.asistanlar.map(a => a.ad).join(", ");
  return [
"Sana bir nöbet listesi tablosunun görüntüsünü veriyorum. Bu tabloyu aşağıda tarif ettiğim JSON biçimine çevir.",
"",
"Klinikteki asistanların tam adları şunlar (çıktıda MUTLAKA bu yazımları kullan, kısaltma veya farklı yazım kullanma):",
liste,
"",
"Görüntüdeki tabloda her satır ayın bir günüdür. Sütunlar iki gruba ayrılır:",
"- Adında YOĞUN BAKIM geçen sütunlar yoğun bakım nöbetidir. Bu grubun UZMAN sütunundaki adlar \"uzman_yb\" listesine, asistanlar (kıdemli, çömez) \"yb\" listesine girer.",
"- Adında AMELİYATHANE geçen sütunlar ameliyathane nöbetidir. Bu grubun UZMAN sütunundaki adlar \"uzman_amel\" listesine, asistanlar \"amel\" listesine girer.",
"Uzmanlar asistan listesinde yoktur, adlarını görüntüdeki gibi yaz. Kıdemli ve çömez ayrımının önemi yok, ikisi de asistan listesine girer.",
"",
"Çıktı SADECE şu yapıda tek bir JSON nesnesi olsun, başka hiçbir açıklama yazma:",
"",
'{',
'  "nobet": {',
'    "1": { "uzman_yb": ["Uzman1"], "yb": ["Ad1", "Ad2"], "uzman_amel": ["Uzman2"], "amel": ["Ad3", "Ad4"] },',
'    "2": { "uzman_yb": [], "yb": ["Ad5"], "uzman_amel": ["Uzman3"], "amel": ["Ad6"] }',
'  }',
'}',
"",
"Kurallar:",
"1. Anahtar ayın gün numarasıdır, metin olarak yazılır: \"1\", \"2\", ... \"31\".",
"2. Görüntüdeki bir hücre boşsa o kişiyi hiç yazma, listeyi kısa bırak.",
"3. Bir ASİSTAN adı yukarıdaki listede birebir yoksa en yakın olanı seç ve listedeki yazımı kullan. Uzman adlarını görüntüdeki gibi bırak.",
"4. Aynı isim bir günde iki sütunda geçiyorsa iki kere yazma.",
"5. Türkçe karakterleri koru.",
"",
"Ayrıca listede olmayan veya emin olamadığın bir isim gördüysen, JSON'un sonuna \"_notlar\" adında bir alan ekle ve orada kısaca yaz."
  ].join("\n");
}

/* ---------- ui yardımcıları ---------- */

const $ = s => document.querySelector(s);
const el = (t, p) => Object.assign(document.createElement(t), p || {});
function toast(m) {
  const t = $("#toast"); t.textContent = m; t.dataset.acik = "1";
  clearTimeout(t._z); t._z = setTimeout(() => { t.dataset.acik = "0"; }, 1600);
}
function kopyala(m, etiket) {
  const ok = () => toast(etiket || "Kopyalandı");
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(m).then(ok, () => fallback(m, ok));
  else fallback(m, ok);
}
function fallback(m, ok) {
  const t = el("textarea", {value: m});
  t.style.position = "fixed"; t.style.opacity = "0";
  document.body.appendChild(t); t.select();
  try { document.execCommand("copy"); ok(); } catch (e) { alert("Kopyalanamadı, elle seçin."); }
  document.body.removeChild(t);
}
function cip(metin, sinif) {
  return el("span", {className: "cip" + (sinif ? " " + sinif : ""), textContent: metin});
}

/* ---------- sekmeler ---------- */

const SEKME = [["gosterge","Gösterge"],["asistan","Asistanlar"],["nobet","Nöbet"],["izin","İzinler"],["kural","Kural & Zorlama"],["cikti","Çıktı"],["analiz","Analiz"]];
const KAYDIRAN = {asistan:1, nobet:1, izin:1, kural:1, cikti:1, analiz:1};
function sekmeler() {
  const n = $("#nav"); n.innerHTML = "";
  SEKME.forEach(([id,ad], i) => {
    const b = el("button", {className: "sekme", textContent: ad});
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", "false");
    b.onclick = () => {
      document.querySelectorAll("section").forEach(s => s.hidden = true);
      $("#s-" + id).hidden = false;
      n.querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", "false"));
      b.setAttribute("aria-selected", "true");
      $("#govde").classList.toggle("kaydir", !!KAYDIRAN[id]);
      if (id === "gosterge") ciz_gosterge();
      if (id === "cikti") ciz_cikti();
      if (id === "analiz") ciz_analiz();
      if (id === "kural") ciz_kural();
    };
    n.appendChild(b);
    if (!i) b.click();
  });
}

/* ---------- gösterge ---------- */

function bugunKart(hedef, gun, s) {
  hedef.innerHTML = "";
  const kd = kidem();
  const sirala = a => a.slice().sort((x,y) => kd[x] - kd[y]).map(kisaAd).join(" ");
  const kutu = el("div", {className: "nobet-liste"});
  const satir = (etiket, icerik) => {
    const r = el("div", {className: "nobet-satir"});
    r.appendChild(el("div", {className: "nobet-etiket", textContent: etiket}));
    const d = el("div", {className: "nobet-deger"});
    if (typeof icerik === "string") d.textContent = icerik;
    else icerik.forEach(x => d.appendChild(x));
    r.appendChild(d);
    kutu.appendChild(r);
  };
  const n = nobetGun(gun);
  hedef.appendChild(nobetTablo(n, sirala));
  if (!s) return;

  const yerler = {};
  for (const ad in s.atama) (yerler[s.atama[ad]] = yerler[s.atama[ad]] || []).push(ad);
  const tumYer = V.zorunlu_yerler.concat(Object.keys(yerler).filter(y => V.zorunlu_yerler.indexOf(y) < 0));
  const es = el("div", {className: "esles"});
  const yh = yerHarita(gun);
  const kalan = adlar().filter(ad =>
    !s.atama[ad] && !s.yok[ad] &&
    V.zorunlu_yerler.indexOf(yh[ad]) < 0 &&
    yh[ad] !== "İzin");
  const ar = el("div", {className: "esles-satir esles-amel grid-line"});
  ar.appendChild(el("div", {className: "esles-yer", textContent: "Ameliyathanede"}));
  const ad2 = el("div", {className: "esles-amel-liste"});
  if (kalan.length) ad2.appendChild(isimSerit(kalan, kd, false, gun, null, ""));
  else ad2.textContent = "Kimse kalmıyor";
  ar.appendChild(ad2);
  amelHedef(ar, gun);
  es.appendChild(ar);
  let n2 = 0;
  const uyarilar = [];
  tumYer.forEach(yer => {
    const boslarY = s.boslar.filter(b => b.yer === yer);
    const bos = boslarY[0];
    const gelen = yerler[yer];
    if (!bos && !gelen) return;
    n2++;
    const r = el("div", {className: "esles-satir grid-line"});
    r.appendChild(el("div", {className: "esles-yer", textContent: yer}));
    const kim = el("div", {className: "esles-kim"});
    const sebepler = boslarY.length
      ? boslarY.reduce((a, b) => a.concat(b.eksik), [])
      : yerEksikleri(yer, gun);
    sebepler.forEach(e => {
      if (!e) return;
      const d = el("div");
      if (e[0] !== "—") d.appendChild(document.createTextNode(kisaAd(e[0])));
      d.appendChild(el("span", {className: "esles-sebep", textContent: e[0] !== "—" ? "(" + e[1] + ")" : e[1]}));
      kim.appendChild(d);
    });
    r.appendChild(kim);
    r.appendChild(el("div", {className: "esles-ok", textContent: gelen ? "→" : "×"}));
    const sag = el("div", {className: "esles-gelir"});
    const rf = {};
    (s.refakat || []).forEach(r => { if (r.yer === yer) rf[r.ad] = 1; });
    if (gelen) {
      sag.appendChild(isimSerit(gelen, kd, false, gun, rf, yer));
      const asan = gelen.filter(ad => yasak(ad, yer));
      if (asan.length) {
        r.classList.add("esles-ihlal");
        uyarilar.push(asan.map(kisaAd).join(", ") + " → " + yer + ": kademe alt sınırı aşıldı");
      }
    } else {
      sag.textContent = "Doldurulamadı";
      sag.className = "esles-gelir hata-metin";
      uyarilar.push(yer + ": doldurulamadı, havuzda uygun kimse yok");
    }
    r.appendChild(sag);
    yerHedef(r, gun, yer, gelen || []);
    es.appendChild(r);
  });
  if (uyarilar.length) {
    const u = el("div", {className: "gun-uyari"});
    u.appendChild(el("span", {className: "gun-uyari-bas", textContent: "Uyarılar"}));
    uyarilar.forEach(x => u.appendChild(el("span", {className: "gun-uyari-oge", textContent: x})));
    es.appendChild(u);
  }
  if (!n2 && s.kaynak === "hafta sonu") {
    es.appendChild(el("p", {className: "ipucu", textContent: "Hafta sonu, görevlendirme yok."}));
  }
  hedef.appendChild(es);
}

function yerEksikleri(yer, gun) {
  const yok = yokOlanlar(gun, izinGun(), egitimGun()), yh = yerHarita(gun);
  return adlar().filter(ad => yh[ad] === yer && yok[ad]).map(ad => [ad, yok[ad]]);
}
function amelHedef(r, gun) {
  r.title = "Bir ismi buraya bırakın: ameliyathaneye geçer, yerine en uygun kişi görevlendirilir";
  r.ondragover = e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; r.classList.add("esles-hedef"); };
  r.ondragleave = () => r.classList.remove("esles-hedef");
  r.ondrop = e => {
    e.preventDefault();
    r.classList.remove("esles-hedef");
    let k = null;
    try { k = JSON.parse(e.dataTransfer.getData("text/plain")); } catch (_) { return; }
    if (!k || !k.ad || !k.yer) return;
    amelAl(gun, k.ad);
  };
}
function hedefTemizle() {
  document.querySelectorAll(".esles-hedef, .isim-hedef, .isim-tasiniyor").forEach(x => x.classList.remove("esles-hedef", "isim-hedef", "isim-tasiniyor"));
}
["dragend", "drop"].forEach(t => document.addEventListener(t, () => setTimeout(hedefTemizle, 0), true));
function yerHedef(r, gun, yer, gelen) {
  r.title = "Bir ismi buraya bırakın: " + yerAdi(yer) + "'e geçer" + (gelen.length ? ", buradaki kişi onun yerine gider" : "");
  r.ondragover = e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; r.classList.add("esles-hedef"); };
  r.ondragleave = () => r.classList.remove("esles-hedef");
  r.ondrop = e => {
    e.preventDefault();
    r.classList.remove("esles-hedef");
    let k = null;
    try { k = JSON.parse(e.dataTransfer.getData("text/plain")); } catch (_) { return; }
    if (!k || !k.ad || k.yer === yer || gelen.indexOf(k.ad) >= 0) return;
    if (gelen.length) { yerTakas(gun, k.ad, k.yer, gelen[gelen.length - 1], yer); return; }
    const gs = String(gun);
    if (V.gecmis[gs]) { toast(gun + ". gün kilitli, önce kilidi açın"); return; }
    const l = (V.force[gs] || []).filter(z => z.ad !== k.ad);
    l.push({ad: k.ad, yer});
    V.force[gs] = l;
    if (V.sabit[gs]) { V.sabit[gs] = V.sabit[gs].filter(x => x !== k.ad); if (!V.sabit[gs].length) delete V.sabit[gs]; }
    sakla(); ciz_gosterge(); ciz_kural();
    toast(kisaAd(k.ad) + " → " + yerAdi(yer));
  };
}
function amelAl(g, ad) {
  const gs = String(g);
  if (V.gecmis[gs]) { toast(g + ". gün kilitli, önce kilidi açın"); return; }
  if (V.force[gs]) {
    V.force[gs] = V.force[gs].filter(z => z.ad !== ad);
    if (!V.force[gs].length) delete V.force[gs];
  }
  const l = V.sabit[gs] = V.sabit[gs] || [];
  if (l.indexOf(ad) < 0) l.push(ad);
  sakla(); ciz_gosterge(); ciz_kural();
  toast(kisaAd(ad) + " ameliyathanede kaldı, yeri en uygun kişiye verildi");
}

const YER_ADI = {Pol: "Poliklinik"};
function yerAdi(y) { return YER_ADI[y] || y; }

let ONCEKI = null;
let DEGISEN = 0;

function matrisBlok(satirlar, ilk, sonG, yeniHar, degisenGun) {
  const t = el("table", {className: "grid-line matris-tablo"});
  t.innerHTML = "<thead><tr><th>Gün</th>" +
    V.zorunlu_yerler.map(y => "<th>" + yerAdi(y) + "</th>").join("") + "</tr></thead>";
  const tb = el("tbody");
  const kd = kidem();
  for (let g = ilk; g <= sonG; g++) {
    const s = satirlar[g-1];
    if (!s) continue;
    const tr = el("tr");
    if (s.hafta === 0 || s.hafta === 6) tr.className = "hafta-sonu";
    if (g < BUGUN) tr.classList.add("gecmis-satir");
    if (g === BUGUN) tr.classList.add("bugun-satir");
    if (s.kademeAsimi && s.kademeAsimi.length) tr.classList.add("ihlal-satir");
    const kilitli = !!V.gecmis[String(g)];
    if (kilitli) tr.classList.add("kilit-satir");
    const gh = el("td", {className: "gun-hucre"});
    tr.classList.add("secilebilir");
    tr.title = g + ". günü düzenlemek için tıklayın";
    tr.onclick = e => { if (e.target.closest(".kilit-sim")) return; gunSec(g); };
    gh.appendChild(el("span", {textContent: g + " " + s.gunAdi}));
    const kb = el("button", {type: "button", className: "kilit-sim kilit-mini",
      textContent: kilitli ? "🔒" : "🔓"});
    kb.title = kilitli ? g + ". gün kilitli — açmak için tıklayın"
                       : g + ". günü kilitle: o günkü atama (boşsa boş olarak) sabitlenir";
    kb.onclick = () => gunKilit(g);
    gh.appendChild(kb);
    tr.appendChild(gh);
    const rf = {};
    (s.refakat || []).forEach(r => rf[r.ad] = 1);
    const yerler = {};
    for (const ad in s.atama) (yerler[s.atama[ad]] = yerler[s.atama[ad]] || []).push(ad);
    V.zorunlu_yerler.forEach(y => {
      const l = yerler[y];
      const metin = l ? l.slice().sort((x,z)=>kd[x]-kd[z])
        .map(ad => kisaAd(ad) + (rf[ad] ? "(R)" : "")).join(", ") : "";
      const anahtar = g + "|" + y;
      yeniHar[anahtar] = metin;
      const td = el("td", {textContent: metin});
      if (l && l.some(ad => rf[ad])) {
        const kadro = adlar().filter(ad => yerHarita(g)[ad] === y && !s.yok[ad]).map(kisaAd);
        td.title = "(R) refakatçi — kadroya sayılmaz."
          + (kadro.length ? " Yerin kendi kadrosu: " + kadro.join(", ") : "");
      }
      if (l && l.some(ad => yasak(ad, y))) td.classList.add("ihlal-hucre");
      if (ONCEKI && ONCEKI[anahtar] !== metin) td.classList.add("degisti");
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  }
  t.appendChild(tb);
  return t;
}

function matris(hedef, satirlar) {
  const yeniHar = {};
  hedef.innerHTML = "";
  const n = gunSayisi();
  const orta = Math.ceil(n / 2);
  const dg = {};
  const kutu = el("div", {className: "matris-ikili"});
  kutu.appendChild(matrisBlok(satirlar, 1, orta, yeniHar, dg));
  kutu.appendChild(matrisBlok(satirlar, orta + 1, n, yeniHar, dg));
  hedef.appendChild(kutu);
  ONCEKI = yeniHar;
  DEGISEN = Object.keys(dg).length;
}

function ceteleTablo(liste, sayac, max, s, sade, bas) {
  const t = el("table", {className: "grid-line"});
  if (bas) t.appendChild(el("caption", {className: "tablo-bas", textContent: bas}));
  t.innerHTML += sade
    ? "<thead><tr><th>Asistan</th><th>Bugün</th></tr></thead>"
    : "<thead><tr><th>Asistan</th><th>Bugün</th><th title=\"Ay içindeki toplam görevlendirme sayısı\">Σ</th>" +
      "<th title=\"Kişinin ay içindeki toplam görev sayısının, en çok görev alan kişiye oranı. Dolu çubuk o ayın en yüklü kişisi demektir.\">Yük</th>" +
      gruplar().map(y => "<th>" + y + "</th>").join("") + "</tr></thead>";
  const tb = el("tbody");
  liste.forEach(a => {
    const tot = sayac.toplam[a.ad] || 0;
    const tr = el("tr");
    tr.appendChild(el("td", {textContent: kisaAd(a.ad)}));
    const durum = bugunDurum(s, a.ad);
    const dt = el("td", {className: "durum-hucre", textContent: durum});
    if (durum === "İzinli" || durum === "Derste") dt.classList.add("durum-yok");
    if (durum.indexOf("Nöbet") >= 0) dt.classList.add("durum-nobet");
    tr.appendChild(dt);
    if (sade) { tb.appendChild(tr); return; }
    tr.appendChild(el("td", {className: "sayi" + (tot ? "" : " sayi-sonuk"), textContent: tot}));
    const bd = el("td");
    const bar = el("span", {className: "cubuk"});
    bar.appendChild(el("i", {style: "width:" + Math.round(tot/max*100) + "%"}));
    bd.appendChild(bar); tr.appendChild(bd);
    gruplar().forEach(y => {
      const nn = sayac.yer[a.ad + "|" + y] || 0;
      tr.appendChild(el("td", {className: "sayi" + (nn ? "" : " sayi-sonuk"), textContent: nn || "·"}));
    });
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  if (!sade) {
    const tf = el("tfoot");
    const tr = el("tr", {className: "cetele-toplam"});
    tr.appendChild(el("td", {textContent: "Toplam"}));
    tr.appendChild(el("td", {textContent: ""}));
    tr.appendChild(el("td", {className: "sayi",
      textContent: liste.reduce((x, a) => x + (sayac.toplam[a.ad] || 0), 0)}));
    tr.appendChild(el("td", {textContent: ""}));
    gruplar().forEach(y => {
      const n = liste.reduce((x, a) => x + (sayac.yer[a.ad + "|" + y] || 0), 0);
      tr.appendChild(el("td", {className: "sayi" + (n ? "" : " sayi-sonuk"), textContent: n || "·"}));
    });
    tf.appendChild(tr);
    t.appendChild(tf);
  }
  return t;
}

function ekipTablo(liste, s) {
  const t = el("table", {className: "grid-line ekip-tablo"});
  const tb = el("tbody");
  liste.forEach(a => {
    const tr = el("tr");
    const g = s ? bugunDurum(s, a.ad) : "";
    const yok = s && s.yok ? s.yok[a.ad] || "" : "";
    if (!(s && s.atama && s.atama[a.ad]) && (yok === "İzinli" || yok.indexOf("Nöbet Ertesi") >= 0)) tr.className = "ekip-yok";
    tr.appendChild(el("td", {textContent: kisaAd(a.ad)}));
    tr.appendChild(el("td", {className: "durum-hucre", textContent: a.yer}));
    const brans = V.zorunlu_yerler.indexOf(a.yer) < 0 && V.havuz_disi_yerler.indexOf(a.yer) < 0;
    const farkli = g && g !== a.yer && !(g === "Ameliyathane" && brans);
    tr.appendChild(el("td", {className: "ekip-guncel", textContent: farkli ? "→ " + g : ""}));
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  return t;
}

function ciz_ekip(s) {
  const c = $("#ekip"); c.innerHTML = "";
  c.appendChild(ekipTablo(V.asistanlar, s));
}

function ciz_cetele(sayac, s) {
  const c = $("#cetele"); c.innerHTML = "";
  const max = Math.max(1, ...Object.values(sayac.toplam), 1);
  const havuzda = a => a.havuz !== false
    && V.havuz_disi_yerler.indexOf(a.yer) < 0
    && V.zorunlu_yerler.indexOf(a.yer) < 0;
  const ana = V.asistanlar.filter(a => havuzda(a) || (sayac.toplam[a.ad] && !istisna(a.ad)));
  const diger = V.asistanlar.filter(a => ana.indexOf(a) < 0);
  c.appendChild(ceteleTablo(ana, sayac, max, s, false, ""));
  if (diger.length) c.appendChild(ceteleTablo(diger, sayac, max, s, true, ""));
}

function ciz_gosterge() {
  const {satirlar, sayac} = hesapla();
  const n = gunSayisi();
  if (BUGUN > n) BUGUN = n;
  const sel = $("#bugunGun");
  if (sel.options.length !== n) {
    sel.innerHTML = "";
    for (let g = 1; g <= n; g++) sel.appendChild(el("option", {value: g, textContent: g + " " + AYLAR[V.ay-1] + " " + GUNADI_UZUN[haftaGunu(g)]}));
  }
  sel.value = String(BUGUN);

  $("#btnGunGeri").disabled = BUGUN <= 1;
  $("#btnGunIleri").disabled = BUGUN >= n;
  const kb = $("#btnKilit");
  kb.hidden = !V.gecmis[String(BUGUN)];
  kb.title = "Bu gün kilitli — hesaplanmaz, aynen kullanılır. Kilidi açmak için tıklayın.";
  bugunKart($("#bugunIc"), BUGUN, satirlar[BUGUN-1]);
  $("#basbarAy").textContent = AYLAR[V.ay-1] + " " + V.yil;

  matris($("#matris1"), satirlar);
  ciz_cetele(sayac, satirlar[BUGUN-1]);
  ciz_ekip(satirlar[BUGUN-1]);
  ciz_gkural(satirlar, sayac);
  autofit();
}
function gunSec(g) {
  const n = gunSayisi();
  if (g < 1 || g > n) return;
  BUGUN = g; ciz_gosterge();
}
document.addEventListener("keydown", e => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if ($("#s-gosterge").hidden) return;
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))) return;
  e.preventDefault();
  gunSec(BUGUN + (e.key === "ArrowRight" ? 1 : -1));
});
$("#btnGunGeri").onclick = () => gunSec(BUGUN - 1);
$("#btnGunIleri").onclick = () => gunSec(BUGUN + 1);
$("#btnKilit").onclick = () => gunKilit(BUGUN);
function gunKilit(g) {
  const gs = String(g);
  if (V.gecmis[gs]) {
    delete V.gecmis[gs];
    sakla(); ciz_gosterge(); ciz_kural();
    toast(g + ". günün kilidi açıldı");
    return;
  }
  if (!SON) hesapla();
  const s = SON.satirlar[g-1];
  if (!s) return;
  V.gecmis[gs] = Object.assign({}, s.atama);
  sakla(); ciz_gosterge(); ciz_kural();
  toast(g + ". gün kilitlendi");
}
$("#bugunGun").onchange = e => { BUGUN = +e.target.value; ciz_gosterge(); };

/* ---------- asistanlar ---------- */

function ciz_asistan() {
  const tb = $("#tblAsistan tbody"); tb.innerHTML = "";
  V.asistanlar.forEach((a, i) => {
    const tr = el("tr"); tr.draggable = true; tr.dataset.i = i;
    const td = () => { const d = el("td"); tr.appendChild(d); return d; };
    td().innerHTML = '<span class="tasi" aria-hidden="true">⠿</span>';
    td().innerHTML = '<span class="sayi">' + (i + 1) + '</span>';
    const i1 = el("input", {value: a.ad, className: "gir"});
    i1.onchange = () => { adDegistir(a.ad, i1.value.trim()); };
    td().appendChild(i1);
    const i2 = el("input", {value: a.kisa, className: "gir"});
    i2.onchange = () => { a.kisa = i2.value.trim() || a.ad; sakla(); };
    td().appendChild(i2);
    const i3 = el("input", {value: a.yer, className: "gir"});
    i3.setAttribute("list", "yerListesi");
    i3.onchange = () => { a.yer = i3.value.trim(); sakla(); ciz_kural(); };
    td().appendChild(i3);
    const i4 = el("input", {type: "number", min: "0", step: "1", className: "gir gir-dar", value: a.kademe});
    i4.onchange = () => { a.kademe = parseInt(i4.value, 10) || 0; sakla(); };
    td().appendChild(i4);
    const c = el("input", {type: "checkbox", checked: a.havuz !== false});
    c.onchange = () => { a.havuz = c.checked; sakla(); };
    td().appendChild(c);
    const b = el("button", {className: "dgm", textContent: "Sil"});
    b.onclick = () => {
      if (!confirm(a.ad + " silinsin mi? Nöbet, izin ve geçmiş kayıtlarından da çıkarılır.")) return;
      asistanSil(a.ad); ciz_asistan();
    };
    td().appendChild(b);
    surukle(tr, tb);
    tb.appendChild(tr);
  });
  let dl = $("#yerListesi");
  if (!dl) { dl = el("datalist", {id: "yerListesi"}); document.body.appendChild(dl); }
  const yerler = new Set(V.asistanlar.map(a => a.yer).concat(V.zorunlu_yerler, V.havuz_disi_yerler));
  dl.innerHTML = ""; yerler.forEach(y => dl.appendChild(el("option", {value: y})));
  $("#zorunlu").value = V.zorunlu_yerler.join(", ");
  $("#havuzDisi").value = V.havuz_disi_yerler.join(", ");
  $("#gruplar").value = Object.keys(V.gruplar).map(y => y + "=" + V.gruplar[y]).join(", ");
  $("#minKademe").value = Object.keys(V.yer_min_kademe).map(y => y + "=" + V.yer_min_kademe[y]).join(", ");
}
function surukle(tr, tb) {
  tr.ondragstart = e => { e.dataTransfer.setData("text/plain", tr.dataset.i); };
  tr.ondragover = e => { e.preventDefault(); tr.classList.add("hedef"); };
  tr.ondragleave = () => tr.classList.remove("hedef");
  tr.ondrop = e => {
    e.preventDefault(); tr.classList.remove("hedef");
    const from = +e.dataTransfer.getData("text/plain"), to = +tr.dataset.i;
    if (from === to) return;
    const x = V.asistanlar.splice(from, 1)[0];
    V.asistanlar.splice(to, 0, x);
    sakla(); ciz_asistan();
  };
}
function adDegistir(eski, yeni) {
  if (!yeni || yeni === eski) { ciz_asistan(); return; }
  const a = V.asistanlar.find(x => x.ad === eski);
  if (a.kisa === eski) a.kisa = yeni;
  a.ad = yeni;
  for (const g in V.nobet) {
    ["yb","amel"].forEach(k => { V.nobet[g][k] = (V.nobet[g][k]||[]).map(x => x === eski ? yeni : x); });
  }
  V.izin.forEach(k => k.kisiler = k.kisiler.map(x => x === eski ? yeni : x));
  for (const g in V.gecmis) if (V.gecmis[g][eski] !== undefined) { V.gecmis[g][yeni] = V.gecmis[g][eski]; delete V.gecmis[g][eski]; }
  for (const g in V.force) V.force[g].forEach(z => { if (z.ad === eski) z.ad = yeni; });
  V.refakat.forEach(r => { if (r.ad === eski) r.ad = yeni; });
  V.degisim.forEach(d => { if (d.cikan === eski) d.cikan = yeni; if (d.giren === eski) d.giren = yeni; });
  if (V.devir.refakat && V.devir.refakat[eski] !== undefined) {
    V.devir.refakat[yeni] = V.devir.refakat[eski]; delete V.devir.refakat[eski];
  }
  ["yb","amel"].forEach(k => V.onceki_ay_son_gun_nobet[k] = (V.onceki_ay_son_gun_nobet[k]||[]).map(x => x === eski ? yeni : x));
  sakla(); ciz_asistan(); ciz_nobet(); ciz_izin();
}
function asistanSil(ad) {
  V.asistanlar = V.asistanlar.filter(a => a.ad !== ad);
  for (const g in V.nobet) ["yb","amel"].forEach(k => V.nobet[g][k] = (V.nobet[g][k]||[]).filter(x => x !== ad));
  V.izin.forEach(k => k.kisiler = k.kisiler.filter(x => x !== ad));
  for (const g in V.gecmis) delete V.gecmis[g][ad];
  for (const g in V.force) V.force[g] = V.force[g].filter(z => z.ad !== ad);
  V.refakat = V.refakat.filter(r => r.ad !== ad);
  V.degisim = V.degisim.filter(d => d.cikan !== ad && d.giren !== ad);
  sakla(); ciz_nobet(); ciz_izin(); ciz_kural();
}
$("#btnEkle").onclick = () => {
  const ad = prompt("Asistan adı:"); if (!ad) return;
  if (adlar().indexOf(ad.trim()) >= 0) { alert("Bu ad zaten var."); return; }
  V.asistanlar.push({ad: ad.trim(), kisa: ad.trim(), yer: "GenelCerrahi", havuz: true});
  sakla(); ciz_asistan();
};
$("#zorunlu").onchange = e => { V.zorunlu_yerler = bol(e.target.value); sakla(); ciz_asistan(); ciz_kural(); };
$("#havuzDisi").onchange = e => { V.havuz_disi_yerler = bol(e.target.value); sakla(); ciz_asistan(); };
$("#gruplar").onchange = e => {
  const m = {};
  bol(e.target.value).forEach(x => {
    const p = x.split("=");
    if (p.length === 2 && p[0].trim() && p[1].trim()) m[p[0].trim()] = p[1].trim();
  });
  V.gruplar = m; sakla(); ciz_asistan();
};
$("#minKademe").onchange = e => {
  const m = {};
  bol(e.target.value).forEach(x => {
    const p = x.split("=");
    if (p.length === 2 && p[0].trim() && !isNaN(parseInt(p[1], 10))) m[p[0].trim()] = parseInt(p[1], 10);
  });
  V.yer_min_kademe = m; sakla(); ciz_asistan();
};
function bol(s) { return s.split(",").map(x => x.trim()).filter(Boolean); }

/* ---------- nöbet ---------- */

function ciz_nobet() {
  const tb = $("#tblNobet tbody"); tb.innerHTML = "";
  for (let g = 1; g <= gunSayisi(); g++) {
    const hg = haftaGunu(g), tr = el("tr");
    if (hg === 0 || hg === 6) tr.className = "hafta-sonu";
    const td = () => { const d = el("td"); tr.appendChild(d); return d; };
    td().innerHTML = '<span class="gun-hucre">' + g + " " + GUNADI[hg] + "</span>";
    ["uzman_yb","yb","uzman_amel","amel"].forEach(k => {
      const n = V.nobet[String(g)] || {};
      const inp = el("input", {className: "gir", value: (n[k]||[]).join(", ")});
      inp.onchange = () => {
        V.nobet[String(g)] = V.nobet[String(g)] || {yb:[],amel:[]};
        V.nobet[String(g)][k] = bol(inp.value);
        sakla(); ciz_gosterge();
      };
      td().appendChild(inp);
    });
    const d = el("input", {className: "gir", value: V.ders[String(g)] || ""});
    d.onchange = () => { if (d.value.trim()) V.ders[String(g)] = d.value.trim(); else delete V.ders[String(g)]; sakla(); };
    td().appendChild(d);
    tb.appendChild(tr);
  }
}
$("#btnPrompt").onclick = () => {
  $("#promptKutu").value = promptMetni();
  $("#dPrompt").open = true;
  $("#dPrompt").scrollIntoView({block: "nearest"});
};
$("#dPrompt").ontoggle = () => { if ($("#dPrompt").open) $("#promptKutu").value = promptMetni(); };
$("#btnPrompt2").onclick = () => kopyala(promptMetni(), "Prompt kopyalandı — resimle birlikte YZ'ye verin");
$("#btnNobetTemizle").onclick = () => { if (confirm("Bu ayın tüm nöbet listesi silinsin mi?")) { V.nobet = {}; sakla(); ciz_nobet(); } };
$("#btnYapistir").onclick = () => { $("#dIce").open = true; $("#iceKutu").focus(); };
$("#btnIceAl").onclick = () => {
  const t = $("#iceKutu").value.trim();
  const s = $("#iceSonuc"); s.innerHTML = "";
  const not = m => s.appendChild(el("div", {className: "uyari", textContent: m}));
  if (!t) { not("Kutu boş."); return; }
  let o;
  try {
    const m = t.match(/\{[\s\S]*\}/);
    o = JSON.parse(m ? m[0] : t);
  } catch (e) { not("JSON çözümlenemedi: " + e.message); return; }
  const n = o.nobet || o;
  const bilinmeyen = new Set(), set = new Set(adlar()), yeni = {};
  let say = 0;
  for (const g in n) {
    if (!/^\d+$/.test(g) || !n[g] || typeof n[g] !== "object") continue;
    const yb = (n[g].yb || []).map(String), am = (n[g].amel || []).map(String);
    yb.concat(am).forEach(a => { if (!set.has(a)) bilinmeyen.add(a); });
    yeni[g] = {
      yb, amel: am,
      uzman_yb: (n[g].uzman_yb || []).map(String),
      uzman_amel: (n[g].uzman_amel || []).map(String)
    };
    say++;
  }
  if (!say) { not('Gün bulunamadı. Anahtarlar "1", "2" gibi gün numarası olmalı.'); return; }
  V.nobet = $("#iceBirlestir").checked ? Object.assign({}, V.nobet, yeni) : yeni;
  sakla(); ciz_nobet();
  not(say + " gün aktarıldı.");
  if (bilinmeyen.size) not("Asistan listesinde olmayan adlar: " + [...bilinmeyen].join(", "));
  if (o._notlar) not("YZ notu: " + o._notlar);
  const eksik = [];
  for (let g = 1; g <= gunSayisi(); g++) if (!yeni[String(g)]) eksik.push(g);
  if (eksik.length) not("Gelmeyen günler: " + eksik.join(", "));
};

/* ---------- izin ---------- */

function ciz_izin() {
  const tb = $("#tblIzin tbody"); tb.innerHTML = "";
  V.izin.forEach((k, i) => {
    const tr = el("tr");
    const td = () => { const d = el("td"); tr.appendChild(d); return d; };
    const a = el("input", {className: "gir", value: k.gunler});
    a.onchange = () => { k.gunler = a.value.trim(); sakla(); };
    td().appendChild(a);
    const b = el("input", {className: "gir", value: k.kisiler.join(", ")});
    b.onchange = () => { k.kisiler = bol(b.value); sakla(); };
    td().appendChild(b);
    const c = el("button", {className: "dgm", textContent: "Sil"});
    c.onclick = () => { V.izin.splice(i,1); sakla(); ciz_izin(); };
    td().appendChild(c);
    tb.appendChild(tr);
  });
}
$("#btnIzinEkle").onclick = () => { V.izin.push({gunler: "1-1", kisiler: []}); sakla(); ciz_izin(); };

function ciz_egitim() {
  const tb = $("#tblEgitim tbody"); tb.innerHTML = "";
  V.egitim.forEach((k, i) => {
    const tr = el("tr");
    const td = () => { const d = el("td"); tr.appendChild(d); return d; };
    const a = el("input", {className: "gir", value: k.gunler});
    a.onchange = () => { k.gunler = a.value.trim(); sakla(); };
    td().appendChild(a);
    const b = el("input", {className: "gir", value: k.kisiler.join(", ")});
    b.onchange = () => { k.kisiler = bol(b.value); sakla(); };
    td().appendChild(b);
    const c = el("button", {className: "dgm", textContent: "Sil"});
    c.onclick = () => { V.egitim.splice(i,1); sakla(); ciz_egitim(); };
    td().appendChild(c);
    tb.appendChild(tr);
  });
}
$("#btnEgitimEkle").onclick = () => { V.egitim.push({gunler: "1-1", kisiler: []}); sakla(); ciz_egitim(); };

/* ---------- kural / force / geçmiş ---------- */

function kadroDugmeleri(mini, yenile) {
  const d = el("div", {className: "gk-satir"});
  V.zorunlu_yerler.forEach(yer => {
    const m = kadroKurali(yer);
    const b = el("button", {type: "button", className: "dgm" + (mini ? " dgm-mini" : ""),
      textContent: yer + ": " + KADRO_KISA[m]});
    b.title = yer + " — " + KADRO_ETIKET[m] + ". Tıkla: Tek → Kıd.Tek → Çift";
    b.onclick = () => {
      V.yer_kadro[yer] = KADRO_SIRA[(KADRO_SIRA.indexOf(m) + 1) % KADRO_SIRA.length];
      sakla(); yenile();
    };
    d.appendChild(b);
  });
  return d;
}

function ciz_kural() {
  const kc = $("#kurallar"); kc.innerHTML = "";
  for (const k in KURAL_ETIKET) {
    const l = el("label"); l.style.display = "block"; l.style.margin = "4px 0";
    const c = el("input", {type: "checkbox", checked: !!V.kural[k]});
    l.appendChild(c); l.appendChild(document.createTextNode(" " + KURAL_ETIKET[k]));
    if (KURAL_DURUM.indexOf(k) >= 0) {
      const r = kuralRozet(k, c.checked);
      const d = el("span", {className: "kural-durum", textContent: r.metin});
      d.classList.toggle("kural-hayir", r.hayir);
      c.disabled = r.pasif;
      if (r.pasif) l.classList.add("kural-pasif");
      c.onchange = () => { V.kural[k] = c.checked; sakla(); ciz_kural(); };
      l.appendChild(d);
    } else {
      c.onchange = () => { V.kural[k] = c.checked; sakla(); ciz_kural(); };
    }
    kc.appendChild(l);
  }
  const l2 = el("label"); l2.style.display = "block"; l2.style.marginTop = "12px";
  l2.appendChild(document.createTextNode("Önceki ayın son günü nöbet tutanlar: "));
  const i2 = el("input", {className: "gir", style: "width:280px;display:inline-block",
    value: (V.onceki_ay_son_gun_nobet.yb||[]).concat(V.onceki_ay_son_gun_nobet.amel||[]).join(", ")});
  i2.onchange = () => { V.onceki_ay_son_gun_nobet = {yb: bol(i2.value), amel: []}; sakla(); };
  l2.appendChild(i2); kc.appendChild(l2);

  const l3 = el("div"); l3.style.marginTop = "12px";
  l3.appendChild(el("div", {className: "ipucu", textContent: "Yer kadrosu — o yere kaç kişi gönderilsin"}));
  l3.appendChild(kadroDugmeleri(false, () => { ciz_kural(); ciz_gosterge(); }));
  kc.appendChild(l3);

  const ac = $("#agirliklar"); ac.innerHTML = "";
  for (const k in AGIRLIK_ETIKET) {
    const l = el("label"); l.style.display = "block"; l.style.margin = "4px 0";
    const i = el("input", {type: "number", step: "0.5", min: "0", className: "gir gir-dar", value: V.agirlik[k]});
    i.style.display = "inline-block";
    i.onchange = () => { V.agirlik[k] = parseFloat(i.value) || 0; sakla(); };
    l.appendChild(i); l.appendChild(document.createTextNode(" " + AGIRLIK_ETIKET[k]));
    ac.appendChild(l);
  }

  const gunOpt = s => { s.innerHTML = ""; for (let g = 1; g <= gunSayisi(); g++) s.appendChild(el("option", {value: g, textContent: g + " " + GUNADI[haftaGunu(g)]})); };
  gunOpt($("#fGun")); gunOpt($("#aGun")); gunOpt($("#gGun"));
  const ks = $("#fKisi"); ks.innerHTML = "";
  adlar().forEach(a => ks.appendChild(el("option", {value: a, textContent: a})));
  const gk = $("#gKisi"); gk.innerHTML = "";
  adlar().forEach(a => gk.appendChild(el("option", {value: a, textContent: a})));
  const gy = $("#gYer"); gy.innerHTML = "";
  V.zorunlu_yerler.forEach(y => gy.appendChild(el("option", {value: y, textContent: y})));
  const ys = $("#fYer"); ys.innerHTML = "";
  const ay = $("#aYer"); ay.innerHTML = "";
  const tumYer = [...new Set(V.zorunlu_yerler.concat(V.asistanlar.map(a => a.yer)))];
  tumYer.forEach(y => { ys.appendChild(el("option", {value: y, textContent: y})); });
  V.zorunlu_yerler.forEach(y => ay.appendChild(el("option", {value: y, textContent: y})));
  const rk = $("#rKisi"); rk.innerHTML = "";
  adlar().forEach(a => rk.appendChild(el("option", {value: a, textContent: a})));
  const ry = $("#rYer"); ry.innerHTML = "";
  V.zorunlu_yerler.forEach(y => ry.appendChild(el("option", {value: y, textContent: y})));
  gunOpt($("#nGun"));
  ["#nCikan", "#nGiren"].forEach(s => {
    const e = $(s); e.innerHTML = "";
    adlar().forEach(a => e.appendChild(el("option", {value: a, textContent: a})));
  });
  karsiOpt($("#nKarsi"), $("#nGiren").value, $("#nGun").value);
  $("#nGiren").onchange = () => karsiOpt($("#nKarsi"), $("#nGiren").value, $("#nGun").value);
  $("#nGun").onchange = () => karsiOpt($("#nKarsi"), $("#nGiren").value, $("#nGun").value);
  ciz_refakat(); ciz_force(); ciz_degisim(); ciz_gecmis();
}
function ciz_refakat() {
  const tb = $("#tblRefakat tbody"); tb.innerHTML = "";
  if (!SON) hesapla();
  const sy = SON.sayac.refakat || {};
  V.refakat.forEach((r, i) => {
    const c = sy[r.ad] || 0;
    const durum = c < r.gun ? "Refakatçi " + c + "/" + r.gun
      : "Tamamlandı — tek başına gidebilir";
    const tr = el("tr");
    tr.appendChild(el("td", {textContent: r.ad}));
    tr.appendChild(el("td", {textContent: r.yer}));
    const td3 = el("td");
    const ai = el("input", {type: "number", min: "1", step: "1", className: "gir gir-dar", value: r.gun});
    ai.onchange = () => { r.gun = Math.max(1, parseInt(ai.value, 10) || 1); sakla(); ciz_kural(); ciz_gosterge(); };
    td3.appendChild(ai); tr.appendChild(td3);
    tr.appendChild(el("td", {textContent: durum}));
    const td5 = el("td");
    const b = el("button", {className: "dgm dgm-mini", textContent: "Sil"});
    b.onclick = () => { V.refakat.splice(i, 1); sakla(); ciz_kural(); ciz_gosterge(); };
    td5.appendChild(b); tr.appendChild(td5);
    tb.appendChild(tr);
  });
  if (!V.refakat.length) {
    const tr = el("tr");
    tr.appendChild(el("td", {colSpan: 5, className: "gk-bos", textContent: "Refakate alınan kimse yok"}));
    tb.appendChild(tr);
  }
}
$("#btnRefakat").onclick = () => {
  const ad = $("#rKisi").value, yer = $("#rYer").value;
  const gun = Math.max(1, parseInt($("#rAdet").value, 10) || 1);
  const v = V.refakat.find(r => r.ad === ad);
  if (v) { v.yer = yer; v.gun = gun; } else V.refakat.push({ad, yer, gun});
  sakla(); ciz_kural(); ciz_gosterge();
  toast(kisaAd(ad) + " → " + yer + " refakati " + gun + " gün");
};
function ciz_degisim() {
  const tb = $("#tblDegisim tbody"); tb.innerHTML = "";
  V.degisim.slice().sort((a, b) => a.gun - b.gun).forEach(d => {
    const tr = el("tr");
    tr.appendChild(el("td", {className: "gun-hucre", textContent: d.gun}));
    tr.appendChild(el("td", {textContent: d.cikan}));
    tr.appendChild(el("td", {textContent: d.giren}));
    tr.appendChild(el("td", {className: "gun-hucre",
      textContent: d.karsi ? d.karsi + ". gün karşılığı" : "tek taraflı"}));
    const td = el("td"), b = el("button", {className: "dgm", textContent: "Sil"});
    b.onclick = () => {
      V.degisim = V.degisim.filter(x => x !== d);
      sakla(); ciz_degisim(); ciz_gosterge();
    };
    td.appendChild(b); tr.appendChild(td); tb.appendChild(tr);
  });
}
function degisimEkle(gun, cikan, giren, karsi) {
  if (cikan === giren) { toast("Çıkan ve giren aynı kişi olamaz"); return; }
  const n = nobetGun(+gun);
  if (n.yb.concat(n.amel).indexOf(cikan) < 0) { toast(gun + ". gün " + kisaAd(cikan) + " nöbetçi değil"); return; }
  if (karsi === undefined) karsi = karsiOneri(giren, gun);
  karsi = +karsi || 0;
  if (karsi && nobetGunleri(giren).indexOf(karsi) < 0) {
    toast(karsi + ". gün " + kisaAd(giren) + " nöbetçi değil"); return;
  }
  V.degisim = V.degisim.filter(d => !(+d.gun === +gun && d.cikan === cikan));
  V.degisim.push({gun: +gun, cikan, giren, karsi});
  sakla(); ciz_degisim(); ciz_gosterge();
  toast(karsi
    ? kisaAd(cikan) + " ile " + kisaAd(giren) + " nöbet değişti: " + gun + " ↔ " + karsi
    : gun + ". gün nöbeti " + kisaAd(cikan) + " yerine " + kisaAd(giren) + " tuttu");
}
function karsiOneri(giren, gun) {
  const gl = nobetGunleri(giren).filter(x => x !== +gun);
  if (!gl.length) return 0;
  const y = gl.reduce((a, b) => Math.abs(b - gun) < Math.abs(a - gun) ? b : a);
  return Math.abs(y - gun) <= 7 ? y : 0;
}
function karsiOpt(sec, giren, gun) {
  sec.innerHTML = "";
  sec.appendChild(el("option", {value: "0", textContent: "tek taraflı"}));
  nobetGunleri(giren).filter(x => x !== +gun).forEach(x =>
    sec.appendChild(el("option", {value: x, textContent: x + ". günü çıkan tutsun"})));
  sec.value = String(karsiOneri(giren, gun) || 0);
}
function ciz_force() {
  const tb = $("#tblForce tbody"); tb.innerHTML = "";
  Object.keys(V.force).sort((a,b) => a-b).forEach(g => {
    (V.force[g]||[]).forEach((z, i) => {
      const tr = el("tr");
      tr.appendChild(el("td", {className: "gun-hucre", textContent: g}));
      tr.appendChild(el("td", {textContent: z.ad}));
      tr.appendChild(el("td", {textContent: z.yer}));
      const d = el("td"); const b = el("button", {className:"dgm", textContent:"Sil"});
      b.onclick = () => { V.force[g].splice(i,1); if (!V.force[g].length) delete V.force[g]; sakla(); ciz_force(); };
      d.appendChild(b); tr.appendChild(d); tb.appendChild(tr);
    });
  });
}
$("#btnDegisim").onclick = () => degisimEkle($("#nGun").value, $("#nCikan").value, $("#nGiren").value, $("#nKarsi").value);
$("#btnForce").onclick = () => {
  const g = $("#fGun").value, ad = $("#fKisi").value, yer = $("#fYer").value;
  V.force[g] = (V.force[g]||[]).filter(z => z.ad !== ad);
  V.force[g].push({ad, yer});
  sakla(); ciz_force(); toast(g + ". gün " + ad + " → " + yer + " zorlandı");
};
$("#btnGecmisEkle").onclick = () => {
  const g = $("#gGun").value, ad = $("#gKisi").value, yer = $("#gYer").value;
  V.gecmis[g] = V.gecmis[g] || {};
  V.gecmis[g][ad] = yer;
  sakla(); ciz_gecmis(); toast(g + ". gün " + ad + " → " + yer + " geçmişe yazıldı");
};
function ciz_gecmis() {
  const tb = $("#tblGecmis tbody"); tb.innerHTML = "";
  Object.keys(V.gecmis).sort((a,b) => a-b).forEach(g => {
    const tr = el("tr");
    tr.appendChild(el("td", {className: "gun-hucre", textContent: g}));
    const t = el("td");
    const m = V.gecmis[g];
    const kl = Object.keys(m);
    if (kl.length) kl.forEach(ad => t.appendChild(cip(ad + " → " + m[ad], "cip-yer")));
    else t.appendChild(cip("Görevlendirme yok", "cip-yer"));
    tr.appendChild(t);
    const d = el("td"); const b = el("button", {className:"dgm", textContent:"Kilidi Aç"});
    b.onclick = () => { delete V.gecmis[g]; sakla(); ciz_gecmis(); };
    d.appendChild(b); tr.appendChild(d); tb.appendChild(tr);
  });
  if (!tb.children.length) {
    const tr = el("tr");
    tr.appendChild(el("td", {colSpan: 3, textContent: 'Kilitli gün yok. Çıktı sekmesindeki "Geçmişe Kaydet" ile eklenir.'}));
    tb.appendChild(tr);
  }
}

/* ---------- çıktı ---------- */

function ciz_cikti() {
  const {satirlar} = hesapla();
  const u = $("#uyarilar"); u.innerHTML = "";
  const h = dogrula();
  satirlar.forEach(s => { if (s.kademeAsimi.length) h.push(s.gun + ". gün kademe eşiği aşıldı: " + s.kademeAsimi.join(", ") + " (başka aday kalmadı)"); });
  satirlar.forEach(s => { if (s.dolmayan.length) h.push(s.gun + ". gün doldurulamadı: " + s.dolmayan.join(", ") + " (havuzda uygun kimse yok)"); });
  h.forEach(x => u.appendChild(el("div", {className: "uyari", textContent: x})));

  const c = $("#cikti"); c.innerHTML = "";
  const hepsi = $("#ciktiBos").checked;
  satirlar.forEach(s => {
    const rows = gunSatirlari(s);
    if (!rows.length && !hepsi) return;
    const box = el("div", {className: "cikti-kutu"});
    const hd = el("div", {className: "cikti-bas"});
    hd.appendChild(el("b", {className: "cikti-gun", textContent: gunBaslik(s)}));
    if (s.kaynak === "geçmiş") hd.appendChild(cip("Kilitli"));
    if (s.kaynak === "hafta sonu") hd.appendChild(cip("Hafta Sonu"));
    if (s.zorla.length) hd.appendChild(cip("Zorlanan: " + s.zorla.join(", ")));
    if (s.kademeAsimi.length) hd.appendChild(cip("Kademe aşıldı: " + s.kademeAsimi.join(", ")));
    hd.appendChild(el("span", {className: "bosluk"}));
    const b1 = el("button", {className: "dgm", textContent: "Kopyala"});
    b1.onclick = () => kopyala(gunMetin(s), s.gun + ". gün kopyalandı");
    hd.appendChild(b1);
    if (s.kaynak !== "geçmiş") {
      const b2 = el("button", {className: "dgm", textContent: "Geçmişe Kaydet"});
      b2.onclick = () => { V.gecmis[String(s.gun)] = Object.assign({}, s.atama); sakla(); ciz_cikti(); toast(s.gun + ". gün kilitlendi"); };
      hd.appendChild(b2);
    }
    box.appendChild(hd);
    const t = el("table", {className: "grid-line"}); const tb = el("tbody");
    rows.forEach(r => {
      const tr = el("tr");
      tr.appendChild(el("td", {textContent: r[0]}));
      tr.appendChild(el("td", {textContent: r[1]}));
      tb.appendChild(tr);
    });
    t.appendChild(tb); box.appendChild(t); c.appendChild(box);
  });
  if (!c.children.length) c.appendChild(el("p", {className: "ipucu", textContent: "Bu ayda görevlendirme gerektiren gün yok."}));
}
$("#btnKilitle").onclick = () => {
  const son = BUGUN;
  if (!SON) hesapla();
  let k = 0;
  SON.satirlar.forEach(s => {
    if (s.gun > son || s.kaynak === "geçmiş" || s.kaynak === "hafta sonu") return;
    V.gecmis[String(s.gun)] = Object.assign({}, s.atama); k++;
  });
  sakla(); ciz_cikti(); ciz_kural();
  toast(k + " gün kilitlendi, kalan ay yeniden hesaplandı");
};
$("#ciktiBos").onchange = ciz_cikti;
$("#btnHesapla").onclick = ciz_cikti;
$("#btnKopyaAy").onclick = () => {
  if (!SON) hesapla();
  const p = SON.satirlar.map(s => {
    const r = gunSatirlari(s);
    if (!r.length) return null;
    return gunBaslik(s) + "\n" + r.map(x => x[0] + "\t" + x[1]).join("\n");
  }).filter(Boolean).join("\n\n");
  kopyala(p, "Tüm ay kopyalandı");
};
$("#btnKopyaTsv").onclick = () => {
  if (!SON) hesapla();
  const bas = ["Gün","Hafta"].concat(V.zorunlu_yerler, ["İzinli","Nöbet Ertesi","Ders"]);
  const sat = [bas.join("\t")];
  const kd = kidem();
  SON.satirlar.forEach(s => {
    const yerler = {};
    for (const ad in s.atama) (yerler[s.atama[ad]] = yerler[s.atama[ad]] || []).push(ad);
    const iz = [], ne = [];
    for (const ad in s.yok) { if (s.atama[ad]) continue; if (s.yok[ad] === "İzinli") iz.push(ad); else if (s.yok[ad] === "Nöbet Ertesi") ne.push(ad); }
    const f = a => a.slice().sort((x,y)=>kd[x]-kd[y]).map(kisaAd).join(" ");
    sat.push([s.gun, s.gunAdi].concat(
      V.zorunlu_yerler.map(y => yerler[y] ? f(yerler[y]) : ""),
      [f(iz), f(ne), V.ders[String(s.gun)] || ""]
    ).join("\t"));
  });
  kopyala(sat.join("\n"), "TSV kopyalandı — Excel'e yapıştırın");
};

/* ---------- analiz ---------- */

function otoAta(yer) {
  const g = BUGUN, gs = String(g);
  if (!SON) hesapla();
  const s = SON.satirlar[g-1];
  if (!s) return;
  if (s.kaynak === "geçmiş") { toast(g + ". gün kilitli, önce kilidi açın"); return; }
  const kd = kidem(), yh = yerHarita(s.gun);
  const aday = havuz(s.yok, s.kalsin, s.gun).filter(ad => !s.atama[ad]);
  if (!aday.length) { toast("Bugün havuzda uygun kimse kalmadı"); return; }
  const kadro = adlar().filter(ad => yh[ad] === yer);
  const hedef = kadro.length ? kadro.reduce((x, ad) => x + kd[ad], 0) / kadro.length : 9;
  const dun = g > 1 ? new Set(Object.keys(SON.satirlar[g-2].atama)) : new Set();
  const ybn = new Set(nobetGun(g).yb);
  const bos = {yer, hedef};
  let en = null, enM = Infinity;
  aday.forEach(ad => {
    const m = maliyet(ad, bos, s.onceSayac, dun, kd, ybn);
    if (m < enM) { enM = m; en = ad; }
  });
  const l = V.force[gs] = V.force[gs] || [];
  if (!l.some(z => z.ad === en && z.yer === yer)) l.push({ad: en, yer});
  sakla(); ciz_gosterge(); ciz_kural();
  toast(g + ". gün " + yer + " → " + kisaAd(en) + (yasak(en, yer) ? " (kademe eşiğinin altında)" : ""));
}

function ciz_gkural(satirlar, sayac) {
  const c = $("#gkural"); c.innerHTML = "";
  const g = BUGUN, gs = String(g);
  c.appendChild(el("div", {className: "gk-ust", textContent: "Kurallar — " + g + " " + AYLAR[V.ay-1]}));

  const bl = (bas, alan) => {
    const d = el("div", {className: "gk-blok gkb-" + alan});
    d.appendChild(el("div", {className: "gk-bas", textContent: bas}));
    return d;
  };
  const kisiSec = () => {
    const s2 = el("select", {className: "gir gir-mini"});
    adlar().forEach(a => s2.appendChild(el("option", {value: a, textContent: kisaAd(a)})));
    return s2;
  };

  const b0 = bl("Genel kurallar", "genel");
  for (const k in KURAL_ETIKET) {
    const l = el("label", {className: "gk-kural"});
    const cb = el("input", {type: "checkbox", checked: !!V.kural[k]});
    l.appendChild(cb);
    l.appendChild(el("span", {textContent: KURAL_ETIKET[k]}));
    if (KURAL_DURUM.indexOf(k) >= 0) {
      const r = kuralRozet(k, cb.checked);
      const dd = el("span", {className: "kural-durum", textContent: r.metin});
      dd.classList.toggle("kural-hayir", r.hayir);
      cb.disabled = r.pasif;
      if (r.pasif) l.classList.add("kural-pasif");
      cb.onchange = () => { V.kural[k] = cb.checked; sakla(); ciz_gosterge(); ciz_kural(); };
      l.appendChild(dd);
    } else {
      cb.onchange = () => { V.kural[k] = cb.checked; sakla(); ciz_gosterge(); ciz_kural(); };
    }
    b0.appendChild(l);
  }
  b0.appendChild(kadroDugmeleri(true, () => { ciz_gosterge(); ciz_kural(); }));
  c.appendChild(b0);

  const b1 = bl("Bugünün ek kuralları", "bugun");
  const f1 = el("div", {className: "gk-satir"});
  const k1 = kisiSec();
  const d1 = el("button", {type: "button", className: "dgm dgm-mini", textContent: "Sabitle"});
  d1.title = "Bugün başka yere gönderme, kendi yerinde kalsın";
  d1.onclick = () => {
    const l = V.sabit[gs] = V.sabit[gs] || [];
    if (l.indexOf(k1.value) < 0) l.push(k1.value);
    sakla(); ciz_gosterge(); ciz_kural();
  };
  f1.appendChild(k1); f1.appendChild(d1);
  b1.appendChild(f1);

  const f2 = el("div", {className: "gk-satir"});
  const k2 = kisiSec();
  const y2 = el("select", {className: "gir gir-mini"});
  V.zorunlu_yerler.concat(["Ders", "Diğer"]).forEach(y =>
    y2.appendChild(el("option", {value: y, textContent: y})));
  const a2 = el("input", {className: "gir gir-mini", placeholder: "ne için?"});
  a2.title = "'Diğer' için açıklama — atamada ve çıktıda bu yazı görünür";
  a2.hidden = y2.value !== "Diğer";
  y2.onchange = () => { a2.hidden = y2.value !== "Diğer"; if (!a2.hidden) a2.focus(); };
  const d2 = el("button", {type: "button", className: "dgm dgm-mini", textContent: "Zorla"});
  d2.title = "Kurala bakılmaz, bugün bu kişi bu yere yazılır";
  d2.onclick = () => {
    const not = a2.value.trim();
    const yer = (y2.value === "Diğer" && not) ? "Diğer — " + not : y2.value;
    const l = V.force[gs] = V.force[gs] || [];
    if (!l.some(z => z.ad === k2.value && z.yer === yer)) l.push({ad: k2.value, yer});
    a2.value = "";
    sakla(); ciz_gosterge(); ciz_kural();
  };
  f2.appendChild(k2); f2.appendChild(y2); f2.appendChild(a2); f2.appendChild(d2);
  b1.appendChild(f2);

  const f3 = el("div", {className: "gk-satir"});
  const y3 = el("select", {className: "gir gir-mini"});
  V.zorunlu_yerler.forEach(y => y3.appendChild(el("option", {value: y, textContent: y})));
  const n3 = el("select", {className: "gir gir-mini"});
  [1,2,3].forEach(n => n3.appendChild(el("option", {value: n, textContent: n + " kişi"})));
  n3.value = "2";
  const d3 = el("button", {type: "button", className: "dgm dgm-mini", textContent: "Kadro İste"});
  d3.title = "Bugün bu yerde bu kadar kişi bulunsun; eksiği havuzdan doldurulur";
  d3.onclick = () => {
    const a = V.yer_adet[gs] = V.yer_adet[gs] || {};
    const n = +n3.value;
    if (n > 1) a[y3.value] = n; else delete a[y3.value];
    if (!Object.keys(a).length) delete V.yer_adet[gs];
    sakla(); ciz_gosterge(); ciz_kural();
  };
  f3.appendChild(y3); f3.appendChild(n3); f3.appendChild(d3);
  b1.appendChild(f3);

  const f6 = el("div", {className: "gk-satir"});
  const nb = nobetGun(g);
  const c6 = el("select", {className: "gir gir-mini"});
  nb.yb.concat(nb.amel).forEach(a => c6.appendChild(el("option", {value: a, textContent: kisaAd(a)})));
  const g6 = kisiSec();
  const d6 = el("button", {type: "button", className: "dgm dgm-mini", textContent: "Nöbet Değişti"});
  d6.title = "Bugünün nöbetini çıkan yerine giren tutar; girenin kendi nöbet günü tekse onu da çıkan tutar";
  d6.disabled = !c6.options.length;
  d6.onclick = () => degisimEkle(g, c6.value, g6.value);
  f6.appendChild(c6); f6.appendChild(g6); f6.appendChild(d6);
  b1.appendChild(f6);

  const f4 = el("div", {className: "gk-satir"});
  f4.appendChild(el("span", {className: "gk-bos", textContent: "Otomatik ata:"}));
  V.zorunlu_yerler.forEach(y => {
    const b = el("button", {type: "button", className: "dgm dgm-mini", textContent: y});
    b.title = y + " için bugünün en uygun kişisini bulur ve zorlar — o yerde 2. ya da 3. kişi olsa bile";
    b.onclick = () => otoAta(y);
    f4.appendChild(b);
  });
  b1.appendChild(f4);

  const f5 = el("div", {className: "gk-satir"});
  f5.appendChild(el("span", {className: "gk-bos", textContent: "Bugün gerekmiyor:"}));
  V.zorunlu_yerler.forEach(y => {
    const kapali = (V.yer_adet[gs] || {})[y] === 0;
    const b = el("button", {type: "button",
      className: "dgm dgm-mini" + (kapali ? " dgm-birincil" : ""), textContent: y});
    b.title = kapali
      ? y + " bugün kapalı — geri açmak için tıklayın"
      : "Bugün " + y + " için kimse görevlendirilmesin";
    b.onclick = () => {
      const a2 = V.yer_adet[gs] = V.yer_adet[gs] || {};
      if (a2[y] === 0) delete a2[y]; else a2[y] = 0;
      if (!Object.keys(a2).length) delete V.yer_adet[gs];
      sakla(); ciz_gosterge(); ciz_kural();
    };
    f5.appendChild(b);
  });
  b1.appendChild(f5);

  const liste = el("div", {className: "gk-liste"});
  const ad3 = V.yer_adet[gs] || {};
  Object.keys(ad3).forEach(y => {
    const r2 = el("div", {className: "gk-oge gk-zorla"});
    r2.appendChild(el("span", {textContent: ad3[y] === 0
      ? y + " bugün gerekmiyor" : y + " × " + ad3[y] + " kişi"}));
    const x = el("button", {type: "button", className: "gk-sil", textContent: "×", title: "Kaldır"});
    x.onclick = () => { delete V.yer_adet[gs][y];
      if (!Object.keys(V.yer_adet[gs]).length) delete V.yer_adet[gs];
      sakla(); ciz_gosterge(); ciz_kural(); };
    r2.appendChild(x); liste.appendChild(r2);
  });
  (V.sabit[gs] || []).forEach((ad, i) => {
    const r = el("div", {className: "gk-oge"});
    r.appendChild(el("span", {textContent: kisaAd(ad) + " sabit"}));
    const x = el("button", {type: "button", className: "gk-sil", textContent: "×", title: "Kaldır"});
    x.onclick = () => { V.sabit[gs].splice(i,1); if (!V.sabit[gs].length) delete V.sabit[gs]; sakla(); ciz_gosterge(); ciz_kural(); };
    r.appendChild(x); liste.appendChild(r);
  });
  (V.force[gs] || []).forEach((z, i) => {
    const r = el("div", {className: "gk-oge gk-zorla"});
    r.appendChild(el("span", {textContent: kisaAd(z.ad) + " → " + z.yer}));
    const x = el("button", {type: "button", className: "gk-sil", textContent: "×", title: "Kaldır"});
    x.onclick = () => { V.force[gs].splice(i,1); if (!V.force[gs].length) delete V.force[gs]; sakla(); ciz_gosterge(); ciz_kural(); };
    r.appendChild(x); liste.appendChild(r);
  });
  V.degisim.filter(d => +d.gun === g || (d.karsi && +d.karsi === g)).forEach(d => {
    const r = el("div", {className: "gk-oge"});
    const ters = +d.gun !== g;
    r.appendChild(el("span", {textContent: "Nöbet: " + kisaAd(ters ? d.giren : d.cikan) +
      " → " + kisaAd(ters ? d.cikan : d.giren) + (d.karsi ? " (karşılıklı)" : "")}));
    const x = el("button", {type: "button", className: "gk-sil", textContent: "×", title: "Kaldır"});
    x.onclick = () => { V.degisim = V.degisim.filter(y => y !== d); sakla(); ciz_gosterge(); ciz_kural(); };
    r.appendChild(x); liste.appendChild(r);
  });
  if (!liste.children.length) liste.appendChild(el("div", {className: "gk-bos", textContent: "Bugüne ek kural yok"}));
  b1.appendChild(liste);
  c.appendChild(b1);

  const b2 = bl("Dengeleme ağırlıkları", "agirlik");
  const ag = el("div", {className: "gk-agirlik"});
  for (const k in AGIRLIK_ETIKET) {
    const l = el("label", {className: "gk-ag"});
    const i = el("input", {type: "number", step: "0.5", min: "0", className: "gir gir-mini", value: V.agirlik[k]});
    i.onchange = () => { V.agirlik[k] = parseFloat(i.value) || 0; sakla(); ciz_gosterge(); ciz_kural(); };
    l.appendChild(i);
    l.appendChild(el("span", {textContent: AGIRLIK_KISA[k]}));
    ag.appendChild(l);
  }
  b2.appendChild(ag);
  const ob = el("div", {className: "gk-satir"});
  const bo = el("button", {type: "button", className: "dgm dgm-mini", textContent: "Oto Ayarla"});
  bo.title = "Ağırlıkları tarayıp kıdem komşularına göre en dengeli dağılımı bulur";
  bo.onclick = otoAgirlik;
  ob.appendChild(bo);
  b2.appendChild(ob);
  c.appendChild(b2);

  const b4 = bl("Ay devri", "devir");
  const dv = el("div", {className: "gk-satir"});
  const dt = Object.values(V.devir.toplam || {}).reduce((x,y) => x+y, 0);
  dv.appendChild(el("span", {className: "gk-bos",
    textContent: dt ? V.devir.kaynak + " devri: " + dt + " görev (kendiliğinden)"
      : (V.devir.elle ? "Devir elle kapatıldı" : "Devir yok · önceki ay kayıtlı değil")}));
  const bd = el("button", {type: "button", className: "dgm dgm-mini",
    textContent: "Sonraki Aya Devret"});
  bd.title = "Kadro, kural ve ağırlıkları taşır; sayacı ve bu ayın son gün nöbetini devreder";
  bd.onclick = devret;
  dv.appendChild(bd);
  if (V.devir.elle) {
    const ba = el("button", {type: "button", className: "dgm dgm-mini", textContent: "Devri Aç"});
    ba.title = "Önceki ayın sayacını yeniden devral";
    ba.onclick = () => { delete V.devir.elle; devirTazele(V); sakla(); ciz_gosterge(); ciz_kural(); };
    dv.appendChild(ba);
  }
  if (dt) {
    const bs = el("button", {type: "button", className: "dgm dgm-mini", textContent: "Devri Kapat"});
    bs.onclick = () => { V.devir = {toplam:{}, yer:{}, kaynak:"", elle:true}; sakla(); ciz_gosterge(); ciz_kural(); };
    dv.appendChild(bs);
  }
  b4.appendChild(dv);
  c.appendChild(b4);

  const bak = analizUyarilari(satirlar, sayac);
  const b3 = bl("Uyarılar", "uyari");
  if (bak.length) bak.forEach(x => b3.appendChild(el("div", {className: "uyari gk-uyari", textContent: x})));
  else b3.appendChild(el("div", {className: "gk-bos", textContent: "Uyarı yok"}));
  c.appendChild(b3);
}

function ciz_analiz() {
  const {satirlar, sayac} = hesapla();
  const a = $("#analiz"); a.innerHTML = "";
  const max = Math.max(1, ...Object.values(sayac.toplam));
  const t = el("table", {className: "grid-line"});
  t.innerHTML = "<thead><tr><th>#</th><th>Asistan</th><th>Kendi Yeri</th><th>Toplam</th><th title=\"Kişinin ay içindeki toplam görev sayısının, en çok görev alan kişiye oranı. Dolu çubuk o ayın en yüklü kişisi demektir.\">Yük</th>" +
    gruplar().map(y => "<th>" + y + "</th>").join("") + "<th>Son Görev</th></tr></thead>";
  const tb = el("tbody");
  V.asistanlar.forEach((as, i) => {
    const tot = sayac.toplam[as.ad] || 0;
    const havuzda = as.havuz !== false && V.havuz_disi_yerler.indexOf(as.yer) < 0 && V.zorunlu_yerler.indexOf(as.yer) < 0;
    if (!havuzda && (!tot || istisna(as.ad))) return;
    const tr = el("tr");
    tr.appendChild(el("td", {className: "sayi", textContent: i+1}));
    tr.appendChild(el("td", {textContent: as.ad}));
    tr.appendChild(el("td", {textContent: as.yer}));
    tr.appendChild(el("td", {className: "sayi", textContent: tot}));
    const bd = el("td");
    const bar = el("span", {className: "cubuk"});
    bar.appendChild(el("i", {style: "width:" + Math.round(tot/max*100) + "%"}));
    bd.appendChild(bar); tr.appendChild(bd);
    gruplar().forEach(y => {
      const n = sayac.yer[as.ad + "|" + y] || 0;
      tr.appendChild(el("td", {className: "sayi" + (n ? "" : " sayi-sonuk"), textContent: n || "·"}));
    });
    tr.appendChild(el("td", {className: "sayi", textContent: sayac.sonGun[as.ad] ? sayac.sonGun[as.ad] + ". gün" : "·"}));
    tb.appendChild(tr);
  });
  t.appendChild(tb); a.appendChild(t);

  const bak = analizUyarilari(satirlar, sayac);
  if (bak.length) {
    const d = el("div"); d.style.marginTop = "16px";
    bak.forEach(x => d.appendChild(el("div", {className: "uyari", textContent: x})));
    a.appendChild(d);
  }
}
function adaletSkoru(satirlar, sayac) {
  const kd = kidem();
  const havuzlu = V.asistanlar.filter(x => x.havuz !== false && V.havuz_disi_yerler.indexOf(x.yer) < 0 && V.zorunlu_yerler.indexOf(x.yer) < 0);
  const sapma = liste => {
    if (liste.length < 2) return 0;
    const y = liste.map(x => sayac.toplam[x.ad] || 0);
    let t = 0;
    for (let i = 0; i < y.length; i++) {
      let s = 0, n = 0;
      for (let j = Math.max(0, i - 2); j <= Math.min(y.length - 1, i + 2); j++) if (j !== i) { s += y[j]; n++; }
      t += Math.abs(y[i] - s / n);
    }
    return t / y.length;
  };
  const kidemliSapma = sapma(havuzlu.filter(x => kademesi(x.ad) > 0));
  const comezSapma = sapma(havuzlu.filter(x => kademesi(x.ad) === 0));
  const yuk = havuzlu.map(x => sayac.toplam[x.ad] || 0);
  let ters = 0;
  for (let i = 0; i < yuk.length - 1; i++) ters += Math.max(0, yuk[i] - yuk[i+1]);
  ters = yuk.length > 1 ? ters / (yuk.length - 1) : 0;
  const yr = Math.floor(yuk.length / 2);
  const ort = a => a.length ? a.reduce((x,y) => x+y, 0) / a.length : 0;
  const egim = yuk.length > 1 ? Math.min(1, ort(yuk.slice(yr)) - ort(yuk.slice(0, yr))) : 0;
  const fark = yuk.length ? Math.max(...yuk) - Math.min(...yuk) : 0;
  const ceza = 100 * Math.max(0, fark - 3);
  let ku = 0, na = 0;
  satirlar.forEach(s => {
    if (s.kaynak !== "hesap") return;
    for (const ad in s.atama) {
      const b = s.boslar.find(x => x.yer === s.atama[ad]);
      if (b) { ku += Math.abs(kd[ad] - b.hedef); na++; }
    }
  });
  ku = na ? ku / na : 0;
  let uy = 0;
  const gr = gruplar();
  havuzlu.forEach(x => {
    const dagilim = gr.map(y => sayac.yer[x.ad + "|" + y] || 0);
    const tot = dagilim.reduce((s, n) => s + n, 0);
    const acik = {};
    V.zorunlu_yerler.forEach(y => { if (!yasak(x.ad, y)) acik[grup(y)] = 1; });
    if (Object.keys(acik).length > 1 && tot >= 3 && Math.max(...dagilim) === tot) uy++;
    if (!(sayac.toplam[x.ad] || 0)) uy++;
  });
  return {
    skor: 2 * (kidemliSapma + comezSapma) + 4 * ters + ku + uy - 4 * egim + ceza,
    kidemliSapma, comezSapma, ters, egim, fark, kidemUyum: ku, uyari: uy
  };
}

const OTO_IZGARA = {
  kidem_farki: [0.5, 1, 2, 4],
  toplam_gorev: [1, 2, 4, 8],
  ayni_yer_tekrari: [0, 1, 3, 6],
  dun_de_gonderildi: [0, 1, 3, 6],
  kidem_yuku: [0, 0.5, 1, 2]
};

function otoAgirlik() {
  const eski = Object.assign({}, V.agirlik);
  let iyi = null;
  OTO_IZGARA.kidem_farki.forEach(a =>
    OTO_IZGARA.toplam_gorev.forEach(b =>
      OTO_IZGARA.ayni_yer_tekrari.forEach(c =>
        OTO_IZGARA.dun_de_gonderildi.forEach(d =>
          OTO_IZGARA.kidem_yuku.forEach(e => {
            V.agirlik = {kidem_farki: a, toplam_gorev: b, ayni_yer_tekrari: c, dun_de_gonderildi: d, kidem_yuku: e};
            const {satirlar, sayac} = hesapla();
            const s = adaletSkoru(satirlar, sayac);
            if (!iyi || s.skor < iyi.skor - 1e-9) iyi = Object.assign({ag: V.agirlik}, s);
          })))));
  V.agirlik = iyi ? iyi.ag : eski;
  sakla(); ciz_gosterge(); ciz_kural();
  if (iyi) toast("Oto ayar · " + Object.keys(AGIRLIK_KISA).map(k => AGIRLIK_KISA[k] + " " + V.agirlik[k]).join(" · ") +
    " · sapma " + (iyi.kidemliSapma + iyi.comezSapma).toFixed(2) + " · eğim " + iyi.egim.toFixed(2) + " · fark " + iyi.fark +
    " · kıdem " + iyi.kidemUyum.toFixed(2) + " · uyarı " + iyi.uyari);
}

function analizUyarilari(satirlar, sayac) {
  const bak = [];
  const havuzlu = V.asistanlar.filter(x => x.havuz !== false && V.havuz_disi_yerler.indexOf(x.yer) < 0 && V.zorunlu_yerler.indexOf(x.yer) < 0);
  const yukler = havuzlu.map(x => sayac.toplam[x.ad] || 0);
  if (yukler.length) {
    const mn = Math.min(...yukler), mx = Math.max(...yukler);
    bak.push("Havuzdaki yük aralığı " + mn + " – " + mx + " görev. Fark " + (mx - mn) + ".");
    if (mx - mn > 3) bak.push('Min-Max Farkı büyük. "Toplam Yük" ağırlığını artırmayı deneyin.');
  }
  havuzlu.forEach(x => {
    const dagilim = gruplar().map(y => sayac.yer[x.ad + "|" + y] || 0);
    const tot = dagilim.reduce((s,n) => s+n, 0);
    const acik = {};
    V.zorunlu_yerler.forEach(y => { if (!yasak(x.ad, y)) acik[grup(y)] = 1; });
    if (Object.keys(acik).length > 1 && tot >= 3 && Math.max(...dagilim) === tot)
      bak.push(x.ad + " her seferinde aynı yere (" + gruplar()[dagilim.indexOf(tot)] + ') gidiyor. "Aynı yere tekrar" ağırlığını artırın.');
  });
  const dolmayan = satirlar.filter(s => s.dolmayan.length).length;
  if (dolmayan) bak.push(dolmayan + " günde en az bir zorunlu yer doldurulamadı.");
  const hicGitmeyen = havuzlu.filter(x => !sayac.toplam[x.ad]).map(x => x.ad);
  if (hicGitmeyen.length) bak.push("Bu ay hiç görevlendirilmeyenler: " + hicGitmeyen.join(", ") + ".");
  return bak;
}
$("#btnOneri").onclick = () => {
  const g = +$("#aGun").value, yer = $("#aYer").value;
  const {sayac} = hesapla();
  const kd = kidem(), iz = izinGun(), yok = yokOlanlar(g, iz), kalsin = kalanlar(g, yok);
  void 0;
  const kadro = adlar().filter(ad => yerHarita(g)[ad] === yer);
  const hedef = kadro.length ? kadro.reduce((s,ad) => s + kd[ad], 0) / kadro.length : 9;
  const bos = {yer, hedef};
  const dun = new Set(Object.keys((SON.satirlar[g-2] || {atama:{}}).atama));
  const liste = havuz(yok, kalsin, g).map(ad => ({
    ad,
    m: maliyet(ad, bos, sayac, dun, kd, new Set(nobetGun(g).yb)),
    kidem: kd[ad],
    tot: sayac.toplam[ad] || 0,
    ayni: sayac.yer[ad + "|" + grup(yer)] || 0,
    dun: dun.has(ad)
  })).sort((a,b) => a.m - b.m);
  const o = $("#oneri");
  o.innerHTML = "";
  o.appendChild(el("p", {className: "ipucu", textContent:
    g + ". gün " + yer + " için sıralama. Hedef kıdem " + hedef.toFixed(1) + ". Uygun olmayanlar listede yok."}));
  const t = el("table", {className: "grid-line"});
  t.innerHTML = "<thead><tr><th>#</th><th>Aday</th><th>Kıdem</th><th>Ay İçi Görev</th><th>Bu Yere Gitti</th><th>Dün Gitti</th><th>Puan</th></tr></thead>";
  const tb = el("tbody");
  liste.forEach((x, i) => {
    const tr = el("tr");
    tr.appendChild(el("td", {className: "sayi", textContent: i+1}));
    tr.appendChild(el("td", {textContent: x.ad}));
    [x.kidem, x.tot, x.ayni].forEach(v => tr.appendChild(el("td", {className: "sayi", textContent: v})));
    tr.appendChild(el("td", {textContent: x.dun ? "Evet" : "·"}));
    tr.appendChild(el("td", {className: "sayi", textContent: x.m.toFixed(1)}));
    tb.appendChild(tr);
  });
  t.appendChild(tb); o.appendChild(t);
  const disi = Object.keys(yok).map(ad => ad + " (" + yok[ad] + ")").join(", ");
  if (disi) o.appendChild(el("p", {className: "ipucu", textContent: "Bugün dışarıda: " + disi}));
};

/* ---------- dosya ---------- */

function oncekiAy(y, a) { return a === 1 ? {y: y - 1, a: 12} : {y: y, a: a - 1}; }

function ayOzeti(v) {
  const es = V;
  V = normalize(v);
  let r = null;
  try { r = {sayac: hesapla().sayac, son: nobetGun(gunSayisi())}; }
  catch (e) { r = null; }
  V = es;
  return r;
}

function devirTazele(v) {
  if (v.devir && v.devir.elle) return v;
  const p = oncekiAy(v.yil, v.ay);
  const ham = DEPO.oku(ayAnahtar(p.y, p.a));
  if (!ham) return v;
  let o = null;
  try { o = JSON.parse(ham); } catch (e) { return v; }
  const r = ayOzeti(o);
  if (!r) return v;
  v.devir = {toplam: Object.assign({}, r.sayac.toplam), yer: Object.assign({}, r.sayac.yer),
    refakat: Object.assign({}, r.sayac.refakat), kaynak: AYLAR[p.a - 1] + " " + p.y};
  v.onceki_ay_son_gun_nobet = {yb: (r.son.yb || []).slice(), amel: (r.son.amel || []).slice()};
  return v;
}

$("#ay").onchange = e => {
  const p = e.target.value.split("-");
  const y = +p[0], a = +p[1];
  sakla();
  const arsiv = DEPO.oku(ayAnahtar(y, a));
  if (arsiv) { V = normalize(JSON.parse(arsiv)); toast(AYLAR[a-1] + " " + y + " arşivden açıldı"); }
  else { V.yil = y; V.ay = a; V.nobet = {}; V.izin = []; V.egitim = []; V.gecmis = {}; V.force = {}; V.sabit = {}; V.ders = {}; }
  devirTazele(V);
  sakla(); baslat();
};
function devret() {
  const {sayac} = hesapla();
  const son = nobetGun(gunSayisi());
  sakla();
  const y = V.ay === 12 ? V.yil + 1 : V.yil;
  const a = V.ay === 12 ? 1 : V.ay + 1;
  const kaynak = AYLAR[V.ay-1] + " " + V.yil;
  const yeni = JSON.parse(JSON.stringify(V));
  yeni.yil = y; yeni.ay = a;
  yeni.nobet = {}; yeni.izin = []; yeni.egitim = [];
  yeni.gecmis = {}; yeni.force = {}; yeni.sabit = {}; yeni.ders = {};
  yeni.onceki_ay_son_gun_nobet = {yb: (son.yb||[]).slice(), amel: (son.amel||[]).slice()};
  yeni.devir = {toplam: Object.assign({}, sayac.toplam), yer: Object.assign({}, sayac.yer),
    refakat: Object.assign({}, sayac.refakat), kaynak};
  V = normalize(yeni); sakla(); baslat();
  toast(AYLAR[a-1] + " " + y + " açıldı · sayaç ve son gün nöbeti devredildi");
}
$("#btnKaydet").onclick = () => {
  const a = el("a", {href: URL.createObjectURL(new Blob([JSON.stringify(V, null, 2)], {type: "application/json"})),
    download: String(V.yil) + "-" + String(V.ay).padStart(2,"0") + ".json"});
  document.body.appendChild(a); a.click(); a.remove();
};
$("#btnYukle").onclick = () => $("#fileIn").click();
$("#fileIn").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      V = devirTazele(normalize(JSON.parse(r.result)));
      sakla(); baslat();
      const d = Object.values(V.devir.toplam || {}).reduce((x, y) => x + y, 0);
      toast(d ? "Yüklendi · " + V.devir.kaynak + " devri: " + d + " görev" : "Yüklendi");
    }
    catch (err) { alert("Okunamadı: " + err.message); }
  };
  r.readAsText(f, "utf-8");
  e.target.value = "";
};

function baslat() {
  $("#ay").value = V.yil + "-" + String(V.ay).padStart(2, "0");
  BUGUN = varsayilanBugun();
  let eski = null;
  try { eski = JSON.parse(sessionStorage.getItem("senkDurum") || "null"); sessionStorage.removeItem("senkDurum"); } catch (_) {}
  if (eski && eski.yil === V.yil && eski.ay === V.ay && eski.gun >= 1 && eski.gun <= gunSayisi()) BUGUN = eski.gun;
  ciz_asistan(); ciz_nobet(); ciz_izin(); ciz_egitim();
  const ok = otoKilit();
  ciz_kural();
  sekmeler();
  const sb = eski ? $("#nav").querySelectorAll("button")[eski.sekme] : null;
  if (sb) sb.click();
  if (ok) toast(ok + " geçmiş gün kendiliğinden kilitlendi");
}
baslat();

/* ---------- pencere çubuğu ---------- */

function senkronBagla() {
  const S = window.pencere && window.pencere.senkron;
  const e = $("#basbarSenk");
  if (!S || !e) return;
  const saat = t => t ? new Date(t).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "";
  const DURUM = { bekliyor: "waiting", esitleniyor: "syncing", esitlendi: "synced", cevrimdisi: "offline", yerel: "local" };
  const METIN = { bekliyor: "Bağlanıyor…", esitleniyor: "Eşitleniyor…", esitlendi: "Eşitlendi", cevrimdisi: "Çevrimdışı", yerel: "Yalnız bu bilgisayar" };
  const goster = d => {
    if (!d) return;
    const a = METIN[d.asama] ? d.asama : "bekliyor";
    e.dataset.state = DURUM[a];
    e.classList.toggle("tk-sync-progress", a === "esitleniyor");
    e.hidden = false;
    e.textContent = METIN[a] + ((a === "esitlendi" || a === "cevrimdisi") && d.zaman ? " · " + saat(d.zaman) : "");
    e.title = (d.hata ? d.hata + "\n" : "") + "Tıkla: şimdi eşitle";
    const sr = $("#basbarSurum");
    if (sr && d.uygulama) { sr.textContent = "v" + d.uygulama; }
  };
  S.durum().then(goster).catch(() => {});
  if (S.olay) S.olay(d => {
    if (d.tur === "durum") goster(d.durum);
    else if (d.tur === "veri") {
      try {
        sessionStorage.setItem("senkBildirim", "Başka bilgisayardaki değişiklikler geldi");
        const sk = [...document.querySelectorAll("#nav button")].findIndex(b => b.getAttribute("aria-selected") === "true");
        sessionStorage.setItem("senkDurum", JSON.stringify({yil: V.yil, ay: V.ay, gun: BUGUN, sekme: sk}));
      } catch (_) {}
      location.reload();
    }
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
function kilitle(son) {
  const {satirlar} = hesapla();
  let k = 0;
  satirlar.forEach(x => {
    if (x.gun > son || x.kaynak === "geçmiş" || x.kaynak === "hafta sonu") return;
    V.gecmis[String(x.gun)] = Object.assign({}, x.atama); k++;
  });
  return k;
}
function otoKilit() {
  const d = new Date();
  if (d.getFullYear() !== V.yil || d.getMonth() + 1 !== V.ay) return 0;
  const k = kilitle(d.getDate() - 1);
  if (k) sakla();
  return k;
}
$("#btnKalan").onclick = () => {
  const k = kilitle(BUGUN);
  sakla();
  ciz_gosterge();
  ciz_kural();
  toast(k + " gün kilitlendi · ayın kalanı yeniden hesaplandı, " + DEGISEN + " gün değişti");
};
function icerikKutu(d) {
  let l = Infinity, t = Infinity, rr = -Infinity, b = -Infinity;
  d.querySelectorAll("*").forEach(e => {
    if (e.children.length && ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    const st = getComputedStyle(e);
    if (st.visibility === "hidden" || st.display === "none") return;
    const k = e.getBoundingClientRect();
    if (!k.width || !k.height) return;
    l = Math.min(l, k.left); t = Math.min(t, k.top); rr = Math.max(rr, k.right); b = Math.max(b, k.bottom);
  });
  if (l === Infinity) return d.getBoundingClientRect();
  const p = 6;
  return {left: l - p, top: t - p, width: rr - l + p * 2, height: b - t + p * 2};
}
async function alanPng(k) {
  const png = await PENCERE.kopyala({
    x: Math.max(0, Math.floor(k.left) - 1),
    y: Math.max(0, Math.floor(k.top) - 1),
    width: Math.ceil(k.width) + 2,
    height: Math.ceil(k.height) + 2
  });
  if (!png || !png.length) throw new Error("görüntü alınamadı");
  return createImageBitmap(new Blob([png], {type: "image/png"}));
}
function zeminRengi(img) {
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const d = x.getImageData(2, 2, 1, 1).data;
  return "rgb(" + d[0] + "," + d[1] + "," + d[2] + ")";
}
function ekipResim(olcek, zemin) {
  const satir = [...document.querySelectorAll("#ekip tr")].map(tr => [...tr.cells].map(td => ({t: td.textContent, renk: getComputedStyle(td).color})));
  const ornek = document.querySelector("#ekip td");
  const st = ornek ? getComputedStyle(ornek) : getComputedStyle(document.body);
  const kok = getComputedStyle(document.documentElement);
  const boy = parseFloat(st.fontSize) * olcek, yuk = Math.round(boy * 1.9), bosluk = Math.round(12 * olcek);
  const font = st.fontWeight + " " + boy + "px " + st.fontFamily;
  const olc = document.createElement("canvas").getContext("2d");
  olc.font = font;
  const w = [0, 1, 2].map(n => Math.ceil(Math.max(0, ...satir.map(r => r[n] ? olc.measureText(r[n].t).width : 0))) + bosluk * 2);
  const top = w[0] + w[1] + w[2];
  const c = document.createElement("canvas");
  c.width = top;
  c.height = satir.length * yuk;
  const x = c.getContext("2d");
  x.fillStyle = zemin || kok.getPropertyValue("--tk-bg").trim() || st.backgroundColor;
  x.fillRect(0, 0, c.width, c.height);
  x.font = font;
  x.textBaseline = "middle";
  const cizgi = Math.max(1, Math.round(olcek));
  satir.forEach((r, i) => {
    const y = i * yuk;
    if (i < satir.length - 1) {
      x.fillStyle = st.borderBottomColor;
      x.fillRect(0, y + yuk - cizgi, top, cizgi);
    }
    let sx = 0;
    r.forEach((h, n) => {
      x.fillStyle = h.renk;
      x.fillText(h.t, sx + bosluk, y + yuk / 2);
      sx += w[n];
    });
  });
  return c;
}
async function resimUret() {
  const pnl = document.querySelector(".a-bugun");
  pnl.classList.add("kopya");
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  try {
    const kutu = icerikKutu(pnl);
    const ust = await alanPng(kutu);
    pnl.classList.remove("kopya");
    const zemin = zeminRengi(ust);
    const alt = ekipResim(ust.width / kutu.width, zemin);
    const c = document.createElement("canvas");
    c.width = Math.max(ust.width, alt.width);
    const ara = Math.round(16 * ust.width / kutu.width);
    c.height = ara + ust.height + ara + alt.height;
    const x = c.getContext("2d");
    x.fillStyle = zemin;
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(ust, Math.round((c.width - ust.width) / 2), ara);
    x.drawImage(alt, Math.round((c.width - alt.width) / 2), ara + ust.height + ara);
    const blob = await new Promise(r => c.toBlob(r, "image/png"));
    await navigator.clipboard.write([new ClipboardItem({"image/png": blob})]);
    return blob;
  } finally {
    pnl.classList.remove("kopya");
  }
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
$("#btnResim").onclick = async () => {
  if (!PENCERE || !PENCERE.kopyala) { toast("Resim kopyalama yalnız uygulamada çalışır"); return; }
  try { await resimUret(); toast("Panoya kopyalandı"); }
  catch (e) { toast("Kopyalanamadı: " + e.message); }
};
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
$("#btnTelefon").onclick = () => qrGoster($("#btnTelefon"), async () => new Uint8Array(await (await resimUret()).arrayBuffer()));
$("#telLink").onclick = () => kopyala($("#telLink").textContent, "Bağlantı kopyalandı");
