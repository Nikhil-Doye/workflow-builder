import React from "react";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ExecutionData {
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  progress?: number;
  duration?: number;
  output?: any;
  error?: string;
  retryCount?: number;
}

interface NodeExecutionIndicatorProps {
  nodeId: string;
  executionData?: ExecutionData;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const NodeExecutionIndicator: React.FC<NodeExecutionIndicatorProps> = ({
  nodeId,
  executionData,
  isExpanded,
  onToggleExpand,
}) => {
  if (!executionData) return null;

  const { status, progress, duration, output, error, retryCount } =
    executionData;

  const getStatusColor = () => {
    switch (status) {
      case "running":
        return "border-blue-500 bg-blue-50";
      case "completed":
        return "border-green-500 bg-green-50";
      case "failed":
        return "border-red-500 bg-red-50";
      case "skipped":
        return "border-yellow-500 bg-yellow-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <Zap className="w-4 h-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "skipped":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute inset-0 rounded-2xl border-2 pointer-events-auto transition-all ${getStatusColor()}`}
      style={{ zIndex: 1000 }}
    >
      {/* Status Overlay Badge */}
      <div className="absolute -top-3 -right-3 flex items-center space-x-1 px-2 py-1 bg-white rounded-full shadow-lg border border-gray-200">
        {getStatusIcon()}
        <span className="text-xs font-semibold capitalize text-gray-900">
          {status}
        </span>
        {retryCount ? (
          <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
            Retry {retryCount}
          </span>
        ) : null}
      </div>

      {/* Progress Bar */}
      {status === "running" && progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Execution Time */}
      {duration && status === "completed" && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500 font-medium">
          {duration}ms
        </div>
      )}

      {/* Error Badge */}
      {status === "failed" && error && (
        <div className="absolute top-12 left-0 right-0 mx-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 font-medium truncate">
          {error}
        </div>
      )}

      {/* Output Preview */}
      {status === "completed" && output && isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border border-green-300 rounded-lg shadow-lg z-50 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Output</span>
            <button
              onClick={onToggleExpand}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronUp className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-48">
            {typeof output === "string"
              ? output
              : JSON.stringify(output, null, 2)}
          </pre>
        </div>
      )}

      {/* Output Toggle Button */}
      {status === "completed" && output && !isExpanded && (
        <button
          onClick={onToggleExpand}
          className="absolute -bottom-6 right-0 flex items-center space-x-1 text-xs text-green-600 font-medium hover:text-green-700 transition-colors"
        >
          <span>View output</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
