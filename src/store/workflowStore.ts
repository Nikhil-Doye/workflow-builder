import { create } from "zustand";
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  NodeData,
  NodeStatus,
} from "../types";
import { v4 as uuidv4 } from "uuid";

interface WorkflowStore {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  selectedNodeId: string | null;
  isExecuting: boolean;
  executionResults: Record<string, any>;

  // Workflow management
  createWorkflow: (name: string) => void;
  loadWorkflow: (workflowId: string) => void;
  saveWorkflow: () => void;
  deleteWorkflow: (workflowId: string) => void;

  // Node management
  addNode: (type: string, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
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
  executeWorkflow: () => Promise<void>;
  updateNodeStatus: (
    nodeId: string,
    status: NodeStatus,
    data?: any,
    error?: string
  ) => void;
  clearExecutionResults: () => void;
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
  workflows: [],
  currentWorkflow: null,
  selectedNodeId: null,
  isExecuting: false,
  executionResults: {},

  createWorkflow: (name: string) => {
    const newWorkflow = createEmptyWorkflow(name);
    set((state) => ({
      workflows: [...state.workflows, newWorkflow],
      currentWorkflow: newWorkflow,
    }));
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

      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === updatedWorkflow.id ? updatedWorkflow : w
        ),
        currentWorkflow: updatedWorkflow,
      }));
    }
  },

  deleteWorkflow: (workflowId: string) => {
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== workflowId),
      currentWorkflow:
        state.currentWorkflow?.id === workflowId ? null : state.currentWorkflow,
    }));
  },

  addNode: (type: string, position: { x: number; y: number }) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const newNode: WorkflowNode = {
      id: uuidv4(),
      type,
      position,
      data: {
        id: uuidv4(),
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
      id: uuidv4(),
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

  executeWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({ isExecuting: true, executionResults: {} });

    try {
      // Simple execution logic - in a real app, this would call your backend
      for (const node of currentWorkflow.nodes) {
        get().updateNodeStatus(node.id, "running");

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock execution result
        const mockResult = { output: `Processed by ${node.data.type} node` };
        get().updateNodeStatus(node.id, "success", mockResult);
      }
    } catch (error) {
      console.error("Workflow execution failed:", error);
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
    set({ executionResults: {}, isExecuting: false });
  },
}));
