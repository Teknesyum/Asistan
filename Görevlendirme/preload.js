const { contextBridge, ipcRenderer } = require("electron");

const dosyaAdi = k => String(k).replace(/[^A-Za-z0-9:_-]/g, "_").replace(/:/g, "@");
let onbellek = {};
const hazir = ipcRenderer.invoke("veri:hepsi").then(o => { onbellek = o || {}; });

contextBridge.exposeInMainWorld("pencere", {
  etiket: () => ipcRenderer.invoke("etiket:hepsi"),
  kucult: () => ipcRenderer.send("pencere:kucult"),
  buyult: () => ipcRenderer.send("pencere:buyult"),
  kapat: () => ipcRenderer.send("pencere:kapat"),
  ac: u => ipcRenderer.send("pencere:ac", u),
  kopyala: (r, sessiz) => ipcRenderer.invoke("pencere:kopyala", r, !!sessiz),
  yukle: b => ipcRenderer.invoke("pencere:yukle", b),
  durum: cb => ipcRenderer.on("pencere:durum", (e, buyuk) => cb(buyuk)),
  veri: {
    hazir: () => hazir,
    oku: k => (dosyaAdi(k) in onbellek ? onbellek[dosyaAdi(k)] : null),
    yaz: (k, m) => { onbellek[dosyaAdi(k)] = m; ipcRenderer.send("veri:yaz", { k, m }); }
  },
  wp: {
    istek: (op, ek) => ipcRenderer.invoke("wp:istek", op, ek),
    ayar: () => ipcRenderer.invoke("wp:ayar"),
    ayarYaz: d => ipcRenderer.invoke("wp:ayar-yaz", d),
    zamanla: () => ipcRenderer.invoke("wp:zamanla"),
    durdur: () => ipcRenderer.invoke("wp:durdur"),
    gorev: () => ipcRenderer.invoke("wp:gorev"),
    gorevBilgi: () => ipcRenderer.invoke("wp:gorev-bilgi"),
    simdi: h => ipcRenderer.invoke("wp:simdi", h),
    olay: cb => ipcRenderer.on("wp:olay", (e, d) => cb(d)),
    resimIste: cb => ipcRenderer.on("wp:resim-iste", (e, d) => cb(d)),
    resim: d => ipcRenderer.send("wp:resim", d),
    hazir: () => ipcRenderer.send("wp:hazir")
  },
  senkron: {
    durum: () => ipcRenderer.invoke("senkron:durum"),
    simdi: () => ipcRenderer.invoke("senkron:simdi"),
    olay: cb => ipcRenderer.on("senkron:olay", (e, d) => cb(d))
  }
});
