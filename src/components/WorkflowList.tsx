import React, { useState, useEffect } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { OnboardingModal } from "./OnboardingModal";
import { OnboardingManager } from "../utils/onboardingManager";
import {
  Plus,
  Play,
  Trash2,
  Edit,
  FolderOpen,
  Check,
  X,
  Sparkles,
  Zap,
  Brain,
  Globe,
  ArrowRight,
  Clock,
  HelpCircle,
} from "lucide-react";

interface WorkflowListProps {
  onOpenWorkflow: (workflowId: string) => void;
  onCreateWorkflow: (workflowName?: string) => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  onOpenWorkflow,
  onCreateWorkflow,
}) => {
  const { workflows, deleteWorkflow, updateWorkflow } = useWorkflowStore();
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(
    null
  );
  const [editingWorkflowName, setEditingWorkflowName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding based on preferences and workflow count
  useEffect(() => {
    if (OnboardingManager.shouldShowOnboarding(workflows.length)) {
      setShowOnboarding(true);
    }
  }, [workflows.length]);

  const handleCreateWorkflow = () => {
    if (newWorkflowName.trim()) {
      onCreateWorkflow(newWorkflowName.trim());
      setNewWorkflowName("");
      setShowCreateForm(false);
    }
  };

  const handleStartEdit = (workflowId: string, currentName: string) => {
    setEditingWorkflowId(workflowId);
    setEditingWorkflowName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingWorkflowId && editingWorkflowName.trim()) {
      updateWorkflow(editingWorkflowId, { name: editingWorkflowName.trim() });
      setEditingWorkflowId(null);
      setEditingWorkflowName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingWorkflowId(null);
    setEditingWorkflowName("");
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

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // OnboardingManager.markOnboardingCompleted() is called in the modal
  };

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4 md:mb-6">
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-3 md:px-4 py-2 shadow-lg">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                <span className="text-xs md:text-sm font-medium text-gray-700">
                  AI-Powered Workflows
                </span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 md:mb-6">
              Build AI Workflows
              <br />
              <span className="text-blue-600">Visually</span>
            </h1>
            <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Create powerful AI automation workflows with our intuitive visual
              builder. Connect AI models, web scraping, and data processing in
              minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="group flex items-center justify-center space-x-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-semibold text-sm md:text-base">
                  Create Workflow
                </span>
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center justify-center space-x-2 px-6 md:px-8 py-3 md:py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl">
                <Play className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-semibold text-sm md:text-base">
                  View Demo
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Workflows
            </h2>
            <p className="text-gray-600">
              {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}{" "}
              created
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <button
                onClick={handleShowOnboarding}
                className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200"
                title="Show tutorial"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Tutorial</span>
                {OnboardingManager.getStatus().isNewVersionAvailable && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>

              {/* Tooltip with onboarding status */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                <div className="text-center">
                  <div className="font-medium">Tutorial Status</div>
                  <div className="text-xs text-gray-300 mt-1">
                    {OnboardingManager.getStatus().hasSeenOnboarding ? (
                      <>
                        Progress:{" "}
                        {OnboardingManager.getStatus().progressPercentage}%
                        {OnboardingManager.getStatus()
                          .isNewVersionAvailable && (
                          <div className="text-blue-300">
                            New version available!
                          </div>
                        )}
                      </>
                    ) : (
                      "Not started yet"
                    )}
                  </div>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="group flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">New Workflow</span>
            </button>
          </div>
        </div>

        {/* Create Workflow Form */}
        {showCreateForm && (
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Create New Workflow
                </h3>
                <p className="text-sm text-gray-600">
                  Give your workflow a descriptive name
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="e.g., Content Analysis Pipeline"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                onKeyPress={(e) => e.key === "Enter" && handleCreateWorkflow()}
                autoFocus
              />
              <button
                onClick={handleCreateWorkflow}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Workflows Grid */}
        {workflows.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              No workflows yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first AI workflow to automate tasks and connect
              different services
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="group flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Create Your First Workflow</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() =>
                  editingWorkflowId !== workflow.id &&
                  onOpenWorkflow(workflow.id)
                }
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    {editingWorkflowId === workflow.id ? (
                      <input
                        type="text"
                        value={editingWorkflowName}
                        onChange={(e) => setEditingWorkflowName(e.target.value)}
                        className="w-full px-2 py-1 text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveEdit()
                        }
                        onKeyDown={(e) =>
                          e.key === "Escape" && handleCancelEdit()
                        }
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {workflow.name}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    {editingWorkflowId === workflow.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Save changes"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Cancel editing"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(workflow.id, workflow.name);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit workflow name"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleExecuteWorkflow(workflow.id, e)}
                          className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          title="Execute workflow"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete workflow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Preview */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{workflow.nodes.length} nodes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{workflow.edges.length} connections</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>
                      Updated {workflow.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Node Type Indicators */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {workflow.nodes.slice(0, 3).map((node, index) => {
                    const getNodeIcon = (type: string) => {
                      switch (type) {
                        case "dataInput":
                          return <ArrowRight className="w-3 h-3" />;
                        case "webScraping":
                          return <Globe className="w-3 h-3" />;
                        case "llmTask":
                          return <Brain className="w-3 h-3" />;
                        case "dataOutput":
                          return <ArrowRight className="w-3 h-3" />;
                        default:
                          return <Zap className="w-3 h-3" />;
                      }
                    };
                    const getNodeColor = (type: string) => {
                      switch (type) {
                        case "dataInput":
                          return "bg-blue-100 text-blue-600";
                        case "webScraping":
                          return "bg-green-100 text-green-600";
                        case "llmTask":
                          return "bg-purple-100 text-purple-600";
                        case "dataOutput":
                          return "bg-orange-100 text-orange-600";
                        default:
                          return "bg-gray-100 text-gray-600";
                      }
                    };
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getNodeColor(
                          node.type
                        )}`}
                      >
                        {getNodeIcon(node.type)}
                        <span>
                          {node.type.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </div>
                    );
                  })}
                  {workflow.nodes.length > 3 && (
                    <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      <span>+{workflow.nodes.length - 3} more</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => onOpenWorkflow(workflow.id)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 font-medium group"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Open Workflow</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};
