import React, { useState, useEffect } from "react";
import {
  Database,
  Plus,
  TestTube,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  databaseConnectionManager,
  DatabaseConnection,
} from "../services/databaseConnectionManager";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

interface DatabaseConnectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSelect?: (connectionId: string) => void;
}

export const DatabaseConnectionManager: React.FC<
  DatabaseConnectionManagerProps
> = ({ isOpen, onClose, onConnectionSelect }) => {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<DatabaseConnection | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "mongodb" as "mongodb" | "mysql" | "postgresql",
    host: "",
    port: 27017,
    database: "",
    username: "",
    password: "",
    connectionString: "",
    ssl: false,
  });

  useEffect(() => {
    if (isOpen) {
      loadConnections();
    }
  }, [isOpen]);

  const loadConnections = () => {
    const allConnections = databaseConnectionManager.getAllConnections();
    setConnections(allConnections);
  };

  const handleAddConnection = async () => {
    try {
      const connectionData = {
        ...formData,
        port: Number(formData.port),
      };

      await databaseConnectionManager.addConnection(connectionData);
      loadConnections();
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error adding connection:", error);
    }
  };

  const handleEditConnection = async () => {
    if (!editingConnection) return;

    try {
      await databaseConnectionManager.updateConnection(
        editingConnection.id,
        formData
      );
      loadConnections();
      setEditingConnection(null);
      resetForm();
    } catch (error) {
      console.error("Error updating connection:", error);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this connection?")) {
      try {
        await databaseConnectionManager.deleteConnection(id);
        loadConnections();
      } catch (error) {
        console.error("Error deleting connection:", error);
      }
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingConnection(id);
    try {
      const result = await databaseConnectionManager.testConnection(id);
      loadConnections();

      if (result.success) {
        // Show success message
        console.log("Connection test successful");
      } else {
        // Show error message
        console.error("Connection test failed:", result.message);
      }
    } catch (error) {
      console.error("Error testing connection:", error);
    } finally {
      setTestingConnection(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "mongodb",
      host: "",
      port: 27017,
      database: "",
      username: "",
      password: "",
      connectionString: "",
      ssl: false,
    });
  };

  const startEdit = (connection: DatabaseConnection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      type: connection.type,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username || "",
      password: connection.password || "",
      connectionString: connection.connectionString || "",
      ssl: connection.ssl || false,
    });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getDatabaseIcon = (type: string) => {
    switch (type) {
      case "mongodb":
        return "🍃";
      case "mysql":
        return "🐬";
      case "postgresql":
        return "🐘";
      default:
        return "🗄️";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Database Connections
              </h2>
              <p className="text-sm text-gray-600">
                Manage your database connections and test connectivity
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Connection</span>
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {connections.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Database Connections
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by adding your first database connection
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <Card
                  key={connection.id}
                  className={`p-4 transition-all duration-200 hover:shadow-md ${getStatusColor(
                    connection.status
                  )}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {getDatabaseIcon(connection.type)}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {connection.name}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {connection.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(connection.status)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm">
                      <span className="font-medium">Host:</span>{" "}
                      {connection.host}:{connection.port}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Database:</span>{" "}
                      {connection.database}
                    </div>
                    {connection.username && (
                      <div className="text-sm">
                        <span className="font-medium">User:</span>{" "}
                        {connection.username}
                      </div>
                    )}
                    {connection.lastTested && (
                      <div className="text-xs text-gray-500">
                        Last tested:{" "}
                        {new Date(connection.lastTested).toLocaleString()}
                      </div>
                    )}
                    {connection.error && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {connection.error}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestConnection(connection.id)}
                        disabled={testingConnection === connection.id}
                      >
                        {testingConnection === connection.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <TestTube className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(connection)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteConnection(connection.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {onConnectionSelect && (
                      <Button
                        size="sm"
                        onClick={() => onConnectionSelect(connection.id)}
                        disabled={connection.status !== "connected"}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Connection Dialog */}
        <Dialog
          open={showAddDialog || !!editingConnection}
          onOpenChange={() => {
            setShowAddDialog(false);
            setEditingConnection(null);
            resetForm();
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConnection ? "Edit Connection" : "Add New Connection"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="My Database"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Database Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="mongodb">MongoDB</option>
                    <option value="mysql">MySQL</option>
                    <option value="postgresql">PostgreSQL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host
                  </label>
                  <Input
                    value={formData.host}
                    onChange={(e) =>
                      setFormData({ ...formData, host: e.target.value })
                    }
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <Input
                    type="number"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        port: parseInt(e.target.value) || 27017,
                      })
                    }
                    placeholder="27017"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name
                </label>
                <Input
                  value={formData.database}
                  onChange={(e) =>
                    setFormData({ ...formData, database: e.target.value })
                  }
                  placeholder="my_database"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <Input
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="password"
                  />
                </div>
              </div>

              {formData.type === "mongodb" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection String (Optional)
                  </label>
                  <Input
                    value={formData.connectionString}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        connectionString: e.target.value,
                      })
                    }
                    placeholder="mongodb://localhost:27017/my_database"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={formData.ssl}
                  onChange={(e) =>
                    setFormData({ ...formData, ssl: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="ssl"
                  className="text-sm font-medium text-gray-700"
                >
                  Use SSL
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingConnection(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={
                  editingConnection ? handleEditConnection : handleAddConnection
                }
                disabled={
                  !formData.name || !formData.host || !formData.database
                }
              >
                {editingConnection ? "Update Connection" : "Add Connection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
