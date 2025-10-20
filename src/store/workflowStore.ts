import { create } from "zustand";
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  NodeData,
  NodeStatus,
  ValidationResult,
  WorkflowStructure,
} from "../types";
import { v4 as uuidv4 } from "uuid";
// Removed unused imports to clean up warnings
import { agentManager } from "../services/agents/AgentManager";
import { executionEngine, ExecutionPlan } from "../services/executionEngine";
import { LabelDependencyManager } from "../utils/labelDependencyManager";

// localStorage key for workflows
const WORKFLOWS_STORAGE_KEY = "agent-workflow-builder-workflows";

// Utility functions for consistent ID generation and mapping
const generateNodeId = (): string => uuidv4();
const generateEdgeId = (): string => uuidv4();

// Create a mapping from deterministic IDs to UUIDs
const createIdMapping = (nodeCount: number): Map<string, string> => {
  const mapping = new Map<string, string>();
  for (let i = 0; i < nodeCount; i++) {
    mapping.set(`node-${i}`, generateNodeId());
  }
  return mapping;
};

// Migrate deterministic IDs to UUIDs in a workflow
const migrateWorkflowIds = (workflow: Workflow): Workflow => {
  // Check if workflow needs migration (contains deterministic IDs)
  const hasDeterministicIds = workflow.nodes.some(
    (node) => node.id.startsWith("node-") && /^node-\d+$/.test(node.id)
  );

  if (!hasDeterministicIds) {
    return workflow; // Already migrated
  }

  // Create ID mapping
  const idMapping = createIdMapping(workflow.nodes.length);

  // Migrate nodes
  const migratedNodes = workflow.nodes.map((node) => {
    const newId = idMapping.get(node.id) || generateNodeId();
    return {
      ...node,
      id: newId,
      data: {
        ...node.data,
        id: newId,
      },
    };
  });

  // Migrate edges
  const migratedEdges = workflow.edges.map((edge) => {
    const newSourceId = idMapping.get(edge.source) || edge.source;
    const newTargetId = idMapping.get(edge.target) || edge.target;
    return {
      ...edge,
      id: generateEdgeId(),
      source: newSourceId,
      target: newTargetId,
    };
  });

  return {
    ...workflow,
    nodes: migratedNodes,
    edges: migratedEdges,
    updatedAt: new Date(),
  };
};

// Helper functions for localStorage operations
const saveWorkflowsToStorage = (workflows: Workflow[]): boolean => {
  try {
    localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
    return true;
  } catch (error) {
    console.error("Failed to save workflows to localStorage:", error);
    // Show user-friendly error message
    alert(
      "Failed to save workflows. Your browser's storage might be full or disabled."
    );
    return false;
  }
};

const loadWorkflowsFromStorage = (): Workflow[] => {
  try {
    const stored = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    if (stored) {
      const workflows = JSON.parse(stored);
      // Convert date strings back to Date objects and migrate IDs
      return workflows.map((workflow: any) => {
        const convertedWorkflow = {
          ...workflow,
          createdAt: new Date(workflow.createdAt),
          updatedAt: new Date(workflow.updatedAt),
        };
        // Apply migration for deterministic IDs
        return migrateWorkflowIds(convertedWorkflow);
      });
    }
  } catch (error) {
    console.error("Failed to load workflows from localStorage:", error);
    alert("Failed to load saved workflows. Some data might be corrupted.");
  }
  return [];
};

