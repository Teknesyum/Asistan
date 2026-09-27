const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const arg = k => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : null; };
const ARAC = path.resolve(arg("arac"));
const CIKTI = path.resolve(arg("cikti"));
const ETIKET = arg("etiket") || "once";
const OLCEK = arg("olcek") || "1";
const DENETIM = arg("denetim");
const AXE = arg("axe");
const EKRANLAR = require(path.resolve(arg("ekranlar")));

app.commandLine.appendSwitch("force-device-scale-factor", OLCEK);
app.commandLine.appendSwitch("high-dpi-support", "1");

const DURUMLAR = ["hover", "focus-visible", "active"];
const ZORLA = `(() => {
  const ek = document.createElement("style"); ek.id = "zorla"; const satir = [];
  const gez = kurallar => { for (const r of kurallar) {
    if (r.cssRules && !r.selectorText) { try { gez(r.cssRules); } catch (e) {} continue; }
    if (!r.selectorText) continue;
    for (const d of ${JSON.stringify(DURUMLAR)}) if (r.selectorText.includes(":" + d))
      satir.push(r.selectorText.split(":" + d).join('[data-zorla="' + d + '"]') + "{" + r.style.cssText + "}");
  } };
  for (const s of document.styleSheets) { try { gez(s.cssRules); } catch (e) {} }
  satir.push("*,*::before,*::after{transition:none!important}");
  ek.textContent = satir.join("\\n"); document.head.appendChild(ek); return satir.length;
})()`;
const HEDEFLER = 'a[href],button,input,select,textarea,summary,[role="button"],[role="tab"],[tabindex]';

app.whenReady().then(async () => {
  ipcMain.handle("etiket:hepsi", () => ({ ...JSON.parse(fs.readFileSync(path.join(ARAC, "teknesyum-ui", "css", "labels.tr.json"), "utf-8")), "app.title": require(path.join(ARAC, "package.json")).productName }));
  ipcMain.handle("veri:hepsi", () => { const o = {}; for (const f of fs.readdirSync(path.join(ARAC, "veri"))) if (f.endsWith(".json")) o[f.slice(0, -5)] = fs.readFileSync(path.join(ARAC, "veri", f), "utf-8"); return o; });
  ipcMain.on("veri:yaz", () => {});
  ipcMain.on("pencere:kucult", () => {});
  ipcMain.on("pencere:buyult", () => {});
  ipcMain.on("pencere:kapat", () => {});
  ipcMain.on("pencere:ac", () => {});
  ipcMain.handle("pencere:kopyala", () => false);
  ipcMain.handle("pencere:yukle", () => "https://n.uguu.se/ornek.png");
  ipcMain.handle("senkron:durum", () => ({ depo: true, asama: "esitlendi", zaman: Date.now(), hata: "", gunluk: [], uygulama: require(path.join(ARAC, "package.json")).version, kod: "test" }));
  ipcMain.handle("senkron:simdi", () => true);

  const w = new BrowserWindow({
    width: 1440, height: 900, show: false, frame: false, paintWhenInitiallyHidden: true,
    backgroundColor: "#000000",
    webPreferences: { contextIsolation: true, nodeIntegration: false, spellcheck: false, preload: path.join(ARAC, "preload.js") }
  });
  w.showInactive();
  const hatalar = [];
  w.webContents.on("console-message", e => { if (e.level === "error") hatalar.push(e.message); });
  await w.loadFile(path.join(ARAC, "arayuz.html"));
  const bekle = ms => new Promise(r => setTimeout(r, ms));
  await bekle(1200);
  const js = s => w.webContents.executeJavaScript(s, true);
  const denetim = DENETIM ? fs.readFileSync(DENETIM, "utf-8") : null;
  fs.mkdirSync(CIKTI, { recursive: true });
  const sonuc = { olcek: OLCEK, etiket: ETIKET, ekranlar: {} };
  if (denetim) await js(ZORLA);
  if (AXE) await js(fs.readFileSync(AXE, "utf-8") + ";0");
  const olc = async () => { const o = await js(denetim); if (AXE) o.axe = await js(`axe.run(document, { runOnly: { type: "rule", values: ["color-contrast", "target-size"] }, resultTypes: ["violations"] }).then(r => r.violations.map(v => ({ kural: v.id, etki: v.impact, dugumler: v.nodes.map(n => ({ hedef: n.target.join(" "), ozet: n.failureSummary })) })))`); return o; };
  for (const ek of EKRANLAR) {
    try { await js(ek.js); } catch (e) { hatalar.push(ek.ad + ": " + e.message); }
    await bekle(ek.bekle || 700);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(CIKTI, ek.ad + "-" + Math.round(OLCEK * 100) + "-" + ETIKET + ".png"), img.toPNG());
    if (denetim) {
      const r = { dinlenik: await olc() };
      for (const d of DURUMLAR) {
        await js(`document.querySelectorAll('${HEDEFLER}').forEach(e => e.dataset.zorla = "${d}")`);
        await bekle(80);
        r[d] = await olc();
        await js(`document.querySelectorAll('[data-zorla]').forEach(e => delete e.dataset.zorla)`);
      }
      await js(`document.querySelectorAll('button,input,select').forEach(e => { if (!e.disabled) { e.dataset.edilgen = 1; e.disabled = true; } })`);
      r.edilgen = await olc();
      await js(`document.querySelectorAll('[data-edilgen]').forEach(e => { e.disabled = false; delete e.dataset.edilgen; })`);
      await bekle(600);
      sonuc.ekranlar[ek.ad] = r;
    }
    if (ek.sonra) { try { await js(ek.sonra); } catch (e) {} await bekle(300); }
  }
  sonuc.hatalar = hatalar;
  if (denetim) fs.writeFileSync(path.join(CIKTI, "denetim-" + ETIKET + ".json"), JSON.stringify(sonuc, null, 1));
  else fs.writeFileSync(path.join(CIKTI, "hatalar-" + Math.round(OLCEK * 100) + "-" + ETIKET + ".json"), JSON.stringify(hatalar, null, 1));
  app.exit(0);
});
