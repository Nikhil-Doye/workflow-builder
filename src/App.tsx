import React, { useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { Toaster } from "react-hot-toast";
import { WorkflowList } from "./components/WorkflowList";
import { WorkflowEditor } from "./components/WorkflowEditor";
import { ExecutionPanel } from "./components/ExecutionPanel";
import { TestingPanel } from "./components/TestingPanel";
import { ApiKeysSettings } from "./components/ApiKeysSettings";
import { useWorkflowStore } from "./store/workflowStore";

function App() {
  const [currentView, setCurrentView] = useState<"list" | "editor">("list");
  const [, setCurrentWorkflowId] = useState<string | null>(null);
  const [showApiKeysSettings, setShowApiKeysSettings] = useState(false);
  const { createWorkflow, loadWorkflow } = useWorkflowStore();

  const handleCreateWorkflow = (workflowName?: string) => {
    const name = workflowName || `Workflow ${Date.now()}`;
    createWorkflow(name);
    setCurrentWorkflowId(name);
    setCurrentView("editor");
  };

  const handleOpenWorkflow = (workflowId: string) => {
    loadWorkflow(workflowId);
    setCurrentWorkflowId(workflowId);
    setCurrentView("editor");
  };

  const handleCloseEditor = () => {
    setCurrentView("list");
    setCurrentWorkflowId(null);
  };

  return (
    <div className="App">
      <Toaster position="top-right" />

      {/* Settings Button */}
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={() => setShowApiKeysSettings(true)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>API Keys</span>
        </button>
      </div>

      {currentView === "list" ? (
        <WorkflowList
          onOpenWorkflow={handleOpenWorkflow}
          onCreateWorkflow={handleCreateWorkflow}
        />
      ) : (
        <ReactFlowProvider>
          <div className="h-screen flex">
            <div className="flex-1">
              <WorkflowEditor onClose={handleCloseEditor} />
            </div>
            <div className="flex">
              <ExecutionPanel />
              <TestingPanel />
            </div>
          </div>
        </ReactFlowProvider>
      )}

      {/* API Keys Settings Modal */}
      {showApiKeysSettings && (
        <ApiKeysSettings onClose={() => setShowApiKeysSettings(false)} />
      )}
    </div>
  );
}

export default App;
