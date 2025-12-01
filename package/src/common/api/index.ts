import { ElectronAPI } from "@electron-toolkit/preload";
import { ModelAPI, ProviderAPI, SettingsAPI } from "./app";
import { ChatAPI } from "./chat";
import { VibecapeAPI } from "./vibecape";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      app: {
        provider: ProviderAPI;
        model: ModelAPI;
        settings: SettingsAPI;
      };
      chat: ChatAPI;
      vibecape: VibecapeAPI;
    };
  }
}
