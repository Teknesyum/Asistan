const { execFileSync, execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const KOK = path.resolve(__dirname, "..");
const IZLENEN = ["Görevlendirme/main.js", "Görevlendirme/preload.js", "Görevlendirme/arayuz.html", "Görevlendirme/app.css", "Görevlendirme/package.json", "Görevlendirme/gorevlendir.py", "Görevlendirme/senkron.js"];

let gunluk = [];
function not(s) {
  gunluk.push(new Date().toISOString().slice(11, 19) + " " + s);
  if (gunluk.length > 200) gunluk.shift();
}
function kayit() { return gunluk.slice(); }

function git(args, opt) {
  return execFileSync("git", ["-c", "core.quotepath=false"].concat(args), {
    cwd: KOK,
    encoding: "utf-8",
    windowsHide: true,
    timeout: (opt && opt.timeout) || 30000,
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}
function gitSessiz(args, opt) {
  try { return { ok: true, cikti: git(args, opt) }; }
  catch (e) { return { ok: false, cikti: ((e.stdout || "") + (e.stderr || "")).toString().trim() }; }
}

function depoVar() {
  return fs.existsSync(path.join(KOK, ".git")) && gitSessiz(["remote", "get-url", "origin"]).ok;
}

function kimlik() {
  if (!gitSessiz(["config", "user.email"]).ok) {
    gitSessiz(["config", "user.email", os.userInfo().username + "@" + os.hostname()]);
    gitSessiz(["config", "user.name", os.userInfo().username]);
  }
}

function surum() {
  const r = gitSessiz(["rev-parse", "HEAD"]);
  return r.ok ? r.cikti : "";
}

function degisenler(a, b) {
  if (!a || !b || a === b) return [];
  const r = gitSessiz(["diff", "--name-only", a, b]);
  return r.ok ? r.cikti.split("\n").filter(Boolean) : [];
}

function yerelKaydet(mesaj) {
  const d = gitSessiz(["status", "--porcelain", "--", "Görevlendirme/veri"]);
  if (!d.ok || !d.cikti) return false;
  gitSessiz(["add", "--", "Görevlendirme/veri"]);
  const c = gitSessiz(["commit", "-m", mesaj + " (" + os.hostname() + ")"]);
  if (c.ok) not("kayıt: " + mesaj);
  return c.ok;
}

function cek() {
  if (!depoVar()) return { ok: false, kodDegisti: false, sebep: "depo yok" };
  kimlik();
  const once = surum();
  yerelKaydet("veri");
  let r = gitSessiz(["pull", "--no-rebase", "--no-edit", "-X", "ours", "origin", "HEAD"], { timeout: 45000 });
  if (!r.ok) {
    not("çekme başarısız: " + r.cikti.split("\n").slice(-2).join(" "));
    gitSessiz(["merge", "--abort"]);
    return { ok: false, kodDegisti: false, sebep: r.cikti };
  }
  const sonra = surum();
  const list = degisenler(once, sonra);
  const kodDegisti = list.some(f => IZLENEN.includes(f));
  if (list.length) not("güncellendi: " + list.length + " dosya" + (kodDegisti ? " (kod)" : ""));
  return { ok: true, kodDegisti, degisen: list };
}

function it() {
  if (!depoVar()) return false;
  const r = gitSessiz(["push", "origin", "HEAD"], { timeout: 45000 });
  if (!r.ok) not("gönderim başarısız: " + r.cikti.split("\n").slice(-1)[0]);
  return r.ok;
}

let zamanlayici = null;
function gecikmeliGonder(ms) {
  if (zamanlayici) clearTimeout(zamanlayici);
  zamanlayici = setTimeout(() => {
    zamanlayici = null;
    try {
      if (!yerelKaydet("veri")) return;
      cek();
      it();
    } catch (e) { not("senkron hatası: " + e.message); }
  }, ms || 4000);
}

function simdiGonder() {
  if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null; }
  try {
    if (!yerelKaydet("veri")) return false;
    cek();
    return it();
  } catch (e) { not("senkron hatası: " + e.message); return false; }
}

function arkadaGonder() {
  execFile(process.execPath, [path.join(__dirname, "senkron-cli.js")], {
    cwd: KOK,
    windowsHide: true,
    env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: "1" })
  }, () => {});
}

module.exports = { KOK, cek, it, gecikmeliGonder, simdiGonder, arkadaGonder, depoVar, kayit, not };
