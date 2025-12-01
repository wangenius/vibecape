import { dialog } from "@/components/custom/DialogModal";
import { FormContainer } from "@/components/custom/FormWrapper";
import { Button } from "@/components/ui/button";
import { Tools } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { PiBookOpenText, PiFile, PiX } from "react-icons/pi";
import { toast } from "sonner";

export const ImportNovelPanel = ({ close }: { close?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<string>("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // 支持json和txt格式文件
    if (!file.name.endsWith(".json") && !file.name.endsWith(".txt")) {
      toast.error("请选择正确的小说文件（.json 或 .txt）");
      return;
    }

    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
      "text/plain": [".txt"],
    },
    multiple: false,
  });

  const handleImport = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setImportProgress("正在导入，请稍候...");
    try {
      // TODO: 真实导入逻辑
      toast.success("导入流程占位，尚未实现具体解析");
      close?.();
    } finally {
      setLoading(false);
      setImportProgress("");
    }
  };

  return (
    <div>
      <FormContainer onSubmit={handleImport} className="space-y-4">
        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={cn(
              "w-full min-h-[200px] rounded-xl",
              "border-2 border-dashed transition-all duration-200",
              "flex flex-col items-center justify-center gap-4",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="p-4 rounded-full bg-muted">
              <PiBookOpenText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {isDragActive ? "松开鼠标导入文件" : "拖拽或点击上传小说文件"}
              </h3>
              <p className="text-sm text-muted-foreground">
                支持 <code>.json</code> 和 <code>.txt</code> 格式的小说文件.
                <br />
                支持导入本软件导出的TXT或普通网络小说TXT
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-6 bg-background p-6 rounded-xl border border-border/40">
              <div className="p-3 bg-primary/5 rounded-lg">
                <PiFile className="w-6 h-6 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-foreground truncate">
                    {selectedFile.name}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <PiX className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <PiFile className="w-4 h-4" />
                    <span>{Tools.formatFileSize(selectedFile.size)}</span>
                  </div>
                </div>
              </div>
            </div>

            {importProgress && (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <p className="text-sm text-muted-foreground">
                    {importProgress}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button
            disabled={loading || !selectedFile}
            className="w-full h-10"
            type="submit"
            variant="primary"
          >
            {loading ? "导入中..." : "确认导入"}
          </Button>
        </div>
      </FormContainer>
    </div>
  );
};

ImportNovelPanel.open = () => {
  dialog({
    title: "导入小说",
    description: "导入小说文件",
    className: "max-w-4xl w-[500px]",
    content: (close) => <ImportNovelPanel close={close} />,
  });
};
