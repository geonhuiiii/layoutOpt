import { app, ipcMain, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import koffi from "koffi";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
const libPath = app.isPackaged ? path.join(process.resourcesPath, "libengine.dylib") : path.resolve(__dirname$1, "../../cpp/build/libengine.dylib");
let calculateArea;
try {
  const lib = koffi.load(libPath);
  calculateArea = lib.func("double calculateArea(double, double)");
  const calculatePolygonArea = lib.func("double calculatePolygonArea(double*, int)");
  console.log("C++ Library loaded successfully.");
  console.log("Test Calculation Area(10, 20):", calculateArea(10, 20));
  ipcMain.handle("calculate-area", async (event, width, height) => {
    if (calculateArea) {
      return calculateArea(width, height);
    }
    return 0;
  });
  ipcMain.handle("calculate-polygon-area", async (event, points) => {
    if (calculatePolygonArea) {
      return calculatePolygonArea(points, points.length);
    }
    return 0;
  });
} catch (error) {
  console.error("Failed to load C++ library at:", libPath);
  console.error(error);
}
process.env.DIST = path.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
let win;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: false,
      // Enable Node.js integration for Koffi
      contextIsolation: true
      // Disable context isolation for direct Node access (simplifies FFI usage)
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
