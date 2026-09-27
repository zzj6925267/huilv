const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("huilvDesktop", {
  getLanUrl: () => ipcRenderer.invoke("get-lan-url"),
});
