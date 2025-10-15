import React from "react";
import { useWorkflowStore } from "../store/workflowStore";
import {
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export const ExecutionPanel: React.FC = () => {
  const {
    currentWorkflow,
    isExecuting,
    executionResults,
    executeWorkflow,
    clearExecutionResults,
  } = useWorkflowStore();

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
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
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
        return "bg-blue-50 border-blue-200";
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (!currentWorkflow) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Execution Panel
        </h3>

        <div className="space-y-3">
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExecuting ? (
              <>
                <Square className="w-4 h-4" />
                <span>Stop Execution</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Execute Workflow</span>
              </>
            )}
          </button>

          <button
            onClick={clearExecutionResults}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Results</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Execution Status
        </h4>

        <div className="space-y-2">
          {currentWorkflow.nodes.map((node) => {
            const status = getNodeStatus(node.id);
            const result = executionResults[node.id];

            return (
              <div
                key={node.id}
                className={`p-3 rounded-lg border ${getStatusColor(status)}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(status)}
                  <span className="text-sm font-medium text-gray-900">
                    {node.data.label}
                  </span>
                </div>

                <div className="text-xs text-gray-600">
                  Status:{" "}
                  <span className="font-medium capitalize">{status}</span>
                </div>

                {result?.executionTime && (
                  <div className="text-xs text-gray-600">
                    Time:{" "}
                    <span className="font-medium">
                      {result.executionTime}ms
                    </span>
                  </div>
                )}

                {result?.error && (
                  <div className="text-xs text-red-600 mt-1 p-2 bg-red-100 rounded">
                    {result.error}
                  </div>
                )}

                {result?.data && (
                  <div className="text-xs text-gray-600 mt-1">
                    <details>
                      <summary className="cursor-pointer font-medium">
                        View Output
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
