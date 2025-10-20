import React from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { ExecutionConfiguration } from "./ExecutionConfiguration";
import { ExecutionPlanPreview } from "./ExecutionPlanPreview";
import {
  Zap,
  Play,
  Square,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Settings,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Layers,
  GitBranch,
} from "lucide-react";

export const ExecutionPanel: React.FC = () => {
  const {
    currentWorkflow,
    isExecuting,
    executionResults,
    executeWorkflow,
    clearExecutionResults,
    executionMode,
    currentExecution,
    getExecutionStats,
    panelStates,
    togglePanel,
  } = useWorkflowStore();

  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(
    new Set()
  );
  const [showOutputs, setShowOutputs] = React.useState(true);
  const [showStats, setShowStats] = React.useState(false);
  const [showConfig, setShowConfig] = React.useState(false);
  const [showPlanPreview, setShowPlanPreview] = React.useState(false);

  const handleExecute = async () => {
    if (isExecuting) {
      // Stop execution logic would go here
      return;
    }

    if (!currentWorkflow) return;

    try {
      await executeWorkflow();
    } catch (error) {
      console.error("Execution failed:", error);
    }
  };

  const createTestWorkflow = () => {
    if (!currentWorkflow) return;

    // Create a simple test workflow with data input and data output
    const testNodes = [
      {
        id: "data-input-1",
        type: "dataInput",
        position: { x: 100, y: 100 },
        data: {
          id: "data-input-1",
          type: "dataInput" as const,
          label: "Test Input",
          status: "idle" as const,
          config: {
            defaultValue: "Hello, World! This is a test workflow.",
          },
          inputs: [],
          outputs: [],
        },
      },
      {
        id: "data-output-1",
        type: "dataOutput",
        position: { x: 400, y: 100 },
        data: {
          id: "data-output-1",
          type: "dataOutput" as const,
          label: "Test Output",
          status: "idle" as const,
          config: {},
          inputs: [],
          outputs: [],
        },
      },
    ];

    const testEdges = [
      {
        id: "edge-1",
        source: "data-input-1",
        target: "data-output-1",
      },
    ];

    // Update the current workflow with test nodes
    const updatedWorkflow = {
      ...currentWorkflow,
      nodes: testNodes,
      edges: testEdges,
      updatedAt: new Date(),
    };

    // Update the store
    const { updateWorkflow } = useWorkflowStore.getState();
    updateWorkflow(currentWorkflow.id, updatedWorkflow);

    console.log("Test workflow created successfully!");
  };

  const getNodeStatus = (nodeId: string) => {
    const result = executionResults[nodeId];
    if (!result) return "idle";
    return result.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "running":
        return "border-blue-200 bg-blue-50";
      case "pending":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getNodeTypeIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case "dataInput":
        return <Play className={`${iconClass} text-blue-500`} />;
      case "webScraping":
        return <Download className={`${iconClass} text-green-500`} />;
      case "llmTask":
        return <Zap className={`${iconClass} text-purple-500`} />;
      case "dataOutput":
        return <Download className={`${iconClass} text-orange-500`} />;
      default:
        return <Settings className={`${iconClass} text-gray-500`} />;
    }
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(executionResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workflow-results-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!currentWorkflow) return null;

  const completedNodes = Object.values(executionResults).filter(
    (result) => result.status === "success"
  ).length;
  const totalNodes = currentWorkflow.nodes.length;
  const progressPercentage =
    totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

  const isCollapsed = panelStates.executionPanel.isCollapsed;
  const isHidden = panelStates.executionPanel.isHidden;

  if (isHidden) return null;

  return (
    <div
      className={`bg-white border-l border-gray-200 flex flex-col shadow-lg transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-72 lg:w-80"
      }`}
    >
      {/* Header */}
      <div
        className={`border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${
          isCollapsed ? "p-2" : "p-6"
        }`}
      >
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          } ${isCollapsed ? "" : "mb-4"}`}
        >
          {isCollapsed ? (
            <button
              onClick={() => togglePanel("executionPanel")}
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-indigo-600 transition-colors"
              title="Expand Execution Panel"
            >
              <Zap className="w-5 h-5 text-white" />
            </button>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Execution
                  </h3>
                  <p className="text-sm text-gray-600">
                    Monitor workflow progress
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Execution Mode Badge */}
                <div className="flex items-center space-x-1 px-2 py-1 bg-white/80 rounded-lg">
                  {executionMode === "sequential" && (
                    <Play className="w-3 h-3 text-blue-500" />
                  )}
                  {executionMode === "parallel" && (
                    <Layers className="w-3 h-3 text-green-500" />
                  )}
                  {executionMode === "conditional" && (
                    <GitBranch className="w-3 h-3 text-purple-500" />
                  )}
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {executionMode}
                  </span>
                </div>

                <button
                  onClick={() => setShowStats(!showStats)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showStats ? "Hide statistics" : "Show statistics"}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowPlanPreview(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Execution plan preview"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConfig(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Execution configuration"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowOutputs(!showOutputs)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showOutputs ? "Hide outputs" : "Show outputs"}
                >
                  {showOutputs ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={downloadResults}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download results"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => togglePanel("executionPanel")}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Collapse panel"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>
                  {completedNodes}/{totalNodes} nodes
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isExecuting ? (
                  <>
                    <Square className="w-4 h-4" />
                    <span className="font-medium">Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="font-medium">Execute</span>
                  </>
                )}
              </button>

              <button
                onClick={clearExecutionResults}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
                title="Clear results"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={createTestWorkflow}
                className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all duration-200"
                title="Create test workflow"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Node Status List */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-900">
                Node Status
              </h4>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3" />
                <span>Real-time</span>
              </div>
            </div>

            {/* Validation Error Display */}
            {executionResults.validation && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-800 mb-1">
                      Workflow Validation Failed
                    </h4>
                    <p className="text-sm text-red-700 mb-2">
                      {executionResults.validation.error}
                    </p>
                    <p className="text-xs text-red-600">
                      Please fix the workflow structure before executing again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {currentWorkflow?.nodes.map((node, index) => {
                const status = getNodeStatus(node.id);
                const result = executionResults[node.id];
                const isExpanded = expandedNodes.has(node.id);
                const hasOutput = result?.data && showOutputs;

                return (
                  <div
                    key={node.id}
                    className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${getStatusColor(
                      status
                    )}`}
                  >
                    {/* Node Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">
                              {index + 1}
                            </span>
                          </div>
                          {getNodeTypeIcon(node.data.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-gray-900 truncate">
                            {node.data.label}
                          </h5>
                          <p className="text-xs text-gray-500 truncate">
                            {node.data.type}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Status Icon */}
                        <div className="flex items-center space-x-1">
                          {status === "success" && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {status === "error" && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          {status === "running" && (
                            <Clock className="w-4 h-4 text-blue-500 animate-spin" />
                          )}
                          {status === "pending" && (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          )}
                          {status === "idle" && (
                            <div className="w-4 h-4 rounded-full bg-gray-300" />
                          )}
                        </div>

                        {/* Expand/Collapse Button */}
                        {hasOutput && (
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedNodes);
                              if (isExpanded) {
                                newExpanded.delete(node.id);
                              } else {
                                newExpanded.add(node.id);
                              }
                              setExpandedNodes(newExpanded);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Node Output */}
                    {hasOutput && isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="bg-white rounded-lg p-3">
                          <h6 className="text-xs font-semibold text-gray-700 mb-2">
                            Output:
                          </h6>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution Statistics */}
          {showStats && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2 mb-3">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <h4 className="text-sm font-semibold text-gray-900">
                  Statistics
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const stats = getExecutionStats();
                  return [
                    {
                      label: "Total",
                      value: stats.totalExecutions,
                      color: "text-gray-600",
                    },
                    {
                      label: "Active",
                      value: stats.activeExecutions,
                      color: "text-blue-600",
                    },
                    {
                      label: "Completed",
                      value: stats.completedExecutions,
                      color: "text-green-600",
                    },
                    {
                      label: "Failed",
                      value: stats.failedExecutions,
                      color: "text-red-600",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="text-center p-2 bg-white rounded-lg"
                    >
                      <div className={`text-lg font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ));
                })()}
              </div>
              <div className="mt-3 text-center p-2 bg-white rounded-lg">
                <div className="text-sm font-semibold text-gray-900">
                  Avg: {Math.round(getExecutionStats().averageDuration)}ms
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Execution Configuration Modal */}
      <ExecutionConfiguration
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />

      {/* Execution Plan Preview Modal */}
      <ExecutionPlanPreview
        isOpen={showPlanPreview}
        onClose={() => setShowPlanPreview(false)}
      />
    </div>
  );
};
