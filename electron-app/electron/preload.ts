import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
        on: (channel: string, listener: (...args: unknown[]) => void) => {
            const subscription = (_event: unknown, ...args: unknown[]) => listener(...args);
            ipcRenderer.on(channel, subscription);
            return () => ipcRenderer.removeListener(channel, subscription);
        },
        // Explicitly typing for better DX if we were using a proper type definition file
        calculateArea: (width: number, height: number) => ipcRenderer.invoke('calculate-area', width, height),
        calculatePolygonArea: (points: number[]) => ipcRenderer.invoke('calculate-polygon-area', points),
    },
})
