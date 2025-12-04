/**
 * Iris - 写作助手 Hero
 */

import { Hero } from "../../Hero";
import info from "./info.json";
import en from "./en.txt";
import zh from "./zh.txt";

export const iris = new Hero({
  ...info,
  prompt: { en, zh },
  maxSteps: 10,
});
