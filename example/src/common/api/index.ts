import { ElectronAPI } from "@electron-toolkit/preload";
import {
  CosmosMetaAPI,
  StoryAPI,
  ActantAPI,
  ActantStateAPI,
  LoreAPI,
  LoreTypeAPI,
  ActantTypeAPI,
  RelationAPI,
} from "./cosmos";
import { ModelAPI, SettingsAPI, WritingStyleAPI } from "./app";
import { ChatAPI } from "./chat";
import { ChapterAPI, NovelMetaAPI } from "./novel";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      cosmos: {
        meta: CosmosMetaAPI;
        story: StoryAPI;
        actant: ActantAPI;
        actantState: ActantStateAPI;
        lore: LoreAPI;
        loreType: LoreTypeAPI;
        actantType: ActantTypeAPI;
        relation: RelationAPI;
      };
      novel: {
        meta: NovelMetaAPI;
        chapter: ChapterAPI;
      };
      app: {
        model: ModelAPI;
        settings: SettingsAPI;
        writingStyle: WritingStyleAPI;
      };
      chat: ChatAPI;
    };
  }
}
