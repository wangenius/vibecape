import { memo } from "react";
import {
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

const NODE_RADIUS = 32; // Half of unified node size (64px / 2)

const RelationEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  selected,
  data,
}: EdgeProps) => {
  // Calculate direction vector
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize direction
  const normalX = distance > 0 ? dx / distance : 0;
  const normalY = distance > 0 ? dy / distance : 0;
  
  // Offset both ends by node radius
  const offsetX = normalX * NODE_RADIUS;
  const offsetY = normalY * NODE_RADIUS;
  
  // Adjusted positions (line starts/ends at node edges)
  const adjustedSourceX = sourceX + offsetX;
  const adjustedSourceY = sourceY + offsetY;
  const adjustedTargetX = targetX - offsetX;
  const adjustedTargetY = targetY - offsetY;

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX: adjustedSourceX,
    sourceY: adjustedSourceY,
    targetX: adjustedTargetX,
    targetY: adjustedTargetY,
  });

  const highlight = data?.highlight as boolean;
  const dimmed = data?.dimmed as boolean;
  const isActive = selected || highlight;

  // Custom marker ID for this edge
  const markerId = `arrow-${id}`;

  return (
    <>
      {/* Arrow marker definition */}
      <defs>
        <marker
          id={markerId}
          markerWidth="16"
          markerHeight="16"
          refX="14"
          refY="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M2,2 L14,8 L2,14 L5,8 Z"
            fill={isActive ? "#3b82f6" : "#888888"}
            opacity={dimmed ? 0.2 : 1}
          />
        </marker>
      </defs>

      {/* Subtle glow for active edges */}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={6}
          strokeOpacity={0.15}
          className="pointer-events-none"
        />
      )}
      {/* Main edge path */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={isActive ? 2.5 : 2}
        stroke={isActive ? "#3b82f6" : "#888888"}
        opacity={dimmed ? 0.2 : 1}
        strokeLinecap="butt"
        markerEnd={`url(#${markerId})`}
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
