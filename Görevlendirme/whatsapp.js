const { app } = require("electron");
const { spawn, execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const SAAT = { A: [16, 0], B: [22, 0] };
const GEC_SINIR = 2 * 3600e3;
const GUN = 14;
const GOREV = h => "AsistanGorevWP-" + h;

let dizin = null, cocuk = null, sira = 1, tampon = "";
const bekleyen = new Map();
const dinleyici = new Set();
let son = { ev: "durum", bagli: false, cevrimici: false };

function klasor() {
  if (!dizin) {
    dizin = path.join(app.getPath("userData"), "wp");
    fs.mkdirSync(dizin, { recursive: true });
  }
  return dizin;
}
const ayarYol = () => path.join(klasor(), "ayar.json");
function ayarOku() {
  try { return { gun: "yarin", haftasonu: true, kayit: [], ...JSON.parse(fs.readFileSync(ayarYol(), "utf-8")) }; }
  catch (e) { return { gun: "yarin", haftasonu: true, kayit: [] }; }
}
function ayarYaz(a) {
  a.kayit = (a.kayit || []).slice(-60);
  fs.writeFileSync(ayarYol(), JSON.stringify(a, null, 1), "utf-8");
  yay({ ev: "ayar" });
  return a;
}

function yay(d) { for (const f of dinleyici) try { f(d); } catch (e) {} }
function dinle(f) { dinleyici.add(f); }

function exeHazirla() {
  const kaynak = path.join(__dirname, "wp", "wp-yardimci.exe");
  const hedef = path.join(klasor(), "wp-yardimci.exe");
  const k = fs.statSync(kaynak);
  let h = null;
  try { h = fs.statSync(hedef); } catch (e) {}
  if (!h || h.size !== k.size) fs.copyFileSync(kaynak, hedef);
  return hedef;
}

function baslat() {
  if (cocuk) return;
  const exe = exeHazirla();
  cocuk = spawn(exe, ["--veri", klasor()], { windowsHide: true, stdio: ["pipe", "pipe", "ignore"] });
  cocuk.stdout.setEncoding("utf-8");
  cocuk.stdout.on("data", p => {
    tampon += p;
    let i;
    while ((i = tampon.indexOf("\n")) >= 0) {
      const satir = tampon.slice(0, i).trim();
      tampon = tampon.slice(i + 1);
      if (!satir) continue;
      let j;
      try { j = JSON.parse(satir); } catch (e) { continue; }
      if (j.id && bekleyen.has(j.id)) {
        const b = bekleyen.get(j.id);
        bekleyen.delete(j.id);
        clearTimeout(b.t);
        if (j.ok === false || j.hata) b.red(new Error(j.hata || "yardımcı hata verdi")); else b.coz(j.veri);
      } else if (j.ev) {
        if (j.ev === "durum") son = j;
        yay(j);
      }
    }
  });
  cocuk.on("exit", () => {
    cocuk = null;
    tampon = "";
    for (const b of bekleyen.values()) { clearTimeout(b.t); b.red(new Error("yardımcı kapandı")); }
    bekleyen.clear();
    son = { ev: "durum", bagli: false, cevrimici: false };
    yay(son);
  });
}

function istek(op, ek = {}, sure = 60000) {
  baslat();
  const id = sira++;
  return new Promise((coz, red) => {
    const t = setTimeout(() => { bekleyen.delete(id); red(new Error("yanıt gelmedi (" + op + ")")); }, sure);
    bekleyen.set(id, { coz, red, t });
    cocuk.stdin.write(JSON.stringify({ id, op, ...ek }) + "\n");
  });
}

async function cevrimici(sure = 45000) {
  baslat();
  const d = await istek("durum");
  if (!d || !d.bagli) throw new Error("WhatsApp bağlı değil");
  if (d.cevrimici) return d;
  return new Promise((coz, red) => {
    const t = setTimeout(() => { dinleyici.delete(f); red(new Error("WhatsApp'a bağlanılamadı")); }, sure);
    const f = e => { if (e.ev === "durum" && e.cevrimici) { clearTimeout(t); dinleyici.delete(f); coz(e); } };
    dinleyici.add(f);
  });
}

async function gonder(jid, bayt, ad) {
  await cevrimici();
  const g = path.join(os.tmpdir(), "asistan-wp");
  fs.mkdirSync(g, { recursive: true });
  const yol = path.join(g, ad + "-" + Date.now() + ".png");
  fs.writeFileSync(yol, Buffer.from(bayt));
  return istek("gonder", { jid, dosyalar: [yol] }, 120000);
}

const tarih = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

function zamanUygun(h, a, simdi = new Date()) {
  if (!a.bitis || !a.baslangic) return "otomasyon kapalı";
  if (simdi.getTime() > a.bitis) return "süre doldu";
  const [s, d] = SAAT[h];
  const slot = new Date(simdi); slot.setHours(s, d, 0, 0);
  if (simdi < slot.getTime() - 15 * 60e3) return "saati gelmedi";
  if (simdi - slot > GEC_SINIR) return "saatinden 2 saatten fazla geç";
  if ((a.kayit || []).some(k => k.anahtar === tarih(simdi) + "|" + h && k.ok)) return "bugün gönderildi";
  return null;
}

function kaydet(k) {
  const a = ayarOku();
  a.kayit.push({ zaman: Date.now(), ...k });
  ayarYaz(a);
}

function ps(betik) {
  return new Promise((coz, red) => {
    execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", betik], { windowsHide: true, timeout: 60000 }, (e, out, err) => {
      if (e) red(new Error((err || e.message).toString().trim().split(/\r?\n/)[0])); else coz(out);
    });
  });
}
const tirnak = s => "'" + String(s).replace(/'/g, "''") + "'";

async function zamanla(gunSayisi = GUN) {
  const exe = process.execPath;
  const kok = app.getAppPath();
  const bitis = new Date();
  if (bitis.getHours() >= SAAT.B[0]) bitis.setDate(bitis.getDate() + 1);
  bitis.setDate(bitis.getDate() + gunSayisi - 1);
  bitis.setHours(23, 59, 0, 0);
  const yerel = tarih(bitis) + "T23:59:00";
  const sat = [];
  for (const h of ["A", "B"]) {
    const [s, d] = SAAT[h];
    sat.push(
      "$t = New-ScheduledTaskTrigger -Daily -At " + tirnak(String(s).padStart(2, "0") + ":" + String(d).padStart(2, "0")) + ";",
      "$t.EndBoundary = " + tirnak(yerel) + ";",
      "$a = New-ScheduledTaskAction -Execute " + tirnak(exe) + " -Argument " + tirnak('"' + kok + '" --wp ' + h) + " -WorkingDirectory " + tirnak(kok) + ";",
      "$s = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 1);",
      "Register-ScheduledTask -TaskName " + tirnak(GOREV(h)) + " -Trigger $t -Action $a -Settings $s -Description " + tirnak("Asistan Görevlendirme WhatsApp " + h) + " -Force | Out-Null;"
    );
  }
  await ps("$ErrorActionPreference = 'Stop'; " + sat.join(" "));
  const a = ayarOku();
  a.baslangic = Date.now();
  a.bitis = bitis.getTime();
  return ayarYaz(a);
}

async function durdur() {
  await ps("$ErrorActionPreference = 'SilentlyContinue'; " + ["A", "B"].map(h => "Unregister-ScheduledTask -TaskName " + tirnak(GOREV(h)) + " -Confirm:$false;").join(" "));
  const a = ayarOku();
  a.baslangic = null;
  a.bitis = null;
  return ayarYaz(a);
}

async function gorevVar() {
  try {
    const o = await ps("(Get-ScheduledTask -TaskName " + tirnak(GOREV("A")) + "," + tirnak(GOREV("B")) + " -ErrorAction SilentlyContinue | Measure-Object).Count");
    return parseInt(o, 10) || 0;
  } catch (e) { return 0; }
}

function kapat() { if (cocuk) try { cocuk.kill(); } catch (e) {} }

module.exports = { dinle, istek, gonder, ayarOku, ayarYaz, zamanUygun, kaydet, zamanla, durdur, gorevVar, kapat, tarih, durumSon: () => son, SAAT };
