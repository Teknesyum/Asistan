const { execFile, execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const KOK = path.resolve(__dirname, "..");
const VERI = path.join(KOK, "veri", "nobet");
const YOL = "veri/nobet";

let etkin = false;
let bekleyen = null;

function veriDizin() {
  try { fs.mkdirSync(VERI, { recursive: true }); } catch (e) {}
  return VERI;
}

function git(args, opts) {
  return new Promise(cevap => {
    execFile("git", args, { cwd: KOK, windowsHide: true, timeout: (opts && opts.sure) || 30000 },
      (hata, cikti, hataCikti) => cevap({ ok: !hata, cikti: (cikti || "").trim(), hata: (hataCikti || "").trim() }));
  });
}

function gitSenkron(args) {
  try {
    return { ok: true, cikti: String(execFileSync("git", args, { cwd: KOK, windowsHide: true, timeout: 20000 })).trim() };
  } catch (e) {
    return { ok: false, cikti: "" };
  }
}

async function depoMu() {
  const a = await git(["rev-parse", "--is-inside-work-tree"], { sure: 8000 });
  if (!a.ok || a.cikti !== "true") return false;
  const b = await git(["remote", "get-url", "origin"], { sure: 8000 });
  return b.ok && !!b.cikti;
}

async function kirliMi() {
  const a = await git(["status", "--porcelain", "--", YOL]);
  return a.ok && a.cikti.length > 0;
}

async function veriIsle(mesaj) {
  if (!(await kirliMi())) return false;
  await git(["add", "--", YOL]);
  const a = await git(["commit", "-m", mesaj]);
  return a.ok;
}

async function tasi() {
  veriDizin();
  if (fs.readdirSync(VERI).length) return;
  const eski = path.join(process.env.APPDATA || "", "asistan-nobet", "veri");
  if (!eski || !fs.existsSync(eski)) return;
  for (const ad of fs.readdirSync(eski)) {
    try { fs.copyFileSync(path.join(eski, ad), path.join(VERI, ad)); } catch (e) {}
  }
}

async function baslat() {
  const sonuc = { depo: false, yenilendi: false, not: "" };
  veriDizin();
  if (!(await depoMu())) { sonuc.not = "depo yok, yalniz yerel"; await tasi(); return sonuc; }
  sonuc.depo = true;
  await tasi();

  const dal = (await git(["rev-parse", "--abbrev-ref", "HEAD"])).cikti || "main";
  const once = (await git(["rev-parse", "HEAD"])).cikti;

  await veriIsle("veri: yerel degisiklik");

  const getir = await git(["fetch", "origin", dal], { sure: 45000 });
  if (!getir.ok) { sonuc.not = "cevrimdisi"; etkin = true; return sonuc; }

  const cek = await git(["rebase", "-X", "theirs", "origin/" + dal], { sure: 45000 });
  if (!cek.ok) {
    await git(["rebase", "--abort"]);
    sonuc.not = "birlestirme cakismasi, yerel korundu";
  }

  const sonra = (await git(["rev-parse", "HEAD"])).cikti;
  if (once && sonra && once !== sonra) {
    const fark = await git(["diff", "--name-only", once, sonra]);
    const kod = fark.cikti.split("\n").filter(s => s && !s.startsWith(YOL) && !s.startsWith("veri/"));
    if (kod.length) sonuc.yenilendi = true;
  }

  etkin = true;
  it();
  return sonuc;
}

function it() {
  git(["push", "origin", "HEAD"], { sure: 45000 });
}

function degisti() {
  if (!etkin) return;
  clearTimeout(bekleyen);
  bekleyen = setTimeout(async () => {
    if (await veriIsle("veri: " + new Date().toISOString().slice(0, 19).replace("T", " "))) it();
  }, 4000);
}

function kapat() {
  if (!etkin) return;
  clearTimeout(bekleyen);
  const a = gitSenkron(["status", "--porcelain", "--", YOL]);
  if (a.ok && a.cikti) {
    gitSenkron(["add", "--", YOL]);
    gitSenkron(["commit", "-m", "veri: " + new Date().toISOString().slice(0, 19).replace("T", " ")]);
  }
  gitSenkron(["push", "origin", "HEAD"]);
}

module.exports = { veriDizin, baslat, degisti, kapat, KOK };
