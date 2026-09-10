const { execFile } = require("child_process");
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

function gitSessiz(args, opt) {
  return new Promise(coz => {
    execFile("git", ["-c", "core.quotepath=false"].concat(args), {
      cwd: KOK,
      encoding: "utf-8",
      windowsHide: true,
      timeout: (opt && opt.timeout) || 30000
    }, (err, stdout, stderr) => {
      if (err) coz({ ok: false, cikti: ((stdout || "") + (stderr || "")).toString().trim() });
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

async function depoVar() {
  return fs.existsSync(path.join(KOK, ".git")) && (await gitSessiz(["remote", "get-url", "origin"])).ok;
}

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
  const d = await gitSessiz(["status", "--porcelain", "--", "Görevlendirme/veri"]);
  if (!d.ok || !d.cikti) return false;
  await gitSessiz(["add", "--", "Görevlendirme/veri"]);
  const c = await gitSessiz(["commit", "-m", mesaj + " (" + os.hostname() + ")"]);
  if (c.ok) not("kayıt: " + mesaj);
  return c.ok;
}

async function cekIc() {
  if (!(await depoVar())) return { ok: false, kodDegisti: false, sebep: "depo yok" };
  await kimlik();
  const once = await surum();
  await yerelKaydet("veri");
  const r = await gitSessiz(["pull", "--no-rebase", "--no-edit", "-X", "ours", "origin", "HEAD"], { timeout: 45000 });
  if (!r.ok) {
    not("çekme başarısız: " + r.cikti.split("\n").slice(-2).join(" "));
    await gitSessiz(["merge", "--abort"]);
    return { ok: false, kodDegisti: false, sebep: r.cikti };
  }
  const list = await degisenler(once, await surum());
  const kodDegisti = list.some(f => IZLENEN.includes(f));
  if (list.length) not("güncellendi: " + list.length + " dosya" + (kodDegisti ? " (kod)" : ""));
  return { ok: true, kodDegisti, degisen: list };
}

async function itIc() {
  if (!(await depoVar())) return false;
  const r = await gitSessiz(["push", "origin", "HEAD"], { timeout: 45000 });
  if (!r.ok) not("gönderim başarısız: " + r.cikti.split("\n").slice(-1)[0]);
  return r.ok;
}

async function gonderIc() {
  try {
    if (!(await yerelKaydet("veri"))) return false;
    await cekIc();
    return await itIc();
  } catch (e) { not("senkron hatası: " + e.message); return false; }
}

function cek() { return sirala(cekIc); }
function it() { return sirala(itIc); }

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

function arkadaGonder() {
  execFile(process.execPath, [path.join(__dirname, "senkron-cli.js")], {
    cwd: KOK,
    windowsHide: true,
    env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: "1" })
  }, () => {});
}

module.exports = { KOK, cek, it, gecikmeliGonder, simdiGonder, arkadaGonder, depoVar, kayit, not };
