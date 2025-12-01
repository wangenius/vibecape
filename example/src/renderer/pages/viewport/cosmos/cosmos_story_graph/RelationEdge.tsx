import { memo } from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

const RelationEdgeComponent = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.2,
  });

  const highlight = data?.highlight as boolean;
  const dimmed = data?.dimmed as boolean;

  const isActive = selected || highlight;

  return (
    <>
      {/* Subtle glow for active edges */}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={6}
          strokeOpacity={0.08}
          className="pointer-events-none"
        />
      )}
      {/* Main edge path */}
      <path
        d={edgePath}
        fill="none"
        stroke={isActive ? "#3b82f6" : "#888888"}
        strokeWidth={isActive ? 2.5 : 2}
        opacity={dimmed ? 0.2 : 1}
        strokeLinecap="round"
      />
      {/* Label */}
      {label && !dimmed && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium transition-all duration-200 rounded-md",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

// Custom comparison to prevent unnecessary re-renders
export const RelationEdge = memo(RelationEdgeComponent, (prevProps, nextProps) => {
  return (
    prevProps.sourceX === nextProps.sourceX &&
    prevProps.sourceY === nextProps.sourceY &&
    prevProps.targetX === nextProps.targetX &&
    prevProps.targetY === nextProps.targetY &&
    prevProps.selected === nextProps.selected &&
    prevProps.label === nextProps.label &&
    prevProps.data?.highlight === nextProps.data?.highlight &&
    prevProps.data?.dimmed === nextProps.data?.dimmed
  );
});
RelationEdge.displayName = "RelationEdge";
