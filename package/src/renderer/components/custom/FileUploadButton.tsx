"use client";

import { useRef, useState } from "react";
import { Loader2Icon, PaperclipIcon } from "lucide-react";
import { toast } from "sonner";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileUploadButtonProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

/**
 * 文件上传按钮组件
 * 上传文件到 OSS，返回文件 URL（不解析内容）
 */
export function FileUploadButton({
  onFilesUploaded,
  disabled,
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadToast = toast.loading(`正在上传 ${files.length} 个文件...`);

    try {
      // 上传文件到统一的 OSS 上传 API
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const uploadResponse = await fetch("/api/file/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "上传失败");
      }

      const uploadResult = await uploadResponse.json();
      toast.dismiss(uploadToast);

      if (!uploadResult.files || uploadResult.files.length === 0) {
        throw new Error("上传失败，未返回文件信息");
      }

      onFilesUploaded(uploadResult.files);

      toast.success(`成功上传 ${uploadResult.files.length} 个文件`);
    } catch (error) {
      console.error("文件上传错误:", error);
      toast.dismiss(uploadToast);
      const errorMessage = error instanceof Error ? error.message : "文件上传失败";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <>
      <PromptInputButton
        onClick={() => fileInputRef.current?.click()}
        className="size-8 hover:bg-muted-foreground/10 rounded-full"
        aria-label="上传文件"
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <PaperclipIcon className="h-4 w-4" />
        )}
      </PromptInputButton>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.csv,.txt,.html,.odt,.rtf,.epub,.md,.xml,.pptx,.jpg,.jpeg,.png,.gif,.webp"
        multiple
        onChange={handleFileChange}
      />
    </>
  );
}

