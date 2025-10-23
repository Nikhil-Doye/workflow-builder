import React from "react";
import { NodeData } from "../../types";
import { DatabaseOperation } from "../../types/database";
import {
  Database,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  GitBranch,
} from "lucide-react";

interface UnifiedDatabaseNodeProps {
  data: NodeData;
  selected: boolean;
}

export const UnifiedDatabaseNode: React.FC<UnifiedDatabaseNodeProps> = ({
  data,
  selected,
}) => {
  // Get operation display info
  const getOperationInfo = () => {
    const operation = data.config?.operation as DatabaseOperation;
    const operationIcons: Record<
      DatabaseOperation,
      React.ComponentType<any>
    > = {
      query: Search,
      insert: Plus,
      update: Edit,
      delete: Trash2,
      aggregate: BarChart3,
      transaction: GitBranch,
    };

    const operationLabels: Record<DatabaseOperation, string> = {
      query: "Query",
      insert: "Insert",
      update: "Update",
      delete: "Delete",
      aggregate: "Aggregate",
      transaction: "Transaction",
    };

    return {
      icon: operationIcons[operation] || Database,
      label: operationLabels[operation] || "Database",
    };
  };

  const operationInfo = getOperationInfo();
  const OperationIcon = operationInfo.icon;

  // Enhanced data for display
  const enhancedData = {
    ...data,
    label: data.label || operationInfo.label,
  };

  // Custom status display for database operations
  const getStatusDisplay = () => {
    if (data.status === "success" && data.outputs && data.outputs.length > 0) {
      const output = data.outputs[0];
      if (output.rowsAffected !== undefined) {
        return `${output.rowsAffected} rows affected`;
      }
      if (output.data && Array.isArray(output.data)) {
        return `${output.data.length} rows returned`;
      }
    }
    return null;
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="group min-w-[240px] bg-cyan-50 rounded-2xl border-2 border-cyan-200 shadow-lg transition-all duration-300 transform hover:scale-105">
      {/* Top Handle */}
      <div className="w-4 h-4 border-2 border-white bg-gray-400 hover:bg-gray-500 transition-colors rounded-full absolute -top-2 left-1/2 transform -translate-x-1/2" />

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-cyan-50 border border-white/50">
              <OperationIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {enhancedData.label}
              </h3>
              <p className="text-xs text-gray-500">
                {data.config?.connectionId ? `Connected` : "No connection"}
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            {data.status === "running" && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-100">
                <Clock className="w-3 h-3 text-blue-500 animate-spin" />
              </div>
            )}
            {data.status === "success" && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100">
                <CheckCircle className="w-3 h-3 text-green-500" />
              </div>
            )}
            {data.status === "error" && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100">
                <XCircle className="w-3 h-3 text-red-500" />
              </div>
            )}
          </div>
        </div>

        {/* Operation-specific preview */}
        {data.config && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {data.config.table && (
                <span className="px-2 py-1 bg-white/60 rounded-md text-xs text-gray-600 font-medium">
                  Table: {data.config.table}
                </span>
              )}
              {data.config.updateTable && (
                <span className="px-2 py-1 bg-white/60 rounded-md text-xs text-gray-600 font-medium">
                  Table: {data.config.updateTable}
                </span>
              )}
              {data.config.deleteTable && (
                <span className="px-2 py-1 bg-white/60 rounded-md text-xs text-gray-600 font-medium">
                  Table: {data.config.deleteTable}
                </span>
              )}
              {data.config.aggregateTable && (
                <span className="px-2 py-1 bg-white/60 rounded-md text-xs text-gray-600 font-medium">
                  Table: {data.config.aggregateTable}
                </span>
              )}
              {data.config.query && (
                <span className="px-2 py-1 bg-white/60 rounded-md text-xs text-gray-500">
                  Query:{" "}
                  {data.config.query.length > 20
                    ? `${data.config.query.substring(0, 20)}...`
                    : data.config.query}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Success status display */}
        {statusDisplay && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-700 font-medium">
                {statusDisplay}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {data.error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-700 font-medium">Error</span>
            </div>
            <p className="text-xs text-red-600 mt-1 truncate">{data.error}</p>
          </div>
        )}
      </div>

      {/* Bottom Accent Bar */}
      <div className="h-1 rounded-b-2xl bg-cyan-500" />

      {/* Bottom Handle */}
      <div className="w-4 h-4 border-2 border-white bg-gray-400 hover:bg-gray-500 transition-colors rounded-full absolute -bottom-2 left-1/2 transform -translate-x-1/2" />
    </div>
  );
};
