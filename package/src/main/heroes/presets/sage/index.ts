/**
 * Sage - 分析师 Hero
 */

import { Hero } from "../../Hero";
import info from "./info.json";
import en from "./en.txt";
import zh from "./zh.txt";

export const sage = new Hero({
  ...info,
  prompt: { en, zh },
  maxSteps: 15,
});
