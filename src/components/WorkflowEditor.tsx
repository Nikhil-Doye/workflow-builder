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
import { CopilotPanel } from "./CopilotPanel";
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
import {
  Search,
  Grid,
  List,
  Brain,
  Globe,
  ArrowRight,
  Database,
  FileText,
  Search as SearchIcon,
  X,
  Trash2,
  Sparkles,
} from "lucide-react";

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
  const [showNodePalette, setShowNodePalette] = useState(true);
  const [showCopilot, setShowCopilot] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
      setShowConfig(false);
      selectNode(null);
    }
  }, [selectedNodeId, deleteNode, selectNode]);

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
    {
      type: "dataInput",
      label: "Data Input",
      icon: ArrowRight,
      description: "Start your workflow with data",
      color: "blue",
      category: "Input",
    },
    {
      type: "webScraping",
      label: "Web Scraping",
      icon: Globe,
      description: "Extract content from websites",
      color: "green",
      category: "Data",
    },
    {
      type: "llmTask",
      label: "AI Task",
      icon: Brain,
      description: "Process with AI models",
      color: "purple",
      category: "AI",
    },
    {
      type: "embeddingGenerator",
      label: "Embedding",
      icon: Database,
      description: "Generate vector embeddings",
      color: "indigo",
      category: "AI",
    },
    {
      type: "similaritySearch",
      label: "Similarity Search",
      icon: SearchIcon,
      description: "Find similar content",
      color: "orange",
      category: "AI",
    },
    {
      type: "structuredOutput",
      label: "Structured Output",
      icon: FileText,
      description: "Format data with schemas",
      color: "pink",
      category: "Output",
    },
    {
      type: "dataOutput",
      label: "Data Output",
      icon: ArrowRight,
      description: "Export your results",
      color: "blue",
      category: "Output",
    },
  ];

  const categories = [
    { name: "All", count: nodeTypesList.length },
    {
      name: "Input",
      count: nodeTypesList.filter((n) => n.category === "Input").length,
    },
    {
      name: "AI",
      count: nodeTypesList.filter((n) => n.category === "AI").length,
    },
    {
      name: "Data",
      count: nodeTypesList.filter((n) => n.category === "Data").length,
    },
    {
      name: "Output",
      count: nodeTypesList.filter((n) => n.category === "Output").length,
    },
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

  // Filter nodes based on search and category
  const filteredNodes = nodeTypesList.filter((nodeType) => {
    const matchesSearch =
      nodeType.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nodeType.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || nodeType.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
      green: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
      purple:
        "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
      indigo:
        "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
      orange:
        "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
      pink: "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100",
    };
    return (
      colorMap[color as keyof typeof colorMap] ||
      "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
    );
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Node Palette */}
      <div
        className={`w-72 md:w-80 bg-white border-r border-gray-200 transition-transform duration-300 flex flex-col ${
          showNodePalette ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Node Library
            </h3>
            <button
              onClick={() => setShowNodePalette(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedCategory === category.name
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Node List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className={`space-y-2 ${
              viewMode === "grid" ? "grid grid-cols-1 gap-3" : ""
            }`}
          >
            {filteredNodes.map((nodeType) => {
              const IconComponent = nodeType.icon;
              return (
                <div
                  key={nodeType.type}
                  className={`group flex items-center space-x-3 p-3 rounded-xl border cursor-move transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 ${getColorClasses(
                    nodeType.color
                  )}`}
                  draggable
                  onDragStart={(event) => onDragStart(event, nodeType.type)}
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center">
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium truncate">
                        {nodeType.label}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-white/60 rounded-full">
                        {nodeType.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {nodeType.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-white">
        <WorkflowToolbar />

        {/* Secondary Toolbar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowNodePalette(!showNodePalette)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Grid className="w-4 h-4" />
              <span className="font-medium">
                {showNodePalette ? "Hide" : "Show"} Library
              </span>
            </button>

            <button
              onClick={() => setShowCopilot(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 rounded-lg hover:from-purple-100 hover:to-indigo-100 transition-colors border border-purple-200"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">AI Copilot</span>
            </button>

            {selectedNodeId && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                title="Delete selected node"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">Delete Node</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{nodes.length} nodes</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{edges.length} connections</span>
            </div>

            <div className="w-px h-6 bg-gray-200"></div>

            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="font-medium">Close</span>
            </button>
          </div>
        </div>

        {/* React Flow */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
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
            className="bg-gradient-to-br from-gray-50 to-blue-50/30"
          >
            <Controls
              className="!bg-white !border !border-gray-200 !rounded-lg !shadow-lg"
              position="top-right"
            />
            <MiniMap
              className="!bg-white !border !border-gray-200 !rounded-lg !shadow-lg"
              position="bottom-right"
              nodeColor={(node) => {
                switch (node.type) {
                  case "dataInput":
                    return "#3b82f6";
                  case "webScraping":
                    return "#10b981";
                  case "llmTask":
                    return "#8b5cf6";
                  case "dataOutput":
                    return "#f59e0b";
                  default:
                    return "#6b7280";
                }
              }}
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.5}
              color="#e5e7eb"
            />
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

      {/* Copilot Panel */}
      <CopilotPanel
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
      />
    </div>
  );
};
