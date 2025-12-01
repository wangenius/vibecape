import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// BookFile 功能已移除
import { dialog } from "@/components/custom/DialogModal";
import { createCosmos } from "@/hook/cosmos/useCosmos";
import { toast } from "sonner";
import { RiMagicLine } from "react-icons/ri";
import { Info, BookOpen, Layers } from "lucide-react";
import { openCosmosDetailTab } from "@/hook/app/useViewManager";

interface ParseBookPageProps {
  fileId: string;
}

/**
 * 拆书页面
 * 显示单个书籍的详细信息和拆书操作
 */
export const ParseBookPage: React.FC<ParseBookPageProps> = ({ fileId }) => {
  // BookFile 功能已移除
  const files: any[] = [];
  const file = files.find((f) => f.id === fileId);

  const handleParseBook = useCallback(async () => {
    if (!file) return;

    try {
      const wordCount = Math.floor(file.bytes / 3) / 10000;
      const fileName = file.filename;

      const content: React.ReactNode = (
        <div className="space-y-2">
          <p>
            确定开始拆书吗？{fileName}，约有{wordCount.toFixed(1)}
            万字，当前拆书会新建一个世界观。
          </p>
        </div>
      );

      dialog.confirm({
        title: "解析文件",
        content: content,
        onOk: async () => {
          await createCosmos({
            name: fileName.split(".")[0],
          });
          openCosmosDetailTab();
          // const { channel } = await window.api.ai.parseBookStart({
          //   fileId: file.id,
          // });
          // const ipc = window.electron?.ipcRenderer;
          // if (ipc) {
          //   const handler = (_e: unknown, payload: any) => {
          //     if (payload?.type === "end" || payload?.type === "error") {
          //       ipc.removeAllListeners(channel);
          //     }
          //   };
          //   ipc.on(channel, handler);
          // }
        },
      });
    } catch (error) {
      console.error("解析文件失败:", error);
      toast.error("解析文件失败");
    }
  }, [file]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>找不到该书籍</p>
        </div>
      </div>
    );
  }

  const wordCount = Math.floor(file.bytes / 3) / 10000;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 书籍信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {file.filename}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">文件大小：</span>
                <span className="font-medium">
                  {(file.bytes / 1024).toFixed(2)} KB
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">预估字数：</span>
                <span className="font-medium">{wordCount.toFixed(1)} 万字</span>
              </div>
              <div>
                <span className="text-muted-foreground">上传时间：</span>
                <span className="font-medium">
                  {new Date(file.created_at * 1000).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">状态：</span>
                <span className="font-medium">{file.status}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleParseBook}
                variant="primary"
                className="w-full gap-2"
              >
                <RiMagicLine className="w-4 h-4" />
                开始拆书
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 拆书方法指南 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-md bg-primary/10">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium">拆书方法说明</h3>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 flex items-start">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-medium">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    全本拆书
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    点击"开始拆书"按钮，AI将分析整本书内容，创建一个新的世界观。
                    同时你也可以在创建的世界观中，通过解析、分解剧情等方式来继续拆书。
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 flex items-start">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-medium">
                    2
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      分章节拆书
                    </h4>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      推荐
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    导入小说后，在小说的章节中选择具体章节进行拆解，效果更精准，墨水消耗更少。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-md bg-muted flex gap-3 items-start">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">
                我们推荐使用分章节拆书，可以根据需要有选择地拆解章节，提高效率和准确度。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 注意事项 */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">注意事项</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>拆书过程可能需要较长时间，请耐心等待</li>
              <li>建议在网络稳定的环境下进行拆书操作</li>
              <li>拆书会消耗墨水，请确保账户有足够的余额</li>
              <li>完成后会自动创建一个新的世界观</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
