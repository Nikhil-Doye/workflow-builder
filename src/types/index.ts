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
  | "dataOutput";

export type NodeStatus = "idle" | "running" | "success" | "error";

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
