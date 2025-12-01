import { dialog } from "@/components/custom/DialogModal";
import { FormContainer } from "@/components/custom/FormWrapper";
import { Button } from "@/components/ui/button";
import { Tools } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { PiFile, PiUploadSimple, PiX } from "react-icons/pi";
import { toast } from "sonner";

export const ImportWorldViewPanel = ({ close }: { close?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("请选择正确的项目文件（.json）");
      return;
    }

    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/octet-stream": [".json"],
    },
    multiple: false,
  });

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("请先选择要导入的项目文件");
      return;
    }

    setLoading(true);
    try {
      // const cosmos = await importCosmos(selectedFile);
      // close();
      // // 导入成功后打开项目
      // if (cosmos) {
      //   await openCosmos(cosmos.meta.id);
      // }
      toast.success("导入流程占位，尚未实现具体解析");
      close?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <FormContainer onSubmit={handleImport} className="space-y-6">
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
              <PiUploadSimple className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {isDragActive ? "松开鼠标导入文件" : "拖拽或点击上传项目文件"}
              </h3>
              <p className="text-sm text-muted-foreground">
                支持 .json 格式的世界观文件
              </p>
            </div>
          </div>
        ) : (
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
        )}

        <Button
          disabled={loading || !selectedFile}
          className="w-full h-10"
          type="submit"
          variant="primary"
        >
          {loading ? "导入中..." : "确认导入"}
        </Button>
      </FormContainer>
    </div>
  );
};

ImportWorldViewPanel.open = () => {
  dialog({
    title: "导入项目",
    description: "导入项目文件（.json）",
    className: "max-w-4xl w-[500px]",
    content: (close) => <ImportWorldViewPanel close={close} />,
  });
};