const clearWorkflowsFromStorage = (): boolean => {
  try {
    localStorage.removeItem(WORKFLOWS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear workflows from localStorage:", error);
    return false;
  }
};

interface WorkflowStore {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  selectedNodeId: string | null;
  isExecuting: boolean;
  executionResults: Record<string, any>;
  currentExecution: ExecutionPlan | null;
  executionMode: "sequential" | "parallel" | "conditional";
  executionConfig: {
    maxConcurrency: number;
    timeout: number;
    retryPolicy: {
      maxRetries: number;
      retryDelay: number;
      backoffMultiplier: number;
    };
  };
  // Panel state management
  panelStates: {
    nodeLibrary: {
      isCollapsed: boolean;
      isHidden: boolean;
    };
    executionPanel: {
      isCollapsed: boolean;
      isHidden: boolean;
    };
    testingPanel: {
      isCollapsed: boolean;
      isHidden: boolean;
    };
  };

  // Workflow management
  createWorkflow: (name: string) => void;
  loadWorkflow: (workflowId: string) => void;
  saveWorkflow: () => void;
  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (workflowId: string) => void;
  clearAllWorkflows: () => void;

  // Node management
  addNode: (type: string, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<NodeData>) => void;
  updateNodePosition: (
    nodeId: string,
    position: { x: number; y: number }
  ) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  updateNodeLabelWithDependencies: (
    nodeId: string,
    newLabel: string,
    updateReferences: boolean
  ) => void;
  deleteNode: (nodeId: string) => void;
  clearAllNodes: () => void;
  selectNode: (nodeId: string | null) => void;

  // Edge management
  addEdge: (
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string
  ) => void;
  deleteEdge: (edgeId: string) => void;

  // Execution
  executeWorkflow: (
    testInput?: string,
    options?: {
      mode?: "sequential" | "parallel" | "conditional";
      maxConcurrency?: number;
      timeout?: number;
      retryPolicy?: {
        maxRetries: number;
        retryDelay: number;
        backoffMultiplier: number;
      };
    }
  ) => Promise<void>;
  updateNodeStatus: (
    nodeId: string,
    status: NodeStatus,
    data?: any,
    error?: string
  ) => void;
  clearExecutionResults: () => void;
  setExecutionMode: (mode: "sequential" | "parallel" | "conditional") => void;
  updateExecutionConfig: (
    config: Partial<WorkflowStore["executionConfig"]>
  ) => void;
  getExecutionStats: () => any;

  // Panel management
  togglePanel: (panelName: keyof WorkflowStore["panelStates"]) => void;
  collapsePanel: (panelName: keyof WorkflowStore["panelStates"]) => void;
  expandPanel: (panelName: keyof WorkflowStore["panelStates"]) => void;
  hidePanel: (panelName: keyof WorkflowStore["panelStates"]) => void;
  showPanel: (panelName: keyof WorkflowStore["panelStates"]) => void;

  // Copilot methods
  generateWorkflowFromDescription: (description: string) => Promise<void>;
  applyCopilotSuggestions: (suggestions: any[]) => void;
  validateGeneratedWorkflow: () => Promise<ValidationResult | null>;
  getCopilotSuggestions: (context?: string) => Promise<string[]>;
}

const createEmptyWorkflow = (name: string): Workflow => ({
  id: uuidv4(),
  name,
  nodes: [],
  edges: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: loadWorkflowsFromStorage(),
  currentWorkflow: null,
  selectedNodeId: null,
  isExecuting: false,
  executionResults: {},
  currentExecution: null,
  executionMode: "sequential",
  executionConfig: {
    maxConcurrency: 5,
    timeout: 300000, // 5 minutes
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    },
  },
  panelStates: {
    nodeLibrary: {
      isCollapsed: false,
      isHidden: false,
    },
    executionPanel: {
      isCollapsed: false,
      isHidden: false,
    },
    testingPanel: {
      isCollapsed: false,
      isHidden: false,
    },
  },

  createWorkflow: (name: string) => {
    const newWorkflow = createEmptyWorkflow(name);
    const newWorkflows = [...get().workflows, newWorkflow];

    set({
      workflows: newWorkflows,
      currentWorkflow: newWorkflow,
    });

    // Persist to localStorage
    saveWorkflowsToStorage(newWorkflows);
  },

  loadWorkflow: (workflowId: string) => {
    const workflow = get().workflows.find((w) => w.id === workflowId);
    if (workflow) {
      set({ currentWorkflow: workflow });
    }
  },

  saveWorkflow: () => {
    const { currentWorkflow } = get();
    if (currentWorkflow) {
      const updatedWorkflow = {
        ...currentWorkflow,
        updatedAt: new Date(),
      };

      const newWorkflows = get().workflows.map((w) =>
        w.id === updatedWorkflow.id ? updatedWorkflow : w
      );

      set({
        workflows: newWorkflows,
        currentWorkflow: updatedWorkflow,
      });

      // Persist to localStorage
      const success = saveWorkflowsToStorage(newWorkflows);
      if (success) {
        console.log(`Workflow "${currentWorkflow.name}" saved successfully`);
      }
    }
  },

  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => {
    const newWorkflows = get().workflows.map((w) =>
      w.id === workflowId ? { ...w, ...updates, updatedAt: new Date() } : w
    );

    set({
      workflows: newWorkflows,
      currentWorkflow:
        get().currentWorkflow?.id === workflowId
          ? ({
              ...get().currentWorkflow,
              ...updates,
              updatedAt: new Date(),
            } as Workflow)
          : get().currentWorkflow,
    });

    // Persist to localStorage
    saveWorkflowsToStorage(newWorkflows);
  },

  deleteWorkflow: (workflowId: string) => {
    const newWorkflows = get().workflows.filter((w) => w.id !== workflowId);
    const currentWorkflow =
      get().currentWorkflow?.id === workflowId ? null : get().currentWorkflow;

    set({
      workflows: newWorkflows,
      currentWorkflow,
    });

    // Persist to localStorage
    saveWorkflowsToStorage(newWorkflows);
  },

  clearAllWorkflows: () => {
    set({
      workflows: [],
      currentWorkflow: null,
    });

    // Clear from localStorage
    clearWorkflowsFromStorage();
  },

  addNode: (type: string, position: { x: number; y: number }) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const nodeId = generateNodeId();
    const newNode: WorkflowNode = {
      id: nodeId,
      type,
      position,
      data: {
        id: nodeId,
        type: type as any,
        label: `${type} Node`,
        status: "idle",
        config: {},
        inputs: [],
        outputs: [],
      },
    };

    set((state) => ({
      currentWorkflow: state.currentWorkflow
        ? {
            ...state.currentWorkflow,
            nodes: [...state.currentWorkflow.nodes, newNode],
            updatedAt: new Date(),
          }
        : null,
    }));
  },

  updateNode: (nodeId: string, data: Partial<NodeData>) => {
    set((state) => {
      if (!state.currentWorkflow) return state;

      // Validate label uniqueness if label is being updated
      if (data.label !== undefined) {
        const otherNodes = state.currentWorkflow.nodes.filter(
          (n) => n.id !== nodeId
        );
        const duplicateLabel = otherNodes.find(
          (n) => n.data.label === data.label
        );

        if (duplicateLabel) {
          console.warn(
            `Node label "${data.label}" already exists. Please use a unique label.`
          );
          // You could throw an error here or show a toast notification
          return state;
        }
      }

      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          nodes: state.currentWorkflow.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
          updatedAt: new Date(),
        },
      };
    });
  },

  updateNodeLabelWithDependencies: (
    nodeId: string,
    newLabel: string,
    updateReferences: boolean
  ) => {
    set((state) => {
      if (!state.currentWorkflow) return state;

      const targetNode = state.currentWorkflow.nodes.find(
        (n) => n.id === nodeId
      );
      if (!targetNode) return state;

      const oldLabel = targetNode.data.label || nodeId;

      // Validate label uniqueness
      const otherNodes = state.currentWorkflow.nodes.filter(
        (n) => n.id !== nodeId
      );
      const duplicateLabel = otherNodes.find((n) => n.data.label === newLabel);

      if (duplicateLabel) {
        console.warn(
          `Node label "${newLabel}" already exists. Please use a unique label.`
        );
        return state;
      }

      if (updateReferences) {
        // Update the workflow with all references updated
        const updatedWorkflow = LabelDependencyManager.updateLabelReferences(
          state.currentWorkflow,
          nodeId,
          oldLabel,
          newLabel
        );

        return {
          ...state,
          currentWorkflow: {
            ...updatedWorkflow,
            updatedAt: new Date(),
          },
        };
      } else {
        // Just update the label without fixing references
        return {
          ...state,
          currentWorkflow: {
            ...state.currentWorkflow,
            nodes: state.currentWorkflow.nodes.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, label: newLabel } }
                : node
            ),
            updatedAt: new Date(),
          },
        };
      }
    });
  },

  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => {
    set((state) => ({
      currentWorkflow: state.currentWorkflow
        ? {
            ...state.currentWorkflow,
            nodes: state.currentWorkflow.nodes.map((node) =>
              node.id === nodeId ? { ...node, position } : node
            ),
            updatedAt: new Date(),
          }
        : null,
    }));
  },

  updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
    set((state) => ({
      currentWorkflow: state.currentWorkflow
        ? {
            ...state.currentWorkflow,
            nodes: state.currentWorkflow.nodes.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, ...data } }
                : node
            ),
            updatedAt: new Date(),
          }
        : null,
    }));
  },

  deleteNode: (nodeId: string) => {
    set((state) => ({
      currentWorkflow: state.currentWorkflow
        ? {
            ...state.currentWorkflow,
            nodes: state.currentWorkflow.nodes.filter(
              (node) => node.id !== nodeId
            ),
            edges: state.currentWorkflow.edges.filter(
              (edge) => edge.source !== nodeId && edge.target !== nodeId
            ),
            updatedAt: new Date(),
          }
        : null,
    }));
  },

  clearAllNodes: () => {
    // Clear execution state first
    set((state) => ({
      selectedNodeId: null,
      executionResults: {},
      isExecuting: false,
    }));

    // Use setTimeout to allow React Flow to properly handle node removal
    setTimeout(() => {
      set((state) => ({
        currentWorkflow: state.currentWorkflow
          ? {
              ...state.currentWorkflow,
              nodes: [],
              edges: [],
              updatedAt: new Date(),
            }
          : null,
      }));
    }, 0);
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  addEdge: (
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string
  ) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const newEdge: WorkflowEdge = {
      id: generateEdgeId(),
      source,
      target,
      sourceHandle,
      targetHandle,
    };

    set((state) => ({
      currentWorkflow: state.currentWorkflow
        ? {
            ...state.currentWorkflow,
            edges: [...state.currentWorkflow.edges, newEdge],
            updatedAt: new Date(),
          }
        : null,
    }));
  },

  deleteEdge: (edgeId: string) => {
    set((state) => ({
      currentWorkflow: state.currentWorkflow
        ? {
            ...state.currentWorkflow,
            edges: state.currentWorkflow.edges.filter(
              (edge) => edge.id !== edgeId
            ),
            updatedAt: new Date(),
          }
        : null,
    }));
  },

  executeWorkflow: async (
    testInput?: string,
    options?: {
      mode?: "sequential" | "parallel" | "conditional";
      maxConcurrency?: number;
      timeout?: number;
      retryPolicy?: {
        maxRetries: number;
        retryDelay: number;
        backoffMultiplier: number;
      };
    }
  ) => {
    const { currentWorkflow, executionMode, executionConfig } = get();
    if (!currentWorkflow) return;

    set({ isExecuting: true, executionResults: {} });

    try {
      // Prepare execution options
      const execOptions = {
        mode: options?.mode || executionMode,
        maxConcurrency:
          options?.maxConcurrency || executionConfig.maxConcurrency,
        timeout: options?.timeout || executionConfig.timeout,
        retryPolicy: options?.retryPolicy || executionConfig.retryPolicy,
      };

      // If test input is provided, update the data input node
      if (testInput) {
        const dataInputNode = currentWorkflow.nodes.find(
          (node) => node.data.type === "dataInput"
        );
        if (dataInputNode) {
          // Update the node's config with test input
          const updatedNodes = currentWorkflow.nodes.map((node) =>
            node.id === dataInputNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      defaultValue: testInput,
                    },
                  },
                }
              : node
          );
          set({ currentWorkflow: { ...currentWorkflow, nodes: updatedNodes } });
        }
      }

      // Execute using the advanced execution engine
      const execution = await executionEngine.executeWorkflow(
        currentWorkflow.id,
        currentWorkflow.nodes,
        currentWorkflow.edges,
        execOptions,
        (nodeId, status, data, error) => {
          // Update node status in real-time
          console.log(`Node ${nodeId} status updated:`, {
            status,
            data,
            error,
          });
          get().updateNodeStatus(nodeId, status as NodeStatus, data, error);
        }
      );

      // Store the execution plan
      set({ currentExecution: execution });

      // Convert execution results to the format expected by the UI
      const results: Record<string, any> = {};
      execution.nodes.forEach((node) => {
        if (node.outputs.has("output")) {
          results[node.nodeId] = {
            status: node.status === "completed" ? "success" : node.status,
            data: node.outputs.get("output"),
            error: node.error,
            executionTime: node.duration,
          };
        }
      });

      set({ executionResults: results });
    } catch (error) {
      console.error("Workflow execution failed:", error);

      // Handle validation errors specifically
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const isValidationError =
        errorMessage.includes("validation failed") ||
        errorMessage.includes("Circular dependencies") ||
        errorMessage.includes("Invalid edge") ||
        errorMessage.includes("Self-loop detected");

      // Update all nodes to error status
      const errorResults: Record<string, any> = {};
      currentWorkflow.nodes.forEach((node) => {
        errorResults[node.id] = {
          status: "error",
          error: errorMessage,
        };
      });

      // Add validation error to results if it's a validation issue
      if (isValidationError) {
        errorResults["validation"] = {
          status: "error",
          error: errorMessage,
          isValidationError: true,
        };
      }

      set({ executionResults: errorResults });
    } finally {
      set({ isExecuting: false });
    }
  },

  updateNodeStatus: (
    nodeId: string,
    status: NodeStatus,
    data?: any,
    error?: string
  ) => {
    set((state) => ({
      executionResults: {
        ...state.executionResults,
        [nodeId]: { status, data, error, timestamp: new Date() },
      },
    }));

    get().updateNode(nodeId, {
      status,
      ...(data && { outputs: [data] }),
      ...(error && { error }),
    });
  },

  clearExecutionResults: () => {
    set({ executionResults: {}, isExecuting: false, currentExecution: null });
  },

  setExecutionMode: (mode: "sequential" | "parallel" | "conditional") => {
    set({ executionMode: mode });
  },

  updateExecutionConfig: (
    config: Partial<WorkflowStore["executionConfig"]>
  ) => {
    set((state) => ({
      executionConfig: { ...state.executionConfig, ...config },
    }));
  },

  getExecutionStats: () => {
    return executionEngine.getExecutionStats();
  },

  // Panel management methods
  togglePanel: (panelName: keyof WorkflowStore["panelStates"]) => {
    set((state) => ({
      panelStates: {
        ...state.panelStates,
        [panelName]: {
          ...state.panelStates[panelName],
          isCollapsed: !state.panelStates[panelName].isCollapsed,
        },
      },
    }));
  },

  collapsePanel: (panelName: keyof WorkflowStore["panelStates"]) => {
    set((state) => ({
      panelStates: {
        ...state.panelStates,
        [panelName]: {
          ...state.panelStates[panelName],
          isCollapsed: true,
        },
      },
    }));
  },

  expandPanel: (panelName: keyof WorkflowStore["panelStates"]) => {
    set((state) => ({
      panelStates: {
        ...state.panelStates,
        [panelName]: {
          ...state.panelStates[panelName],
          isCollapsed: false,
        },
      },
    }));
  },

  hidePanel: (panelName: keyof WorkflowStore["panelStates"]) => {
    set((state) => ({
      panelStates: {
        ...state.panelStates,
        [panelName]: {
          ...state.panelStates[panelName],
          isHidden: true,
        },
      },
    }));
  },

  showPanel: (panelName: keyof WorkflowStore["panelStates"]) => {
    set((state) => ({
      panelStates: {
        ...state.panelStates,
        [panelName]: {
          ...state.panelStates[panelName],
          isHidden: false,
        },
      },
    }));
  },

  // Copilot methods
  generateWorkflowFromDescription: async (description: string) => {
    try {
      const parsedIntent = await agentManager.generateWorkflowFromDescription(
        description
      );
      const workflowStructure = parsedIntent.workflowStructure;

      if (!workflowStructure) {
        throw new Error("Failed to generate workflow structure");
      }

      // Create a new workflow with the generated structure
      const newWorkflow = createEmptyWorkflow(parsedIntent.intent);

      // Convert WorkflowStructure to Workflow format with proper UUIDs
      const nodeIdMapping = createIdMapping(workflowStructure.nodes.length);
      const nodes: WorkflowNode[] = workflowStructure.nodes.map(
        (node, index) => {
          const nodeId = nodeIdMapping.get(`node-${index}`) || generateNodeId();
          return {
            id: nodeId,
            type: node.type,
            position: node.position || { x: 100 + index * 200, y: 100 },
            data: {
              id: nodeId,
              type: node.type as any,
              label: node.label,
              status: "idle" as const,
              config: node.config,
              inputs: [],
              outputs: [],
            },
          };
        }
      );

      const edges: WorkflowEdge[] = workflowStructure.edges.map(
        (edge, index) => {
          const sourceId = nodeIdMapping.get(edge.source) || edge.source;
          const targetId = nodeIdMapping.get(edge.target) || edge.target;
          return {
            id: generateEdgeId(),
            source: sourceId,
            target: targetId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          };
        }
      );

      const generatedWorkflow: Workflow = {
        ...newWorkflow,
        name: `Generated: ${parsedIntent.intent}`,
        nodes,
        edges,
      };

      // Add to workflows and set as current
      const newWorkflows = [...get().workflows, generatedWorkflow];
      set({
        workflows: newWorkflows,
        currentWorkflow: generatedWorkflow,
      });

      // Persist to localStorage
      saveWorkflowsToStorage(newWorkflows);
    } catch (error) {
      console.error("Error generating workflow from description:", error);

      // Enhanced error handling with detailed context
      if (error instanceof Error && "errorContext" in error) {
        const errorContext = (error as any).errorContext;
        console.error("Detailed error context:", {
          stage: errorContext.stage,
          toolName: errorContext.toolName,
          errorType: errorContext.errorType,
          suggestions: errorContext.suggestions,
          partialResults: Object.keys(errorContext.partialResults || {}),
        });

        // You could also dispatch an error event with detailed context here
        // for better user experience and debugging
      }

      throw error;
    }
  },

  applyCopilotSuggestions: (suggestions: any[]) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    // Apply suggestions to current workflow
    // This is a simplified implementation - in practice, you'd have more sophisticated suggestion application
    suggestions.forEach((suggestion) => {
      if (suggestion.type === "node" && suggestion.nodeId) {
        // Apply node-level suggestions
        const node = currentWorkflow.nodes.find(
          (n) => n.id === suggestion.nodeId
        );
        if (node) {
          // Apply suggestion to node configuration
          console.log("Applying suggestion to node:", suggestion);
        }
      }
    });
  },

  validateGeneratedWorkflow: async (): Promise<ValidationResult | null> => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return null;

    // Convert current workflow to WorkflowStructure format for validation
    const workflowStructure: WorkflowStructure = {
      nodes: currentWorkflow.nodes.map((node) => ({
        type: node.type,
        label: node.data.label,
        config: node.data.config,
        position: node.position,
      })),
      edges: currentWorkflow.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
      topology: {
        type: "linear",
        description: "Sequential processing",
        parallelExecution: false,
      },
      complexity: "medium",
    };

    try {
      return await agentManager.validateWorkflow(workflowStructure, "");
    } catch (error) {
      console.error("Error validating workflow:", error);
      return {
        isValid: false,
        issues: ["Validation failed due to internal error"],
        suggestions: ["Please check the workflow structure and try again"],
        complexity: "unknown",
        estimatedExecutionTime: 0,
      };
    }
  },

  getCopilotSuggestions: async (context?: string): Promise<string[]> => {
    try {
      return await agentManager.getSuggestions(context);
    } catch (error) {
      console.error("Error getting copilot suggestions:", error);
      return ["Unable to generate suggestions at this time"];
    }
  },
}));
