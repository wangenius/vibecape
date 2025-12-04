/**
 * Nova - 通用助手 Hero
 */

import { Hero } from "../../Hero";
import { commonTools } from "../../tools";
import info from "./info.json";
import en from "./en.txt";
import zh from "./zh.txt";

export const nova = new Hero({
  ...info,
  prompt: { en, zh },
  tools: commonTools,
  maxSteps: 20,
});
