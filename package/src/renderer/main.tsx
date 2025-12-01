import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";

import "@/@styles/main.css";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-center" closeButton />
  </React.StrictMode>
);
