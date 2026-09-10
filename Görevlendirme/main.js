const { app, BrowserWindow, Menu, ipcMain, clipboard, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const senkron = require("./senkron");

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
    title: "Asistan Görevlendirme",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  p.maximize();
  p.loadFile(path.join(__dirname, "arayuz.html"));
  p.once("ready-to-show", () => p.show());
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
  ipcMain.handle("pencere:kopyala", async (e, r) => {
    const w = hedef(e);
    if (!w) return false;
    const img = await w.webContents.capturePage(r);
    try { clipboard.write({ image: img }); } catch (e) {}
    return img.toPNG();
  });
  ipcMain.on("pencere:ac", (e, u) => { if (/^https:\/\//.test(u)) shell.openExternal(u); });
  ipcMain.on("pencere:kapat", e => { const w = hedef(e); if (w) w.close(); });
  ipcMain.on("veri:oku", (e, k) => {
    try { e.returnValue = fs.readFileSync(veriYol(k), "utf-8"); }
    catch (err) { e.returnValue = null; }
  });
  ipcMain.on("veri:yaz", (e, { k, m }) => {
    try { fs.writeFileSync(veriYol(k), m, "utf-8"); senkron.gecikmeliGonder(5000); } catch (err) {}
  });
  ipcMain.handle("senkron:durum", () => senkron.durum());
  ipcMain.handle("senkron:simdi", async () => { try { await senkron.simdiGonder(); return await senkron.esitle(); } catch (e) { return false; } });
  const w = pencere();
  senkron.dinle(d => { if (!w.isDestroyed()) w.webContents.send("senkron:olay", d); });
  senkron.izle(60000, r => {
    if (!r || !r.ok || w.isDestroyed()) return;
    if (r.kodDegisti) {
      w.webContents.send("senkron:olay", { tur: "kod" });
      setTimeout(() => { app.relaunch(); app.exit(0); }, 2500);
    } else if (r.veriDegisti) w.webContents.send("senkron:olay", { tur: "veri" });
  });
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) pencere(); });
});

let cikisSenkronu = false;
app.on("before-quit", () => {
  if (cikisSenkronu) return;
  cikisSenkronu = true;
  try { senkron.arkadaGonder(); } catch (e) {}
});

app.on("window-all-closed", () => app.quit());
