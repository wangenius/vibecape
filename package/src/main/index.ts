import { app, shell, BrowserWindow, ipcMain, nativeImage } from "electron";
import { join } from "path";
import icon from "../../resources/icon-macOS-Default-1024x1024@2x.png?asset";
import { ensureDatabaseReady } from "./db/client";

// 自动注册 IPC handlers（副作用导入）
import "./handler/app/SettingsHandler";
import "./handler/app/ModelHandler";
import "./handler/chat/ChatHandler";
import "./handler/docs/DocsHandler";
import "./handler/docs/VibecapeHandler";

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 1320,
    minHeight: 900,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    title: "jezzlab",
    // Only set icon for Linux and Windows (macOS uses dock icon instead)
    ...(process.platform !== "darwin" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  const isDev = !app.isPackaged;
  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  app.setAppUserModelId("com.electron");

  // Set app icon for macOS dock
  if (process.platform === "darwin" && app.dock) {
    const dockIcon = nativeImage.createFromPath(icon);
    // Resize to appropriate size for dock (128x128 is optimal for Retina displays)
    const resizedIcon = dockIcon.resize({ width: 128, height: 128 });
    app.dock.setIcon(resizedIcon);
  }

  // Handle dev shortcuts: F12 for DevTools, ignore Ctrl+R in production
  app.on("browser-window-created", (_, window) => {
    window.webContents.on("before-input-event", (event, input) => {
      if (input.key === "F12") {
        window.webContents.toggleDevTools();
        event.preventDefault();
      }
      // Ignore refresh in production
      if (!app.isPackaged) return;
      if ((input.control || input.meta) && input.key.toLowerCase() === "r") {
        event.preventDefault();
      }
    });
  });

  try {
    // Initialize Global Databases
    await ensureDatabaseReady();
  } catch (error) {
    console.error("Failed to initialize databases:", error);
  }

  // 初始化代理配置
  const { initProxyConfig } = await import("./utils/proxy");
  await initProxyConfig();

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
