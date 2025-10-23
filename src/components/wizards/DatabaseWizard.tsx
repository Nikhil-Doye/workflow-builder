import React, { useState, useEffect } from "react";
import { DatabaseConfig, DatabaseOperation } from "../../types/database";

interface DatabaseWizardProps {
  config: DatabaseConfig;
  onConfigChange: (config: DatabaseConfig) => void;
  onClose: () => void;
}

export const DatabaseWizard: React.FC<DatabaseWizardProps> = ({
  config,
  onConfigChange,
  onClose,
}) => {
  const [operation, setOperation] = useState<DatabaseOperation>(
    config.operation || "query"
  );

  // Update config when operation changes
  useEffect(() => {
    onConfigChange({
      ...config,
      operation,
    });
  }, [operation]);

  const renderOperationFields = () => {
    switch (operation) {
      case "query":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SQL Query
              </label>
              <textarea
                value={config.query || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, query: e.target.value })
                }
                placeholder="SELECT * FROM users WHERE id = ?"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Parameters (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.parameters || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    onConfigChange({ ...config, parameters: parsed });
                  } catch {
                    // Invalid JSON, keep the text for editing
                  }
                }}
                placeholder='{"id": 123, "name": "John"}'
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
          </div>
        );

      case "insert":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Table Name
              </label>
              <input
                type="text"
                value={config.table || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, table: e.target.value })
                }
                placeholder="users"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.data || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    onConfigChange({ ...config, data: parsed });
                  } catch {
                    // Invalid JSON, keep the text for editing
                  }
                }}
                placeholder='{"name": "John", "email": "john@example.com"}'
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                On Conflict
              </label>
              <select
                value={config.onConflict || "error"}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    onConflict: e.target.value as any,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="error">Error</option>
                <option value="ignore">Ignore</option>
                <option value="update">Update</option>
              </select>
            </div>
          </div>
        );

      case "update":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Table Name
              </label>
              <input
                type="text"
                value={config.updateTable || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, updateTable: e.target.value })
                }
                placeholder="users"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Set Clause (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.setClause || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    onConfigChange({ ...config, setClause: parsed });
                  } catch {
                    // Invalid JSON, keep the text for editing
                  }
                }}
                placeholder='{"name": "John", "email": "john@example.com"}'
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Where Clause (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.whereClause || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    onConfigChange({ ...config, whereClause: parsed });
                  } catch {
                    // Invalid JSON, keep the text for editing
                  }
                }}
                placeholder='{"id": 123}'
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
          </div>
        );

      case "delete":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Table Name
              </label>
              <input
                type="text"
                value={config.deleteTable || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, deleteTable: e.target.value })
                }
                placeholder="users"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Where Clause (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.deleteWhereClause || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    onConfigChange({ ...config, deleteWhereClause: parsed });
                  } catch {
                    // Invalid JSON, keep the text for editing
                  }
                }}
                placeholder='{"id": 123}'
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
          </div>
        );

      case "aggregate":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Table Name
              </label>
              <input
                type="text"
                value={config.aggregateTable || ""}
                onChange={(e) =>
                  onConfigChange({ ...config, aggregateTable: e.target.value })
                }
                placeholder="users"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Function
                </label>
                <select
                  value={config.aggregateFunction || "count"}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      aggregateFunction: e.target.value as any,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="count">Count</option>
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Column
                </label>
                <input
                  type="text"
                  value={config.aggregateColumn || ""}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      aggregateColumn: e.target.value,
                    })
                  }
                  placeholder="age"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        );

      case "transaction":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Transaction Queries (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.transactionQueries || [], null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    onConfigChange({ ...config, transactionQueries: parsed });
                  } catch {
                    // Invalid JSON, keep the text for editing
                  }
                }}
                placeholder='[{"type": "insert", "config": {"table": "users", "data": {"name": "John"}}}]'
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rollbackOnError"
                checked={config.rollbackOnError || false}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    rollbackOnError: e.target.checked,
                  })
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="rollbackOnError"
                className="ml-2 block text-sm text-gray-900"
              >
                Rollback on error
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Configure Database Operation
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Operation Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Operation Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "query", label: "Query", desc: "SELECT data" },
                { value: "insert", label: "Insert", desc: "Add records" },
                { value: "update", label: "Update", desc: "Modify records" },
                { value: "delete", label: "Delete", desc: "Remove records" },
                {
                  value: "aggregate",
                  label: "Aggregate",
                  desc: "Count, sum, etc.",
                },
                {
                  value: "transaction",
                  label: "Transaction",
                  desc: "Multiple operations",
                },
              ].map((op) => (
                <button
                  key={op.value}
                  onClick={() => setOperation(op.value as DatabaseOperation)}
                  className={`p-3 text-left rounded-lg border-2 transition-colors ${
                    operation === op.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">{op.label}</div>
                  <div className="text-xs text-gray-500">{op.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Database Connection
            </label>
            <input
              type="text"
              value={config.connectionId || ""}
              onChange={(e) =>
                onConfigChange({ ...config, connectionId: e.target.value })
              }
              placeholder="connection-id"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Dynamic Fields Based on Operation */}
          {renderOperationFields()}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
