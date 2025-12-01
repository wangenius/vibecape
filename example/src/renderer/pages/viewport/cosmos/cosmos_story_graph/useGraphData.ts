import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type EdgeChange,
  addEdge,
} from "@xyflow/react";
import type { Story } from "@common/schema";
import type { StoryNodeData, BreadcrumbItem } from "./types";

const toArray = (value: unknown): string[] =>
  Array.isArray(value) ? (value.filter(Boolean) as string[]) : [];

export const useGraphData = () => {
  const cosmos = useCosmos((state) => state.current_meta);
  const stories = useCosmos((state) => state.stories);
  const actants = useCosmos((state) => state.actants);
  const actantStates = useCosmos((state) => state.actant_states);
  const updateStory = useCosmos((state) => state.updateStory);

  // Current parent story ID (empty string = root level)
  const [currentParentId, setCurrentParentId] = useState<string>("");
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [neighbors, setNeighbors] = useState<Set<string>>(new Set());

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StoryNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Track previous key to detect actual data changes
  const prevKeyRef = useRef<string | null>(null);

  // Build set of story IDs that have children
  const storiesWithChildren = useMemo(() => {
    const set = new Set<string>();
    Object.values(stories || {}).forEach((story) => {
      if (story.parent_id) {
        set.add(story.parent_id);
      }
    });
    return set;
  }, [stories]);

  // Build breadcrumb path from root to current parent
  const breadcrumb = useMemo((): BreadcrumbItem[] => {
    if (!currentParentId) return [];
    
    const path: BreadcrumbItem[] = [];
    let id = currentParentId;
    
    while (id) {
      const story = stories?.[id];
      if (!story) break;
      path.unshift({ id: story.id, name: story.name || "未命名" });
      id = story.parent_id;
    }
    
    return path;
  }, [currentParentId, stories]);

  // Build a map of storyId -> character names
  const storyCharactersMap = useMemo(() => {
    const map = new Map<string, string[]>();
    Object.values(actantStates || {}).forEach((state) => {
      const actant = actants?.[state.actant_id];
      if (actant && state.story_id) {
        const chars = map.get(state.story_id) || [];
        chars.push(actant.name);
        map.set(state.story_id, chars);
      }
    });
    return map;
  }, [actants, actantStates]);

  // Calculate base graph layout - only when stories data actually changes
  const { baseNodes, baseEdges } = useMemo(() => {
    if (!cosmos) {
      return { baseNodes: [], baseEdges: [] };
    }

    // Filter stories by current parent
    const storyList = Object.values(stories || {}).filter(
      (s) => s.parent_id === currentParentId
    );
    if (storyList.length === 0) {
      return { baseNodes: [], baseEdges: [] };
    }

    const storyMap = new Map<string, Story>(
      storyList.map((story) => [story.id, story])
    );

    const indegree = new Map<string, number>();
    storyList.forEach((s) => indegree.set(s.id, 0));

    storyList.forEach((story) => {
      const nextIds = toArray(story.next_ids).filter((id) => storyMap.has(id));
      nextIds.forEach((id) => indegree.set(id, (indegree.get(id) || 0) + 1));
    });

    const queue: Story[] = storyList
      .filter((s) => (indegree.get(s.id) || 0) === 0)
      .sort((a, b) => a.order_index - b.order_index);

    if (queue.length === 0) {
      storyList
        .sort((a, b) => a.order_index - b.order_index)
        .forEach((s) => queue.push(s));
    }

    const levelMap = new Map<string, number>();
    const visited = new Set<string>();

    while (queue.length) {
      const current = queue.shift()!;
      const currentLevel = levelMap.get(current.id) ?? 0;
      visited.add(current.id);

      const nextIds = toArray(current.next_ids).filter((id) => storyMap.has(id));
      nextIds.forEach((nextId) => {
        const nextStory = storyMap.get(nextId);
        if (!nextStory) return;

        const nextLevel = Math.max(levelMap.get(nextId) ?? 0, currentLevel + 1);
        levelMap.set(nextId, nextLevel);

        const leftIndegree = (indegree.get(nextId) || 1) - 1;
        indegree.set(nextId, leftIndegree);
        if (leftIndegree <= 0 && !visited.has(nextId)) {
          queue.push(nextStory);
        }
      });
    }

    storyList.forEach((story) => {
      if (!levelMap.has(story.id)) {
        levelMap.set(story.id, 0);
      }
    });

    const grouped: Record<number, Story[]> = {};
    storyList.forEach((story) => {
      const level = levelMap.get(story.id) ?? 0;
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(story);
    });

    const horizontal = 350;
    const vertical = 250;

    const newNodes: Node<StoryNodeData>[] = [];
    Object.entries(grouped).forEach(([levelKey, items]) => {
      const level = Number(levelKey);
      items
        .sort((a, b) => a.order_index - b.order_index)
        .forEach((story, idx) => {
          const offset = (items.length - 1) / 2;
          const autoX = level * horizontal;
          const autoY = (idx - offset) * vertical;

          const hasStoredPosition =
            (story.position_x !== 0 || story.position_y !== 0);
          
          const x = hasStoredPosition ? story.position_x : autoX;
          const y = hasStoredPosition ? story.position_y : autoY;

          newNodes.push({
            id: story.id,
            type: "story",
            position: { x, y },
            data: {
              title: story.name,
              characters: storyCharactersMap.get(story.id) || [],
              hasChildren: storiesWithChildren.has(story.id),
              dimmed: false,
              highlight: false,
            },
            draggable: true,
            zIndex: 5,
          });
        });
    });

    const newEdges: Edge[] = [];
    const edgeIds = new Set<string>();

    storyList.forEach((story) => {
      const nextIds = toArray(story.next_ids).filter((id) => storyMap.has(id));
      nextIds.forEach((nextId) => {
        const edgeId = `${story.id}-${nextId}`;
        if (edgeIds.has(edgeId)) return;
        edgeIds.add(edgeId);

        newEdges.push({
          id: edgeId,
          source: story.id,
          target: nextId,
          type: "relation",
          data: {
            highlight: false,
            dimmed: false,
          },
        });
      });
    });

    return { baseNodes: newNodes, baseEdges: newEdges };
  }, [cosmos, stories, storyCharactersMap, currentParentId, storiesWithChildren]);

  // Initialize nodes/edges when base data changes
  useEffect(() => {
    const dataKey = JSON.stringify({
      parent: currentParentId,
      stories: Object.values(stories || {})
        .filter((s) => s.parent_id === currentParentId)
        .map((s) => ({
          id: s.id,
          name: s.name,
          next_ids: s.next_ids,
          order_index: s.order_index,
        })),
    });

    if (prevKeyRef.current !== dataKey) {
      prevKeyRef.current = dataKey;
      setNodes(baseNodes);
      setEdges(baseEdges);
    }
  }, [baseNodes, baseEdges, stories, currentParentId, setNodes, setEdges]);

  // Update visual states (dimmed/highlight) without replacing nodes
  useEffect(() => {
    if (nodes.length === 0) return;

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const isHovered = hoveredId === node.id;
        const isNeighbor = neighbors.has(node.id);
        const isDimmed = hoveredId !== null && !isHovered && !isNeighbor;
        const highlight = isHovered || (hoveredId !== null && isNeighbor);

        // Only update if visual state changed
        if (
          node.data.dimmed === isDimmed &&
          node.data.highlight === highlight &&
          node.zIndex === (isHovered ? 100 : 5)
        ) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            dimmed: isDimmed,
            highlight,
          },
          zIndex: isHovered ? 100 : 5,
        };
      })
    );

    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const isConnectedToHover =
          hoveredId === edge.source || hoveredId === edge.target;
        const isDimmed = hoveredId !== null && !isConnectedToHover;

        // Only update if visual state changed
        if (
          edge.data?.highlight === isConnectedToHover &&
          edge.data?.dimmed === isDimmed
        ) {
          return edge;
        }

        return {
          ...edge,
          data: {
            ...edge.data,
            highlight: isConnectedToHover,
            dimmed: isDimmed,
          },
        };
      })
    );
  }, [hoveredId, neighbors, nodes.length, setNodes, setEdges]);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateStory(node.id, {
        position_x: node.position.x,
        position_y: node.position.y,
      });
    },
    [updateStory]
  );

  const onNodeMouseEnter = useCallback(
    (_: any, node: Node) => {
      const story = stories?.[node.id];
      if (!story) return;

      setHoveredId(node.id);
      const toArray = (value: unknown) =>
        Array.isArray(value) ? (value.filter(Boolean) as string[]) : [];
      setNeighbors(
        new Set([...toArray(story.last_ids), ...toArray(story.next_ids)])
      );
    },
    [stories]
  );

  const onNodeMouseLeave = useCallback(() => {
    setHoveredId(null);
    setNeighbors(new Set());
  }, []);

  // Handle new connection creation
  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target || source === target) return;

      const sourceStory = stories?.[source];
      const targetStory = stories?.[target];
      if (!sourceStory || !targetStory) return;

      // Check if connection already exists
      const sourceNextIds = toArray(sourceStory.next_ids);
      if (sourceNextIds.includes(target)) return;

      // Update source story's next_ids
      updateStory(source, {
        next_ids: [...sourceNextIds, target],
      });

      // Update target story's last_ids
      const targetLastIds = toArray(targetStory.last_ids);
      if (!targetLastIds.includes(source)) {
        updateStory(target, {
          last_ids: [...targetLastIds, source],
        });
      }

      // Add edge to local state
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `${source}-${target}`,
            type: "relation",
            data: { highlight: false, dimmed: false },
          },
          eds
        )
      );
    },
    [stories, updateStory, setEdges]
  );

  // Handle edge deletion
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // First apply the default changes
      onEdgesChange(changes);

      // Then handle deletions to update story relationships
      changes.forEach((change) => {
        if (change.type === "remove") {
          const edgeId = change.id;
          const [sourceId, targetId] = edgeId.split("-");

          if (!sourceId || !targetId) return;

          const sourceStory = stories?.[sourceId];
          const targetStory = stories?.[targetId];

          // Update source story's next_ids
          if (sourceStory) {
            const sourceNextIds = toArray(sourceStory.next_ids);
            updateStory(sourceId, {
              next_ids: sourceNextIds.filter((id) => id !== targetId),
            });
          }

          // Update target story's last_ids
          if (targetStory) {
            const targetLastIds = toArray(targetStory.last_ids);
            updateStory(targetId, {
              last_ids: targetLastIds.filter((id) => id !== sourceId),
            });
          }
        }
      });
    },
    [stories, updateStory, onEdgesChange]
  );

  // Get selected story data
  const selectedStory = selectedStoryId ? stories?.[selectedStoryId] : null;
  const selectedStoryCharacters = selectedStoryId
    ? storyCharactersMap.get(selectedStoryId) || []
    : [];

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedStoryId(node.id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedStoryId(null);
  }, []);

  // Navigation functions for nested stories
  const navigateToStory = useCallback((storyId: string) => {
    setCurrentParentId(storyId);
    setSelectedStoryId(null);
  }, []);

  const navigateToRoot = useCallback(() => {
    setCurrentParentId("");
    setSelectedStoryId(null);
  }, []);

  const navigateToBreadcrumb = useCallback((storyId: string) => {
    setCurrentParentId(storyId);
    setSelectedStoryId(null);
  }, []);

  // Double click to enter child story space
  const onNodeDoubleClick = useCallback((_: any, node: Node<StoryNodeData>) => {
    if (node.data.hasChildren) {
      navigateToStory(node.id);
    }
  }, [navigateToStory]);

  return {
    cosmos,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect,
    onNodeDragStop,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onNodeClick,
    onNodeDoubleClick,
    selectedStory,
    selectedStoryCharacters,
    clearSelection,
    // Breadcrumb navigation
    breadcrumb,
    currentParentId,
    navigateToRoot,
    navigateToBreadcrumb,
  };
};
