import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useDocsStore } from "../useDocsStore";
import type { DocNavNode } from "@common/types/docs";
import { FileText, FolderTree, Loader2 } from "lucide-react";

type TreeProps = {
  nodes: DocNavNode[];
  depth?: number;
  activePath: string | null;
  onOpen: (path: string) => void;
};

const StoryTree = ({
  nodes,
  depth = 0,
  activePath,
  onOpen,
}: TreeProps) => {
  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const isDoc = node.type === "doc" && node.path;
        const isActive = isDoc && activePath === node.path;
        return (
          <div key={node.id} className="space-y-1">
            <div
              className={`flex items-center gap-2 text-sm rounded-md px-2 py-1 ${
                isDoc
                  ? "cursor-pointer hover:bg-muted"
                  : "text-muted-foreground"
              } ${isActive ? "bg-primary/10 text-primary" : ""}`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => {
                if (isDoc && node.path) {
                  onOpen(node.path);
                }
              }}
            >
              {isDoc ? (
                <FileText className="h-4 w-4 shrink-0" />
              ) : (
                <FolderTree className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{node.title}</span>
            </div>
            {node.children ? (
              <StoryTree
                nodes={node.children}
                depth={depth + 1}
                activePath={activePath}
                onOpen={onOpen}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export const DocsSidebar = () => {
  const root = useDocsStore((state) => state.root);
  const stories = useDocsStore((state) => state.stories);
  const activeStoryId = useDocsStore((state) => state.activeStoryId);
  const activeStory = useDocsStore((state) => state.activeStory);
  const activePath = useDocsStore((state) => state.activePath);
  const loading = useDocsStore((state) => state.loading);
  const chooseRoot = useDocsStore((state) => state.chooseRoot);
  const refreshStories = useDocsStore((state) => state.refreshStories);
  const openStory = useDocsStore((state) => state.openStory);
  const openDoc = useDocsStore((state) => state.openDoc);

  const tree = useMemo(() => activeStory?.tree ?? [], [activeStory?.tree]);

  return (
    <aside className="w-80 border-r border-border/60 bg-muted/10 h-full flex flex-col">
      <div className="p-3 border-b border-border/60 space-y-2">
        <div className="text-xs text-muted-foreground">根目录</div>
        <div className="text-sm font-medium truncate">
          {root || "未选择"}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => void chooseRoot()}
            disabled={loading}
          >
            选择目录
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refreshStories()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "刷新"
            )}
          </Button>
        </div>
      </div>

      {!root ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
          选择存放 meta.json 与 MDX 的目录以开始
        </div>
      ) : (
        <>
          <div className="p-3 border-b border-border/60 space-y-2">
            <div className="text-xs text-muted-foreground">Story 列表</div>
            <div className="flex flex-col gap-2">
              {stories.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  目录下没有 meta.json 或子目录。
                </div>
              ) : (
                stories.map((story) => (
                  <Button
                    key={story.id}
                    variant={
                      story.id === activeStoryId ? "secondary" : "outline"
                    }
                    className="justify-between"
                    onClick={() => void openStory(story.id)}
                  >
                    <span className="truncate">{story.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {story.hasMeta ? "meta.json" : "扫描目录"}
                    </span>
                  </Button>
                ))
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Story 结构
            </div>
            {activeStory ? (
              tree.length > 0 ? (
                <StoryTree
                  nodes={tree}
                  activePath={activePath}
                  onOpen={(path) => void openDoc(path)}
                />
              ) : (
                <div className="text-xs text-muted-foreground">
                  meta.json 没有 items，已根据文件夹生成空导航。
                </div>
              )
            ) : (
              <div className="text-xs text-muted-foreground">
                先选择一个 story 查看其导航。
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
