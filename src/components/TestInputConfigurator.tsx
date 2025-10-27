import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  testInputManager,
  TestInputConfig,
  DataInputNode,
} from "../services/testInputManager";

interface TestInputConfiguratorProps {
  nodes: any[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: TestInputConfig) => void;
  initialValue?: string;
}

export const TestInputConfigurator: React.FC<TestInputConfiguratorProps> = ({
  nodes,
  isOpen,
  onClose,
  onApply,
  initialValue,
}) => {
  const [mode, setMode] = useState<"single" | "multiple" | "auto">("auto");
  const [mappings, setMappings] = useState<
    Array<{ nodeId: string; value: string }>
  >([]);
  const [fallbackValue, setFallbackValue] = useState<string>(
    initialValue || ""
  );
  const [isExpanded, setIsExpanded] = useState(true);

  const dataInputNodes = testInputManager.findDataInputNodes(nodes);
  const status = testInputManager.getStatus(
    { mode, mappings, fallbackValue },
    nodes
  );

  // Initialize configuration based on data input nodes
  useEffect(() => {
    if (!isOpen) return;

    if (dataInputNodes.length === 0) {
      setMode("auto");
    } else if (dataInputNodes.length === 1) {
      setMode("single");
      setMappings([
        { nodeId: dataInputNodes[0].id, value: initialValue || "" },
      ]);
    } else {
      setMode("auto");
      setMappings([]);
    }
  }, [isOpen, dataInputNodes, initialValue]);

  const handleApply = () => {
    const config: TestInputConfig = { mode, mappings, fallbackValue };

    const validation = testInputManager.validateTestInputConfig(config, nodes);
    if (!validation.isValid) {
      alert(`Validation errors:\n${validation.errors.join("\n")}`);
      return;
    }

    onApply(config);
    onClose();
  };

  const addMapping = () => {
    if (dataInputNodes.length > 0) {
      const unmappedNode = dataInputNodes.find(
        (n) => !mappings.some((m) => m.nodeId === n.id)
      );
      if (unmappedNode) {
        setMappings([...mappings, { nodeId: unmappedNode.id, value: "" }]);
      }
    }
  };

  const removeMapping = (nodeId: string) => {
    setMappings(mappings.filter((m) => m.nodeId !== nodeId));
  };

  const updateMapping = (nodeId: string, value: string) => {
    setMappings(
      mappings.map((m) => (m.nodeId === nodeId ? { ...m, value } : m))
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Configure Test Inputs
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {dataInputNodes.length} data input node
              {dataInputNodes.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {dataInputNodes.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">
                  No Input Nodes
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Add a Data Input node to your workflow to configure test
                  inputs
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Input Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["single", "multiple", "auto"].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m as "single" | "multiple" | "auto");
                        if (m === "single" && dataInputNodes.length > 0) {
                          setMappings([
                            {
                              nodeId: dataInputNodes[0].id,
                              value: initialValue || "",
                            },
                          ]);
                        } else if (m === "auto") {
                          setMappings([]);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        mode === m
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {m === "single"
                        ? "Single"
                        : m === "multiple"
                        ? "Multiple"
                        : "Auto"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {mode === "single" && "Configure one primary input node"}
                  {mode === "multiple" &&
                    "Map test data to each input node individually"}
                  {mode === "auto" &&
                    "Same test data applied to all input nodes"}
                </p>
              </div>

              {/* Input Configuration */}
              {mode === "auto" && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-900">
                    Test Data (Applied to All Inputs)
                  </label>
                  <textarea
                    value={fallbackValue}
                    onChange={(e) => setFallbackValue(e.target.value)}
                    placeholder="Enter test data here..."
                    className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <p className="text-xs text-gray-600">
                    This data will be sent to all {dataInputNodes.length} input
                    node{dataInputNodes.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {mode === "single" && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-900">
                    Select Input Node & Data
                  </label>
                  {mappings.length > 0 && (
                    <>
                      <select
                        value={mappings[0].nodeId}
                        onChange={(e) => {
                          const newMapping = {
                            ...mappings[0],
                            nodeId: e.target.value,
                          };
                          setMappings([newMapping]);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {dataInputNodes.map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={mappings[0].value}
                        onChange={(e) =>
                          updateMapping(mappings[0].nodeId, e.target.value)
                        }
                        placeholder="Enter test data..."
                        className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </>
                  )}
                </div>
              )}

              {mode === "multiple" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-900">
                      Configure Each Input
                    </label>
                    {mappings.length < dataInputNodes.length && (
                      <button
                        onClick={addMapping}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Mapping</span>
                      </button>
                    )}
                  </div>

                  {mappings.length === 0 ? (
                    <button
                      onClick={addMapping}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors"
                    >
                      Click to add first mapping
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {mappings.map((mapping) => {
                        const node = dataInputNodes.find(
                          (n) => n.id === mapping.nodeId
                        );
                        return (
                          <div
                            key={mapping.nodeId}
                            className="p-3 border border-gray-300 rounded-lg space-y-2 bg-white"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm text-gray-900">
                                {node?.label || mapping.nodeId}
                              </span>
                              {mappings.length > 1 && (
                                <button
                                  onClick={() => removeMapping(mapping.nodeId)}
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <textarea
                              value={mapping.value}
                              onChange={(e) =>
                                updateMapping(mapping.nodeId, e.target.value)
                              }
                              placeholder="Enter test data for this input..."
                              className="w-full p-2 border border-gray-300 rounded font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status.icon === "✅" && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            {status.icon === "⚠️" && (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            {status.icon === "ℹ️" && (
              <AlertCircle className="w-5 h-5 text-blue-600" />
            )}
            <span className="text-sm text-gray-700">{status.message}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={dataInputNodes.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
