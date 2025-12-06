/**
 * Table Bubble Menu
 * 表格浮动工具栏 - 选中表格或单元格时显示
 */

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Columns,
  Rows,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableBubbleMenuProps {
  editor: Editor | null;
}

export const TableBubbleMenu = ({ editor }: TableBubbleMenuProps) => {
  const { t } = useTranslation();

  if (!editor) return null;

  const isTableSelected = editor.isActive("table");

  if (!isTableSelected) return null;

  const MenuButton = ({
    onClick,
    icon: Icon,
    title,
    variant = "default",
  }: {
    onClick: () => void;
    icon: React.ElementType;
    title: string;
    variant?: "default" | "danger";
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center justify-center size-7 rounded-md transition-colors",
        variant === "danger"
          ? "text-red-500 hover:bg-red-500/10"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );

  const Divider = () => (
    <div className="w-px h-4 bg-border mx-0.5" />
  );

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
        offset: 8,
      }}
      shouldShow={({ editor }) => {
        return editor.isActive("table");
      }}
    >
      <div className="bg-background border border-border rounded-lg shadow-lg p-1 flex items-center gap-0.5">
      {/* 行操作 */}
      <MenuButton
        onClick={() => editor.chain().focus().addRowBefore().run()}
        icon={ArrowUp}
        title={t("editor:table.addRowBefore")}
      />
      <MenuButton
        onClick={() => editor.chain().focus().addRowAfter().run()}
        icon={ArrowDown}
        title={t("editor:table.addRowAfter")}
      />
      <MenuButton
        onClick={() => editor.chain().focus().deleteRow().run()}
        icon={Rows}
        title={t("editor:table.deleteRow")}
        variant="danger"
      />

      <Divider />

      {/* 列操作 */}
      <MenuButton
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        icon={ArrowLeft}
        title={t("editor:table.addColBefore")}
      />
      <MenuButton
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        icon={ArrowRight}
        title={t("editor:table.addColAfter")}
      />
      <MenuButton
        onClick={() => editor.chain().focus().deleteColumn().run()}
        icon={Columns}
        title={t("editor:table.deleteCol")}
        variant="danger"
      />

      <Divider />

      {/* 删除表格 */}
      <MenuButton
        onClick={() => editor.chain().focus().deleteTable().run()}
        icon={Trash2}
        title={t("editor:table.deleteTable")}
        variant="danger"
      />
      </div>
    </BubbleMenu>
  );
};
