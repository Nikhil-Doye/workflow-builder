import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { NodeData } from "../../types";
import {
  Globe,
  FileText,
  Brain,
  Search,
  Database,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { clsx } from "clsx";

const nodeIcons = {
  webScraping: Globe,
  structuredOutput: FileText,
  embeddingGenerator: Brain,
  similaritySearch: Search,
  llmTask: Database,
  dataInput: ArrowUpFromLine,
  dataOutput: ArrowDownToLine,
};

const statusColors = {
  idle: "border-gray-300 bg-white",
  running: "border-blue-400 bg-blue-50",
  success: "border-green-400 bg-green-50",
  error: "border-red-400 bg-red-50",
};

const statusIcons = {
  idle: null,
  running: Loader2,
  success: CheckCircle,
  error: XCircle,
};

interface BaseNodeProps extends NodeProps {
  data: NodeData;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  data,
  selected,
  ...props
}) => {
  const Icon = nodeIcons[data.type];
  const StatusIcon = statusIcons[data.status];

  return (
    <div
      className={clsx(
        "min-w-[200px] p-4 rounded-lg border-2 shadow-lg transition-all duration-200",
        statusColors[data.status],
        selected && "ring-2 ring-primary-500 ring-opacity-50",
        data.status === "running" && "animate-pulse"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-white bg-gray-400"
      />

      <div className="flex items-center space-x-2 mb-2">
        <Icon className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-sm text-gray-800">{data.label}</span>
        {StatusIcon && (
          <StatusIcon
            className={clsx(
              "w-4 h-4",
              data.status === "running" && "animate-spin text-blue-500",
              data.status === "success" && "text-green-500",
              data.status === "error" && "text-red-500"
            )}
          />
        )}
      </div>

      <div className="text-xs text-gray-600 mb-2">
        {data.type.replace(/([A-Z])/g, " $1").trim()}
      </div>

      {data.error && (
        <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
          {data.error}
        </div>
      )}

      {data.outputs.length > 0 && (
        <div className="text-xs text-green-600 bg-green-100 p-2 rounded mt-2">
          Output: {JSON.stringify(data.outputs[0]).slice(0, 50)}...
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-white bg-gray-400"
      />
    </div>
  );
};
