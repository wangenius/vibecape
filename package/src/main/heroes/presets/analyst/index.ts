/**
 * Sage - 分析师 Hero
 */

import { Hero } from "../../Hero";
import en from "./en.txt";
import zh from "./zh.txt";

export const analyst = new Hero({
  id: "analyst",
  name: "Sage",
  description: "Data analysis and logical reasoning expert",
  avatar: "https://avatar.iran.liara.run/public?username=analyst",
  prompt: { en, zh },
  maxSteps: 15,
});
