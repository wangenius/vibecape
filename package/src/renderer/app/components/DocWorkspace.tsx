import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useDocsStore } from "../useDocsStore";
import { DocEditor } from "./DocEditor";
import { FilePlus2, FolderSearch, NotebookPen } from "lucide-react";

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
  const stories = useDocsStore((state) => state.stories);
  const activeStory = useDocsStore((state) => state.activeStory);
  const activePath = useDocsStore((state) => state.activePath);
  const doc = useDocsStore((state) => state.doc);
  const chooseRoot = useDocsStore((state) => state.chooseRoot);
  const saveDoc = useDocsStore((state) => state.saveDoc);
  const openStory = useDocsStore((state) => state.openStory);

  const storyHasContent = useMemo(
    () => Boolean(activeStory && activeStory.tree.length > 0),
    [activeStory]
  );

  if (!root) {
    return (
      <EmptyState
        title="尚未选择 story 目录"
        description="选择包含 meta.json 与 MDX 文件的根目录，应用会根据 Fumadocs 的 meta.json 构建导航。"
        action={
          <Button onClick={() => void chooseRoot()} size="sm">
            选择目录
          </Button>
        }
      />
    );
  }

  if (stories.length === 0) {
    return (
      <EmptyState
        title="目录中没有可用的 story"
        description="确保根目录下存在子目录或 meta.json 文件。子目录将被视为一个 story。"
        action={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FolderSearch className="h-4 w-4" />
            <span>为每个 story 准备 meta.json，items 将成为左侧导航。</span>
          </div>
        }
      />
    );
  }

  if (!activeStory) {
    return (
      <EmptyState
        title="选择一个 story 开始编辑"
        description="在左侧 Story 列表中选择要打开的 Story。"
        action={
          <Button
            size="sm"
            onClick={() => {
              const first = stories[0];
              if (first) void openStory(first.id);
            }}
          >
            <NotebookPen className="h-4 w-4" />
            打开第一个 story
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
          storyHasContent
            ? "点击左侧导航中的文档开始编辑。"
            : "story 为空。你可以直接在目录下创建 MDX 文件，或编辑 meta.json 添加 items。"
        }
        action={
          storyHasContent ? null : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FilePlus2 className="h-4 w-4" />
              <span>创建新的 .mdx 文件后点击刷新。</span>
            </div>
          )
        }
      />
    );
  }

  return (
    <DocEditor
      storyTitle={activeStory.title}
      docPath={activePath}
      doc={doc}
      onSave={saveDoc}
    />
  );
};
