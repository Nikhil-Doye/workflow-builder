import React, { useRef, useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import {
  Download,
  Upload,
  Save,
  Play,
  Square,
  RotateCcw,
  Settings,
} from "lucide-react";
import {
  downloadWorkflow,
  loadWorkflowFromFile,
} from "../utils/workflowSerialization";
import { OpenAIConfig } from "./OpenAIConfig";

export const WorkflowToolbar: React.FC = () => {
  const {
    currentWorkflow,
    saveWorkflow,
    executeWorkflow,
    isExecuting,
    clearExecutionResults,
  } = useWorkflowStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showOpenAIConfig, setShowOpenAIConfig] = useState(false);

  const handleSave = () => {
    if (currentWorkflow) {
      saveWorkflow();
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
    clearExecutionResults();
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
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          title="Save workflow"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>

        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          title="Export workflow"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>

        <button
          onClick={handleImport}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          title="Import workflow"
        >
          <Upload className="w-4 h-4" />
          <span>Import</span>
        </button>

        <button
          onClick={() => setShowOpenAIConfig(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          title="Configure OpenAI API"
        >
          <Settings className="w-4 h-4" />
          <span>AI Config</span>
        </button>

        <div className="w-px h-6 bg-gray-300" />

        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className="flex items-center space-x-2 px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={isExecuting ? "Stop execution" : "Execute workflow"}
        >
          {isExecuting ? (
            <>
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Execute</span>
            </>
          )}
        </button>

        <button
          onClick={handleClear}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          title="Clear execution results"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* OpenAI Configuration Modal */}
      {showOpenAIConfig && (
        <OpenAIConfig onClose={() => setShowOpenAIConfig(false)} />
      )}
    </div>
  );
};
