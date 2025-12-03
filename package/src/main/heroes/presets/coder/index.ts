/**
 * Max - 编程助手 Hero
 */

import { Hero } from "../../Hero";
import en from "./en.txt";
import zh from "./zh.txt";

export const coder = new Hero({
  id: "coder",
  name: "Max",
  description: "Senior programmer helping with code writing and optimization",
  avatar: "https://avatar.iran.liara.run/public?username=coder",
  prompt: { en, zh },
  maxSteps: 20,
});
