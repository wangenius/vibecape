/**
 * Muse - 创意大师 Hero
 */

import { Hero } from "../../Hero";
import info from "./info.json";
import en from "./en.txt";
import zh from "./zh.txt";

export const muse = new Hero({
  ...info,
  prompt: { en, zh },
  maxSteps: 10,
});
