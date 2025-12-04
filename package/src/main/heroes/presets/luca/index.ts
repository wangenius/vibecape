/**
 * Luca - 翻译专家 Hero
 */

import { Hero } from "../../Hero";
import info from "./info.json";
import en from "./en.txt";
import zh from "./zh.txt";

export const luca = new Hero({
  ...info,
  prompt: { en, zh },
  maxSteps: 5,
});
