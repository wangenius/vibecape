import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./pages/App";
import { initRendererPlugins } from "./PluginManager";

import "@/@styles/main.css";
import { Toaster } from "sonner";

// App 启动前初始化插件
initRendererPlugins();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-center" closeButton />
  </React.StrictMode>
);
