import {
    Background,
    Controls,
    ReactFlow,
    ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { X, User, Home, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { BaseEditor } from "@/components/editor/BaseEditor";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { MentionExtension } from "@/components/editor/extensions/MentionExtension";

import { StoryNode } from "./StoryNode";
import { RelationEdge } from "./RelationEdge";
import { useGraphData } from "./useGraphData";
import type { TiptapContent } from "@/components/editor/tiptap-types";
import { Input } from "@/components/ui/input";

const nodeTypes = { story: StoryNode };
const edgeTypes = { relation: RelationEdge };
const proOptions = { hideAttribution: true };
const defaultEdgeOptions = { type: "relation" as const };

// Simple debounce hook
const useDebounce = <T,>(callback: (value: T) => void, delay = 500) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (value: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callback(value), delay);
    },
    [callback, delay]
  );
};

// Detail panel component for editing story
const StoryDetailPanel = ({
  story,
  characters,
  onClose,
}: {
  story: any;
  characters: string[];
  onClose: () => void;
}) => {
  const updateStory = useCosmos((s) => s.updateStory);
  const [localName, setLocalName] = useState(story.name || "");

  // Reset local state when story changes
  useEffect(() => {
    setLocalName(story.name || "");
  }, [story.id, story.name]);

  const debouncedNameSave = useDebounce(
    useCallback(
      (value: string) => updateStory(story.id, { name: value }),
      [updateStory, story.id]
    )
  );
  const debouncedBodySave = useDebounce(
    useCallback(
      (value: TiptapContent) => updateStory(story.id, { body: value }),
      [updateStory, story.id]
    )
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalName(value);
      debouncedNameSave(value);
    },
    [debouncedNameSave]
  );

  const handleBodyChange = useCallback(
    (value: TiptapContent) => {
      debouncedBodySave(value);
    },
    [debouncedBodySave]
  );

  const editorKey = useMemo(() => story.id, [story.id]);

  return (
    <div className="absolute bottom-4 right-4 w-72 rounded-xl bg-card border border-border overflow-hidden shadow-lg">
      {/* Header with name input */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Input
          type="title"
          value={localName}
          onChange={handleNameChange}
          placeholder="未命名"
          className="bg-transparent"
        />
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Body editor */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <BaseEditor
          key={editorKey}
          defaultValue={story.body}
          onChange={handleBodyChange}
          extensions={[
            StarterKit,
            Placeholder.configure({ placeholder: "输入内容..." }),
            ...MentionExtension,
          ]}
          className="text-sm min-h-16"
        />
      </div>

      {/* Characters */}
      {characters.length > 0 && (
        <div className="px-3 pb-3 flex items-center gap-1.5 flex-wrap">
          <User className="h-3 w-3 text-muted-foreground" />
          {characters.map((name, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const GraphContent = () => {
  const {
    cosmos,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStop,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onNodeClick,
    onNodeDoubleClick,
    selectedStory,
    selectedStoryCharacters,
    clearSelection,
    breadcrumb,
    currentParentId,
    navigateToRoot,
    navigateToBreadcrumb,
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
        {/* Breadcrumb - always visible */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card">
          <button
            onClick={navigateToRoot}
            className={`flex items-center gap-1 text-xs transition-colors ${
              currentParentId
                ? "text-muted-foreground hover:text-foreground"
                : "text-foreground font-medium"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span>根目录</span>
          </button>
          {breadcrumb.map((item, index) => (
            <div key={item.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              {index === breadcrumb.length - 1 ? (
                <span className="text-xs font-medium text-foreground">
                  {item.name}
                </span>
              ) : (
                <button
                  onClick={() => navigateToBreadcrumb(item.id)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          {currentParentId
            ? "当前剧情空间暂无子节点"
            : "暂无剧情节点，可在左侧情节列表中创建后查看图谱。"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background relative">
      {/* Custom CSS for edge animation */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash {
          animation: dash 0.8s linear infinite;
        }
      `}</style>
      {/* Breadcrumb - always visible */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card">
        <button
          onClick={navigateToRoot}
          className={`flex items-center gap-1 text-xs transition-colors ${
            currentParentId
              ? "text-muted-foreground hover:text-foreground"
              : "text-foreground font-medium"
          }`}
        >
          <Home className="h-3.5 w-3.5" />
          <span>根目录</span>
        </button>
        {breadcrumb.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            {index === breadcrumb.length - 1 ? (
              <span className="text-xs font-medium text-foreground">
                {item.name}
              </span>
            ) : (
              <button
                onClick={() => navigateToBreadcrumb(item.id)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </button>
            )}
          </div>
        ))}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={clearSelection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
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
      {selectedStory && (
        <StoryDetailPanel
          story={selectedStory}
          characters={selectedStoryCharacters}
          onClose={clearSelection}
        />
      )}
    </div>
  );
};

export const CosmosStoryGraphView = () => {
  return (
    <ReactFlowProvider>
      <GraphContent />
    </ReactFlowProvider>
  );
};
