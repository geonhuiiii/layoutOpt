"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    invoke: (channel, ...args) => electron.ipcRenderer.invoke(channel, ...args),
    on: (channel, listener) => {
      const subscription = (_event, ...args) => listener(...args);
      electron.ipcRenderer.on(channel, subscription);
      return () => electron.ipcRenderer.removeListener(channel, subscription);
    },
    // Explicitly typing for better DX if we were using a proper type definition file
    calculateArea: (width, height) => electron.ipcRenderer.invoke("calculate-area", width, height),
    calculatePolygonArea: (points) => electron.ipcRenderer.invoke("calculate-polygon-area", points)
  }
});
