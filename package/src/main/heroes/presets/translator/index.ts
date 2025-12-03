/**
 * Luca - 翻译专家 Hero
 */

import { Hero } from "../../Hero";
import en from "./en.txt";
import zh from "./zh.txt";

export const translator = new Hero({
  id: "translator",
  name: "Luca",
  description: "Multilingual translation expert, preserving original style and context",
  avatar: "https://avatar.iran.liara.run/public?username=translator",
  prompt: { en, zh },
  maxSteps: 5,
});
