/**
 * Nova - 通用助手 Hero
 */

import { Hero } from "../../Hero";
import { commonTools } from "../../tools";
import en from "./en.txt";
import zh from "./zh.txt";

export const assistant = new Hero({
  id: "assistant",
  name: "Nova",
  description: "Intelligent assistant that helps you complete various tasks",
  avatar: "https://avatar.iran.liara.run/public?username=assistant",
  isDefault: true,
  prompt: { en, zh },
  tools: commonTools,
  maxSteps: 20,
});
