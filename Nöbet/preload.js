const { contextBridge, ipcRenderer } = require("electron");

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
    oku: k => ipcRenderer.sendSync("veri:oku", k),
    yaz: (k, m) => ipcRenderer.send("veri:yaz", { k, m })
  }
});
