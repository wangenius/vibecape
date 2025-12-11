import { useTranslation } from "react-i18next";
import {
  SettingsContainer,
  SettingSection,
  FeatureCard,
  ShortcutItem,
} from "@/layouts/settings/item/SettingComponents";
import { Sparkles, MessageSquare, Search, FileEdit, Wand2 } from "lucide-react";

/**
 * AI Settings - 显示编辑器可用的 AI 功能
 */
export const AISettings = () => {
  const { t } = useTranslation();

  const AI_FEATURES = [
    {
      icon: Sparkles,
      titleKey: "inlineEdit",
      title: "内联编辑",
      description: "选中文本后按 Cmd+K 触发 AI 编辑，流式替换选中内容",
      shortcut: "⌘K",
      status: "available" as const,
    },
    {
      icon: MessageSquare,
      titleKey: "chatRef",
      title: "Chat 引用编辑",
      description: "选中文本按 Cmd+L 引用到 Chat，AI 通过工具直接修改文档",
      shortcut: "⌘L",
      status: "available" as const,
    },
    {
      icon: Search,
      titleKey: "searchReplace",
      title: "搜索替换",
      description: "AI 可通过 searchAndReplaceInDoc 工具按文本搜索并替换",
      shortcut: null,
      status: "available" as const,
    },
    {
      icon: FileEdit,
      titleKey: "appendContent",
      title: "追加内容",
      description: "AI 可在文档末尾追加新段落，适合续写场景",
      shortcut: null,
      status: "available" as const,
    },
    {
      icon: Wand2,
      titleKey: "fullRewrite",
      title: "全文重写",
      description: "AI 可通过 setDocumentContent 替换整个文档内容",
      shortcut: null,
      status: "available" as const,
    },
  ];

  return (
    <SettingsContainer>
      <SettingSection
        title={t("common.settings.aiFeatures", "AI 编辑功能")}
        description={t(
          "common.settings.aiFeaturesDesc",
          "编辑器支持的 AI 辅助功能列表"
        )}
      >
        <div className="flex flex-col gap-2">
          {AI_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <FeatureCard
                key={feature.titleKey}
                icon={<Icon className="size-5" />}
                title={t(
                  `common.settings.ai.${feature.titleKey}`,
                  feature.title
                )}
                description={t(
                  `common.settings.ai.${feature.titleKey}Desc`,
                  feature.description
                )}
                shortcut={feature.shortcut ?? undefined}
                status={feature.status}
              />
            );
          })}
        </div>
      </SettingSection>

      <SettingSection
        title={t("common.settings.aiShortcuts", "快捷键")}
        description={t(
          "common.settings.aiShortcutsDesc",
          "AI 编辑相关的键盘快捷键"
        )}
      >
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "⌘K", label: "触发 AI 编辑" },
            { key: "⌘L", label: "引用到 Chat" },
            { key: "Tab", label: "应用 AI 建议" },
            { key: "Esc", label: "取消 AI 编辑" },
            { key: "⌘Z", label: "撤销更改" },
            { key: "Enter", label: "提交指令" },
          ].map((shortcut) => (
            <ShortcutItem
              key={shortcut.key}
              shortcut={shortcut.key}
              label={t(
                `common.settings.ai.shortcut.${shortcut.key}`,
                shortcut.label
              )}
            />
          ))}
        </div>
      </SettingSection>

      <SettingSection
        title={t("common.settings.aiTools", "后端 AI 工具")}
        description={t(
          "common.settings.aiToolsDesc",
          "AI Agent 可调用的文档编辑工具"
        )}
      >
        <div className="overflow-hidden rounded-lg border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                  {t("common.settings.ai.toolName", "工具名称")}
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                  {t("common.settings.ai.toolDesc", "功能描述")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                {
                  name: "readDocumentContent",
                  desc: "读取文档内容（纯文本 + Markdown）",
                },
                {
                  name: "searchAndReplaceInDoc",
                  desc: "搜索文本并替换，核心编辑操作",
                },
                { name: "appendToDocument", desc: "在文档末尾追加段落" },
                { name: "prependToDocument", desc: "在文档开头插入段落" },
                {
                  name: "insertAfterTextInDoc",
                  desc: "在指定文本后插入内容（不依赖选区）",
                },
                {
                  name: "insertBeforeTextInDoc",
                  desc: "在指定文本前插入内容（不依赖选区）",
                },
                { name: "setDocumentContent", desc: "替换整个文档内容" },
                {
                  name: "setDocumentFromMarkdown",
                  desc: "使用 Markdown 设置文档",
                },
              ].map((tool) => (
                <tr key={tool.name} className="hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs text-primary">
                    {tool.name}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {tool.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingSection>
    </SettingsContainer>
  );
};
