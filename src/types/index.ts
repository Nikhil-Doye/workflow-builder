export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  status: NodeStatus;
  config: Record<string, any>;
  inputs: any[];
  outputs: any[];
  error?: string;
}

export type NodeType =
  | "webScraping"
  | "structuredOutput"
  | "embeddingGenerator"
  | "similaritySearch"
  | "llmTask"
  | "dataInput"
  | "dataOutput"
  // Database connectors
  | "databaseQuery"
  | "databaseInsert"
  | "databaseUpdate"
  | "databaseDelete";

export type NodeStatus =
  | "idle"
  | "running"
  | "success"
  | "completed"
  | "error"
  | "failed";

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionResult {
  nodeId: string;
  status: NodeStatus;
  data?: any;
  error?: string;
  executionTime?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "running" | "completed" | "failed";
  results: ExecutionResult[];
  startedAt: Date;
  completedAt?: Date;
}

// Copilot Types
export interface IntentClassification {
  intent: string;
  confidence: number;
  reasoning: string;
  complexity?: string;
  stepBreakdown?: Array<{
    step: number;
    operation: string;
    description: string;
    nodeType: string;
  }>;
  dataFlow?: string;
  integrationPoints?: string[];
}

export interface EntityExtraction {
  urls: string[];
  dataTypes: string[];
  outputFormats: string[];
  aiTasks: string[];
  processingSteps: string[];
  targetSites?: string[];
  dataSources?: string[];
}

export interface MixedIntentAnalysis {
  intent: string;
  confidence: number;
  reasoning: string;
  subIntents: string[];
  subConfidences: Record<string, number>;
  complexity: ComplexityAnalysis;
}

export interface ComplexityAnalysis {
  level: "low" | "medium" | "high";
  score: number;
  patterns: string[];
  estimatedNodes: number;
}

export interface ParsedIntent {
  intent: string;
  confidence: number;
  entities: EntityExtraction;
  workflowStructure: WorkflowStructure;
  reasoning: string;
}

export interface WorkflowStructure {
  id: string;
  name: string;
  nodes: WorkflowNodeStructure[];
  edges: WorkflowEdgeStructure[];
  topology: WorkflowTopology;
  complexity: string;
  estimatedExecutionTime?: number;
  validationRules?: string[];
}

export interface WorkflowNodeStructure {
  id: string;
  type: string;
  label: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

export interface WorkflowEdgeStructure {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowTopology {
  type: "linear" | "fork-join" | "branching";
  description: string;
  parallelExecution: boolean;
}

export interface CopilotSuggestion {
  type: "node" | "configuration" | "connection";
  nodeId?: string;
  suggestion: string;
  confidence: number;
  reasoning: string;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  pattern: WorkflowPattern;
  useCases: string[];
  complexity: "simple" | "medium" | "complex";
}

export interface WorkflowPattern {
  nodes: WorkflowNodeStructure[];
  edges: WorkflowEdgeStructure[];
  description: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  complexity?: string;
  estimatedExecutionTime?: number;
}

export interface MixedValidationResult extends ValidationResult {
  complexity: string;
  estimatedExecutionTime: number;
}
