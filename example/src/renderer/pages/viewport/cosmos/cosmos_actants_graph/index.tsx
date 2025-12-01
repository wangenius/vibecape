import { Background, Controls, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ActantNode } from "./ActantNode";
import { RelationEdge } from "./RelationEdge";
import { ActantDetailPanel } from "./ActantDetailPanel";
import { useGraphData } from "./useGraphData";

const nodeTypes = { actant: ActantNode };
const edgeTypes = { relation: RelationEdge };
const proOptions = { hideAttribution: true };
const defaultEdgeOptions = { type: "relation" as const };

const GraphContent = () => {
  const {
    cosmos,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onNodeClick,
    clearSelection,
    selectedActant,
  } = useGraphData();

  if (!cosmos) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/50">
        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-current" />
        </div>
        <p className="text-xs font-medium uppercase tracking-widest">
          Empty Cosmos
        </p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full bg-background relative">
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          暂无角色，可在左侧角色列表中创建。
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onNodeClick={onNodeClick}
        onPaneClick={clearSelection}
        fitView
        minZoom={0.1}
        maxZoom={3}
        nodeDragThreshold={2}
        proOptions={proOptions}
        defaultEdgeOptions={defaultEdgeOptions}
        panOnDrag={[2]}
        selectionOnDrag
      >
        <Background
          color="#666666"
          gap={24}
          size={1.5}
          variant={"dots" as any}
          style={{ opacity: 0.3 }}
        />
        <Controls
          className="bg-card/90 backdrop-blur-sm border-border/50 shadow-lg rounded-xl overflow-hidden"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Detail Panel */}
      {selectedActant && (
        <ActantDetailPanel actant={selectedActant} onClose={clearSelection} />
      )}
    </div>
  );
};

export const CosmosActantsFlowView = () => {
  return (
    <ReactFlowProvider>
      <GraphContent />
    </ReactFlowProvider>
  );
};
