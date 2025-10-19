import React, { useState, useEffect } from "react";
import {
  Database,
  TestTube,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Table,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import {
  databaseConnectionManager,
  DatabaseConnection,
} from "../services/databaseConnectionManager";
import { DatabaseConnectionManager } from "./DatabaseConnectionManager";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface DatabaseNodeConfigurationProps {
  nodeId: string;
  data: any;
  onClose: () => void;
  onConfigChange: (key: string, value: any) => void;
}

export const DatabaseNodeConfiguration: React.FC<
  DatabaseNodeConfigurationProps
> = ({ nodeId, data, onClose, onConfigChange }) => {
  const [selectedConnection, setSelectedConnection] =
    useState<DatabaseConnection | null>(null);
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [testingQuery, setTestingQuery] = useState(false);
  const [showQueryResult, setShowQueryResult] = useState(false);

  const nodeType = data.type;
  const config = data.config || {};

  useEffect(() => {
    if (config.connectionId) {
      const connection = databaseConnectionManager.getConnection(
        config.connectionId
      );
      if (connection) {
        setSelectedConnection(connection);
        loadTables(connection.id);
      }
    }
  }, [config.connectionId]);

  const handleConnectionSelect = async (connectionId: string) => {
    const connection = databaseConnectionManager.getConnection(connectionId);
    if (connection) {
      setSelectedConnection(connection);
      onConfigChange("connectionId", connectionId);
      onConfigChange("connectionName", connection.name);
      onConfigChange("connectionType", connection.type);

      // Auto-connect if not connected
      if (connection.status !== "connected") {
        await databaseConnectionManager.connect(connectionId);
      }

      await loadTables(connectionId);
    }
    setShowConnectionManager(false);
  };

  const loadTables = async (connectionId: string) => {
    setLoadingTables(true);
    try {
      const result = await databaseConnectionManager.listTables(connectionId);
      if (result.success) {
        setTables(result.data || []);
      }
    } catch (error) {
      console.error("Error loading tables:", error);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleTestQuery = async () => {
    if (!selectedConnection || !config.query) return;

    setTestingQuery(true);
    try {
      const result = await databaseConnectionManager.executeQuery(
        selectedConnection.id,
        config.query,
        config.params ? JSON.parse(config.params) : []
      );

      setQueryResult(result);
      setShowQueryResult(true);
    } catch (error) {
      console.error("Error testing query:", error);
      setQueryResult({
        error: error instanceof Error ? error.message : "Query failed",
      });
      setShowQueryResult(true);
    } finally {
      setTestingQuery(false);
    }
  };

  const getQueryPlaceholder = () => {
    if (!selectedConnection) return "Select a connection first";

    switch (selectedConnection.type) {
      case "mongodb":
        return "db.collection.find({})";
      case "mysql":
        return "SELECT * FROM table_name WHERE condition";
      case "postgresql":
        return "SELECT * FROM table_name WHERE condition";
      default:
        return "Enter your query";
    }
  };

  const getOperationType = () => {
    switch (nodeType) {
      case "databaseQuery":
        return "Query";
      case "databaseInsert":
        return "Insert";
      case "databaseUpdate":
        return "Update";
      case "databaseDelete":
        return "Delete";
      default:
        return "Operation";
    }
  };

  const getOperationIcon = () => {
    switch (nodeType) {
      case "databaseQuery":
        return <Search className="w-4 h-4" />;
      case "databaseInsert":
        return <Plus className="w-4 h-4" />;
      case "databaseUpdate":
        return <Edit className="w-4 h-4" />;
      case "databaseDelete":
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              {getOperationIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Database {getOperationType()} Configuration
              </h2>
              <p className="text-sm text-gray-600">
                Configure your database {getOperationType().toLowerCase()}{" "}
                operation
              </p>
            </div>
          </div>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Connection Selection */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Database Connection
              </h3>
              <Button
                onClick={() => setShowConnectionManager(true)}
                variant="outline"
                size="sm"
              >
                <Database className="w-4 h-4 mr-2" />
                Manage Connections
              </Button>
            </div>

            {selectedConnection ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {selectedConnection.type === "mongodb"
                      ? "🍃"
                      : selectedConnection.type === "mysql"
                      ? "🐬"
                      : "🐘"}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {selectedConnection.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedConnection.host}:{selectedConnection.port} /{" "}
                      {selectedConnection.database}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedConnection.status)}
                  <Badge
                    variant={
                      selectedConnection.status === "connected"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedConnection.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  No database connection selected
                </p>
                <Button onClick={() => setShowConnectionManager(true)}>
                  Select Connection
                </Button>
              </div>
            )}
          </Card>

          {/* Query Configuration */}
          {selectedConnection && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Query Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {getOperationType()} Statement
                  </label>
                  <Textarea
                    value={config.query || ""}
                    onChange={(e) => onConfigChange("query", e.target.value)}
                    placeholder={getQueryPlaceholder()}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                {nodeType === "databaseQuery" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parameters (JSON array)
                    </label>
                    <Input
                      value={config.params || ""}
                      onChange={(e) => onConfigChange("params", e.target.value)}
                      placeholder='["param1", "param2"]'
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {nodeType === "databaseInsert" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document/Record (JSON)
                    </label>
                    <Textarea
                      value={config.document || ""}
                      onChange={(e) =>
                        onConfigChange("document", e.target.value)
                      }
                      placeholder='{"field1": "value1", "field2": "value2"}'
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {(nodeType === "databaseUpdate" ||
                  nodeType === "databaseDelete") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter/Where Condition (JSON)
                    </label>
                    <Textarea
                      value={config.filter || ""}
                      onChange={(e) => onConfigChange("filter", e.target.value)}
                      placeholder='{"field": "value"}'
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {nodeType === "databaseUpdate" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Data (JSON)
                    </label>
                    <Textarea
                      value={config.update || ""}
                      onChange={(e) => onConfigChange("update", e.target.value)}
                      placeholder='{"$set": {"field": "new_value"}}'
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleTestQuery}
                    disabled={!config.query || testingQuery}
                    className="flex items-center space-x-2"
                  >
                    {testingQuery ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    <span>{testingQuery ? "Testing..." : "Test Query"}</span>
                  </Button>

                  {queryResult && (
                    <Button
                      onClick={() => setShowQueryResult(true)}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Result</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Available Tables */}
          {selectedConnection && tables.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Tables/Collections
                </h3>
                <Button
                  onClick={() => loadTables(selectedConnection.id)}
                  disabled={loadingTables}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingTables ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {tables.map((table, index) => {
                  const tableName = table.name || table;
                  return (
                    <div
                      key={index}
                      className="p-2 bg-gray-50 rounded-lg text-sm font-mono cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        onConfigChange("table", tableName);
                      }}
                    >
                      <Table className="w-4 h-4 inline mr-2" />
                      {tableName}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Connection Manager Dialog */}
        <DatabaseConnectionManager
          isOpen={showConnectionManager}
          onClose={() => setShowConnectionManager(false)}
          onConnectionSelect={handleConnectionSelect}
        />

        {/* Query Result Dialog */}
        <Dialog open={showQueryResult} onOpenChange={setShowQueryResult}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Query Result</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {queryResult?.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-700">Error</span>
                  </div>
                  <p className="text-red-600">{queryResult.error}</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(queryResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
