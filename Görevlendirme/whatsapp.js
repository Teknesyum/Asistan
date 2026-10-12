const { app } = require("electron");
const { spawn, execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const SAAT_ONTANIM = { A: "15:00", B: "21:00" };
function saatCoz(x) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(x == null ? "" : x).trim());
  if (!m) return null;
  return [Math.min(23, Math.max(0, +m[1])), Math.min(59, Math.max(0, +m[2]))];
}
function saat(h, a) {
  return saatCoz((a || ayarOku())["saat" + h]) || saatCoz(SAAT_ONTANIM[h]);
}
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
  const ont = { gun: "yarin", haftasonu: true, kayit: [], saatA: SAAT_ONTANIM.A, saatB: SAAT_ONTANIM.B };
  try { return { ...ont, ...JSON.parse(fs.readFileSync(ayarYol(), "utf-8")) }; }
  catch (e) { return ont; }
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
  const [s, d] = saat(h, a);
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

function calis(exe, args) {
  return new Promise((coz, red) => {
    execFile(exe, args, { windowsHide: true, timeout: 60000 }, (e, out, err) => {
      if (e) red(new Error((err || out || e.message).toString().trim().split(/\r?\n/)[0])); else coz(out);
    });
  });
}
const xml = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const iki = n => String(n).padStart(2, "0");

function gorevXml(h, bitis) {
  const [s, d] = saat(h);
  const bas = new Date(); bas.setHours(s, d, 0, 0);
  const args = (app.isPackaged ? ["--arac", "gorevlendirme"] : [__dirname]).map(x => /\s/.test(x) ? '"' + x + '"' : x).concat(["--wp", h]).join(" ");
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>${xml("Asistan Görevlendirme WhatsApp " + h)}</Description></RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>${tarih(bas)}T${iki(s)}:${iki(d)}:00</StartBoundary>
      <EndBoundary>${tarih(bitis)}T23:59:00</EndBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals><Principal id="Author"><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
    <Enabled>true</Enabled>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${xml(process.execPath)}</Command>
      <Arguments>${xml(args)}</Arguments>
      <WorkingDirectory>${xml(__dirname)}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>`;
}

async function zamanla(gunSayisi = GUN, bitisZaman = null) {
  const bitis = bitisZaman ? new Date(bitisZaman) : new Date();
  if (!bitisZaman) {
    if (bitis.getHours() >= saat("B")[0]) bitis.setDate(bitis.getDate() + 1);
    bitis.setDate(bitis.getDate() + gunSayisi - 1);
  }
  bitis.setHours(23, 59, 0, 0);
  for (const h of ["A", "B"]) {
    const dosya = path.join(os.tmpdir(), GOREV(h) + ".xml");
    fs.writeFileSync(dosya, "\ufeff" + gorevXml(h, bitis), "utf16le");
    try { await calis("schtasks.exe", ["/Create", "/TN", GOREV(h), "/XML", dosya, "/F"]); }
    finally { try { fs.unlinkSync(dosya); } catch (e) {} }
  }
  const a = ayarOku();
  if (!bitisZaman) a.baslangic = Date.now();
  a.bitis = bitis.getTime();
  return ayarYaz(a);
}

async function durdur() {
  for (const h of ["A", "B"]) await calis("schtasks.exe", ["/Delete", "/TN", GOREV(h), "/F"]).catch(() => {});
  const a = ayarOku();
  a.baslangic = null;
  a.bitis = null;
  return ayarYaz(a);
}

async function gorevVar() {
  let n = 0;
  for (const h of ["A", "B"]) if (await calis("schtasks.exe", ["/Query", "/TN", GOREV(h)]).then(() => true, () => false)) n++;
  return n;
}

function kapat() { if (cocuk) try { cocuk.kill(); } catch (e) {} }

module.exports = { dinle, istek, gonder, ayarOku, ayarYaz, zamanUygun, kaydet, zamanla, durdur, gorevVar, kapat, tarih, durumSon: () => son, saat, SAAT_ONTANIM };
