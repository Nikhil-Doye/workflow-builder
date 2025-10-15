import React, { useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { Plus, Play, Trash2, Edit, FolderOpen } from "lucide-react";

interface WorkflowListProps {
  onOpenWorkflow: (workflowId: string) => void;
  onCreateWorkflow: () => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  onOpenWorkflow,
  onCreateWorkflow,
}) => {
  const { workflows, deleteWorkflow } = useWorkflowStore();
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateWorkflow = () => {
    if (newWorkflowName.trim()) {
      onCreateWorkflow();
      setNewWorkflowName("");
      setShowCreateForm(false);
    }
  };

  const handleDeleteWorkflow = (
    workflowId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this workflow?")) {
      deleteWorkflow(workflowId);
    }
  };

  const handleExecuteWorkflow = (
    workflowId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    onOpenWorkflow(workflowId);
    // Note: In a real app, you'd want to execute the workflow after opening it
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Agent Workflow Builder
          </h1>
          <p className="mt-2 text-gray-600">
            Create and manage AI-powered workflows with visual node-based
            editing
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Workflows
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
        </div>

        {/* Create Workflow Form */}
        {showCreateForm && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Create New Workflow
            </h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="Enter workflow name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleCreateWorkflow()}
              />
              <button
                onClick={handleCreateWorkflow}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Workflows Grid */}
        {workflows.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No workflows yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first workflow to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onOpenWorkflow(workflow.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {workflow.name}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => handleExecuteWorkflow(workflow.id, e)}
                      className="p-1 text-gray-400 hover:text-primary-500 transition-colors"
                      title="Execute workflow"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Nodes:</span>
                    <span className="font-medium">{workflow.nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connections:</span>
                    <span className="font-medium">{workflow.edges.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span className="font-medium">
                      {workflow.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => onOpenWorkflow(workflow.id)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Workflow</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
