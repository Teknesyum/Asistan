const { contextBridge, ipcRenderer } = require("electron");

const dosyaAdi = k => String(k).replace(/[^A-Za-z0-9:_-]/g, "_").replace(/:/g, "@");
let onbellek = {};
const hazir = ipcRenderer.invoke("veri:hepsi").then(o => { onbellek = o || {}; });

contextBridge.exposeInMainWorld("pencere", {
  kucult: () => ipcRenderer.send("pencere:kucult"),
  buyult: () => ipcRenderer.send("pencere:buyult"),
  kapat: () => ipcRenderer.send("pencere:kapat"),
  ac: u => ipcRenderer.send("pencere:ac", u),
  kopyala: r => ipcRenderer.invoke("pencere:kopyala", r),
  yukle: b => ipcRenderer.invoke("pencere:yukle", b),
  senkron: {
    durum: () => ipcRenderer.invoke("senkron:durum"),
    simdi: () => ipcRenderer.invoke("senkron:simdi"),
    olay: cb => ipcRenderer.on("senkron:olay", (e, d) => cb(d))
  },
  durum: cb => ipcRenderer.on("pencere:durum", (e, buyuk) => cb(buyuk)),
  veri: {
    hazir: () => hazir,
    oku: k => (dosyaAdi(k) in onbellek ? onbellek[dosyaAdi(k)] : null),
    yaz: (k, m) => { onbellek[dosyaAdi(k)] = m; ipcRenderer.send("veri:yaz", { k, m }); }
  }
});
