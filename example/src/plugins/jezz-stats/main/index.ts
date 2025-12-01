import { JezzPlugin } from "@common/types/plugin";
import { onMainLoad } from "./main";

const plugin: JezzPlugin = {
  id: "com.wangenius.stats",
  onMainLoad
};

export default plugin;
