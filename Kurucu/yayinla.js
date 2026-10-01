const { execFileSync } = require("child_process");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const kok = __dirname;
const { version } = JSON.parse(fs.readFileSync(path.join(kok, "package.json"), "utf-8"));
const ad = `Asistan-Setup-${version}.exe`;
const exe = path.join(kok, "dist", ad);
const kabuk = { cwd: kok, stdio: "inherit", shell: true };

if (!process.argv.includes("--derleme-yok")) execFileSync("npm", ["run", "dist"], kabuk);
const ozet = crypto.createHash("sha256").update(fs.readFileSync(exe)).digest("hex");
fs.writeFileSync(exe + ".sha256", `${ozet}  ${ad}\n`, "ascii");
console.log(ozet + "  " + ad);

if (process.argv.includes("--yayinla")) {
  const notlar = process.argv.includes("--notlar") ? process.argv[process.argv.indexOf("--notlar") + 1] : `Asistan ${version}`;
  execFileSync("gh", ["release", "create", "v" + version, exe, exe + ".sha256", "--title", `Asistan ${version}`, "--notes", notlar, "--latest"], { cwd: kok, stdio: "inherit" });
}
