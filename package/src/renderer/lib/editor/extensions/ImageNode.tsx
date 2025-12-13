/**
 * Image 扩展
 * 支持本地图片 (/img/xxx) 和远程图片 (https://xxx)
 * 本地图片路径 /img/xxx 映射到 vibecape/asset/img/xxx
 */

import { Node, mergeAttributes, nodeInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Loader2, ImageIcon, X, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { lang } from "@/lib/locales/i18n";
import { useTranslation } from "react-i18next";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageNode: {
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
      }) => ReturnType;
      insertImagePlaceholder: () => ReturnType;
    };
  }
}

// 图片组件
const ImageComponent = ({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) => {
  const { t } = useTranslation();
  const { src, alt, title } = node.attrs;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>("");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // 是否是占位符状态（没有 src）
  const isPlaceholder = !src;

  // 解析图片路径
  useEffect(() => {
    if (isPlaceholder) {
      setLoading(false);
      return;
    }

    const resolveSrc = async () => {
      if (!src) {
        setError(true);
        setLoading(false);
        return;
      }

      // 远程图片直接使用
      if (src.startsWith("http://") || src.startsWith("https://")) {
        setResolvedSrc(src);
        setLoading(false);
        return;
      }

      // 本地图片路径 /img/xxx -> vibecape/asset/img/xxx
      if (src.startsWith("/img/")) {
        try {
          const api = (window as any).api?.vibecape;
          if (api?.resolveAssetPath) {
            const localPath = await api.resolveAssetPath(src);
            if (localPath) {
              // 使用自定义协议加载本地文件
              setResolvedSrc(`local-asset://${localPath}`);
            } else {
              setError(true);
            }
          } else {
            setError(true);
          }
        } catch (err) {
          console.error("Failed to resolve image path:", err);
          setError(true);
        }
        setLoading(false);
        return;
      }

      // 其他情况直接使用
      setResolvedSrc(src);
      setLoading(false);
    };

    resolveSrc();
  }, [src, isPlaceholder]);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error(t("common.image.selectFile"));
        return;
      }

      setUploading(true);
      try {
        const api = (window as any).api?.vibecape;
        if (!api?.uploadImage) {
          toast.error(t("common.image.uploadUnavailable"));
          return;
        }

        // 读取文件为 base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // 上传图片
        const result = await api.uploadImage({
          filename: file.name,
          data: base64,
          useOss: false,
        });

        if (result.success) {
          updateAttributes({ src: result.path, alt: file.name });
        } else {
          toast.error(result.error || t("common.image.uploadFailed"));
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(error?.message || t("common.image.uploadFailed"));
      } finally {
        setUploading(false);
      }
    },
    [updateAttributes]
  );

  // 处理文件选择
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
      e.target.value = "";
    },
    [handleFileUpload]
  );

  // 处理 URL 提交
  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) return;
    updateAttributes({ src: urlInput.trim() });
    setUrlInput("");
    setShowUrlInput(false);
  }, [urlInput, updateAttributes]);

  // 处理拖放
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  // 占位符状态 - 简洁的上传界面
  if (isPlaceholder) {
    return (
      <NodeViewWrapper className="my-2">
        <div
          className={cn(
            "group rounded-md transition-all p-2 bg-muted",
            dragOver ? "bg-muted" : "hover:bg-muted-foreground/10",
            selected && "bg-muted-foreground/20"
          )}
          contentEditable={false}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          {/* 主区域 */}
          <div
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 cursor-pointer",
              uploading && "pointer-events-none opacity-60"
            )}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <ImageIcon className="size-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground flex-1">
              {uploading
                ? t("common.image.uploading")
                : t("common.image.addImage")}
            </span>
            {!showUrlInput && !uploading && (
              <button
                className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(true);
                  setTimeout(() => urlInputRef.current?.focus(), 0);
                }}
              >
                {t("common.image.pasteLink")}
              </button>
            )}
          </div>

          {/* URL 输入 */}
          {showUrlInput && (
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2">
                <input
                  ref={urlInputRef}
                  type="text"
                  placeholder="https://"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUrlSubmit();
                    }
                    if (e.key === "Escape") {
                      setShowUrlInput(false);
                      setUrlInput("");
                    }
                  }}
                  onBlur={() => {
                    if (!urlInput.trim()) {
                      setShowUrlInput(false);
                    }
                  }}
                  className="flex-1 h-7 px-2 text-sm bg-background border border-border/50 rounded outline-none focus:border-border placeholder:text-muted-foreground/40"
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="h-7 px-2.5 text-xs bg-foreground/10 hover:bg-foreground/15 text-foreground rounded disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  {t("common.image.confirm")}
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </NodeViewWrapper>
    );
  }

  // 已有图片 - 显示图片
  return (
    <NodeViewWrapper className="">
      <figure
        className="relative rounded-lg overflow-hidden"
        contentEditable={false}
      >
        {loading && (
          <div className="flex items-center justify-center h-32 bg-muted/50">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/50">
            <div className="flex items-center justify-center size-8 rounded-md bg-destructive/10">
              <ImageIcon className="size-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-muted-foreground">
                {t("common.image.loadFailed")}
              </span>
              <p className="text-xs text-muted-foreground/60 truncate">{src}</p>
            </div>
          </div>
        )}

        {!error && resolvedSrc && (
          <div
            className="relative group cursor-pointer"
            onDoubleClick={() => setShowPreview(true)}
          >
            <img
              src={resolvedSrc}
              alt={alt || ""}
              title={title || ""}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                "max-w-full max-h-[70vh] h-auto mx-auto transition-opacity my-0! object-contain",
                loading ? "opacity-0 h-0" : "opacity-100"
              )}
              draggable={false}
            />
            {/* Hover/选中 蒙版 */}
            {!loading && (
              <div
                className={cn(
                  "absolute inset-0 transition-colors pointer-events-none",
                  selected ? "bg-foreground/10" : "bg-foreground/0 group-hover:bg-foreground/5"
                )}
              />
            )}
            {/* 展开按钮 - hover 时显示 */}
            {!loading && (
              <button
                className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(true);
                }}
              >
                <Maximize2 className="size-4" />
              </button>
            )}
          </div>
        )}
      </figure>

      {/* 图片预览弹层 - 使用 Portal 渲染到 body */}
      {showPreview &&
        resolvedSrc &&
        createPortal(
          <div
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowPreview(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={() => setShowPreview(false)}
            >
              <X className="size-5" />
            </button>
            <img
              src={resolvedSrc}
              alt={alt || ""}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            />
            {alt && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm">
                {alt}
              </div>
            )}
          </div>,
          document.body
        )}
    </NodeViewWrapper>
  );
};

