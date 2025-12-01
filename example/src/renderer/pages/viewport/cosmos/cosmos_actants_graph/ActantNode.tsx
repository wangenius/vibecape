import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { ActantNodeData } from "./types";

const getInitials = (name: string) => {
  return name.slice(0, 1).toUpperCase();
};

const NODE_SIZE = 64; // Unified node size (w-16 = 64px)

const ActantNodeComponent = ({
  data,
  selected,
}: NodeProps<Node<ActantNodeData>>) => {
  const { isMain, label, avatar, dimmed, highlight } = data;
  const isActive = selected || highlight;

  return (
    <div
      className={cn(
        "relative group flex flex-col items-center transition-opacity duration-300",
        dimmed ? "opacity-15" : "opacity-100"
      )}
    >
      {/* Center handle - positioned at avatar center (32px from top) */}
      <Handle
        type="target"
        position={Position.Top}
        id="center"
        className="opacity-0! w-1! h-1!"
        style={{
          left: "50%",
          top: NODE_SIZE / 2,
          transform: "translate(-50%, -50%)",
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="center"
        className="opacity-0! w-1! h-1!"
        style={{
          left: "50%",
          top: NODE_SIZE / 2,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Avatar - unified size, main char has different background */}
      <div
        className={cn(
          "relative overflow-hidden rounded-full transition-all duration-200 w-16 h-16",
          isActive
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
            : isMain
              ? "ring-2 ring-amber-500"
              : "ring-1 ring-border"
        )}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "w-full h-full flex items-center justify-center",
              isActive
                ? "bg-primary text-primary-foreground"
                : isMain
                  ? "bg-amber-500/20 text-amber-600"
                  : "bg-muted text-muted-foreground"
            )}
          >
            <span className="font-semibold text-xl">{getInitials(label)}</span>
          </div>
        )}
      </div>

      {/* Label - always visible */}
      <div className="mt-2 max-w-24 text-center">
        <span
          className={cn(
            "text-xs font-medium truncate block",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label || "未命名"}
        </span>
      </div>
    </div>
  );
};

export const ActantNode = memo(ActantNodeComponent, (prevProps, nextProps) => {
  const prevData = prevProps.data;
  const nextData = nextProps.data;
  return (
    prevProps.selected === nextProps.selected &&
    prevData.label === nextData.label &&
    prevData.isMain === nextData.isMain &&
    prevData.avatar === nextData.avatar &&
    prevData.dimmed === nextData.dimmed &&
    prevData.highlight === nextData.highlight
  );
});
ActantNode.displayName = "ActantNode";
