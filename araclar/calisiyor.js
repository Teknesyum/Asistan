const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const arg = k => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : null; };
const ARAC = path.resolve(arg("arac"));
const CIKTI = path.resolve(arg("cikti"));

app.whenReady().then(async () => {
  const ipc = {};
  const say = k => () => { ipc[k] = (ipc[k] || 0) + 1; };
  ipcMain.handle("etiket:hepsi", () => ({ ...JSON.parse(fs.readFileSync(path.join(ARAC, "teknesyum-ui", "css", "labels.tr.json"), "utf-8")), "app.title": require(path.join(ARAC, "package.json")).productName }));
  ipcMain.handle("veri:hepsi", () => { say("veri:hepsi")(); const o = {}; for (const f of fs.readdirSync(path.join(ARAC, "veri"))) if (f.endsWith(".json")) o[f.slice(0, -5)] = fs.readFileSync(path.join(ARAC, "veri", f), "utf-8"); return o; });
  for (const k of ["veri:yaz", "pencere:kucult", "pencere:buyult", "pencere:kapat", "pencere:ac"]) ipcMain.on(k, say(k));
  ipcMain.handle("pencere:kopyala", () => false);
  ipcMain.handle("pencere:yukle", () => "https://n.uguu.se/ornek.png");
  ipcMain.handle("senkron:durum", () => ({ depo: true, asama: "esitlendi", zaman: Date.now(), hata: "", gunluk: [], uygulama: require(path.join(ARAC, "package.json")).version, kod: "test" }));
  ipcMain.handle("senkron:simdi", say("senkron:simdi"));

  const w = new BrowserWindow({ width: 1440, height: 900, show: false, frame: false, webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(ARAC, "preload.js") } });
  const hatalar = [];
  w.webContents.on("console-message", e => { if (e.level === "error") hatalar.push(e.message); });
  await w.loadFile(path.join(ARAC, "arayuz.html"));
  await new Promise(r => setTimeout(r, 1500));
  const js = s => w.webContents.executeJavaScript(s, true);
  const sonuc = [];
  const sina = async (ad, ifade) => { let v; try { v = await js(ifade); } catch (e) { v = "HATA: " + e.message; } sonuc.push({ ad, gecti: v === true, deger: v }); };

  await sina("uygulama.js yüklendi", `!!document.querySelector('script[src="uygulama.js"]')`);
  await sina("veri diskten okundu", `document.querySelector("#basbarAy").textContent.trim().length > 0`);
  await sina("senkron rozeti görünür ve eşitlendi", `(e => !e.hidden && e.dataset.state === "synced")(document.querySelector("#basbarSenk"))`);
  await sina("sürüm başlıkta", `/^v\\d/.test(document.querySelector("#basbarSurum").textContent)`);
  const ET = ({ ...JSON.parse(fs.readFileSync(path.join(ARAC, "teknesyum-ui", "css", "labels.tr.json"), "utf-8")), "app.title": require(path.join(ARAC, "package.json")).productName });
  const q = v => JSON.stringify(v);
  await sina("pencere başlığı labels.tr.json'dan", `document.title === ${q(ET["app.title"])} && document.querySelector("#basbarAd").textContent === ${q(ET["app.title"])}`);
  await sina("imza ve destek yazıları labels.tr.json'dan", `document.querySelector("#imza").textContent === ${q(ET["sig.brand"])} && document.querySelector("#destek").textContent === ${q(ET["sig.support"])}`);
  await sina("eşitleme yazısı labels.tr.json'dan", `document.querySelector("#basbarSenk").textContent.startsWith(${q(ET["sync.synced"])})`);
  await sina("sekmeler dolaşılır", `(() => { const b = [...document.querySelectorAll("#nav button, #adimlar button")]; b.forEach(x => x.click()); b[0] && b[0].click(); return b.length > 1; })()`);
  await sina("pencere düğmeleri IPC'ye gider", `(() => { ["#pKucult", "#pBuyult"].forEach(s => document.querySelector(s).click()); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  sonuc.push({ ad: "IPC küçült/büyült alındı", gecti: ipc["pencere:kucult"] === 1 && ipc["pencere:buyult"] === 1, deger: ipc });
  sonuc.push({ ad: "konsol hatası yok", gecti: hatalar.length === 0, deger: hatalar });
  const gecti = sonuc.every(s => s.gecti);
  fs.mkdirSync(CIKTI, { recursive: true });
  fs.writeFileSync(path.join(CIKTI, "calisiyor.json"), JSON.stringify({ arac: path.basename(ARAC), gecti, sonuc }, null, 1));
  console.log((gecti ? "GEÇTİ " : "KALDI ") + path.basename(ARAC) + " " + sonuc.filter(s => s.gecti).length + "/" + sonuc.length);
  app.exit(gecti ? 0 : 1);
});
