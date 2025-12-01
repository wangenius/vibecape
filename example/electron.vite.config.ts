import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: [],
      }),
    ],
    resolve: {
      alias: {
        "@": resolve("src/renderer"),
        "@main": resolve("src/main"),
        "@common": resolve("src/common"),
      },
    },
    build: {
      rollupOptions: {
        external: ["electron"],
      },
      // Keep Electron main process hot-reloading when backend-style files live outside src/main
      // (e.g. drizzle migrations / data scripts). Add paths here if you move backend code elsewhere.
      watch: {
        include: [
          "src/main/**",
          "drizzle/**",
          "data/**",
          "scripts/**",
          "resources/**",
        ],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@common": resolve("src/common"),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@": resolve("src/renderer"),
        "@common": resolve("src/common"),
        "@assets": resolve("src/renderer/assets"),
        "@styles": resolve("src/renderer/@styles"),
      },
    },
    publicDir: resolve("src/renderer/assets"),
    define: {
      PACKAGE_VERSION: JSON.stringify(packageJson.version),
    },
    plugins: [tailwindcss(), react()],
  },
});
