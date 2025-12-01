import { BookOpen, FolderOpen, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocsStore } from "../useDocsStore";

export const Header = () => {
  const root = useDocsStore((state) => state.root);
  const activeStory = useDocsStore((state) => state.activeStory);
  const chooseRoot = useDocsStore((state) => state.chooseRoot);
  const refreshStories = useDocsStore((state) => state.refreshStories);
  const loading = useDocsStore((state) => state.loading);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border/60 bg-background/80 backdrop-blur z-10">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-semibold tracking-wide">
            Local MDX Studio
          </div>
          <div className="text-xs text-muted-foreground max-w-md truncate">
            {root || "请选择 Fumadocs story 目录"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeStory ? (
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {activeStory.title}
          </span>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refreshStories()}
          disabled={loading}
        >
          <RefreshCcw className="h-4 w-4" />
          刷新
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => void chooseRoot()}
          disabled={loading}
        >
          <FolderOpen className="h-4 w-4" />
          选择目录
        </Button>
      </div>
    </header>
  );
};
