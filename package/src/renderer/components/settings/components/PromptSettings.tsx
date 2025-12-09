import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingSection, SettingCard } from "./SettingComponents";
import { usePromptStore, type PromptItem } from "@/hooks/stores/usePromptStore";
import { TbPlus, TbTrash, TbEdit, TbCheck, TbX } from "react-icons/tb";
import { cn } from "@/lib/utils";
import type { JSONContent } from "@tiptap/core";

/**
 * Prompt 编辑器组件
 */
const PromptEditor = ({
  initialContent,
  placeholder,
  onChange,
  className,
}: {
  initialContent?: JSONContent;
  placeholder?: string;
  onChange?: (content: JSONContent) => void;
  className?: string;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "输入 Prompt 内容...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prompt-editor-content",
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getJSON());
    },
  });

  return (
    <div
      className={cn(
        "min-h-[100px] max-h-[200px] overflow-y-auto rounded-md border border-input bg-background px-3 py-2 text-sm",
        "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-20",
        "[&_.ProseMirror_p]:m-0 [&_.ProseMirror_p]:leading-relaxed",
        "[&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:text-muted-foreground/50 [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:h-0 [&_.is-editor-empty]:before:pointer-events-none",
        className
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
};

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
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors group">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{prompt.title}</h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {bodyText || t("common.prompt.noContent", "无内容")}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => onEdit(prompt)}
          title={t("common.prompt.edit", "编辑")}
        >
          <TbEdit className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(prompt.id)}
          title={t("common.prompt.delete", "删除")}
        >
          <TbTrash className="size-4" />
        </Button>
      </div>
    </div>
  );
};

/**
 * Prompt 编辑表单
 */
const PromptForm = ({
  prompt,
  onSave,
  onCancel,
}: {
  prompt?: PromptItem;
  onSave: (title: string, body: JSONContent) => void;
  onCancel: () => void;
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(prompt?.title || "");
  const [body, setBody] = useState<JSONContent>(
    prompt?.body || { type: "doc", content: [] }
  );

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave(title.trim(), body);
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("common.prompt.title", "标题")}
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("common.prompt.titlePlaceholder", "输入 Prompt 标题...")}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("common.prompt.body", "内容")}
        </label>
        <PromptEditor
          initialContent={body}
          placeholder={t("common.prompt.bodyPlaceholder", "输入 Prompt 内容...")}
          onChange={setBody}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <TbX className="size-4 mr-1" />
          {t("common.cancel", "取消")}
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          <TbCheck className="size-4 mr-1" />
          {t("common.save", "保存")}
        </Button>
      </div>
    </div>
  );
};

/**
 * Prompt 管理设置面板
 */
export const PromptSettings = () => {
  const { t } = useTranslation();
  const prompts = usePromptStore((state) => state.prompts);
  const addPrompt = usePromptStore((state) => state.addPrompt);
  const updatePrompt = usePromptStore((state) => state.updatePrompt);
  const deletePrompt = usePromptStore((state) => state.deletePrompt);

  const [isAdding, setIsAdding] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);

  const handleAdd = useCallback(
    (title: string, body: JSONContent) => {
      addPrompt(title, body);
      setIsAdding(false);
    },
    [addPrompt]
  );

  const handleEdit = useCallback(
    (title: string, body: JSONContent) => {
      if (editingPrompt) {
        updatePrompt(editingPrompt.id, { title, body });
        setEditingPrompt(null);
      }
    },
    [editingPrompt, updatePrompt]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm(t("common.prompt.deleteConfirm", "确定要删除这个 Prompt 吗？"))) {
        deletePrompt(id);
      }
    },
    [deletePrompt, t]
  );

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("common.prompt.management", "Prompt 管理")}
        description={t(
          "common.prompt.managementDesc",
          "创建和管理常用的 AI Prompt 模板，在编辑器中输入 # 可快速插入"
        )}
        action={
          !isAdding &&
          !editingPrompt && (
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <TbPlus className="size-4 mr-1" />
              {t("common.prompt.add", "添加 Prompt")}
            </Button>
          )
        }
      >
        <div className="space-y-3">
          {/* 添加表单 */}
          {isAdding && (
            <PromptForm onSave={handleAdd} onCancel={() => setIsAdding(false)} />
          )}

          {/* 编辑表单 */}
          {editingPrompt && (
            <PromptForm
              prompt={editingPrompt}
              onSave={handleEdit}
              onCancel={() => setEditingPrompt(null)}
            />
          )}

          {/* Prompt 列表 */}
          {prompts.length === 0 && !isAdding ? (
            <SettingCard>
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  {t("common.prompt.empty", "还没有创建任何 Prompt")}
                </p>
                <p className="text-xs mt-1">
                  {t(
                    "common.prompt.emptyHint",
                    "点击上方按钮添加常用的 AI 指令模板"
                  )}
                </p>
              </div>
            </SettingCard>
          ) : (
            <div className="space-y-2">
              {prompts.map((prompt) =>
                editingPrompt?.id === prompt.id ? null : (
                  <PromptItemCard
                    key={prompt.id}
                    prompt={prompt}
                    onEdit={setEditingPrompt}
                    onDelete={handleDelete}
                  />
                )
              )}
            </div>
          )}
        </div>
      </SettingSection>

      {/* 使用说明 */}
      <SettingSection
        title={t("common.prompt.usage", "使用方法")}
        description={t("common.prompt.usageDesc", "如何在编辑器中使用 Prompt")}
      >
        <SettingCard>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <kbd className="px-2 py-1 rounded bg-muted border border-border font-mono text-xs shrink-0">
                #
              </kbd>
              <p className="text-muted-foreground">
                {t(
                  "common.prompt.usageStep1",
                  "在 AI 编辑输入框中输入 # 触发 Prompt 选择菜单"
                )}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <kbd className="px-2 py-1 rounded bg-muted border border-border font-mono text-xs shrink-0">
                ↑↓
              </kbd>
              <p className="text-muted-foreground">
                {t(
                  "common.prompt.usageStep2",
                  "使用方向键选择 Prompt，按 Enter 插入"
                )}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <kbd className="px-2 py-1 rounded bg-muted border border-border font-mono text-xs shrink-0">
                Esc
              </kbd>
              <p className="text-muted-foreground">
                {t("common.prompt.usageStep3", "按 Esc 关闭菜单")}
              </p>
            </div>
          </div>
        </SettingCard>
      </SettingSection>
    </div>
  );
};
