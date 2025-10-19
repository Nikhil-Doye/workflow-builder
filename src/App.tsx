import React, { useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { Toaster } from "react-hot-toast";
import { WorkflowList } from "./components/WorkflowList";
import { WorkflowEditor } from "./components/WorkflowEditor";
import { ExecutionPanel } from "./components/ExecutionPanel";
import { TestingPanel } from "./components/TestingPanel";
import { useWorkflowStore } from "./store/workflowStore";

function App() {
  const [currentView, setCurrentView] = useState<"list" | "editor">("list");
  const [, setCurrentWorkflowId] = useState<string | null>(null);
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
    </div>
  );
}

export default App;
