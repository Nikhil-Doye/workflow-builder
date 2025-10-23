import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { NodeData, NodeType } from "../../types";
import {
  Globe,
  FileText,
  Brain,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  MessageSquare,
} from "lucide-react";
import { clsx } from "clsx";

const nodeIcons: Record<NodeType, React.ComponentType<any>> = {
  webScraping: Globe,
  structuredOutput: FileText,
  embeddingGenerator: Brain,
  similaritySearch: Search,
  llmTask: Brain,
  dataInput: ArrowUpFromLine,
  dataOutput: ArrowDownToLine,
  database: Database,
  slack: MessageSquare,
};

const nodeColors: Record<
  NodeType,
  { bg: string; border: string; icon: string; accent: string }
> = {
  webScraping: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "text-green-600",
    accent: "bg-green-500",
  },
  structuredOutput: {
    bg: "bg-pink-50",
    border: "border-pink-200",
    icon: "text-pink-600",
    accent: "bg-pink-500",
  },
  embeddingGenerator: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "text-indigo-600",
    accent: "bg-indigo-500",
  },
  similaritySearch: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "text-orange-600",
    accent: "bg-orange-500",
  },
  llmTask: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "text-purple-600",
    accent: "bg-purple-500",
  },
  dataInput: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-600",
    accent: "bg-blue-500",
  },
  dataOutput: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-600",
    accent: "bg-blue-500",
  },
  database: {
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    icon: "text-cyan-600",
    accent: "bg-cyan-500",
  },
  slack: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "text-purple-600",
    accent: "bg-purple-500",
  },
};

const statusConfig = {
  idle: {
    icon: null,
    color: "text-gray-400",
    bg: "bg-gray-100",
    pulse: false,
  },
  running: {
    icon: Loader2,
    color: "text-blue-500",
    bg: "bg-blue-100",
    pulse: true,
  },
  success: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-100",
    pulse: false,
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-100",
    pulse: false,
  },
  error: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-100",
    pulse: false,
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-100",
    pulse: false,
  },
};

interface BaseNodeProps extends NodeProps {
  data: NodeData;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  data,
  selected,
  ...props
}) => {
  // Debug logging
  if (!data.type || !data.status) {
    console.warn("BaseNode received invalid data:", data);
  }

  const Icon = nodeIcons[data.type] || FileText;
  const colors = nodeColors[data.type] || nodeColors.dataInput;
  const status = statusConfig[data.status] || statusConfig.idle;
  const StatusIcon = status.icon;

  return (
    <div
      className={clsx(
        "group min-w-[240px] bg-white rounded-2xl border-2 shadow-lg transition-all duration-300 transform hover:scale-105",
        colors.bg,
        colors.border,
        selected && "ring-2 ring-blue-500 ring-opacity-50 shadow-xl",
        data.status === "running" && status.pulse && "animate-pulse"
      )}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 border-2 border-white bg-gray-400 hover:bg-gray-500 transition-colors"
        style={{ top: -8 }}
      />

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                colors.bg,
                "border border-white/50"
              )}
            >
              <Icon className={clsx("w-5 h-5", colors.icon)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {data.label}
              </h3>
              <p className="text-xs text-gray-500 capitalize">
                {data.type.replace(/([A-Z])/g, " $1").trim()}
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            {StatusIcon && (
              <div
                className={clsx(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  status.bg
                )}
              >
                <StatusIcon
                  className={clsx(
                    "w-3 h-3",
                    status.color,
                    data.status === "running" && "animate-spin"
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Configuration Preview */}
        {data.config && Object.keys(data.config).length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.config)
                .slice(0, 2)
                .map(([key, value]) => (
                  <span
                    key={key}
                    className="px-2 py-1 bg-white/60 rounded-md text-xs text-gray-600 font-medium"
                  >
                    {key}: {String(value).slice(0, 10)}...
                  </span>
                ))}
              {Object.keys(data.config).length > 2 && (
                <span className="px-2 py-1 bg-white/60 rounded-md text-xs text-gray-500">
                  +{Object.keys(data.config).length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {data.error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-700 font-medium">Error</span>
            </div>
            <p className="text-xs text-red-600 mt-1 truncate">{data.error}</p>
          </div>
        )}

        {/* Success State */}
        {data.status === "success" && data.outputs.length > 0 && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-700 font-medium">
                Success
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1 truncate">Output ready</p>
          </div>
        )}
      </div>

      {/* Bottom Accent Bar */}
      <div
        className={clsx(
          "h-1 rounded-b-2xl",
          colors.accent,
          data.status === "running" && "animate-pulse"
        )}
      />

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 border-2 border-white bg-gray-400 hover:bg-gray-500 transition-colors"
        style={{ bottom: -8 }}
      />
    </div>
  );
};
