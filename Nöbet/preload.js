const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pencere", {
  kucult: () => ipcRenderer.send("pencere:kucult"),
  buyult: () => ipcRenderer.send("pencere:buyult"),
  kapat: () => ipcRenderer.send("pencere:kapat"),
  kopyala: r => ipcRenderer.invoke("pencere:kopyala", r),
  durum: cb => ipcRenderer.on("pencere:durum", (e, buyuk) => cb(buyuk)),
  veri: {
    oku: k => ipcRenderer.sendSync("veri:oku", k),
    yaz: (k, m) => ipcRenderer.send("veri:yaz", { k, m })
  }
});
