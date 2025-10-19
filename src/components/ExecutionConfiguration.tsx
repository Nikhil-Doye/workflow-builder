import React, { useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Settings,
  Play,
  RotateCcw,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";

interface ExecutionConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutionConfiguration: React.FC<ExecutionConfigurationProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    executionMode,
    executionConfig,
    setExecutionMode,
    updateExecutionConfig,
    getExecutionStats,
  } = useWorkflowStore();

  const [localConfig, setLocalConfig] = useState(executionConfig);
  const [showStats, setShowStats] = useState(false);

  const stats = getExecutionStats();

  const handleModeChange = (
    mode: "sequential" | "parallel" | "conditional"
  ) => {
    setExecutionMode(mode);
  };

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...localConfig };
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      if (parent === "retryPolicy") {
        newConfig.retryPolicy = {
          ...newConfig.retryPolicy,
          [child]: value,
        };
      }
    } else {
      (newConfig as any)[key] = value;
    }
    setLocalConfig(newConfig);
  };

  const handleSave = () => {
    updateExecutionConfig(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig(executionConfig);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Execution Configuration
                </h2>
                <p className="text-sm text-gray-600">
                  Configure how workflows are executed
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <Activity className="w-4 h-4 mr-2" />
                {showStats ? "Hide Stats" : "Show Stats"}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Execution Mode */}
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Execution Mode
                </h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: "sequential",
                      label: "Sequential",
                      description: "Execute nodes one after another",
                      icon: <Play className="w-4 h-4" />,
                    },
                    {
                      value: "parallel",
                      label: "Parallel",
                      description: "Execute independent nodes simultaneously",
                      icon: <Activity className="w-4 h-4" />,
                    },
                    {
                      value: "conditional",
                      label: "Conditional",
                      description: "Execute based on conditions and branches",
                      icon: <AlertTriangle className="w-4 h-4" />,
                    },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => handleModeChange(mode.value as any)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        executionMode === mode.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {mode.icon}
                        <span className="font-medium text-gray-900">
                          {mode.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 text-left">
                        {mode.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Execution Configuration */}
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Execution Settings
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxConcurrency">Max Concurrency</Label>
                  <Input
                    id="maxConcurrency"
                    type="number"
                    min="1"
                    max="20"
                    value={localConfig.maxConcurrency}
                    onChange={(e) =>
                      handleConfigChange(
                        "maxConcurrency",
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum parallel executions
                  </p>
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="1000"
                    step="1000"
                    value={localConfig.timeout}
                    onChange={(e) =>
                      handleConfigChange("timeout", parseInt(e.target.value))
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum execution time
                  </p>
                </div>
              </div>
            </Card>

            {/* Retry Policy */}
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <RotateCcw className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Retry Policy
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxRetries">Max Retries</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    min="0"
                    max="10"
                    value={localConfig.retryPolicy.maxRetries}
                    onChange={(e) =>
                      handleConfigChange(
                        "retryPolicy.maxRetries",
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="retryDelay">Retry Delay (ms)</Label>
                  <Input
                    id="retryDelay"
                    type="number"
                    min="100"
                    step="100"
                    value={localConfig.retryPolicy.retryDelay}
                    onChange={(e) =>
                      handleConfigChange(
                        "retryPolicy.retryDelay",
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="backoffMultiplier">Backoff Multiplier</Label>
                  <Input
                    id="backoffMultiplier"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={localConfig.retryPolicy.backoffMultiplier}
                    onChange={(e) =>
                      handleConfigChange(
                        "retryPolicy.backoffMultiplier",
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Execution Statistics */}
            {showStats && (
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Execution Statistics
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalExecutions}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Executions
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.activeExecutions}
                    </div>
                    <div className="text-sm text-gray-600">Active</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.completedExecutions}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.failedExecutions}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
                <div className="mt-4 text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(stats.averageDuration)}ms
                  </div>
                  <div className="text-sm text-gray-600">Average Duration</div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
