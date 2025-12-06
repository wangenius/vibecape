import { app, shell, BrowserWindow, ipcMain, nativeImage, protocol, net } from "electron";
import { join } from "path";
import { pathToFileURL } from "url";
import icon from "../../resources/new-macOS-Default-1024x1024@2x.png?asset";
import { ensureDatabaseReady } from "./db/client";

// 自动注册 IPC handlers（副作用导入）
import "./handler/app/SettingsHandler";
import "./handler/app/ModelHandler";
import "./handler/app/ProviderHandler";
import "./handler/chat/ChatHandler";
import "./handler/docs/VibecapeHandler";
import "./handler/docs/DocsAIHandler";
import "./handler/docs/ImageHandler";

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

// 注册自定义协议用于加载本地资源
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-asset",
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // 注册 local-asset 协议处理器
  protocol.handle("local-asset", (request) => {
    // local-asset://path/to/file -> file:///path/to/file
    const filePath = decodeURIComponent(request.url.replace("local-asset://", ""));
    return net.fetch(pathToFileURL(filePath).href);
  });

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
  // Prevent Cmd+W from closing window (let renderer handle it as expand-region)
  app.on("browser-window-created", (_, window) => {
    window.webContents.on("before-input-event", (event, input) => {
      if (input.key === "F12") {
        window.webContents.toggleDevTools();
        event.preventDefault();
      }
      // Prevent Cmd+W / Ctrl+W from closing window, trigger expand-region in renderer
      if ((input.control || input.meta) && input.key.toLowerCase() === "w") {
        event.preventDefault();
        window.webContents.send("shortcut:expand-region");
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

    // 数据库就绪后初始化服务
    const { SettingsService } = await import("./services/Settings");
    const { Model } = await import("./services/Model");
    const { Provider } = await import("./services/Provider");
    await Promise.all([
      SettingsService.init(),
      Model.init(),
      Provider.init(),
    ]);
  } catch (error) {
    console.error("Failed to initialize databases:", error);
  }

  // 初始化代理配置
  const { initProxyConfig } = await import("./utils/proxy");
  await initProxyConfig();

  // 初始化 MCP 连接
  const { MCPManager } = await import("./services/MCPManager");
  MCPManager.initialize().catch((error) => {
    console.error("[MCP] Failed to initialize MCP:", error);
  });

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
