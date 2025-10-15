import React, { useCallback, useRef, useState, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowInstance,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import { useWorkflowStore } from "../store/workflowStore";
import { NodeConfiguration } from "./NodeConfiguration";
import { WorkflowToolbar } from "./WorkflowToolbar";
import {
  WebScrapingNode,
  LLMNode,
  EmbeddingNode,
  SimilaritySearchNode,
  StructuredOutputNode,
  DataInputNode,
  DataOutputNode,
} from "./nodes";
import { NodeData } from "../types";

const nodeTypes: NodeTypes = {
  webScraping: WebScrapingNode,
  llmTask: LLMNode,
  embeddingGenerator: EmbeddingNode,
  similaritySearch: SimilaritySearchNode,
  structuredOutput: StructuredOutputNode,
  dataInput: DataInputNode,
  dataOutput: DataOutputNode,
};

interface WorkflowEditorProps {
  onClose: () => void;
}

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ onClose }) => {
  const {
    currentWorkflow,
    addNode,
    addEdge,
    deleteNode,
    deleteEdge,
    selectNode,
    selectedNodeId,
  } = useWorkflowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync local state with store when currentWorkflow changes
  useEffect(() => {
    if (currentWorkflow) {
      setNodes(currentWorkflow.nodes);
      setEdges(currentWorkflow.edges);
    }
  }, [currentWorkflow, setNodes, setEdges]);
  const [showConfig, setShowConfig] = useState(false);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        // Add edge to workflow store
        addEdge(
          params.source,
          params.target,
          params.sourceHandle || undefined,
          params.targetHandle || undefined
        );

        // Add edge to local state
        const newEdge = {
          id: `edge-${Date.now()}`,
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
        };

        setEdges((eds) => [...eds, newEdge]);
      }
    },
    [addEdge, setEdges]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
      setShowConfig(true);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
    setShowConfig(false);
  }, [selectNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      if (
        typeof type === "undefined" ||
        !type ||
        !reactFlowInstance ||
        !reactFlowBounds
      ) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Add node to the workflow store
      addNode(type, position);

      // Create a new node for the local state
      const newNode = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: {
          id: `node-${Date.now()}`,
          type: type as any,
          label: `${type} Node`,
          status: "idle" as const,
          config: {},
          inputs: [],
          outputs: [],
        },
      };

      // Add to local state
      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, addNode, setNodes]
  );

  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      nodesToDelete.forEach((node) => deleteNode(node.id));
      // Update local state
      setNodes((nds) =>
        nds.filter((node) => !nodesToDelete.some((n) => n.id === node.id))
      );
    },
    [deleteNode, setNodes]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((edge) => deleteEdge(edge.id));
      // Update local state
      setEdges((eds) =>
        eds.filter((edge) => !edgesToDelete.some((e) => e.id === edge.id))
      );
    },
    [deleteEdge, setEdges]
  );

  const nodeTypesList = [
    { type: "dataInput", label: "Data Input", icon: "📥" },
    { type: "webScraping", label: "Web Scraping", icon: "🌐" },
    { type: "llmTask", label: "LLM Task", icon: "🤖" },
    { type: "embeddingGenerator", label: "Embedding", icon: "🧠" },
    { type: "similaritySearch", label: "Similarity Search", icon: "🔍" },
    { type: "structuredOutput", label: "Structured Output", icon: "📋" },
    { type: "dataOutput", label: "Data Output", icon: "📤" },
  ];

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const selectedNode = currentWorkflow?.nodes.find(
    (node) => node.id === selectedNodeId
  );

  return (
    <div className="h-screen flex">
      {/* Node Palette */}
      <div
        className={`w-64 bg-gray-50 border-r border-gray-200 transition-transform duration-300 ${
          showNodePalette ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Node Types
          </h3>
          <div className="space-y-2">
            {nodeTypesList.map((nodeType) => (
              <div
                key={nodeType.type}
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-shadow"
                draggable
                onDragStart={(event) => onDragStart(event, nodeType.type)}
              >
                <span className="text-2xl">{nodeType.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {nodeType.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        <WorkflowToolbar />

        {/* Node Palette Toggle */}
        <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4">
          <button
            onClick={() => setShowNodePalette(!showNodePalette)}
            className="px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            {showNodePalette ? "Hide" : "Show"} Node Palette
          </button>
          <button
            onClick={onClose}
            className="ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close Editor
          </button>
        </div>

        {/* React Flow */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onInit={onInit}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Modal */}
      {showConfig && selectedNode && (
        <NodeConfiguration
          key={selectedNode.id}
          nodeId={selectedNode.id}
          data={selectedNode.data as NodeData}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
};
