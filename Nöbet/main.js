const { app, BrowserWindow, Menu, ipcMain, clipboard } = require("electron");
const path = require("path");
const fs = require("fs");
const senkron = require("./senkron");

function veriDizin() {
  return senkron.veriDizin();
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
    title: "Asistan Nöbet",
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
  ipcMain.on("pencere:kapat", e => { const w = hedef(e); if (w) w.close(); });
  ipcMain.on("veri:oku", (e, k) => {
    try { e.returnValue = fs.readFileSync(veriYol(k), "utf-8"); }
    catch (err) { e.returnValue = null; }
  });
  ipcMain.on("veri:yaz", (e, { k, m }) => {
    try { fs.writeFileSync(veriYol(k), m, "utf-8"); senkron.degisti(); } catch (err) {}
  });

  let durum = { depo: false, yenilendi: false, not: "baslatiliyor" };
  try { durum = await senkron.baslat(); } catch (err) { durum = { depo: false, yenilendi: false, not: "senkron hatasi" }; }
  if (durum.yenilendi) { app.relaunch(); app.exit(0); return; }

  const p = pencere();
  p.webContents.on("did-finish-load", () => p.webContents.send("senkron:durum", durum));
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) pencere(); });
});

let kapaniyor = false;
app.on("before-quit", () => {
  if (kapaniyor) return;
  kapaniyor = true;
  try { senkron.kapat(); } catch (e) {}
});

app.on("window-all-closed", () => app.quit());
