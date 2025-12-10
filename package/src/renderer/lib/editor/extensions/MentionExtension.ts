/**
 * Mention Extension 打包
 * 包含 MentionNode + MentionCommand + Suggestion 配置
 */

import type { Extension } from "@tiptap/core";
import { MentionNode } from "./MentionNode";
import { MentionCommand } from "./MentionCommand";
import { createMentionPlugin } from "../menus/MentionMenu";
import { lang } from "@/lib/locales/i18n";

export const MentionExtension: Extension[] = [
  MentionNode as unknown as Extension,
  MentionCommand.configure({
    suggestion: createMentionPlugin(lang),
  }),
];
