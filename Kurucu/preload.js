const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kur", {
  ilk: () => ipcRenderer.invoke("kur:ilk"),
  anahtarSec: () => ipcRenderer.invoke("kur:anahtar-sec"),
  bagla: (yol, anahtar) => ipcRenderer.send("kur:bagla", yol, anahtar),
  ac: k => ipcRenderer.send("kur:ac", k),
  gunluk: () => ipcRenderer.send("kur:gunluk"),
  gitIndir: () => ipcRenderer.send("kur:git-indir"),
  durum: f => ipcRenderer.on("kur:durum", (e, d) => f(d)),
  kucult: () => ipcRenderer.send("pencere:kucult"),
  kapat: () => ipcRenderer.send("pencere:kapat"),
});
