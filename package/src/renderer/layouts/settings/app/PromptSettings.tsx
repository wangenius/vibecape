import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { dialogForm } from "@/components/ui/DialogForm";
import {
  SettingsContainer,
  SettingSection,
  SettingList,
  ListItem,
  ShortcutItem,
} from "@/layouts/settings/item/SettingComponents";
import { usePromptStore, type PromptItem } from "@/hooks/stores/usePromptStore";
import { TbPlus, TbTrash, TbEdit } from "react-icons/tb";

// Prompt Schema
const promptSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  body: z.string(),
});

/**
 * 单个 Prompt 项组件
 */
const PromptItemCard = ({
  prompt,
  onEdit,
  onDelete,
}: {
  prompt: PromptItem;
  onEdit: (prompt: PromptItem) => void;
  onDelete: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const getPromptText = usePromptStore((state) => state.getPromptText);
  const bodyText = getPromptText(prompt.id);

  return (
    <ListItem
      title={prompt.title}
      subtitle={bodyText || t("common.prompt.noContent", "无内容")}
      actions={
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            onClick={() => onEdit(prompt)}
            title={t("common.prompt.edit", "编辑")}
          >
            <TbEdit />
          </Button>
          <Button
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(prompt.id)}
            title={t("common.prompt.delete", "删除")}
          >
            <TbTrash />
          </Button>
        </div>
      }
    />
  );
};

/** 将纯文本转换为 JSONContent */
const textToJSONContent = (
  text: string
): {
  type: "doc";
  content: { type: "paragraph"; content: { type: "text"; text: string }[] }[];
} => ({
  type: "doc",
  content: text.split("\n").map((line) => ({
    type: "paragraph",
    content: line ? [{ type: "text", text: line }] : [],
  })),
});

/**
 * Prompt 管理设置面板
 */
export const PromptSettings = () => {
  const { t } = useTranslation();
  const prompts = usePromptStore((state) => state.prompts);
  const addPrompt = usePromptStore((state) => state.addPrompt);
  const updatePrompt = usePromptStore((state) => state.updatePrompt);
  const deletePrompt = usePromptStore((state) => state.deletePrompt);
  const getPromptText = usePromptStore((state) => state.getPromptText);

  // 打开添加对话框
  const openAddDialog = () => {
    dialogForm({
      title: t("common.prompt.add", "添加 Prompt"),
      schema: promptSchema,
      fields: {
        title: { label: "标题", placeholder: "输入 Prompt 标题..." },
        body: {
          label: "内容",
          type: "textarea",
          placeholder: "输入 Prompt 内容...",
        },
      },
      defaultValues: { title: "", body: "" },
      onSubmit: (data) => {
        addPrompt(data.title, textToJSONContent(data.body));
      },
    });
  };

  // 打开编辑对话框
  const openEditDialog = useCallback(
    (prompt: PromptItem) => {
      dialogForm({
        title: t("common.prompt.edit", "编辑 Prompt"),
        schema: promptSchema,
        fields: {
          title: { label: "标题", placeholder: "输入 Prompt 标题..." },
          body: {
            label: "内容",
            type: "textarea",
            placeholder: "输入 Prompt 内容...",
          },
        },
        defaultValues: {
          title: prompt.title,
          body: getPromptText(prompt.id),
        },
        onSubmit: (data) => {
          updatePrompt(prompt.id, {
            title: data.title,
            body: textToJSONContent(data.body),
          });
        },
      });
    },
    [t, getPromptText, updatePrompt]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (
        confirm(t("common.prompt.deleteConfirm", "确定要删除这个 Prompt 吗？"))
      ) {
        deletePrompt(id);
      }
    },
    [deletePrompt, t]
  );

  return (
    <SettingsContainer>
      <SettingSection
        title={t("common.prompt.management", "Prompt 管理")}
        description={t(
          "common.prompt.managementDesc",
          "创建和管理常用的 AI Prompt 模板，在编辑器中输入 # 可快速插入"
        )}
        action={
          <Button onClick={openAddDialog}>
            <TbPlus className="size-4" />
            {t("common.prompt.add", "添加 Prompt")}
          </Button>
        }
      >
        <SettingList
          empty={
            <div className="flex flex-col items-center gap-1">
              <p>{t("common.prompt.empty", "还没有创建任何 Prompt")}</p>
              <p className="text-xs">
                {t(
                  "common.prompt.emptyHint",
                  "点击上方按钮添加常用的 AI 指令模板"
                )}
              </p>
            </div>
          }
        >
          {prompts.map((prompt) => (
            <PromptItemCard
              key={prompt.id}
              prompt={prompt}
              onEdit={openEditDialog}
              onDelete={handleDelete}
            />
          ))}
        </SettingList>
      </SettingSection>

      {/* 使用说明 */}
      <SettingSection
        title={t("common.prompt.usage", "使用方法")}
        description={t("common.prompt.usageDesc", "如何在编辑器中使用 Prompt")}
      >
        <div className="flex flex-col gap-2">
          <ShortcutItem
            shortcut="#"
            label={t(
              "common.prompt.usageStep1",
              "在 AI 编辑输入框中输入 # 触发 Prompt 选择菜单"
            )}
          />
          <ShortcutItem
            shortcut="↑↓"
            label={t(
              "common.prompt.usageStep2",
              "使用方向键选择 Prompt，按 Enter 插入"
            )}
          />
          <ShortcutItem
            shortcut="Esc"
            label={t("common.prompt.usageStep3", "按 Esc 关闭菜单")}
          />
        </div>
      </SettingSection>
    </SettingsContainer>
  );
};
