const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const { spawn, execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const ARACLAR = { gorevlendirme: "Görevlendirme", "görevlendirme": "Görevlendirme", nobet: "Nöbet", "nöbet": "Nöbet" };
const DEPO_SSH = "git@github.com:Teknesyum/Asistan.git";
const DEPO_HTTPS = "https://github.com/Teknesyum/Asistan.git";
const YEREL = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "Asistan");
const ADAYLAR = [path.join(app.getPath("documents"), "Asistan"), path.join(YEREL, "depo")];
const YENI = ADAYLAR[1];

const aracArg = argv => {
  const i = argv.indexOf("--arac");
  return i >= 0 ? ARACLAR[String(argv[i + 1] || "").toLowerCase()] || null : null;
};

const depoBul = (klasor = null) => ADAYLAR.find(d => fs.existsSync(path.join(d, ".git")) && (!klasor || fs.existsSync(path.join(d, klasor, "main.js")))) || null;

function araciAc(klasor) {
  const depo = depoBul(klasor);
  if (!depo) return false;
  const dizin = path.join(depo, klasor);
  let ad = "Asistan " + klasor;
  try { ad = JSON.parse(fs.readFileSync(path.join(dizin, "package.json"), "utf-8")).productName || ad; } catch (e) {}
  app.setName(ad);
  app.setPath("userData", path.join(app.getPath("appData"), ad));
  process.chdir(dizin);
  require(path.join(dizin, "main.js"));
  return true;
}

const ARAC = aracArg(process.argv);
if (!(ARAC && araciAc(ARAC))) kurucu();

