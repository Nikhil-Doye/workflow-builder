// Tool system types
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, any>) => Promise<ToolResult>;
  validate?: (params: Record<string, any>) => ToolValidationResult;
}

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
    confidence?: number;
  };
}

export interface ToolValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ToolRegistry {
  registerTool(tool: Tool): void;
  getTool(name: string): Tool | undefined;
  getAllTools(): Tool[];
  unregisterTool(name: string): void;
}

export interface AgentTask {
  id: string;
  type:
    | "workflow_generation"
    | "intent_analysis"
    | "validation"
    | "optimization";
  input: string;
  context?: Record<string, any>;
  priority: "low" | "medium" | "high";
  createdAt: Date;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  toolsUsed: string[];
  executionTime: number;
  confidence: number;
}

export interface AgentContext {
  userRequest: string;
  currentWorkflow?: any;
  executionHistory: any[];
  userPreferences: Record<string, any>;
  sessionId: string;
}

export interface ToolExecutionPlan {
  tools: string[];
  dependencies: Array<{ tool: string; dependsOn: string }>;
  parallel: boolean;
  estimatedTime: number;
}
