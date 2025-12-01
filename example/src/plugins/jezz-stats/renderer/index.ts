import { JezzPlugin } from "@common/types/plugin";
import { onRendererLoad } from "./renderer";

const plugin: JezzPlugin = {
  id: "com.wangenius.stats",
  onRendererLoad,
};

export default plugin;