function kurucu() {
  if (!app.requestSingleInstanceLock()) { app.quit(); return; }
  const gunluk = path.join(YEREL, "kurulum.log");
  let pencere = null, mesgul = false;

  const gitBul = () => new Promise(coz => {
    const sabit = [
      path.join(process.env.ProgramFiles || "C:\\Program Files", "Git", "cmd", "git.exe"),
      path.join(process.env.LOCALAPPDATA || "", "Programs", "Git", "cmd", "git.exe"),
      ...ADAYLAR.map(d => path.join(d, ".araclar", "git", "cmd", "git.exe")),
    ].find(f => fs.existsSync(f));
    if (sabit) return coz(sabit);
    execFile("where.exe", ["git"], { windowsHide: true }, (e, out) => coz(e ? null : String(out).split(/\r?\n/)[0].trim() || null));
  });

  const calis = (exe, args, ek = {}) => new Promise((coz, red) => {
    execFile(exe, args, { windowsHide: true, ...ek }, (e, out, err) => e ? red(new Error(String(err || out || e.message).trim().split(/\r?\n/).pop())) : coz(String(out)));
  });

  function yaz(d) { if (pencere && !pencere.isDestroyed()) pencere.webContents.send("kur:durum", d); }
  function satir(s) {
    try { fs.mkdirSync(YEREL, { recursive: true }); fs.appendFileSync(gunluk, new Date().toISOString() + " " + s + "\n", "utf-8"); } catch (e) {}
  }
  function adim(yuzde, tavan, cumle) { satir(cumle); yaz({ tur: "adim", yuzde, tavan, cumle }); }

  function klonla(git, url, hedef, env) {
    return new Promise((coz, red) => {
      const c = spawn(git, ["-c", "safe.directory=*", "clone", "--progress", url, hedef], { windowsHide: true, env: { ...process.env, GIT_TERMINAL_PROMPT: "0", ...env } });
      let son = "";
      c.stderr.setEncoding("utf-8");
      c.stderr.on("data", p => {
        for (const s of p.split(/[\r\n]+/)) {
          const t = s.trim();
          if (!t) continue;
          son = t;
          const m = /^(Receiving objects|Resolving deltas):\s+(\d+)%/.exec(t);
          if (m) yaz({ tur: "yuzde", yuzde: m[1].startsWith("Receiving") ? 15 + Math.round(+m[2] * 0.65) : 80 + Math.round(+m[2] * 0.1) });
        }
      });
      c.on("error", red);
      c.on("exit", k => k === 0 ? coz() : red(new Error(son || "git clone " + k)));
    });
  }

  async function ayarla(git, hedef, ssh) {
    const g = (...a) => calis(git, ["-C", hedef, ...a]);
    if (ssh) await g("config", "core.sshCommand", ssh);
    await g("config", "user.name", process.env.USERNAME || os.userInfo().username);
    await g("config", "user.email", (process.env.USERNAME || "asistan") + "@" + (process.env.COMPUTERNAME || os.hostname()));
    await g("config", "core.quotepath", "false");
    const guvenli = await calis(git, ["config", "--global", "--get-all", "safe.directory"]).catch(() => "");
    if (!guvenli.split(/\r?\n/).includes("*")) await calis(git, ["config", "--global", "--add", "safe.directory", "*"]);
  }

  async function bagla(yol, anahtar) {
    mesgul = true;
    try {
      fs.mkdirSync(YEREL, { recursive: true });
      try { fs.unlinkSync(gunluk); } catch (e) {}
      adim(2, 8, "Git aranıyor");
      const git = await gitBul();
      if (!git) throw new Error("Git bulunamadı");
      if (fs.existsSync(YENI)) {
        if (fs.existsSync(path.join(YENI, ".git"))) throw new Error("Klasör zaten var: " + YENI);
        fs.rmSync(YENI, { recursive: true, force: true });
      }
      let env = {}, ssh = null;
      if (yol === "anahtar") {
        adim(8, 14, "Anahtar dosyası yerine konuyor");
        const hedefAnahtar = path.join(YEREL, "anahtar");
        try { fs.chmodSync(hedefAnahtar, 0o666); fs.unlinkSync(hedefAnahtar); } catch (e) {}
        fs.copyFileSync(anahtar, hedefAnahtar);
        const kim = (process.env.USERDOMAIN ? process.env.USERDOMAIN + "\\" : "") + (process.env.USERNAME || os.userInfo().username);
        await calis("icacls.exe", [hedefAnahtar, "/inheritance:r", "/grant:r", kim + ":(R)", "*S-1-5-18:(F)"]);
        const sshExe = path.join(path.dirname(path.dirname(git)), "usr", "bin", "ssh.exe");
        const ileri = f => f.replace(/\\/g, "/");
        ssh = `"${fs.existsSync(sshExe) ? ileri(sshExe) : "ssh"}" -i "${ileri(hedefAnahtar)}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="${ileri(path.join(YEREL, "known_hosts"))}"`;
        env = { GIT_SSH_COMMAND: ssh };
      } else {
        adim(8, 14, "GitHub girişi bekleniyor, açılan pencerede oturum açın");
      }
      adim(15, 80, "Depo indiriliyor");
      await klonla(git, yol === "anahtar" ? DEPO_SSH : DEPO_HTTPS, YENI, env);
      adim(90, 98, "Depo ayarlanıyor");
      await ayarla(git, YENI, ssh);
      adim(100, 100, "Kurulum tamamlandı");
      yaz({ tur: "bitti", araclar: araclar() });
    } catch (e) {
      satir("HATA " + e.message);
      if (!fs.existsSync(path.join(YENI, ".git"))) try { fs.rmSync(YENI, { recursive: true, force: true }); } catch (x) {}
      yaz({ tur: "hata", ileti: e.message });
    } finally { mesgul = false; }
  }

  const araclar = () => Object.values(ARACLAR).filter((v, i, a) => a.indexOf(v) === i && depoBul(v));

  app.whenReady().then(() => {
    pencere = new BrowserWindow({
      width: 600, height: 440, resizable: false, maximizable: false, show: false,
      frame: false, autoHideMenuBar: true,
      title: "Asistan",
      icon: path.join(process.resourcesPath && app.isPackaged ? path.join(process.resourcesPath, "simge") : path.join(__dirname, "kaynak", "simge"), "asistan.ico"),
      webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, "preload.js") },
    });
    pencere.on("close", e => { if (mesgul) e.preventDefault(); });
    pencere.once("ready-to-show", () => pencere.show());
    pencere.loadFile(path.join(__dirname, "baslatici.html"));
  });

  app.on("second-instance", (e, argv) => {
    const k = aracArg(argv);
    if (k && depoBul(k)) { spawn(process.execPath, app.isPackaged ? ["--arac", k] : [__dirname, "--arac", k], { detached: true, stdio: "ignore" }).unref(); return; }
    if (pencere) { if (pencere.isMinimized()) pencere.restore(); pencere.focus(); }
  });
  app.on("window-all-closed", () => app.quit());

  ipcMain.handle("kur:ilk", async () => ({ git: !!(await gitBul()), araclar: araclar(), surum: app.getVersion(), hedef: YENI }));
  ipcMain.handle("kur:anahtar-sec", async () => {
    const r = await dialog.showOpenDialog(pencere, { title: "Anahtar Dosyasını Seç", properties: ["openFile"] });
    return r.canceled ? null : r.filePaths[0];
  });
  ipcMain.on("kur:bagla", (e, yol, anahtar) => { if (!mesgul) bagla(yol, anahtar); });
  ipcMain.on("kur:ac", (e, k) => {
    if (!depoBul(k)) return;
    spawn(process.execPath, app.isPackaged ? ["--arac", k] : [__dirname, "--arac", k], { detached: true, stdio: "ignore" }).unref();
    setTimeout(() => app.quit(), 300);
  });
  ipcMain.on("kur:gunluk", () => shell.openPath(gunluk));
  ipcMain.on("kur:git-indir", () => shell.openExternal("https://git-scm.com/download/win"));
  ipcMain.on("pencere:kucult", () => pencere && pencere.minimize());
  ipcMain.on("pencere:kapat", () => pencere && pencere.close());
}
