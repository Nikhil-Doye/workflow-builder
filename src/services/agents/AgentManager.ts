import { WorkflowAgent } from "./WorkflowAgent";
import { AgentContext, AgentResult } from "../../types/tools";
import { toolRegistry } from "../tools/ToolRegistry";
import { ParsedIntent } from "../../types";

export class AgentManager {
  private agent: WorkflowAgent | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTools();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTools(): void {
    // Import and register all tools
    this.registerAllTools();
  }

  private async registerAllTools(): Promise<void> {
    try {
      // Import tool classes
      const { ClassifyIntentTool } = await import(
        "../tools/ClassifyIntentTool"
      );
      const { ExtractEntitiesTool } = await import(
        "../tools/ExtractEntitiesTool"
      );
      const { GenerateWorkflowTool } = await import(
        "../tools/GenerateWorkflowTool"
      );
      const { ValidateWorkflowTool } = await import(
        "../tools/ValidateWorkflowTool"
      );
      const { CacheLookupTool } = await import("../tools/CacheLookupTool");
      const { GenerateSuggestionsTool } = await import(
        "../tools/GenerateSuggestionsTool"
      );

      // Register tools
      toolRegistry.registerTool(new ClassifyIntentTool());
      toolRegistry.registerTool(new ExtractEntitiesTool());
      toolRegistry.registerTool(new GenerateWorkflowTool());
      toolRegistry.registerTool(new ValidateWorkflowTool());
      toolRegistry.registerTool(new CacheLookupTool());
      toolRegistry.registerTool(new GenerateSuggestionsTool());

      console.log("All tools registered successfully");
    } catch (error) {
      console.error("Error registering tools:", error);
    }
  }

  async processWorkflowRequest(
    userInput: string,
    currentWorkflow?: any,
    userPreferences?: Record<string, any>
  ): Promise<AgentResult> {
    // Create or update agent context
    const context: AgentContext = {
      userRequest: userInput,
      currentWorkflow,
      executionHistory: [],
      userPreferences: userPreferences || {},
      sessionId: this.sessionId,
    };

    // Create new agent instance for this request
    this.agent = new WorkflowAgent(context);

    try {
      const result = await this.agent.processRequest(userInput);

      // Update execution history
      if (this.agent) {
        const updatedContext = this.agent.getContext();
        updatedContext.executionHistory.push({
          timestamp: new Date(),
          input: userInput,
          result: result.success ? result.data : null,
          error: result.success ? null : result.error,
          toolsUsed: result.toolsUsed,
          executionTime: result.executionTime,
        });
        this.agent.updateContext(updatedContext);
      }

      return result;
    } catch (error) {
      console.error("Error in AgentManager:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        toolsUsed: [],
        executionTime: 0,
        confidence: 0.0,
      };
    }
  }

  async generateWorkflowFromDescription(
    description: string
  ): Promise<ParsedIntent> {
    const result = await this.processWorkflowRequest(description);

    if (!result.success) {
      throw new Error(result.error || "Failed to generate workflow");
    }

    return result.data.parsedIntent;
  }

  async getSuggestions(context?: string): Promise<string[]> {
    const result = await this.processWorkflowRequest(
      context || "Generate suggestions for current workflow"
    );

    if (!result.success) {
      return ["Unable to generate suggestions at this time"];
    }

    return result.data.suggestions || [];
  }

  async validateWorkflow(workflow: any, originalInput: string): Promise<any> {
    const validateTool = toolRegistry.getTool("validate_workflow");
    if (!validateTool) {
      throw new Error("Validation tool not available");
    }

    const result = await validateTool.execute({
      workflow,
      originalInput,
    });

    if (!result.success) {
      throw new Error(result.error || "Validation failed");
    }

    return result.data;
  }

  // Method to get available tools
  getAvailableTools(): string[] {
    return toolRegistry.getToolNames();
  }

  // Method to get tool information
  getToolInfo(toolName: string): any {
    const tool = toolRegistry.getTool(toolName);
    if (!tool) return null;

    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    };
  }

  // Method to clear cache
  clearCache(): void {
    const cacheTool = toolRegistry.getTool("cache_lookup") as any;
    if (cacheTool && cacheTool.clearExpired) {
      cacheTool.clearExpired();
    }
  }

  // Method to get cache statistics
  getCacheStats(): any {
    const cacheTool = toolRegistry.getTool("cache_lookup") as any;
    if (cacheTool && cacheTool.getStats) {
      return cacheTool.getStats();
    }
    return { size: 0, hitRate: 0 };
  }

  // Method to get session information
  getSessionInfo(): any {
    return {
      sessionId: this.sessionId,
      toolsAvailable: this.getAvailableTools().length,
      cacheStats: this.getCacheStats(),
    };
  }
}

// Export singleton instance
export const agentManager = new AgentManager();
