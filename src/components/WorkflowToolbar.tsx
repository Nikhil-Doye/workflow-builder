import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
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
  Database,
  Clock,
  Activity,
  GitBranch,
} from "lucide-react";
import {
  downloadWorkflow,
  loadWorkflowFromFile,
} from "../utils/workflowSerialization";
import { ApiKeysSettings } from "./ApiKeysSettings";
import { DatabaseConnectionManager } from "./DatabaseConnectionManager";
import { WorkflowScheduler } from "./WorkflowScheduler";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

export const WorkflowToolbar: React.FC = () => {
  const {
    currentWorkflow,
    saveWorkflow,
    importWorkflow,
    executeWorkflow,
    isExecuting,
    clearAllNodes,
    executionMode,
    setExecutionMode,
  } = useWorkflowStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiKeysSettings, setShowApiKeysSettings] = useState(false);
  const [showDatabaseManager, setShowDatabaseManager] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
    if (!file) return;

    const toastId = toast.loading(`Importing ${file.name}...`);

    try {
      const workflow = await loadWorkflowFromFile(file);

      if (workflow) {
        // Import workflow - automatically adds to list and opens for editing
        importWorkflow(workflow);

        toast.success(
          `✓ Workflow "${workflow.name}" imported successfully!\n` +
            `${workflow.nodes.length} nodes, ${workflow.edges.length} connections`,
          {
            id: toastId,
            duration: 4000,
          }
        );

        console.log(`[WorkflowToolbar] Imported workflow:`, {
          name: workflow.name,
          nodes: workflow.nodes.length,
          edges: workflow.edges.length,
        });
      } else {
        toast.error("Failed to import workflow\nPlease check the file format", {
          id: toastId,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("[WorkflowToolbar] Import error:", error);
      toast.error(
        `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: toastId, duration: 5000 }
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExecute = async () => {
    if (currentWorkflow) {
      await executeWorkflow();
    }
  };

  const handleClear = () => {
    setShowResetConfirm(true);
  };

  const confirmClearNodes = () => {
    clearAllNodes();
    setShowResetConfirm(false);
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

        <Button
          onClick={() => setShowDatabaseManager(true)}
          variant="default"
          title="Database Connections"
        >
          <Database className="w-4 h-4 mr-2" />
          Databases
        </Button>

        <Button
          onClick={() => setShowScheduler(true)}
          variant="default"
          title="Schedule Workflows"
        >
          <Clock className="w-4 h-4 mr-2" />
          Schedule
        </Button>

        <div className="w-px h-6 bg-gray-300" />

        {/* Execution Mode Selector */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setExecutionMode("sequential")}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              executionMode === "sequential"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Sequential execution"
          >
            <Play className="w-3 h-3" />
            <span>Seq</span>
          </button>
          <button
            onClick={() => setExecutionMode("parallel")}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              executionMode === "parallel"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Parallel execution"
          >
            <Activity className="w-3 h-3" />
            <span>Par</span>
          </button>
          <button
            onClick={() => setExecutionMode("conditional")}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              executionMode === "conditional"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Conditional execution"
          >
            <GitBranch className="w-3 h-3" />
            <span>Cond</span>
          </button>
        </div>

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

      {/* Database Connection Manager Modal */}
      {showDatabaseManager && (
        <DatabaseConnectionManager
          isOpen={showDatabaseManager}
          onClose={() => setShowDatabaseManager(false)}
        />
      )}

      {/* Workflow Scheduler Modal */}
      {showScheduler && (
        <WorkflowScheduler
          isOpen={showScheduler}
          onClose={() => setShowScheduler(false)}
          workflowId={currentWorkflow?.id}
        />
      )}

      {/* Confirm Reset (Clear All Nodes) Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset workflow?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">
            This will remove all nodes and connections from the current
            workflow. This action cannot be undone.
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              onClick={() => setShowResetConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmClearNodes}
            >
              Yes, clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
