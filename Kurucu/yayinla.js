const { execFileSync } = require("child_process");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const kok = __dirname;
const depo = path.dirname(kok);
const surumu = d => JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf-8")).version;
const version = surumu(kok);
const ad = `Asistan-Setup-${version}.exe`;
const exe = path.join(kok, "dist", ad);
const ARACLAR = [["Görevlendirme", "gorevlendirme"], ["Nöbet", "nobet"]];
const git = (...a) => execFileSync("git", ["-C", depo, ...a], { encoding: "utf-8" }).trim();
const arg = k => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null;

if (!process.argv.includes("--derleme-yok")) execFileSync("npm", ["run", "dist"], { cwd: kok, stdio: "inherit", shell: true });
const ozet = crypto.createHash("sha256").update(fs.readFileSync(exe)).digest("hex");
fs.writeFileSync(exe + ".sha256", `${ozet}  ${ad}\n`, "ascii");
console.log(ozet + "  " + ad);

const sonSurum = () => { try { return git("describe", "--tags", "--abbrev=0", "--match", "v*"); } catch (e) { return null; } };
const otoNot = () => {
  const son = sonSurum();
  const log = git("log", "--no-merges", "--format=%s", son ? son + "..HEAD" : "HEAD").split("\n").filter(x => x && !x.startsWith("veri ("));
  return log.length ? log.map(x => "- " + x.trim()).join("\n") : `Asistan ${version}`;
};

if (!process.argv.includes("--taslak")) {
  const satirlar = [arg("--notlar") || otoNot(), ""];
  const yeniEtiket = [];
  for (const [klasor, kisa] of ARACLAR) {
    const v = surumu(path.join(depo, klasor));
    const etiket = `${kisa}-v${v}`;
    satirlar.push(`- ${klasor} ${v}` + (arg("--" + kisa) ? ": " + arg("--" + kisa) : ""));
    if (!git("tag", "-l", etiket)) { git("tag", "-a", etiket, "-m", `${klasor} ${v}`); yeniEtiket.push(etiket); }
  }
  if (yeniEtiket.length) git("push", "origin", ...yeniEtiket);
  execFileSync("gh", ["release", "create", "v" + version, exe, exe + ".sha256", "--title", `Asistan ${version}`, "--notes", satirlar.join("\n"), "--latest"], { cwd: kok, stdio: "inherit" });
}
