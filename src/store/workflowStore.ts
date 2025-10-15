import { create } from "zustand";
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  NodeData,
  NodeStatus,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import { callOpenAI, OpenAIConfig } from "../services/openaiService";
import {
  scrapeWithFirecrawl,
  FirecrawlConfig,
} from "../services/firecrawlService";

// localStorage key for workflows
const WORKFLOWS_STORAGE_KEY = "agent-workflow-builder-workflows";

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
      // Convert date strings back to Date objects
      return workflows.map((workflow: any) => ({
        ...workflow,
        createdAt: new Date(workflow.createdAt),
        updatedAt: new Date(workflow.updatedAt),
      }));
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

  // Workflow management
  createWorkflow: (name: string) => void;
  loadWorkflow: (workflowId: string) => void;
  saveWorkflow: () => void;
  deleteWorkflow: (workflowId: string) => void;
  clearAllWorkflows: () => void;

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
  executeWorkflow: (testInput?: string) => Promise<void>;
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
  workflows: loadWorkflowsFromStorage(),
  currentWorkflow: null,
  selectedNodeId: null,
  isExecuting: false,
  executionResults: {},

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

  executeWorkflow: async (testInput?: string) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({ isExecuting: true, executionResults: {} });

    try {
      // Find the first data input node to start with
      const dataInputNode = currentWorkflow.nodes.find(
        (node) => node.data.type === "dataInput"
      );

      if (!dataInputNode) {
        console.error("No data input node found in workflow");
        return;
      }

      // Start with the data input node
      get().updateNodeStatus(dataInputNode.id, "running");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Use test input if provided, otherwise use the node's default value
      const inputData =
        testInput || dataInputNode.data.config.defaultValue || "";
      const dataInputResult = { output: inputData };
      get().updateNodeStatus(dataInputNode.id, "success", dataInputResult);

      // Process remaining nodes in order
      const remainingNodes = currentWorkflow.nodes.filter(
        (node) => node.id !== dataInputNode.id
      );

      for (const node of remainingNodes) {
        get().updateNodeStatus(node.id, "running");
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Process node based on type
        let result;
        switch (node.data.type) {
          case "llmTask":
            result = await processLLMNode(node, inputData);
            break;
          case "dataOutput":
            result = await processDataOutputNode(node, inputData);
            break;
          case "webScraping":
            result = await processWebScrapingNode(node, inputData);
            break;
          case "embeddingGenerator":
            result = await processEmbeddingNode(node, inputData);
            break;
          case "similaritySearch":
            result = await processSimilaritySearchNode(node, inputData);
            break;
          case "structuredOutput":
            result = await processStructuredOutputNode(node, inputData);
            break;
          default:
            result = { output: `Processed by ${node.data.type} node` };
        }

        get().updateNodeStatus(node.id, "success", result);
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

// Node processing functions
const processLLMNode = async (node: WorkflowNode, inputData: string) => {
  const config = node.data.config;
  const prompt = config.prompt || "Process the following input: {{input}}";
  const model = config.model || "gpt-3.5-turbo";
  const temperature = config.temperature || 0.7;
  const maxTokens = config.maxTokens || 1000;

  // Replace {{input}} placeholder with actual input data
  const processedPrompt = prompt.replace(/\{\{input\}\}/g, inputData);

  try {
    // Call OpenAI API
    const openaiConfig: OpenAIConfig = {
      model,
      temperature,
      maxTokens,
    };

    const response = await callOpenAI(processedPrompt, openaiConfig);

    return {
      output: response.content,
      prompt: processedPrompt,
      model,
      temperature,
      maxTokens,
      usage: response.usage,
    };
  } catch (error) {
    console.error("Error processing LLM node:", error);

    // Fallback to mock response if API fails
    const fallbackResponse = `Error calling OpenAI API: ${
      error instanceof Error ? error.message : "Unknown error"
    }. Please check your API key and try again.`;

    return {
      output: fallbackResponse,
      prompt: processedPrompt,
      model,
      temperature,
      maxTokens,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const processDataOutputNode = async (node: WorkflowNode, inputData: string) => {
  const config = node.data.config;
  const format = config.format || "text";
  const filename = config.filename || "output.txt";

  let output;
  switch (format) {
    case "json":
      output = JSON.stringify(
        { data: inputData, timestamp: new Date().toISOString() },
        null,
        2
      );
      break;
    case "csv":
      output = `data\n"${inputData}"`;
      break;
    default:
      output = inputData;
  }

  return { output, format, filename };
};

const processWebScrapingNode = async (
  node: WorkflowNode,
  inputData: string
) => {
  const config = node.data.config;
  const url = config.url || inputData;

  // Prepare Firecrawl configuration
  const firecrawlConfig: FirecrawlConfig = {
    url,
    formats: config.formats || ["markdown", "html"],
    onlyMainContent: config.onlyMainContent !== false,
    maxLength: config.maxLength || 5000,
    waitFor: config.waitFor || 2000,
    timeout: config.timeout || 30000,
  };

  // Parse include/exclude tags if provided
  if (config.includeTags) {
    firecrawlConfig.includeTags = config.includeTags
      .split(",")
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);
  }

  if (config.excludeTags) {
    firecrawlConfig.excludeTags = config.excludeTags
      .split(",")
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);
  }

  try {
    // Use Firecrawl to scrape the URL
    const result = await scrapeWithFirecrawl(firecrawlConfig);

    if (result.success && result.data) {
      return {
        output: result.data.content,
        url,
        metadata: result.data.metadata,
        markdown: result.data.markdown,
        html: result.data.html,
        formats: config.formats || ["markdown", "html"],
        onlyMainContent: config.onlyMainContent !== false,
      };
    } else {
      throw new Error(result.error || "Failed to scrape URL with Firecrawl");
    }
  } catch (error) {
    console.error("Error processing web scraping node:", error);

    // Return fallback response if Firecrawl fails
    const fallbackContent = `Error scraping ${url}: ${
      error instanceof Error ? error.message : "Unknown error"
    }. Please check your Firecrawl API key and try again.`;

    return {
      output: fallbackContent,
      url,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const processEmbeddingNode = async (node: WorkflowNode, inputData: string) => {
  const config = node.data.config;
  const model = config.model || "text-embedding-ada-002";
  const dimensions = config.dimensions || 1536;

  // In a real app, this would generate actual embeddings
  const mockEmbedding = Array.from({ length: dimensions }, () => Math.random());

  return { output: mockEmbedding, model, dimensions };
};

const processSimilaritySearchNode = async (
  node: WorkflowNode,
  inputData: string
) => {
  const config = node.data.config;
  const vectorStore = config.vectorStore || "pinecone";
  const topK = config.topK || 5;
  const threshold = config.threshold || 0.8;

  // In a real app, this would perform actual similarity search
  const mockResults = Array.from({ length: topK }, (_, i) => ({
    id: `result_${i + 1}`,
    content: `Similar content ${i + 1} for: ${inputData}`,
    similarity: threshold + Math.random() * (1 - threshold),
  }));

  return { output: mockResults, vectorStore, topK, threshold };
};

const processStructuredOutputNode = async (
  node: WorkflowNode,
  inputData: string
) => {
  const config = node.data.config;
  const schema = config.schema || '{"type": "object"}';
  const model = config.model || "gpt-3.5-turbo";

  // In a real app, this would use an LLM to structure the data according to the schema
  const mockStructuredOutput = {
    input: inputData,
    structured: {
      text: inputData,
      length: inputData.length,
      timestamp: new Date().toISOString(),
    },
    schema: JSON.parse(schema),
  };

  return { output: mockStructuredOutput, model, schema };
};
