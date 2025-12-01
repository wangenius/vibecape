import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCosmos } from "@/hook/cosmos/useCosmos";

interface AvatarEditorProps {
  actant: { id: string } & Record<string, any>;
  currentAvatar: string;
  onClose: () => void;
}

/** 头像编辑器 */
export const AvatarEditor = ({
  actant,
  currentAvatar,
  onClose,
}: AvatarEditorProps) => {
  const [previewUrl, setPreviewUrl] = useState(currentAvatar);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 创建一个本地预览URL
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (previewUrl !== currentAvatar) {
      useCosmos.getState().updateActant(actant.id, { avatar: previewUrl });
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* 预览区域 */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <img
            src={previewUrl}
            alt="头像预览"
            className="w-full h-full rounded-full object-cover border-2 border-gray-200"
          />
        </div>
      </div>

      {/* 上传区域 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            className="flex-1 text-sm file:mr-4 file:py-1 file:px-3 file:text-xs
                                 file:rounded-full file:border-0 file:bg-primary/10
                                 file:text-primary hover:file:bg-primary/20"
            onChange={handleFileChange}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          支持 jpg、png 格式，建议尺寸 200x200 像素
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            useCosmos.getState().updateActant(actant.id, { avatar: "" });
            onClose();
          }}
        >
          移除头像
        </Button>
        <Button size="sm" onClick={handleSave}>
          确认更改
        </Button>
      </div>
    </div>
  );
};
