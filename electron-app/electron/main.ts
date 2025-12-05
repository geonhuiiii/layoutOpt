import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import koffi from 'koffi'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load C++ DLL
// In production (packaged app), load from resources folder
// In development, load from cpp/build folder
const libPath = app.isPackaged
    ? path.join(process.resourcesPath, 'libengine.dylib')
    : path.resolve(__dirname, '../../cpp/build/libengine.dylib')
let calculateArea: any

try {
    const lib = koffi.load(libPath)
    calculateArea = lib.func('double calculateArea(double, double)')
    const calculatePolygonArea = lib.func('double calculatePolygonArea(double*, int)')
    console.log('C++ Library loaded successfully.')
    console.log('Test Calculation Area(10, 20):', calculateArea(10, 20))

    ipcMain.handle('calculate-area', async (event, width, height) => {
        if (calculateArea) {
            return calculateArea(width, height)
        }
        return 0
    })

    ipcMain.handle('calculate-polygon-area', async (event, points) => {
        if (calculatePolygonArea) {
            return calculatePolygonArea(points, points.length)
        }
        return 0
    })
} catch (error) {
    console.error('Failed to load C++ library at:', libPath)
    console.error(error)
}


// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js
// │ └─┬ preload
// │   └── index.js
// ├─┬ dist
// │ └── index.html

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            nodeIntegration: false, // Enable Node.js integration for Koffi
            contextIsolation: true, // Disable context isolation for direct Node access (simplifies FFI usage)
        },
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
        win.webContents.openDevTools()
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(process.env.DIST, 'index.html'))
    }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(createWindow)
