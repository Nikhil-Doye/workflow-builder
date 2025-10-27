import React, {
  useCallback,
  useRef,
  useState,
  useMemo,
  useEffect,
} from "react";
import ReactFlow, {
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
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
import { NodeLibrary } from "./NodeLibrary";
import { ConnectionSuggestions } from "./ConnectionSuggestions";
import { ConnectionValidation } from "./ConnectionValidation";
import { InteractiveTutorial } from "./InteractiveTutorial";
import { ExecutionLogger } from "./ExecutionLogger";
import {
  WebScrapingNode,
  LLMNode,
  EmbeddingNode,
  SimilaritySearchNode,
  StructuredOutputNode,
  DataInputNode,
  DataOutputNode,
  // Unified database node
  UnifiedDatabaseNode,
  // Slack node
  SlackNode,
  // Discord node
  DiscordNode,
  // Gmail node
  GmailNode,
} from "./nodes";
import { NodeData } from "../types";
import {
  Grid,
  Trash2,
  Sparkles,
  X,
  Lightbulb,
  Play,
  Activity,
} from "lucide-react";
import {
  executionEventBus,
  ExecutionEvent,
} from "../services/executionEventBus";

const nodeTypes: NodeTypes = {
  webScraping: WebScrapingNode,
  llmTask: LLMNode,
  embeddingGenerator: EmbeddingNode,
  similaritySearch: SimilaritySearchNode,
  structuredOutput: StructuredOutputNode,
  dataInput: DataInputNode,
  dataOutput: DataOutputNode,
  // Unified database node
  database: UnifiedDatabaseNode,
  // Slack node
  slack: SlackNode,
  // Discord node
  discord: DiscordNode,
  // Gmail node
  gmail: GmailNode,
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
    panelStates,
    togglePanel,
    updateNodePosition,
    isExecuting,
    currentExecution,
  } = useWorkflowStore();

  const nodes = useMemo(
    () => currentWorkflow?.nodes || [],
    [currentWorkflow?.nodes]
  );
  const edges = currentWorkflow?.edges || [];
  const [showConfig, setShowConfig] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showExecutionLogger, setShowExecutionLogger] = useState(false);
  const [connectionSource, setConnectionSource] =
    useState<Node<NodeData> | null>(null);
  const [connectionTarget, setConnectionTarget] =
    useState<Node<NodeData> | null>(null);
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(
    null
  );
  const [executionMetrics, setExecutionMetrics] = useState<{
    completedNodes: number;
    failedNodes: number;
    totalDuration: number;
  }>({ completedNodes: 0, failedNodes: 0, totalDuration: 0 });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const executionUnsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to execution events for real-time feedback
  useEffect(() => {
    if (isExecuting && currentExecution?.id) {
      setActiveExecutionId(currentExecution.id);
      setShowExecutionLogger(true);

      // Subscribe to execution events
      executionUnsubscribeRef.current = executionEventBus.subscribeToExecution(
        currentExecution.id,
        (event: ExecutionEvent) => {
          // Update execution metrics
          if (event.type === "execution:complete") {
            setExecutionMetrics({
              completedNodes: event.completedNodes,
              failedNodes: event.failedNodes,
              totalDuration: event.totalDuration,
            });
          } else if (event.type === "node:complete") {
            setExecutionMetrics((prev) => ({
              ...prev,
              completedNodes:
                prev.completedNodes + (event.status === "success" ? 1 : 0),
              failedNodes:
                prev.failedNodes + (event.status === "failed" ? 1 : 0),
            }));
          }
        }
      );
    }

    return () => {
      if (executionUnsubscribeRef.current) {
        executionUnsubscribeRef.current();
        executionUnsubscribeRef.current = null;
      }
    };
  }, [isExecuting, currentExecution?.id]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addEdge(
          params.source,
          params.target,
          params.sourceHandle || undefined,
          params.targetHandle || undefined
        );
      }
    },
    [addEdge]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        switch (change.type) {
          case "position":
            if (change.id && change.position) {
              updateNodePosition(change.id, change.position);
            }
            break;
          case "select":
            if (change.id) {
              selectNode(change.selected ? change.id : null);
            }
            break;
          case "remove":
            if (change.id) {
              deleteNode(change.id);
            }
            break;
          default:
            break;
        }
      });
    },
    [updateNodePosition, selectNode, deleteNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach((change) => {
        if (change.type === "remove" && change.id) {
          deleteEdge(change.id);
        }
      });
    },
    [deleteEdge]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
      setShowConfig(true);
    },
    [selectNode]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: any) => {
      const sourceNode = nodes.find((n) => n.id === suggestion.sourceId);
      const targetNode = nodes.find((n) => n.id === suggestion.targetId);

      if (sourceNode && targetNode) {
        setConnectionSource(sourceNode as Node<NodeData>);
        setConnectionTarget(targetNode as Node<NodeData>);
      }
    },
    [nodes]
  );

  const handleValidateConnection = useCallback(
    (sourceId: string, targetId: string) => {
      const sourceNode = nodes.find((n) => n.id === sourceId);
      const targetNode = nodes.find((n) => n.id === targetId);

      if (sourceNode && targetNode) {
        setConnectionSource(sourceNode as Node<NodeData>);
        setConnectionTarget(targetNode as Node<NodeData>);
      }
    },
    [nodes]
  );

  const handleConnectionAttempt = useCallback(
    (sourceId: string, targetId: string) => {
      addEdge(sourceId, targetId);
      setConnectionSource(null);
      setConnectionTarget(null);
    },
    [addEdge]
  );

  const handleClearConnection = useCallback(() => {
    setConnectionSource(null);
    setConnectionTarget(null);
  }, []);

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

      addNode(type, position);
    },
    [reactFlowInstance, addNode]
  );

  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      nodesToDelete.forEach((node) => deleteNode(node.id));
    },
    [deleteNode]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((edge) => deleteEdge(edge.id));
    },
    [deleteEdge]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const selectedNode = currentWorkflow?.nodes.find(
    (node) => node.id === selectedNodeId
  );

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Node Library */}
      <NodeLibrary />

      {/* Main Editor */}
      <div className="flex-1 flex bg-white min-w-0">
        <div className="flex-1 flex flex-col">
          <WorkflowToolbar />

          {/* Secondary Toolbar */}
          <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => togglePanel("nodeLibrary")}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Grid className="w-4 h-4" />
                <span className="font-medium">
                  {panelStates.nodeLibrary.isCollapsed ? "Show" : "Hide"}{" "}
                  Library
                </span>
              </button>

              <button
                onClick={() => setShowCopilot(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 rounded-lg hover:from-purple-100 hover:to-indigo-100 transition-colors border border-purple-200"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">AI Copilot</span>
              </button>

              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showSuggestions
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">
                  {showSuggestions ? "Hide" : "Show"} Suggestions
                </span>
              </button>

              <button
                onClick={() => setShowTutorial(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
              >
                <Play className="w-4 h-4" />
                <span className="font-medium">Tutorial</span>
              </button>

              {/* Execution Logger Toggle */}
              <button
                onClick={() => setShowExecutionLogger(!showExecutionLogger)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showExecutionLogger || isExecuting
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
                title="Toggle execution logger"
              >
                <Activity className="w-4 h-4" />
                <span className="font-medium">
                  {isExecuting ? "Executing..." : "Logs"}
                </span>
                {isExecuting && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
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
              {/* Execution Metrics */}
              {isExecuting && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                  <Activity className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-700">
                    {executionMetrics.completedNodes}/{nodes.length} completed
                  </span>
                  {executionMetrics.failedNodes > 0 && (
                    <span className="text-sm font-medium text-red-700">
                      ({executionMetrics.failedNodes} failed)
                    </span>
                  )}
                </div>
              )}

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
          <div className="flex-1 relative min-h-0" ref={reactFlowWrapper}>
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
              fitViewOptions={{
                padding: 0.1,
                includeHiddenNodes: false,
                minZoom: 0.1,
                maxZoom: 2,
              }}
              attributionPosition="bottom-left"
              className={`bg-gradient-to-br from-gray-50 to-blue-50/30 ${
                isExecuting ? "opacity-75" : ""
              }`}
              minZoom={0.1}
              maxZoom={2}
            >
              <Controls
                className="!bg-white !border !border-gray-200 !rounded-lg !shadow-lg !p-1"
                position="top-right"
                showInteractive={false}
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
                    case "databaseQuery":
                    case "databaseInsert":
                    case "databaseUpdate":
                    case "databaseDelete":
                      return "#06b6d4";
                    case "embeddingGenerator":
                      return "#f59e0b";
                    case "similaritySearch":
                      return "#f97316";
                    case "structuredOutput":
                      return "#8b5cf6";
                    default:
                      return "#6b7280";
                  }
                }}
                nodeStrokeWidth={2}
                nodeBorderRadius={4}
                maskColor="rgba(0, 0, 0, 0.1)"
                style={{
                  width: 200,
                  height: 120,
                }}
              />
              <Background
                variant={BackgroundVariant.Dots}
                gap={16}
                size={1}
                color="#e5e7eb"
                className="opacity-60"
              />
            </ReactFlow>
          </div>
        </div>

        {/* Connection Suggestions Panel */}
        {showSuggestions && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <ConnectionSuggestions
                nodes={nodes}
                edges={edges}
                onSuggestionClick={handleSuggestionClick}
                onValidateConnection={handleValidateConnection}
              />
            </div>
          </div>
        )}
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

      {/* Connection Validation */}
      <ConnectionValidation
        sourceNode={connectionSource}
        targetNode={connectionTarget}
        existingEdges={edges}
        onConnectionAttempt={handleConnectionAttempt}
        onClear={handleClearConnection}
      />

      {/* Interactive Tutorial */}
      <InteractiveTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => setShowTutorial(false)}
        workflowNodes={nodes}
        workflowEdges={edges}
      />

      {/* Execution Logger */}
      <ExecutionLogger
        executionId={activeExecutionId || undefined}
        isOpen={showExecutionLogger}
        onClose={() => setShowExecutionLogger(false)}
      />
    </div>
  );
};
