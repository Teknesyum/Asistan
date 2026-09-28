const s = i => `document.querySelectorAll("#nav button")[${i}].click()`;
module.exports = [
  { ad: "gosterge", js: s(0) },
  { ad: "asistanlar", js: s(1) },
  { ad: "nobet", js: s(2) },
  { ad: "izinler", js: s(3) },
  { ad: "kural", js: s(4) },
  { ad: "cikti", js: s(5) },
  { ad: "analiz", js: s(6), bekle: 1500 },
  { ad: "qr", js: s(0) + `; qrCiz(document.querySelector("#telQr"), "https://n.uguu.se/ornek.png"); document.querySelector("#telLink").textContent = "https://n.uguu.se/ornek.png"; document.querySelector("#telDlg").showModal()`, sonra: `document.querySelector("#telDlg").close()` },
  { ad: "bildirim", js: `toast("Panoya kopyalandı")`, bekle: 300 }
];
