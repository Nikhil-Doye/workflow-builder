import React from "react";
import { NodeProps } from "reactflow";
import { BaseNode } from "./BaseNode";
import { Database, CheckCircle, XCircle, Clock } from "lucide-react";

interface DatabaseQueryNodeProps extends NodeProps {
  data: any;
}

export const DatabaseQueryNode: React.FC<DatabaseQueryNodeProps> = (props) => {
  const getStatusIcon = () => {
    switch (props.data.status) {
      case "running":
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (props.data.status) {
      case "running":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "success":
        return "bg-green-50 border-green-200 text-green-700";
      case "error":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <BaseNode {...props}>
      <div className={`p-4 rounded-lg border-2 ${getStatusColor()}`}>
        <div className="flex items-center space-x-2 mb-2">
          {getStatusIcon()}
          <span className="font-semibold text-sm">Database Query</span>
        </div>

        <div className="text-xs space-y-1">
          <div className="flex items-center space-x-1">
            <Database className="w-3 h-3" />
            <span className="font-medium">
              {props.data.config?.connector || "No connector"}
            </span>
          </div>

          {props.data.config?.query && (
            <div className="mt-2 p-2 bg-white/50 rounded text-xs font-mono">
              {props.data.config.query.length > 50
                ? `${props.data.config.query.substring(0, 50)}...`
                : props.data.config.query}
            </div>
          )}

          {props.data.status === "success" &&
            props.data.config?.resultCount && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                <span>{props.data.config.resultCount} rows</span>
              </div>
            )}

          {props.data.status === "error" && props.data.error && (
            <div className="text-red-600 text-xs">{props.data.error}</div>
          )}
        </div>
      </div>
    </BaseNode>
  );
};