export const ImageNode = Node.create({
  name: "image",

  group: "block",

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => ({
          src: attributes.src,
        }),
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute("alt"),
        renderHTML: (attributes) => ({
          alt: attributes.alt,
        }),
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title"),
        renderHTML: (attributes) => ({
          title: attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      insertImagePlaceholder:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { src: null, alt: null, title: null },
          });
        },
    };
  },

  // 支持 Markdown 语法解析 ![alt](src)
  addInputRules() {
    // 匹配 ![alt](src) 或 ![alt](src "title")
    const imageInputRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;

    return [
      nodeInputRule({
        find: imageInputRegex,
        type: this.type,
        getAttributes: (match) => {
          const [, alt, src, title] = match;
          return { src, alt: alt || null, title: title || null };
        },
      }),
    ];
  },

  // 支持粘贴图片
  addProseMirrorPlugins() {
    const uploadAndInsert = async (file: File, editor: any) => {
      try {
        const api = (window as any).api?.vibecape;
        if (!api?.uploadImage) {
          toast.error(lang("common.image.uploadUnavailable"));
          return;
        }

        // 读取文件为 base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // 上传图片
        const result = await api.uploadImage({
          filename: file.name,
          data: base64,
          useOss: false,
        });

        if (result.success) {
          editor
            .chain()
            .focus()
            .setImage({ src: result.path, alt: file.name })
            .run();
          toast.success(lang("common.image.uploadSuccess"));
        } else {
          toast.error(result.error || lang("common.image.uploadFailed"));
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(error?.message || lang("common.image.uploadFailed"));
      }
    };

    return [
      new Plugin({
        key: new PluginKey("imagePaste"),
        props: {
          handlePaste: (_view, event) => {
            const items = event.clipboardData?.items;
            if (!items) return false;

            for (const item of items) {
              if (item.type.startsWith("image/")) {
                event.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;

                // 直接上传并插入
                uploadAndInsert(file, this.editor);
                return true;
              }
            }
            return false;
          },
          handleDrop: (_view, event) => {
            const files = event.dataTransfer?.files;
            if (!files || files.length === 0) return false;

            const imageFile = Array.from(files).find((f) =>
              f.type.startsWith("image/")
            );
            if (!imageFile) return false;

            event.preventDefault();

            // 直接上传并插入
            uploadAndInsert(imageFile, this.editor);
            return true;
          },
        },
      }),
    ];
  },
});
