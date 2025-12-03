/**
 * Iris - 写作助手 Hero
 */

import { Hero } from "../../Hero";
import en from "./en.txt";
import zh from "./zh.txt";

export const writer = new Hero({
  id: "writer",
  name: "Iris",
  description: "Professional writing consultant for polishing and creating articles",
  avatar: "https://avatar.iran.liara.run/public?username=writer",
  prompt: { en, zh },
  maxSteps: 10,
});
