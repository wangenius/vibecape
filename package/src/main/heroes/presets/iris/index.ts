/**
 * Iris - 写作助手 Hero
 */

import { Hero } from "../../Hero";
import info from "./info.json";
import en from "./en.txt?raw";
import zh from "./zh.txt?raw";

export const iris = new Hero({
  ...info,
  prompt: { en, zh },
  maxSteps: 10,
});
