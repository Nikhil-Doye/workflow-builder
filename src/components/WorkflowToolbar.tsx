import React, { useRef, useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import {
  Download,
  Upload,
  Save,
  Play,
  Square,
  RotateCcw,
  Key,
  Check,
} from "lucide-react";
import {
  downloadWorkflow,
  loadWorkflowFromFile,
} from "../utils/workflowSerialization";
import { ApiKeysSettings } from "./ApiKeysSettings";
import { Button } from "./ui/button";

export const WorkflowToolbar: React.FC = () => {
  const {
    currentWorkflow,
    saveWorkflow,
    executeWorkflow,
    isExecuting,
    clearAllNodes,
  } = useWorkflowStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiKeysSettings, setShowApiKeysSettings] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSave = () => {
    if (currentWorkflow) {
      saveWorkflow();
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    }
  };

  const handleExport = () => {
    if (currentWorkflow) {
      downloadWorkflow(currentWorkflow);
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const workflow = await loadWorkflowFromFile(file);
      if (workflow) {
        // In a real app, you'd add this to the workflows list
        console.log("Imported workflow:", workflow);
        alert("Workflow imported successfully!");
      } else {
        alert("Failed to import workflow. Please check the file format.");
      }
    }
  };

  const handleExecute = async () => {
    if (currentWorkflow) {
      await executeWorkflow();
    }
  };

  const handleClear = () => {
    clearAllNodes();
  };

  if (!currentWorkflow) return null;

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentWorkflow.name}
        </h2>
        <span className="text-sm text-gray-500">
          {currentWorkflow.nodes.length} nodes, {currentWorkflow.edges.length}{" "}
          connections
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          onClick={handleSave}
          variant={showSaveSuccess ? "default" : "default"}
          className={showSaveSuccess ? "bg-green-600 hover:bg-green-700" : ""}
          title="Save workflow"
        >
          {showSaveSuccess ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {showSaveSuccess ? "Saved!" : "Save"}
        </Button>

        <Button
          onClick={handleExport}
          variant="default"
          title="Export workflow"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Button
          onClick={handleImport}
          variant="default"
          title="Import workflow"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>

        <Button
          onClick={() => setShowApiKeysSettings(true)}
          variant="default"
          title="Configure API Keys"
        >
          <Key className="w-4 h-4 mr-2" />
          API Keys
        </Button>

        <div className="w-px h-6 bg-gray-300" />

        <Button
          onClick={handleExecute}
          disabled={isExecuting}
          variant="default"
          className="bg-blue-600 hover:bg-blue-700"
          title={isExecuting ? "Stop execution" : "Execute workflow"}
        >
          {isExecuting ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Execute
            </>
          )}
        </Button>

        <Button
          onClick={handleClear}
          variant="default"
          title="Reset workflow (clear all nodes)"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* API Keys Settings Modal */}
      {showApiKeysSettings && (
        <ApiKeysSettings
          isOpen={showApiKeysSettings}
          onClose={() => setShowApiKeysSettings(false)}
        />
      )}
    </div>
  );
};
