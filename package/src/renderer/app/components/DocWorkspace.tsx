import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useDocsStore } from "../useDocsStore";
import { DocEditor } from "./DocEditor";
import { FilePlus2 } from "lucide-react";
import { useViewManager } from "@/hook/app/useViewManager";
import { GeneralSettings, ModelSettings, AboutSettings } from "./SettingsModal";

const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-6">
    <div className="text-lg font-semibold">{title}</div>
    <div className="text-sm text-muted-foreground max-w-lg">{description}</div>
    {action}
  </div>
);

export const DocWorkspace = () => {
  const root = useDocsStore((state) => state.root);
  const activeStory = useDocsStore((state) => state.activeStory);
  const activePath = useDocsStore((state) => state.activePath);
  const doc = useDocsStore((state) => state.doc);
  const chooseRoot = useDocsStore((state) => state.chooseRoot);
  const saveDoc = useDocsStore((state) => state.saveDoc);

  const activeSidebarPanel = useViewManager(
    (state) => state.activeSidebarPanel
  );
  const settingsSection = useViewManager((state) => state.previewCosmosId);

  const hasContent = useMemo(
    () => Boolean(activeStory && activeStory.tree.length > 0),
    [activeStory]
  );

  // 如果在设置模式，显示设置内容
  if (activeSidebarPanel === "settings") {
    const renderSettings = () => {
      switch (settingsSection) {
        case "models":
          return <ModelSettings />;
        case "about":
          return <AboutSettings />;
        case "general":
        default:
          return <GeneralSettings />;
      }
    };

    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {renderSettings()}
        </div>
      </div>
    );
  }

  if (!root) {
    return (
      <EmptyState
        title="尚未选择文档目录"
        description="选择包含 MDX 文件的目录，应用会根据目录结构构建文档导航。"
        action={
          <Button onClick={() => void chooseRoot()} size="sm">
            选择目录
          </Button>
        }
      />
    );
  }

  if (!activePath || !doc) {
    return (
      <EmptyState
        title="选择一个文档"
        description={
          hasContent
            ? "点击左侧导航中的文档开始编辑。"
            : "目录为空，请在目录下创建 MDX 文件。"
        }
        action={
          hasContent ? null : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FilePlus2 className="h-4 w-4" />
              <span>创建新的 .mdx 文件后点击刷新。</span>
            </div>
          )
        }
      />
    );
  }

  return <DocEditor doc={doc} onSave={saveDoc} />;
};
