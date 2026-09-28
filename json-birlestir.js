const fs = require("fs");

const duz = x => x !== null && typeof x === "object" && !Array.isArray(x);
const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function birlestir(o, a, b) {
  if (esit(a, b)) return a;
  if (esit(o, a)) return b;
  if (esit(o, b)) return a;
  if (duz(a) && duz(b)) {
    const t = duz(o) ? o : {};
    const r = {};
    const anahtar = Object.keys(a).concat(Object.keys(b).filter(k => !(k in a)));
    for (const k of anahtar) {
      const v = birlestir(t[k], a[k], b[k]);
      if (v !== undefined) r[k] = v;
    }
    return r;
  }
  return a;
}

function oku(f) {
  try { return JSON.parse(fs.readFileSync(f, "utf-8")); } catch (e) { return undefined; }
}

if (require.main === module) {
  const [o, a, b] = process.argv.slice(2);
  const A = oku(a), B = oku(b);
  if (A === undefined && B === undefined) process.exit(1);
  const sonuc = A === undefined ? B : B === undefined ? A : birlestir(oku(o), A, B);
  fs.writeFileSync(a, JSON.stringify(sonuc), "utf-8");
}

module.exports = { birlestir };
