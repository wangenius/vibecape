import { ElectronAPI } from "@electron-toolkit/preload";
import { ModelAPI, SettingsAPI } from "./app";
import { DocsAPI } from "./docs";
import { ChatAPI } from "./chat";
import { VibecapeAPI } from "./vibecape";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      docs: DocsAPI;
      app: {
        model: ModelAPI;
        settings: SettingsAPI;
      };
      chat: ChatAPI;
      vibecape: VibecapeAPI;
    };
  }
}
