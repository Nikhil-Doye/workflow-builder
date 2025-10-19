import React from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { Card } from "./ui/card";
import {
  Play,
  Activity,
  GitBranch,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Layers,
  ArrowRight,
  Globe,
  Brain,
  Database,
  FileText,
  Search,
} from "lucide-react";

interface ExecutionPlanPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutionPlanPreview: React.FC<ExecutionPlanPreviewProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentWorkflow, executionMode, currentExecution } =
    useWorkflowStore();

  if (!isOpen || !currentWorkflow) return null;

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case "dataInput":
        return <ArrowRight className="w-4 h-4 text-blue-500" />;
      case "webScraping":
        return <Globe className="w-4 h-4 text-green-500" />;
      case "llmTask":
        return <Brain className="w-4 h-4 text-purple-500" />;
      case "embeddingGenerator":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "similaritySearch":
        return <Search className="w-4 h-4 text-orange-500" />;
      case "structuredOutput":
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case "dataOutput":
        return <ArrowRight className="w-4 h-4 text-gray-500" />;
      case "databaseQuery":
      case "databaseInsert":
      case "databaseUpdate":
      case "databaseDelete":
        return <Database className="w-4 h-4 text-cyan-500" />;
      default:
        return <Zap className="w-4 h-4 text-gray-500" />;
    }
  };

  const getExecutionModeInfo = () => {
    switch (executionMode) {
      case "sequential":
        return {
          icon: <Play className="w-5 h-5 text-blue-500" />,
          title: "Sequential Execution",
          description:
            "Nodes will execute one after another in dependency order",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        };
      case "parallel":
        return {
          icon: <Activity className="w-5 h-5 text-green-500" />,
          title: "Parallel Execution",
          description: "Independent nodes will execute simultaneously",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "conditional":
        return {
          icon: <GitBranch className="w-5 h-5 text-purple-500" />,
          title: "Conditional Execution",
          description: "Nodes will execute based on conditions and branches",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
        };
      default:
        return {
          icon: <Play className="w-5 h-5 text-gray-500" />,
          title: "Unknown Mode",
          description: "Execution mode not recognized",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const modeInfo = getExecutionModeInfo();

  // Analyze workflow structure for execution insights
  const analyzeWorkflow = () => {
    const nodes = currentWorkflow.nodes;
    const edges = currentWorkflow.edges;

    // Find entry points (nodes with no incoming edges)
    const entryPoints = nodes.filter(
      (node) => !edges.some((edge) => edge.target === node.id)
    );

    // Find exit points (nodes with no outgoing edges)
    const exitPoints = nodes.filter(
      (node) => !edges.some((edge) => edge.source === node.id)
    );

    // Find parallel opportunities
    const parallelGroups: Array<{
      level: number;
      nodes: string[];
      count: number;
    }> = [];
    if (executionMode === "parallel") {
      // Simple heuristic: nodes at the same "level" can run in parallel
      const levels = new Map<string, number>();
      const visited = new Set<string>();

      const calculateLevel = (nodeId: string, level: number = 0) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const currentLevel = Math.max(level, levels.get(nodeId) || 0);
        levels.set(nodeId, currentLevel);

        // Find children
        const children = edges
          .filter((edge) => edge.source === nodeId)
          .map((edge) => edge.target);

        children.forEach((childId) => {
          calculateLevel(childId, currentLevel + 1);
        });
      };

      entryPoints.forEach((node) => calculateLevel(node.id));

      // Group nodes by level
      const levelGroups = new Map<number, string[]>();
      levels.forEach((level, nodeId) => {
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(nodeId);
      });

      // Convert to parallel groups
      levelGroups.forEach((nodeIds, level) => {
        if (nodeIds.length > 1) {
          parallelGroups.push({
            level,
            nodes: nodeIds,
            count: nodeIds.length,
          });
        }
      });
    }

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      entryPoints: entryPoints.length,
      exitPoints: exitPoints.length,
      parallelGroups,
      estimatedDuration: nodes.length * 1000, // Rough estimate
    };
  };

  const analysis = analyzeWorkflow();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Execution Plan Preview
                </h2>
                <p className="text-sm text-gray-600">
                  Preview how your workflow will be executed
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <AlertTriangle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Execution Mode Overview */}
            <Card
              className={`p-4 ${modeInfo.bgColor} ${modeInfo.borderColor} border-2`}
            >
              <div className="flex items-center space-x-3 mb-3">
                {modeInfo.icon}
                <h3 className={`text-lg font-semibold ${modeInfo.color}`}>
                  {modeInfo.title}
                </h3>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                {modeInfo.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">
                    Total Nodes:
                  </span>
                  <span className="ml-2 font-semibold">
                    {analysis.totalNodes}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Total Edges:
                  </span>
                  <span className="ml-2 font-semibold">
                    {analysis.totalEdges}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Entry Points:
                  </span>
                  <span className="ml-2 font-semibold">
                    {analysis.entryPoints}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Exit Points:
                  </span>
                  <span className="ml-2 font-semibold">
                    {analysis.exitPoints}
                  </span>
                </div>
              </div>
            </Card>

            {/* Parallel Groups (if applicable) */}
            {executionMode === "parallel" &&
              analysis.parallelGroups.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Parallel Execution Groups
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {analysis.parallelGroups.map((group, index) => (
                      <div
                        key={index}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-green-800">
                            Level {group.level}
                          </span>
                          <span className="text-sm text-green-600">
                            {group.count} nodes in parallel
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.nodes.map((nodeId) => {
                            const node = currentWorkflow.nodes.find(
                              (n) => n.id === nodeId
                            );
                            return node ? (
                              <div
                                key={nodeId}
                                className="flex items-center space-x-1 px-2 py-1 bg-white rounded text-xs"
                              >
                                {getNodeTypeIcon(node.data.type)}
                                <span className="text-gray-700">
                                  {node.data.label}
                                </span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            {/* Node Execution Order */}
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Execution Order
                </h3>
              </div>
              <div className="space-y-2">
                {currentWorkflow.nodes.map((node, index) => (
                  <div
                    key={node.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getNodeTypeIcon(node.data.type)}
                      <span className="font-medium text-gray-900">
                        {node.data.label}
                      </span>
                    </div>
                    <div className="ml-auto text-xs text-gray-500 capitalize">
                      {node.data.type.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Current Execution Status */}
            {currentExecution && (
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Current Execution Status
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span
                      className={`ml-2 font-semibold capitalize ${
                        currentExecution.status === "completed"
                          ? "text-green-600"
                          : currentExecution.status === "running"
                          ? "text-blue-600"
                          : currentExecution.status === "failed"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {currentExecution.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Duration:</span>
                    <span className="ml-2 font-semibold">
                      {currentExecution.totalDuration
                        ? `${currentExecution.totalDuration}ms`
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Start Time:
                    </span>
                    <span className="ml-2 font-semibold">
                      {currentExecution.startTime
                        ? new Date(
                            currentExecution.startTime
                          ).toLocaleTimeString()
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">End Time:</span>
                    <span className="ml-2 font-semibold">
                      {currentExecution.endTime
                        ? new Date(
                            currentExecution.endTime
                          ).toLocaleTimeString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
