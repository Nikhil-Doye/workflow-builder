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
import {
  callOpenAI,
  OpenAIConfig,
  generateEmbedding,
} from "../services/openaiService";
import {
  scrapeWithFirecrawl,
  FirecrawlConfig,
} from "../services/firecrawlService";
import { searchSimilarVectors } from "../services/pineconeService";
import { substituteVariables, NodeOutput } from "../utils/variableSubstitution";
import { agentManager } from "../services/agents/AgentManager";
import { executionEngine, ExecutionPlan } from "../services/executionEngine";

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
        execOptions
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
      // Update all nodes to error status
      const errorResults: Record<string, any> = {};
      currentWorkflow.nodes.forEach((node) => {
        errorResults[node.id] = {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      });
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

      // Convert WorkflowStructure to Workflow format
      const nodes: WorkflowNode[] = workflowStructure.nodes.map(
        (node, index) => ({
          id: `node-${index}`,
          type: node.type,
          position: node.position || { x: 100 + index * 200, y: 100 },
          data: {
            id: `node-${index}`,
            type: node.type as any,
            label: node.label,
            status: "idle" as const,
            config: node.config,
            inputs: [],
            outputs: [],
          },
        })
      );

      const edges: WorkflowEdge[] = workflowStructure.edges.map(
        (edge, index) => ({
          id: `edge-${index}`,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })
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

// Node processing functions
const processLLMNode = async (
  node: WorkflowNode,
  nodeOutputs: Map<string, NodeOutput>,
  nodeLabelToId?: Map<string, string>
) => {
  const config = node.data.config;
  let prompt = config.prompt || "Process the following input: {{input}}";
  const model = config.model || "gpt-3.5-turbo";
  const temperature = config.temperature || 0.7;
  const maxTokens = config.maxTokens || 1000;

  // Check if we should optimize the prompt
  if (config.optimizePrompt !== false) {
    try {
      // Import the prompt optimizer
      const { promptOptimizer } = require("../services/promptOptimizer");

      // Create node context for optimization
      const nodeContext = {
        dataType: determineNodeDataType(node, nodeOutputs),
        previousNodes: getPreviousNodeIds(node, nodeOutputs),
        intent: "AI_ANALYSIS",
        domain: determineNodeDomain(node, nodeOutputs),
        workflowType: "ai_analysis",
        availableData: nodeOutputs,
      };

      // Generate optimized prompt
      const optimizedPrompt = promptOptimizer.generateOptimizedPrompt(
        prompt,
        extractEntitiesFromPrompt(prompt),
        nodeContext,
        nodeOutputs
      );

      // Use optimized prompt if it's different and better
      if (optimizedPrompt && optimizedPrompt !== prompt) {
        console.log("Using optimized prompt for LLM node:", node.id);
        prompt = optimizedPrompt;
      }
    } catch (error) {
      console.warn("Failed to optimize prompt, using original:", error);
    }
  }

  // Apply variable substitution to the prompt
  const processedPrompt = substituteVariables(
    prompt,
    nodeOutputs,
    nodeLabelToId
  );

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
    throw new Error(
      `LLM processing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const processDataOutputNode = async (
  node: WorkflowNode,
  nodeOutputs: Map<string, NodeOutput>,
  nodeLabelToId?: Map<string, string>
) => {
  const config = node.data.config;
  const format = config.format || "text";
  const filename = config.filename || "output.txt";

  // Get the most recent input data from the node outputs
  const inputData = Array.from(nodeOutputs.values()).pop()?.output || "";

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
  nodeOutputs: Map<string, NodeOutput>,
  nodeLabelToId?: Map<string, string>
) => {
  const config = node.data.config;

  // Apply variable substitution to the URL
  const urlTemplate = config.url || "";
  const substitutedUrl = substituteVariables(
    urlTemplate,
    nodeOutputs,
    nodeLabelToId
  );

  // Check if variable substitution actually worked (no remaining variables)
  const hasUnresolvedVariables = /\{\{[^}]+\}\}/.test(substitutedUrl);

  let url = substitutedUrl;

  // If substitution failed and we have unresolved variables, try fallback
  if (hasUnresolvedVariables) {
    console.warn(
      `Variable substitution failed for URL template: "${urlTemplate}"`
    );
    console.warn(`Substituted result: "${substitutedUrl}"`);
    console.warn(`Available node outputs:`, Array.from(nodeOutputs.keys()));

    // Try to use the last node's output as fallback
    const lastNodeOutput = Array.from(nodeOutputs.values()).pop()?.output;
    if (
      lastNodeOutput &&
      typeof lastNodeOutput === "string" &&
      lastNodeOutput.startsWith("http")
    ) {
      url = lastNodeOutput;
      console.log(`Using fallback URL from last node: "${url}"`);
    } else {
      // If no valid fallback, return error
      return {
        output: `Error: Could not resolve URL from template "${urlTemplate}". No valid URL found in node outputs.`,
        error: `Invalid URL template: "${urlTemplate}". Please ensure the referenced node exists and has a valid URL output.`,
        url: urlTemplate,
      };
    }
  }

  // Validate that we have a proper URL
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    return {
      output: `Error: Invalid URL "${url}". URL must start with http:// or https://`,
      error: `Invalid URL: "${url}". Please provide a valid URL or ensure variable substitution works correctly.`,
      url: url,
    };
  }

  console.log(`Web scraping node using URL: "${url}"`);

  // Sanitize requested formats: map unsupported values and dedupe
  const allowedFormats = new Set([
    "markdown",
    "html",
    "rawHtml",
    "summary",
    "links",
    "images",
    "screenshot",
    "json",
  ]);
  const requestedFormats: string[] = Array.isArray(config.formats)
    ? config.formats
    : ["markdown", "html"];
  const normalizedFormats = Array.from(
    new Set([
      ...requestedFormats
        .map((fmt: string) => (fmt === "text" ? "markdown" : fmt))
        .filter((fmt: string) => allowedFormats.has(fmt)),
      // Always include markdown as a safe fallback
      "markdown",
    ])
  );

  // Prepare Firecrawl configuration
  const firecrawlConfig: FirecrawlConfig = {
    url,
    formats:
      normalizedFormats.length > 0
        ? (normalizedFormats as FirecrawlConfig["formats"])
        : (["markdown"] as FirecrawlConfig["formats"]),
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
      // Choose a string output suitable for downstream LLM nodes
      const preferredOrder = [
        "markdown",
        "html",
        "rawHtml",
        "summary",
      ] as const;
      let chosenText: string = "";
      for (const key of preferredOrder) {
        const val = (result.data as any)[key];
        if (typeof val === "string" && val.trim().length > 0) {
          chosenText = val;
          break;
        }
      }
      if (!chosenText && result.data.json) {
        try {
          chosenText = JSON.stringify(result.data.json);
        } catch {
          chosenText = String(result.data.json);
        }
      }

      // Enforce maxLength if configured
      const maxLen =
        typeof config.maxLength === "number" ? config.maxLength : 0;
      if (
        maxLen > 0 &&
        typeof chosenText === "string" &&
        chosenText.length > maxLen
      ) {
        chosenText = chosenText.slice(0, maxLen);
      }

      return {
        output: chosenText || result.data.markdown || result.data.html || "",
        url,
        metadata: result.data.metadata,
        markdown: result.data.markdown,
        html: result.data.html,
        formats: firecrawlConfig.formats,
        onlyMainContent: firecrawlConfig.onlyMainContent,
      };
    } else {
      throw new Error(result.error || "Failed to scrape URL with Firecrawl");
    }
  } catch (error) {
    console.error("Error processing web scraping node:", error);
    throw new Error(
      `Web scraping failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const processEmbeddingNode = async (
  node: WorkflowNode,
  nodeOutputs: Map<string, NodeOutput>,
  nodeLabelToId?: Map<string, string>
) => {
  const config = node.data.config;
  const model = config.model || "text-embedding-ada-002";
  const dimensions = config.dimensions || 1536;

  // Get the most recent input data from the node outputs
  const inputData = Array.from(nodeOutputs.values()).pop()?.output || "";

  if (!inputData) {
    throw new Error("No input data provided for embedding generation");
  }

  const embedding = await generateEmbedding(inputData, model);

  return {
    output: embedding,
    model,
    dimensions,
    inputData,
    type: "embedding",
  };
};

const processSimilaritySearchNode = async (
  node: WorkflowNode,
  nodeOutputs: Map<string, NodeOutput>,
  nodeLabelToId?: Map<string, string>
) => {
  const config = node.data.config;
  const vectorStore = config.vectorStore || "pinecone";
  const topK = config.topK || 5;
  const threshold = config.threshold || 0.8;
  const indexName = config.indexName || "default-index";

  const inputData = Array.from(nodeOutputs.values()).pop()?.output || "";

  if (!inputData) {
    throw new Error("No input data provided for similarity search");
  }

  if (vectorStore === "pinecone") {
    const queryEmbedding = await generateEmbedding(inputData);
    const results = await searchSimilarVectors(
      queryEmbedding,
      indexName,
      topK,
      threshold
    );

    return {
      output: results,
      vectorStore,
      topK,
      threshold,
      indexName,
      type: "pinecone_search",
    };
  } else {
    throw new Error(
      `Vector store '${vectorStore}' is not supported. Only Pinecone is currently supported.`
    );
  }
};

const processStructuredOutputNode = async (
  node: WorkflowNode,
  nodeOutputs: Map<string, NodeOutput>,
  nodeLabelToId?: Map<string, string>
) => {
  const config = node.data.config;
  const schema = config.schema || '{"type": "object"}';
  const model = config.model || "gpt-3.5-turbo";

  // Get the most recent input data from the node outputs
  const inputData = Array.from(nodeOutputs.values()).pop()?.output || "";

  // Use LLM to structure the data according to the schema
  try {
    const prompt = `Structure the following data according to the provided JSON schema. Return only valid JSON that matches the schema exactly.

Data: ${inputData}

Schema: ${schema}

Return the structured data as JSON:`;

    const response = await callOpenAI(prompt, {
      model: model,
      temperature: 0.1,
      maxTokens: 1000,
    });

    const structuredOutput = {
      input: inputData,
      structured: JSON.parse(response.content),
      schema: JSON.parse(schema),
    };

    return { output: structuredOutput, model, schema };
  } catch (error) {
    // Fallback to basic structure if LLM fails
    const fallbackStructuredOutput = {
      input: inputData,
      structured: {
        text: inputData,
        length: inputData.length,
        timestamp: new Date().toISOString(),
      },
      schema: JSON.parse(schema),
    };

    return { output: fallbackStructuredOutput, model, schema };
  }
};

// Helper functions for prompt optimization
function determineNodeDataType(
  node: WorkflowNode,
  nodeOutputs: Map<string, NodeOutput>
): string {
  // Check if this is a data input node
  if (node.data.type === "dataInput") {
    return node.data.config?.dataType || "text";
  }

  // Check previous nodes for data type
  const previousOutput = Array.from(nodeOutputs.values()).pop();
  if (previousOutput?.data?.type) {
    return previousOutput.data.type;
  }

  // Check if previous output looks like specific data types
  if (previousOutput?.output) {
    const output = previousOutput.output;
    if (typeof output === "string") {
      if (output.startsWith("http")) return "url";
      if (output.includes("{") && output.includes("}")) return "json";
      if (output.includes(",") && output.includes("\n")) return "csv";
    }
  }

  return "text";
}

function getPreviousNodeIds(
  node: WorkflowNode,
  nodeOutputs: Map<string, NodeOutput>
): string[] {
  return Array.from(nodeOutputs.keys());
}

function determineNodeDomain(
  node: WorkflowNode,
  nodeOutputs: Map<string, NodeOutput>
): string {
  // Check node label for domain indicators
  const label = node.data.label?.toLowerCase() || "";

  if (
    label.includes("resume") ||
    label.includes("cv") ||
    label.includes("job")
  ) {
    return "jobApplication";
  }

  if (
    label.includes("financial") ||
    label.includes("revenue") ||
    label.includes("profit")
  ) {
    return "financial";
  }

  if (label.includes("legal") || label.includes("contract")) {
    return "legal";
  }

  if (label.includes("medical") || label.includes("health")) {
    return "medical";
  }

  if (label.includes("technical") || label.includes("code")) {
    return "technical";
  }

  if (label.includes("content") || label.includes("marketing")) {
    return "contentAnalysis";
  }

  // Check previous outputs for domain indicators
  for (const output of nodeOutputs.values()) {
    if (output.output && typeof output.output === "string") {
      const text = output.output.toLowerCase();
      if (text.includes("resume") || text.includes("cv"))
        return "jobApplication";
      if (text.includes("financial") || text.includes("revenue"))
        return "financial";
      if (text.includes("legal") || text.includes("contract")) return "legal";
      if (text.includes("medical") || text.includes("health")) return "medical";
      if (text.includes("technical") || text.includes("code"))
        return "technical";
      if (text.includes("content") || text.includes("marketing"))
        return "contentAnalysis";
    }
  }

  return "general";
}

function extractEntitiesFromPrompt(prompt: string): any {
  // Simple entity extraction from prompt text
  const entities: any = {
    aiTasks: [],
    dataTypes: [],
  };

  const lowerPrompt = prompt.toLowerCase();

  // Extract AI tasks
  if (lowerPrompt.includes("summarize")) entities.aiTasks.push("summarize");
  if (lowerPrompt.includes("analyze")) entities.aiTasks.push("analyze");
  if (lowerPrompt.includes("extract")) entities.aiTasks.push("extract");
  if (lowerPrompt.includes("classify")) entities.aiTasks.push("classify");
  if (lowerPrompt.includes("generate")) entities.aiTasks.push("generate");
  if (lowerPrompt.includes("translate")) entities.aiTasks.push("translate");
  if (lowerPrompt.includes("sentiment")) entities.aiTasks.push("sentiment");
  if (lowerPrompt.includes("compare")) entities.aiTasks.push("compare");

  // Extract data types
  if (lowerPrompt.includes("resume") || lowerPrompt.includes("cv"))
    entities.dataTypes.push("resume");
  if (lowerPrompt.includes("pdf")) entities.dataTypes.push("pdf");
  if (lowerPrompt.includes("json")) entities.dataTypes.push("json");
  if (lowerPrompt.includes("csv")) entities.dataTypes.push("csv");
  if (lowerPrompt.includes("url")) entities.dataTypes.push("url");
  if (lowerPrompt.includes("financial")) entities.dataTypes.push("financial");
  if (lowerPrompt.includes("legal")) entities.dataTypes.push("legal");
  if (lowerPrompt.includes("medical")) entities.dataTypes.push("medical");
  if (lowerPrompt.includes("technical")) entities.dataTypes.push("technical");

  return entities;
}
