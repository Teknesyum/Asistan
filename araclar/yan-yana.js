const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const i = process.argv.indexOf("--isler");
const ISLER = require(path.resolve(process.argv[i + 1]));

process.on("unhandledRejection", e => { console.error(String(e.message || e).slice(0, 300)); app.exit(2); });
app.on("window-all-closed", () => {});
app.whenReady().then(async () => {
  const bekle = ms => new Promise(r => setTimeout(r, ms));
  const uri = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
  for (const is of ISLER) {
    const cikti = path.resolve(is.cikti);
    const onizleme = cikti.replace(/\.png$/, "-onizleme.png");
    const w = new BrowserWindow({ width: 1440, height: 900, show: false, paintWhenInitiallyHidden: true, useContentSize: true });
    w.showInactive();
    const hatalar = [];
    w.webContents.on("console-message", e => { if (e.level === "error") hatalar.push(e.message); });
    await w.loadURL(is.adres);
    if (is.veri) {
      const o = {};
      for (const d of fs.readdirSync(is.veri)) if (d.endsWith(".json")) o[d.slice(0, -5)] = fs.readFileSync(path.join(is.veri, d), "utf-8");
      await w.webContents.executeJavaScript(`localStorage.clear(); for (const [k, v] of Object.entries(${JSON.stringify(o)})) localStorage.setItem(k, v)`, true);
      await w.loadURL(is.adres);
    }
    await bekle(1500);
    if (is.js) { await w.webContents.executeJavaScript(is.js, true); await bekle(is.bekle || 700); }
    fs.writeFileSync(onizleme, (await w.webContents.capturePage()).toPNG());
    w.destroy();
    const k = new BrowserWindow({ width: 2020, height: 700, show: false, paintWhenInitiallyHidden: true, useContentSize: true });
    k.showInactive();
    const sekil = (baslik, p) => `<figure style="margin:0;width:1000px"><figcaption style="padding:6px 0">${baslik}</figcaption><img style="width:1000px;display:block" src="${uri(p)}"></figure>`;
    await k.loadURL("about:blank");
    await k.webContents.executeJavaScript(`document.body.outerHTML = ${JSON.stringify(`<body style="margin:0;display:flex;gap:20px;background:#fff;color:#000;font:14px sans-serif">${sekil("Önizleme — tarayıcı, " + is.adres, onizleme)}${sekil("Uygulama — Electron, " + path.basename(is.uygulama), path.resolve(is.uygulama))}</body>`)}; Promise.all([...document.images].map(i => i.decode()))`, true);
    await bekle(500);
    fs.writeFileSync(cikti, (await k.webContents.capturePage()).toPNG());
    k.destroy();
    fs.writeFileSync(cikti.replace(/\.png$/, "-hatalar.json"), JSON.stringify(hatalar, null, 1));
  }
  app.exit(0);
});
