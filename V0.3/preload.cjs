const { contextBridge, ipcRenderer } = require('electron');

const api = {
  getBestMove: (fen, movetimeMs) => ipcRenderer.invoke('get-best-move', fen, movetimeMs)
};

contextBridge.exposeInMainWorld('electronAPI', api);
// back-compat shorthand used in renderer
contextBridge.exposeInMainWorld('api', api);
