const { app, BrowserWindow, Menu, ipcMain, clipboard, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const senkron = require("./senkron");
const whatsapp = require("./whatsapp");
const etiket = () => { try { return { ...JSON.parse(fs.readFileSync(path.join(__dirname, "teknesyum-ui", "css", "labels.tr.json"), "utf-8")), "app.title": require("./package.json").productName }; } catch (err) { return {}; } };

let VERIDIZIN = null;
function veriDizin() {
  if (!VERIDIZIN) {
    VERIDIZIN = path.join(__dirname, "veri");
    try { fs.mkdirSync(VERIDIZIN, { recursive: true }); } catch (e) {}
    tasi();
  }
  return VERIDIZIN;
}

function tasi() {
  const eski = path.join(app.getPath("userData"), "veri");
  if (eski === VERIDIZIN || !fs.existsSync(eski)) return;
  try {
    for (const ad of fs.readdirSync(eski)) {
      const hedef = path.join(VERIDIZIN, ad);
      if (!fs.existsSync(hedef)) fs.copyFileSync(path.join(eski, ad), hedef);
    }
    fs.renameSync(eski, eski + "-devredildi-" + Date.now());
    senkron.not("eski veri taşındı");
  } catch (e) {}
}
function veriYol(k) {
  const ad = String(k).replace(/[^A-Za-z0-9:_-]/g, "_").replace(/:/g, "@");
  return path.join(veriDizin(), ad + ".json");
}

const wpArg = argv => { const i = argv.indexOf("--wp"); return i >= 0 && /^[AB]$/.test(argv[i + 1]) ? argv[i + 1] : null; };
const ILK_WP = wpArg(process.argv);
if (!app.requestSingleInstanceLock(ILK_WP ? { wp: ILK_WP } : {})) app.quit();
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
let ANA = null, hazirCoz = null, rendererHazir = new Promise(r => { hazirCoz = r; });
const resimBekleyen = new Map();
let resimSira = 1, wpZincir = Promise.resolve();
const wpDenendi = new Map();
let veriSurum = 1;

function resimIste(w, a, zorla) {
  const id = resimSira++;
  return new Promise((coz, red) => {
    const t = setTimeout(() => { resimBekleyen.delete(id); red(new Error("resim hazırlanamadı")); }, 60000);
    resimBekleyen.set(id, { coz, red, t });
    w.webContents.send("wp:resim-iste", { id, gun: a.gun, haftasonu: a.haftasonu, zorla });
  });
}

function wpTetik(h, elle) {
  if (!elle) whatsapp.kaydet({ anahtar: whatsapp.tarih(new Date()) + "|" + h + "|tetik", h, ok: false, tetik: true, not: "tetiklendi" });
  const is = wpZincir.then(() => wpGonder(h, elle));
  wpZincir = is.catch(() => {});
  return is;
}

async function wpGonder(h, elle) {
  const a = whatsapp.ayarOku();
  const anahtar = whatsapp.tarih(new Date()) + "|" + h;
  const hedef = a["hedef" + h];
  if (!elle) {
    const neden = whatsapp.zamanUygun(h, a);
    if (neden) {
      whatsapp.kaydet({ anahtar: anahtar + "|red", h, ok: false, not: neden });
      return { ok: false, not: neden };
    }
  }
  if (!hedef || !hedef.jid) {
    whatsapp.kaydet({ anahtar, h, ok: false, not: "hedef seçilmemiş", elle });
    return { ok: false, not: "hedef seçilmemiş" };
  }
  await Promise.race([rendererHazir, new Promise(r => setTimeout(r, 60000))]);
  const w = ANA;
  if (!w || w.isDestroyed()) {
    whatsapp.kaydet({ anahtar, h, ok: false, hedef: hedef.ad, not: "pencere yok", elle });
    return { ok: false, not: "pencere yok" };
  }
  const kucuk = w.isMinimized(), gizli = !w.isVisible();
  try {
    if (kucuk || gizli) { w.showInactive(); if (kucuk) w.restore(); await new Promise(r => setTimeout(r, 800)); }
    const r = await resimIste(w, a, !!elle);
    if (kucuk) w.minimize();
    if (r.atla) {
      whatsapp.kaydet({ anahtar: anahtar + "|atla", h, ok: false, atla: true, not: r.atla, elle });
      return { ok: false, not: r.atla };
    }
    await whatsapp.gonder(hedef.jid, r.bayt, "gorevlendirme-" + h);
    whatsapp.kaydet({ anahtar, h, ok: true, hedef: hedef.ad, gun: r.etiket, elle });
    return { ok: true, hedef: hedef.ad, gun: r.etiket };
  } catch (e) {
    if (kucuk && !w.isDestroyed() && !w.isMinimized()) w.minimize();
    whatsapp.kaydet({ anahtar, h, ok: false, hedef: hedef.ad, not: e.message, elle });
    return { ok: false, not: e.message };
  }
}

function pencere() {
  const p = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "simge.ico"),
    title: etiket()["app.title"],
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  p.maximize();
  p.loadFile(path.join(__dirname, "arayuz.html"));
  p.once("ready-to-show", () => { if (ILK_WP) p.showInactive(); else p.show(); });
  const bildir = () => p.webContents.send("pencere:durum", p.isMaximized());
  p.on("maximize", bildir);
  p.on("unmaximize", bildir);
  p.webContents.on("did-finish-load", bildir);
  return p;
}

