const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const KOK = path.resolve(__dirname, "..");
const ARAC = "Görevlendirme";
const IZLENEN = ["Görevlendirme/main.js", "Görevlendirme/preload.js", "Görevlendirme/arayuz.html", "Görevlendirme/app.css", "Görevlendirme/package.json", "Görevlendirme/gorevlendir.py", "Görevlendirme/senkron.js"];
const YEREL_GIT = path.join(KOK, ".araclar", "git", "cmd", "git.exe");
const GIT = [YEREL_GIT, path.join(process.env.ProgramFiles || "C:\\Program Files", "Git", "cmd", "git.exe")]
  .find(f => fs.existsSync(f)) || "git";

let gunluk = [];
function not(s) {
  gunluk.push(new Date().toISOString().slice(11, 19) + " " + s);
  if (gunluk.length > 200) gunluk.shift();
}
function kayit() { return gunluk.slice(); }

const dinleyiciler = [];
const durumBilgi = { asama: "bekliyor", zaman: null, hata: "" };
function dinle(fn) { dinleyiciler.push(fn); }
function durumYaz(asama, hata) {
  durumBilgi.asama = asama;
  durumBilgi.hata = hata || "";
  if (asama !== "esitleniyor") durumBilgi.zaman = Date.now();
  for (const fn of dinleyiciler) { try { fn({ tur: "durum", durum: Object.assign({}, durumBilgi) }); } catch (e) {} }
}

function gitSessiz(args, opt) {
  return new Promise(coz => {
    execFile(GIT, ["-c", "core.quotepath=false", "-c", "safe.directory=*"].concat(args), {
      cwd: KOK,
      encoding: "utf-8",
      windowsHide: true,
      timeout: (opt && opt.timeout) || 30000
    }, (err, stdout, stderr) => {
      if (err) coz({ ok: false, cikti: ((stdout || "") + (stderr || "") || err.message).toString().trim() });
      else coz({ ok: true, cikti: String(stdout).trim() });
    });
  });
}

let sira = Promise.resolve();
function sirala(is) {
  const s = sira.then(is, is);
  sira = s.catch(() => {});
  return s;
}

async function depoNeden() {
  if (!fs.existsSync(path.join(KOK, ".git"))) return "Klasör git deposu değil: " + KOK;
  const r = await gitSessiz(["remote", "get-url", "origin"]);
  if (r.ok) return "";
  return (r.cikti.split("\n").filter(Boolean).slice(-1)[0] || "git çalışmadı") + " (git: " + GIT + ")";
}
async function depoVar() { return !(await depoNeden()); }

async function kimlik() {
  if (!(await gitSessiz(["config", "user.email"])).ok) {
    await gitSessiz(["config", "user.email", os.userInfo().username + "@" + os.hostname()]);
    await gitSessiz(["config", "user.name", os.userInfo().username]);
  }
}

async function surum() {
  const r = await gitSessiz(["rev-parse", "HEAD"]);
  return r.ok ? r.cikti : "";
}

async function degisenler(a, b) {
  if (!a || !b || a === b) return [];
  const r = await gitSessiz(["diff", "--name-only", a, b]);
  return r.ok ? r.cikti.split("\n").filter(Boolean) : [];
}

async function yerelKaydet(mesaj) {
  const d = await gitSessiz(["status", "--porcelain", "--", ARAC + "/veri"]);
  if (!d.ok || !d.cikti) return false;
  await gitSessiz(["add", "--", ARAC + "/veri"]);
  const c = await gitSessiz(["commit", "-m", mesaj + " (" + os.hostname() + ")"]);
  if (c.ok) not("kayıt: " + mesaj);
  return c.ok;
}

async function cekIc() {
  const neden = await depoNeden();
  if (neden) { not("depo yok: " + neden); durumYaz("yerel", neden); return { ok: false, kodDegisti: false, veriDegisti: false, sebep: neden }; }
  durumYaz("esitleniyor");
  await kimlik();
  const once = await surum();
  await yerelKaydet("veri");
  const r = await gitSessiz(["pull", "--no-rebase", "--no-edit", "-X", "ours", "origin", "HEAD"], { timeout: 45000 });
  if (!r.ok) {
    not("çekme başarısız: " + r.cikti.split("\n").slice(-2).join(" "));
    await gitSessiz(["merge", "--abort"]);
    durumYaz("cevrimdisi", r.cikti.split("\n").slice(-1)[0]);
    return { ok: false, kodDegisti: false, veriDegisti: false, sebep: r.cikti };
  }
  const list = await degisenler(once, await surum());
  const kodDegisti = list.some(f => IZLENEN.includes(f));
  const veriDegisti = list.some(f => f.startsWith(ARAC + "/veri/"));
  if (list.length) not("güncellendi: " + list.length + " dosya" + (kodDegisti ? " (kod)" : ""));
  durumYaz("esitlendi");
  return { ok: true, kodDegisti, veriDegisti, degisen: list };
}

async function itIc() {
  if (!(await depoVar())) return false;
  const ileride = await gitSessiz(["rev-list", "--count", "@{u}..HEAD"]);
  if (ileride.ok && ileride.cikti === "0") return true;
  durumYaz("esitleniyor");
  const r = await gitSessiz(["push", "origin", "HEAD"], { timeout: 45000 });
  if (!r.ok) { not("gönderim başarısız: " + r.cikti.split("\n").slice(-1)[0]); durumYaz("cevrimdisi", r.cikti.split("\n").slice(-1)[0]); }
  else durumYaz("esitlendi");
  return r.ok;
}

let izleyici = null;
async function esitleIc() {
  try {
    const r = await cekIc();
    if (r.ok) await itIc();
    if (izleyici) izleyici(r);
    return r.ok;
  } catch (e) { not("senkron hatası: " + e.message); durumYaz("cevrimdisi", e.message); return false; }
}

async function gonderIc() {
  try {
    if (!(await yerelKaydet("veri"))) return false;
    return await esitleIc();
  } catch (e) { not("senkron hatası: " + e.message); return false; }
}

function cek() { return sirala(cekIc); }
function it() { return sirala(itIc); }
function esitle() { return sirala(esitleIc); }

let zamanlayici = null;
function gecikmeliGonder(ms) {
  if (zamanlayici) clearTimeout(zamanlayici);
  zamanlayici = setTimeout(() => {
    zamanlayici = null;
    sirala(gonderIc);
  }, ms || 4000);
}

function simdiGonder() {
  if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null; }
  return sirala(gonderIc);
}

function izle(ms, fn) {
  izleyici = fn;
  setInterval(esitle, ms || 60000);
}

async function durum() {
  return Object.assign({ depo: await depoVar(), gunluk: kayit() }, durumBilgi);
}

function arkadaGonder() {
  execFile(process.execPath, [path.join(__dirname, "senkron-cli.js")], {
    cwd: KOK,
    windowsHide: true,
    env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: "1" })
  }, () => {});
}

module.exports = { KOK, cek, it, esitle, gecikmeliGonder, simdiGonder, arkadaGonder, depoVar, kayit, not, dinle, izle, durum };
