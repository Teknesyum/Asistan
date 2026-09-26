const f = process.argv[2]; const d = require(require("path").resolve(f));
const sayac = {}; const hedef = {};
for (const [ek, r] of Object.entries(d.ekranlar)) for (const [durum, s] of Object.entries(r)) {
  for (const p of s.pairs) { const k = `${p.uncertain ? "?" : "!"} ${p.selector.split(" > ").slice(-2).join(" > ")} ${p.fg}/${p.bg} ${p.ratio}`; (sayac[k] ||= new Set()).add(ek + ":" + durum); }
  for (const t of s.targets || []) { const k = `${t.selector.split(" > ").slice(-2).join(" > ")} ${Math.round(t.width)}x${Math.round(t.height)}`; (hedef[k] ||= new Set()).add(ek); }
}
console.log("KONTRAST", Object.keys(sayac).length); for (const [k, v] of Object.entries(sayac)) console.log(k, "|", [...v].slice(0, 4).join(","), v.size);
console.log("HEDEF", Object.keys(hedef).length); for (const [k, v] of Object.entries(hedef)) console.log(k, "|", [...v].join(","));
console.log("HATALAR", JSON.stringify(d.hatalar));
