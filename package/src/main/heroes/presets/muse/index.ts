/**
 * Muse - 创意大师 Hero
 */

import { Hero } from "../../Hero";
import en from "./en.txt";
import zh from "./zh.txt";

export const muse = new Hero({
  id: "muse",
  name: "Muse",
  description: "Inspire creativity and provide innovative solutions",
  avatar: "https://avatar.iran.liara.run/public?username=creative",
  prompt: { en, zh },
  maxSteps: 10,
});
