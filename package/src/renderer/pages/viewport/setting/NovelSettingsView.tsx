import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import {
  useWritingStyleList,
  useWritingStyle,
  selectWritingStyle,
  addWritingStyle,
  updateWritingStyle,
  deleteWritingStyle,
} from "@/hook/app/useWritingStyle";
import { FC, useState } from "react";
import { TbCircleCheckFilled } from "react-icons/tb";
import { toast } from "sonner";
import { WritingStyleInsert } from "@common/schema";

type StyleForm = {
  name: string;
  description: string;
  example: string | null;
};

const createEmptyForm = (): StyleForm => ({
  name: "",
  description: "",
  example: null,
});

const toForm = (style: WritingStyleInsert): StyleForm => ({
  name: style.name ?? "",
  description: style.description ?? "",
  example: style.example ?? null,
});

export const NovelSettingsView: FC = () => {
  const styles = useWritingStyleList();
  const { selectedId } = useWritingStyle();
  const [form, setForm] = useState<StyleForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startCreate = () => {
    setForm(createEmptyForm());
    setEditingId("__new");
    setSheetOpen(true);
  };

  const startEdit = (style: WritingStyleInsert) => {
    setForm(toForm(style));
    setEditingId(style.id ?? null);
    setSheetOpen(true);
  };

  const startDuplicate = (style: WritingStyleInsert) => {
    const baseForm = toForm(style);
    const duplicateForm: StyleForm = {
      ...baseForm,
      name: `${baseForm.name} (副本)`,
    };
    setForm(duplicateForm);
    setEditingId("__new");
    setSheetOpen(true);
  };

  const cancelEdit = () => {
    setForm(null);
    setEditingId(null);
    setSheetOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除风格"${name}"吗？`)) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteWritingStyle(id);
      toast.success("风格删除成功");
      if (editingId === id) {
        cancelEdit();
      }
    } catch (error: any) {
      toast.error(error?.message ?? "删除风格失败");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    if (!form) return;

    const trimmed: StyleForm = {
      name: form.name.trim(),
      description: form.description.trim(),
      example: form.example?.trim() || null,
    };

    if (!trimmed.name || !trimmed.description) {
      toast.error("请填写风格名称和描述");
      return;
    }

    try {
      setSaving(true);
      if (editingId === "__new") {
        const newStyle: Omit<WritingStyleInsert, "id" | "created_at" | "updated_at"> = {
          name: trimmed.name,
          description: trimmed.description,
          example: trimmed.example,
        };
        const result = await addWritingStyle(newStyle);
        await selectWritingStyle(result.id);
        toast.success("添加风格成功");
      } else if (editingId) {
        const updatedStyle: WritingStyleInsert = {
          id: editingId,
          name: trimmed.name,
          description: trimmed.description,
          example: trimmed.example,
        };
        await updateWritingStyle(updatedStyle);
        toast.success("更新风格成功");
      }
      cancelEdit();
    } catch (error: any) {
      toast.error(error?.message ?? "保存风格失败");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = <K extends keyof StyleForm>(
    key: K,
    value: StyleForm[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const renderFormContent = () => {
    if (!form) return null;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="style-name">风格名称</Label>
          <Input
            id="style-name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={saving}
            placeholder="输入风格名称"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="style-description">风格描述</Label>
          <Textarea
            id="style-description"
            value={form.description}
            onChange={(value) => handleChange("description", value)}
            disabled={saving}
            placeholder="描述这种写作风格的特点，例如：多分段、多用对话描写..."
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="style-example">示例文本（可选）</Label>
          <Textarea
            id="style-example"
            value={form.example || ""}
            onChange={(value) => handleChange("example", value || null)}
            disabled={saving}
            placeholder="输入一段示例文本，展示这种写作风格的特点"
            className="min-h-[100px]"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-base font-semibold">写作风格</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  创建和管理你的写作风格，应用于扩写、润色、重写、分章等所有场景
                </p>
              </div>
              <Button size="sm" onClick={startCreate}>
                新建风格
              </Button>
            </div>

            <div className="rounded-lg">
              {!styles.length ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  还没有创建任何写作风格，点击右上角"新建风格"开始吧
                </div>
              ) : (
                <div className="space-y-1">
                  {styles.map((style) => (
                    <div
                      key={style.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted transition-colors group cursor-pointer"
                      onClick={() => selectWritingStyle(style.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {style.name}
                            </span>
                            {style.id === selectedId && (
                              <Badge
                                variant="default"
                                className="shrink-0 h-5 px-1.5 text-xs"
                              >
                                <TbCircleCheckFilled className="w-3 h-3 mr-0.5" />
                                当前
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {style.description}
                          </p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 hover:bg-muted-foreground/10 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={deletingId === style.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(style);
                            }}
                          >
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              startDuplicate(style);
                            }}
                          >
                            复制
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(style.id, style.name);
                            }}
                            disabled={deletingId === style.id}
                          >
                            {deletingId === style.id ? "删除中..." : "删除"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelEdit();
          }
        }}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {editingId === "__new"
                ? "新建写作风格"
                : form
                  ? "编辑写作风格"
                  : "写作风格设置"}
            </SheetTitle>
            <SheetDescription>填写风格的名称、描述和示例。</SheetDescription>
          </SheetHeader>
          <div className="flex-1">{renderFormContent()}</div>
          <SheetFooter className="mt-6">
            <Button
              className="flex-1 h-10"
              onClick={cancelEdit}
              disabled={saving}
              variant="outline"
            >
              取消
            </Button>
            <Button
              className="flex-1 h-10"
              variant="default"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
