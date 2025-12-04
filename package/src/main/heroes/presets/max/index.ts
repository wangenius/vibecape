/**
 * Max - 编程助手 Hero
 */

import { Hero } from "../../Hero";
import info from "./info.json";
import en from "./en.txt";
import zh from "./zh.txt";

export const max = new Hero({
  ...info,
  prompt: { en, zh },
  maxSteps: 20,
});
