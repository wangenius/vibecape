import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoryNodeData } from "./types";

const StoryNodeComponent = ({ data, selected }: NodeProps<Node<StoryNodeData>>) => {
  const { title, characters, hasChildren, dimmed, highlight } = data;
  const isActive = selected || highlight;

  return (
    <div
      className={cn(
        "group relative w-52 transition-all duration-200",
        dimmed ? "opacity-15" : "opacity-100"
      )}
    >
      {/* Handles - minimal dots */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "w-2! h-2! rounded-full! border-0! transition-all duration-200",
          isActive ? "bg-primary!" : "bg-muted-foreground/40!"
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "w-2! h-2! rounded-full! border-0! transition-all duration-200",
          isActive ? "bg-primary!" : "bg-muted-foreground/40!"
        )}
      />

      {/* Card - solid background, no border */}
      <div
        className={cn(
          "rounded-xl overflow-hidden transition-all duration-200",
          isActive
            ? "bg-primary/15 shadow-lg shadow-primary/10"
            : "bg-muted hover:bg-muted-foreground/10"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3.5 py-3">
          <h3
            className={cn(
              "flex-1 text-sm font-medium truncate",
              isActive
                ? "text-foreground"
                : title
                  ? "text-foreground/90"
                  : "text-muted-foreground"
            )}
          >
            {title || "未命名"}
          </h3>
          {hasChildren && (
            <div className={cn(
              "flex items-center justify-center w-5 h-5 rounded-md transition-colors",
              isActive ? "bg-primary/20" : "bg-background/50"
            )}>
              <Layers className={cn(
                "h-3 w-3",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
          )}
        </div>

        {/* Characters */}
        {characters.length > 0 && (
          <div className="px-3.5 pb-3 flex items-center gap-1.5 flex-wrap">
            {characters.slice(0, 3).map((name, i) => (
              <span
                key={i}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-background/60 text-muted-foreground"
                )}
              >
                {name}
              </span>
            ))}
            {characters.length > 3 && (
              <span className={cn(
                "text-[10px]",
                isActive ? "text-primary/70" : "text-muted-foreground/70"
              )}>
                +{characters.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const StoryNode = memo(StoryNodeComponent, (prevProps, nextProps) => {
  const prevData = prevProps.data;
  const nextData = nextProps.data;
  return (
    prevProps.selected === nextProps.selected &&
    prevData.title === nextData.title &&
    prevData.hasChildren === nextData.hasChildren &&
    prevData.characters.length === nextData.characters.length &&
    prevData.characters.every((c, i) => c === nextData.characters[i]) &&
    prevData.dimmed === nextData.dimmed &&
    prevData.highlight === nextData.highlight
  );
});
StoryNode.displayName = "StoryNode";
