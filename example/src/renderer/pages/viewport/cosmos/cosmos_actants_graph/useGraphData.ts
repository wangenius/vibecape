import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useCosmos } from "@/hook/cosmos/useCosmos";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import type { ActantNodeData } from "./types";

export const useGraphData = () => {
  const cosmos = useCosmos((state) => state.current_meta);
  const actants = useCosmos((state) => state.actants);
  const relations = useCosmos((state) => state.relations);

  const insertRelation = useCosmos((state) => state.insertRelation);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [neighbors, setNeighbors] = useState<Set<string>>(new Set());
  const [selectedActantId, setSelectedActantId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ActantNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Track previous data key to detect actual data changes
  const prevKeyRef = useRef<string | null>(null);

  const { baseNodes, baseEdges } = useMemo(() => {
    if (!cosmos) return { baseNodes: [], baseEdges: [] };

    const actantList = Object.values(actants || {});
    const relationList = Object.values(relations || {});
    const mainChars = actantList.filter((a) => a.main_char);
    const otherChars = actantList.filter((a) => !a.main_char);

    const tempNodes: Node<ActantNodeData>[] = [];

    const mainRadius = mainChars.length > 1 ? 250 : 0;
    const otherRadius = 450;

    // Main characters layout
    mainChars.forEach((actant, index) => {
      const angle =
        mainChars.length > 1
          ? (index / mainChars.length) * Math.PI * 2 - Math.PI / 2
          : 0;

      tempNodes.push({
        id: actant.id,
        type: "actant",
        position: {
          x: mainRadius * Math.cos(angle),
          y: mainRadius * Math.sin(angle),
        },
        data: {
          label: actant.name || "Unknown",
          isMain: true,
          avatar: actant.avatar,
          dimmed: false,
          highlight: false,
        },
        draggable: true,
        zIndex: 10,
      });
    });

    // Supporting characters layout (golden angle spiral)
    otherChars.forEach((actant, index) => {
      const phi = (Math.sqrt(5) + 1) / 2;
      const theta = (index * 2 * Math.PI) / phi;
      const r = otherRadius + (index % 3) * 70;

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);

      tempNodes.push({
        id: actant.id,
        type: "actant",
        position: { x, y },
        data: {
          label: actant.name || "Unknown",
          isMain: false,
          avatar: actant.avatar,
          dimmed: false,
          highlight: false,
        },
        draggable: true,
        zIndex: 1,
      });
    });

    const tempEdges: Edge[] = relationList.map((relation) => ({
      id: relation.id,
      type: "relation",
      source: relation.actant_a,
      target: relation.actant_b,
      label: relation.a_to_b || relation.b_to_a || "",
      animated: false,
      data: {
        highlight: false,
        dimmed: false,
      },
    }));

    return { baseNodes: tempNodes, baseEdges: tempEdges };
  }, [cosmos, actants, relations]);

  // Initialize nodes/edges when base data changes
  useEffect(() => {
    const dataKey = JSON.stringify({
      actants: Object.values(actants || {}).map((a) => ({
        id: a.id,
        name: a.name,
        avatar: a.avatar,
        main_char: a.main_char,
      })),
      relations: Object.values(relations || {}).map((r) => ({
        id: r.id,
        a_to_b: r.a_to_b,
        b_to_a: r.b_to_a,
      })),
    });

    if (prevKeyRef.current !== dataKey) {
      prevKeyRef.current = dataKey;
      setNodes(baseNodes);
      setEdges(baseEdges);
    }
  }, [baseNodes, baseEdges, actants, relations, setNodes, setEdges]);

  // Update visual states (dimmed/highlight) without replacing nodes
  useEffect(() => {
    if (nodes.length === 0) return;

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const isHovered = hoveredNodeId === node.id;
        const isNeighbor = neighbors.has(node.id);
        const isDimmed = hoveredNodeId !== null && !isHovered && !isNeighbor;
        const highlight = isHovered || (hoveredNodeId !== null && isNeighbor);

        if (
          node.data.dimmed === isDimmed &&
          node.data.highlight === highlight &&
          node.zIndex === (isHovered ? 100 : node.data.isMain ? 10 : 1)
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
          zIndex: isHovered ? 100 : node.data.isMain ? 10 : 1,
        };
      })
    );

    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const isConnectedToHover =
          hoveredNodeId === edge.source || hoveredNodeId === edge.target;
        const isDimmed = hoveredNodeId !== null && !isConnectedToHover;

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
  }, [hoveredNodeId, neighbors, nodes.length, setNodes, setEdges]);

  // Handle new connection - create relation
  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target || source === target) return;

      // Check if relation already exists
      const existingRelation = Object.values(relations || {}).find(
        (rel) =>
          (rel.actant_a === source && rel.actant_b === target) ||
          (rel.actant_a === target && rel.actant_b === source)
      );
      if (existingRelation) return;

      // Create new relation
      insertRelation({
        actant_a: source,
        actant_b: target,
        story_id: "default",
        a_to_b: "",
        b_to_a: "",
      });

      // Add edge to local state immediately
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `temp-${source}-${target}`,
            type: "relation",
            data: { highlight: false, dimmed: false },
          },
          eds
        )
      );
    },
    [relations, insertRelation, setEdges]
  );

  const onNodeMouseEnter = useCallback(
    (_: any, node: Node) => {
      const nodeId = node.id;
      setHoveredNodeId(nodeId);
      const connectedNodeIds = new Set<string>();
      Object.values(relations || {}).forEach((rel) => {
        if (rel.actant_a === nodeId) connectedNodeIds.add(rel.actant_b);
        if (rel.actant_b === nodeId) connectedNodeIds.add(rel.actant_a);
      });
      setNeighbors(connectedNodeIds);
    },
    [relations]
  );

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
    setNeighbors(new Set());
  }, []);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedActantId(node.id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedActantId(null);
  }, []);

  const selectedActant = selectedActantId ? actants?.[selectedActantId] : null;

  return {
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
  };
};
