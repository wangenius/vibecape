import { Empty } from "@/components/custom/Empty";
import { Button } from "@/components/ui/button";
// BookFile 功能已移除
import React, { useCallback } from "react";
import { TbBook, TbFilePlus, TbTrash } from "react-icons/tb";
import { toast } from "sonner";
import { dialog } from "@/components/custom/DialogModal";
import { openParseBookTab } from "@/hook/app/useViewManager";

/**
 * 拆书侧边栏组件
 * 显示上传的书籍列表，支持上传、删除和拆书操作
 */
export const FileListSection: React.FC = () => {
  // BookFile 功能已移除
  const files: any[] = [];

  // 上传文件（功能已移除）
  const handleUploadFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        // 检查文件数量
        if (files.length >= 5) {
          toast.error("非pro版本最多只能上传5个文件");
          return;
        }

        // 检查文件编码
        const isUtf8 = async (file: File): Promise<boolean> => {
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);

          let i = 0;
          while (i < bytes.length) {
            if (bytes[i] <= 0x7f) {
              i++;
              continue;
            }
            if (bytes[i] < 0xc0) return false;
            if (bytes[i] >= 0xc0 && bytes[i] <= 0xdf) {
              if (i + 1 >= bytes.length) return false;
              if ((bytes[i + 1] & 0xc0) !== 0x80) return false;
              i += 2;
              continue;
            }
            if (bytes[i] >= 0xe0 && bytes[i] <= 0xef) {
              if (i + 2 >= bytes.length) return false;
              if ((bytes[i + 1] & 0xc0) !== 0x80) return false;
              if ((bytes[i + 2] & 0xc0) !== 0x80) return false;
              i += 3;
              continue;
            }
            if (bytes[i] >= 0xf0 && bytes[i] <= 0xf7) {
              if (i + 3 >= bytes.length) return false;
              if ((bytes[i + 1] & 0xc0) !== 0x80) return false;
              if ((bytes[i + 2] & 0xc0) !== 0x80) return false;
              if ((bytes[i + 3] & 0xc0) !== 0x80) return false;
              i += 4;
              continue;
            }
            return false;
          }
          return true;
        };

        if (!(await isUtf8(file))) {
          toast.error("请上传 UTF-8 编码的文本文件");
          return;
        }

        // 读取文件内容
        const tryReadFile = async (
          file: File,
          encodings: string[]
        ): Promise<string> => {
          for (const encoding of encodings) {
            try {
              const content = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsText(file, encoding);
              });

              if (!/[\uFFFD]/.test(content)) {
                return content;
              }
            } catch (e) {
              continue;
            }
          }
          throw new Error("无法正确读取文件编码");
        };

        const content = await tryReadFile(file, ["utf-8", "gbk", "big5"]);
        const wordCount = content.length;

        if (wordCount > 300000) {
          toast.error(
            "书籍内容超过30万字，暂不支持解析，建议您将书籍拆分成多个文件"
          );
          return;
        }

        // BookFile 功能已移除
        toast.error("BookFile 功能已移除");
      } catch (error) {
        console.error("上传书籍失败:", error);
        toast.error("上传书籍失败");
      }
    };
    input.click();
  }, [files.length]);

  // 删除文件（功能已移除）
  const handleDeleteFile = useCallback(async (file: any) => {
    dialog.confirm({
      title: "删除文件",
      content: `确定要删除【${file.filename}】吗？`,
      onOk: async () => {
        try {
          // BookFile 功能已移除
          toast.error("BookFile 功能已移除");
        } catch (error) {
          console.error("删除文件失败:", error);
          toast.error("删除文件失败");
        }
      },
    });
  }, []);

  // 打开拆书页面（功能已移除）
  const handleOpenParseBookPage = useCallback((file: any) => {
    openParseBookTab(file.id, file.filename);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* 顶部操作栏 */}
      <div className="flex-none flex items-center justify-end px-2 py-1.5">
        <Button
          size="icon"
          className="p-1 h-7 w-7"
          variant="ghost"
          onClick={handleUploadFile}
        >
          <TbFilePlus />
        </Button>
      </div>

      {/* 书籍列表 */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {files.length === 0 ? (
          <Empty content="暂无书籍" className="pt-20" />
        ) : (
          <div className="flex flex-col gap-1">
            {files.map((file) => (
              <div
                key={file.id}
                className="group flex items-center justify-between p-2 rounded-md border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                onClick={() => handleOpenParseBookPage(file)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <TbBook className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {file.filename}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="删除"
                  >
                    <TbTrash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
