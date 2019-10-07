import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { format as formatUrl } from "url";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
autoUpdater.autoInstallOnAppQuit = false;
log.info("App starting...");

const isDevelopment = process.env.NODE_ENV !== "production";

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

function createMainWindow() {
  const window = new BrowserWindow({
    webPreferences: { nodeIntegration: true },
  });

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true,
      }),
    );
  }

  window.on("closed", () => {
    mainWindow = null;
  });

  window.webContents.on("devtools-opened", () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

// quit application when all windows are closed
app.on("window-all-closed", () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send("message", text);
}

autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Checking for update...");
});

autoUpdater.on("update-available", () => {
  sendStatusToWindow("Update available.");
});

autoUpdater.on("update-not-available", () => {
  sendStatusToWindow("Update not available.");
});

autoUpdater.on("error", err => {
  sendStatusToWindow("Error in auto-updater. " + err);
});

autoUpdater.on("download-progress", progressObj => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message =
    log_message +
    " (" +
    progressObj.transferred +
    "/" +
    progressObj.total +
    ")";
  sendStatusToWindow(log_message);
});

autoUpdater.on("update-downloaded", () => {
  sendStatusToWindow("Update downloaded");
});

// Wait for event from renderer to quit and install
ipcMain.on("quit-and-install", () => {
  autoUpdater.quitAndInstall();
});

// This info is only available from main thread
function sendAppInfo() {
  const info = {
    name: isDevelopment ? process.env.npm_package_productName : app.getName(),
    version: isDevelopment ? process.env.npm_package_version : app.getVersion(),
  };

  log.info(info);
  mainWindow.webContents.send("appInfo", info);
}

// create main BrowserWindow when electron is ready
app.on("ready", () => {
  mainWindow = createMainWindow();

  // Wait for the renderer to finish loading DOM and send general info to display
  mainWindow.webContents.once("dom-ready", () => {
    sendAppInfo();
  });

  autoUpdater.checkForUpdatesAndNotify();
});