function hedef(e) {
  return BrowserWindow.fromWebContents(e.sender);
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  try {
    const g = await senkron.cek();
    if (g.ok && g.kodDegisti) {
      senkron.not("kod güncellendi, yeniden başlatılıyor");
      app.relaunch();
      app.exit(0);
      return;
    }
  } catch (e) { senkron.not("başlangıç senkronu: " + e.message); }
  veriDizin();
  ipcMain.on("pencere:kucult", e => { const w = hedef(e); if (w) w.minimize(); });
  ipcMain.on("pencere:buyult", e => {
    const w = hedef(e);
    if (!w) return;
    if (w.isMaximized()) w.unmaximize(); else w.maximize();
  });
  ipcMain.handle("pencere:kopyala", async (e, r, sessiz) => {
    const w = hedef(e);
    if (!w) return false;
    const img = await w.webContents.capturePage(r, { stayHidden: true, stayAwake: true });
    if (!sessiz) try { clipboard.write({ image: img }); } catch (e) {}
    return img.toPNG();
  });
  ipcMain.handle("pencere:yukle", async (e, bayt) => {
    const f = new FormData();
    f.append("files[]", new Blob([Buffer.from(bayt)], { type: "image/png" }), "gorevlendirme.png");
    const r = await fetch("https://uguu.se/upload", { method: "POST", body: f, signal: AbortSignal.timeout(30000) });
    let j = null;
    try { j = await r.json(); } catch (err) {}
    const u = j && j.success && j.files && j.files[0] && j.files[0].url;
    if (!u || !/^https:\/\//.test(u)) throw new Error((j && j.description) || "sunucu " + r.status + " döndü");
    return u;
  });
  ipcMain.on("pencere:ac", (e, u) => { if (/^https:\/\//.test(u)) shell.openExternal(u); });
  ipcMain.on("pencere:kapat", e => { const w = hedef(e); if (w) w.close(); });
  ipcMain.handle("etiket:hepsi", () => etiket());
  ipcMain.handle("veri:hepsi", () => {
    const o = {};
    for (const f of fs.readdirSync(veriDizin())) if (f.endsWith(".json")) {
      try { o[f.slice(0, -5)] = fs.readFileSync(path.join(veriDizin(), f), "utf-8"); } catch (err) {}
    }
    return o;
  });
  ipcMain.handle("veri:surum", () => veriSurum);
  ipcMain.on("veri:yaz", (e, { k, m, s }) => {
    if (s !== veriSurum) {
      senkron.not("eski sayfadan yazma engellendi, arayüz yenileniyor");
      if (ANA && !ANA.isDestroyed()) ANA.webContents.send("senkron:olay", { tur: "veri" });
      return;
    }
    try { fs.writeFileSync(veriYol(k), m, "utf-8"); senkron.gecikmeliGonder(5000); } catch (err) {}
  });
  ipcMain.handle("senkron:durum", () => senkron.durum());
  ipcMain.handle("senkron:simdi", async () => { try { await senkron.simdiGonder(); return await senkron.esitle(); } catch (e) { return false; } });
  ipcMain.on("wp:hazir", () => hazirCoz());
  ipcMain.on("wp:resim", (e, d) => {
    const b = resimBekleyen.get(d && d.id);
    if (!b) return;
    resimBekleyen.delete(d.id);
    clearTimeout(b.t);
    if (d.hata) b.red(new Error(d.hata)); else b.coz(d);
  });
  ipcMain.handle("wp:istek", (e, op, ek) => whatsapp.istek(op, ek || {}));
  ipcMain.handle("wp:ayar", () => whatsapp.ayarOku());
  ipcMain.handle("wp:ayar-yaz", async (e, d) => {
    const a = whatsapp.ayarOku();
    let saatDegisti = false;
    for (const k of ["hedefA", "hedefB", "gun", "haftasonu", "saatA", "saatB"]) if (k in d) {
      if ((k === "saatA" || k === "saatB") && a[k] !== d[k]) saatDegisti = true;
      a[k] = d[k];
    }
    const y = whatsapp.ayarYaz(a);
    if (saatDegisti && y.bitis && y.bitis > Date.now()) await whatsapp.zamanla(undefined, y.bitis).catch(() => {});
    return y;
  });
  ipcMain.handle("wp:zamanla", () => whatsapp.zamanla());
  ipcMain.handle("wp:durdur", () => whatsapp.durdur());
  ipcMain.handle("wp:gorev", () => whatsapp.gorevVar());
  ipcMain.handle("wp:gorev-bilgi", () => whatsapp.gorevBilgi());
  ipcMain.handle("wp:simdi", (e, h) => wpTetik(h, true));
  const w = pencere();
  ANA = w;
  whatsapp.dinle(d => { if (!w.isDestroyed()) w.webContents.send("wp:olay", d); });
  (async () => {
    const a = whatsapp.ayarOku();
    if (a.saatSurum === 2 || !a.bitis || a.bitis <= Date.now()) {
      if (a.saatSurum !== 2) whatsapp.ayarYaz({ ...a, saatSurum: 2 });
      return;
    }
    try { await whatsapp.zamanla(undefined, a.bitis); } catch (e) {}
    whatsapp.ayarYaz({ ...whatsapp.ayarOku(), saatSurum: 2 });
  })();
  w.webContents.on("did-start-navigation", d => { if (d.isMainFrame && !d.isSameDocument) rendererHazir = new Promise(r => { hazirCoz = r; }); });
  app.on("second-instance", (e, argv, cwd, ek) => {
    const h = (ek && ek.wp) || wpArg(argv);
    if (h) { wpTetik(h, false); return; }
    if (w.isDestroyed()) return;
    if (w.isMinimized()) w.restore();
    w.show();
    w.focus();
  });
  if (ILK_WP) wpTetik(ILK_WP, false);
  setInterval(() => {
    if (w.isDestroyed()) return;
    const a = whatsapp.ayarOku();
    for (const h of ["A", "B"]) {
      if (whatsapp.zamanUygun(h, a)) continue;
      const k = whatsapp.tarih(new Date()) + "|" + h;
      if (Date.now() - (wpDenendi.get(k) || 0) < 10 * 60e3) continue;
      wpDenendi.set(k, Date.now());
      wpTetik(h, false);
    }
  }, 30000);
  senkron.dinle(d => { if (!w.isDestroyed()) w.webContents.send("senkron:olay", d); });
  senkron.izle(60000, r => {
    if (!r || !r.ok || w.isDestroyed()) return;
    if (r.kodDegisti) {
      w.webContents.send("senkron:olay", { tur: "kod" });
      setTimeout(() => { app.relaunch(); app.exit(0); }, 2500);
    } else if (r.veriDegisti) {
      veriSurum++;
      w.webContents.send("senkron:olay", { tur: "veri" });
    }
  });
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) pencere(); });
});

let cikisSenkronu = false;
app.on("before-quit", () => {
  if (cikisSenkronu) return;
  cikisSenkronu = true;
  try { senkron.arkadaGonder(); } catch (e) {}
  whatsapp.kapat();
});

app.on("window-all-closed", () => app.quit());
