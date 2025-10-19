import React from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { ExecutionConfiguration } from "./ExecutionConfiguration";
import { ExecutionPlanPreview } from "./ExecutionPlanPreview";
import {
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Activity,
  TrendingUp,
  AlertTriangle,
  Copy,
  Download,
  Eye,
  EyeOff,
  Globe,
  Brain,
  ArrowRight,
  Settings,
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
  } = useWorkflowStore();

  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(
    new Set()
  );
  const [showOutputs, setShowOutputs] = React.useState(true);
  const [showConfig, setShowConfig] = React.useState(false);
  const [showStats, setShowStats] = React.useState(false);
  const [showPlanPreview, setShowPlanPreview] = React.useState(false);

  const handleExecute = async () => {
    if (currentWorkflow) {
      await executeWorkflow();
    }
  };

  const getNodeStatus = (nodeId: string) => {
    return executionResults[nodeId]?.status || "idle";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-50 border-blue-200 shadow-blue-100";
      case "success":
        return "bg-green-50 border-green-200 shadow-green-100";
      case "error":
        return "bg-red-50 border-red-200 shadow-red-100";
      default:
        return "bg-gray-50 border-gray-200 shadow-gray-100";
    }
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case "dataInput":
        return <ArrowRight className="w-4 h-4" />;
      case "webScraping":
        return <Globe className="w-4 h-4" />;
      case "llmTask":
        return <Brain className="w-4 h-4" />;
      case "dataOutput":
        return <ArrowRight className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(executionResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workflow_execution_${Date.now()}.json`;
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

  return (
    <div className="w-80 md:w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Execution</h3>
              <p className="text-sm text-gray-600">Monitor workflow progress</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Execution Mode Badge */}
            <div className="flex items-center space-x-1 px-2 py-1 bg-white/80 rounded-lg">
              {executionMode === "sequential" && (
                <Play className="w-3 h-3 text-blue-500" />
              )}
              {executionMode === "parallel" && (
                <Activity className="w-3 h-3 text-green-500" />
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
          </div>
        </div>

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
        </div>
      </div>

      {/* Node Status List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900">Node Status</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3" />
              <span>Real-time</span>
            </div>
          </div>

          <div className="space-y-3">
            {currentWorkflow.nodes.map((node, index) => {
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
                        <p className="text-xs text-gray-500 capitalize">
                          {node.data.type.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      {hasOutput && (
                        <button
                          onClick={() => toggleNodeExpansion(node.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded transition-colors"
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

                  {/* Status Details */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-2 py-1 rounded-full font-medium ${
                          status === "success"
                            ? "bg-green-100 text-green-700"
                            : status === "running"
                            ? "bg-blue-100 text-blue-700"
                            : status === "error"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {status}
                      </span>
                      {result?.executionTime && (
                        <span className="text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {result.executionTime}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  {result?.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-red-700">
                            Error
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {result.error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Output Data */}
                  {hasOutput && isExpanded && (
                    <div className="mt-3 p-3 bg-white/60 rounded-lg border border-white/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">
                          Output
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(result.data, null, 2)
                            )
                          }
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Copy output"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
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
