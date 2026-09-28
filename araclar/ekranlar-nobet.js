const s = i => `document.querySelectorAll("#adimlar button")[${i}].click()`;
module.exports = [
  { ad: "kadro", js: s(0) },
  { ad: "liste", js: `document.querySelector("#btnCoz").click(); ` + s(1), bekle: 1500 },
  { ad: "kisi", js: `kisiSec(V.asistanlar[0].ad)`, sonra: `kisiSec(null)` },
  { ad: "cikti", js: s(2) },
  { ad: "kurallar", js: `document.querySelector("#btnKurallar").click()`, sonra: `document.querySelector("#btnKuralKapat").click()` },
  { ad: "qr", js: `qrCiz(document.querySelector("#telQr"), "https://n.uguu.se/ornek.png"); document.querySelector("#telLink").textContent = "https://n.uguu.se/ornek.png"; document.querySelector("#telDlg").showModal()`, sonra: `document.querySelector("#telDlg").close()` },
  { ad: "bildirim", js: `toast("Kopyalandı")`, bekle: 300 }
];
