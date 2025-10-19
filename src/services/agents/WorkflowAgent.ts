import {
  AgentTask,
  AgentResult,
  AgentContext,
  ToolExecutionPlan,
} from "../../types/tools";
import { toolRegistry } from "../tools/ToolRegistry";
import { ParsedIntent, WorkflowStructure, ValidationResult } from "../../types";

export class WorkflowAgent {
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
  }

  async processRequest(userInput: string): Promise<AgentResult> {
    const startTime = Date.now();
    const toolsUsed: string[] = [];

    try {
      // Step 1: Check cache first
      const cacheTool = toolRegistry.getTool("cache_lookup");
      if (cacheTool) {
        const cacheKey = this.generateCacheKey(userInput);
        const cacheResult = await cacheTool.execute({ key: cacheKey });

        if (cacheResult.success && cacheResult.data) {
          return {
            success: true,
            data: cacheResult.data,
            toolsUsed: ["cache_lookup"],
            executionTime: Date.now() - startTime,
            confidence: 0.9,
          };
        }
        toolsUsed.push("cache_lookup");
      }

      // Step 2: Classify intent
      const intentResult = await this.executeTool("classify_intent", {
        userInput,
      });

      if (!intentResult.success) {
        throw new Error("Failed to classify intent");
      }
      toolsUsed.push("classify_intent");

      // Step 3: Extract entities
      const entitiesResult = await this.executeTool("extract_entities", {
        userInput,
        intent: intentResult.data,
      });

      if (!entitiesResult.success) {
        throw new Error("Failed to extract entities");
      }
      toolsUsed.push("extract_entities");

      // Step 4: Generate workflow
      const workflowResult = await this.executeTool("generate_workflow", {
        userInput,
        intent: intentResult.data,
        entities: entitiesResult.data,
      });

      if (!workflowResult.success) {
        throw new Error("Failed to generate workflow");
      }
      toolsUsed.push("generate_workflow");

      // Step 5: Validate workflow
      const validationResult = await this.executeTool("validate_workflow", {
        workflow: workflowResult.data,
        originalInput: userInput,
      });

      if (!validationResult.success) {
        console.warn(
          "Workflow validation failed, but continuing with generated workflow"
        );
      }
      toolsUsed.push("validate_workflow");

      // Step 6: Generate suggestions
      const suggestionsResult = await this.executeTool("generate_suggestions", {
        workflow: workflowResult.data,
        context: userInput,
      });

      if (suggestionsResult.success) {
        toolsUsed.push("generate_suggestions");
      }

      // Create final result
      const parsedIntent: ParsedIntent = {
        intent: intentResult.data.intent,
        confidence: intentResult.data.confidence,
        entities: entitiesResult.data,
        workflowStructure: workflowResult.data,
        reasoning: intentResult.data.reasoning,
      };

      // Cache the result
      await this.cacheResult(userInput, parsedIntent);

      return {
        success: true,
        data: {
          parsedIntent,
          validation: validationResult.data,
          suggestions: suggestionsResult.data || [],
        },
        toolsUsed,
        executionTime: Date.now() - startTime,
        confidence: this.calculateOverallConfidence(
          intentResult,
          entitiesResult,
          workflowResult,
          validationResult
        ),
      };
    } catch (error) {
      console.error("Error in WorkflowAgent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        toolsUsed,
        executionTime: Date.now() - startTime,
        confidence: 0.0,
      };
    }
  }

  private async executeTool(
    toolName: string,
    params: Record<string, any>
  ): Promise<any> {
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const result = await tool.execute(params);
    if (!result.success) {
      throw new Error(`Tool ${toolName} failed: ${result.error}`);
    }

    return result;
  }

  private generateCacheKey(userInput: string): string {
    return userInput.toLowerCase().trim().replace(/\s+/g, "_");
  }

  private async cacheResult(
    userInput: string,
    result: ParsedIntent
  ): Promise<void> {
    const cacheTool = toolRegistry.getTool("cache_lookup") as any;
    if (cacheTool && cacheTool.store) {
      const cacheKey = this.generateCacheKey(userInput);
      cacheTool.store(cacheKey, result, 5 * 60 * 1000); // 5 minutes TTL
    }
  }

  private calculateOverallConfidence(
    intentResult: any,
    entitiesResult: any,
    workflowResult: any,
    validationResult: any
  ): number {
    let confidence = 0.0;
    let weight = 0.0;

    // Intent confidence (weight: 0.3)
    if (intentResult.metadata?.confidence) {
      confidence += intentResult.metadata.confidence * 0.3;
      weight += 0.3;
    }

    // Entities confidence (weight: 0.2)
    if (entitiesResult.metadata?.confidence) {
      confidence += entitiesResult.metadata.confidence * 0.2;
      weight += 0.2;
    }

    // Workflow confidence (weight: 0.3)
    if (workflowResult.metadata?.confidence) {
      confidence += workflowResult.metadata.confidence * 0.3;
      weight += 0.3;
    }

    // Validation confidence (weight: 0.2)
    if (validationResult.metadata?.confidence) {
      confidence += validationResult.metadata.confidence * 0.2;
      weight += 0.2;
    }

    return weight > 0 ? confidence / weight : 0.5;
  }

  // Method to create execution plan (for future use)
  createExecutionPlan(tools: string[]): ToolExecutionPlan {
    const dependencies: Array<{ tool: string; dependsOn: string }> = [];

    // Define tool dependencies
    const toolDeps: Record<string, string[]> = {
      extract_entities: ["classify_intent"],
      generate_workflow: ["classify_intent", "extract_entities"],
      validate_workflow: ["generate_workflow"],
      generate_suggestions: ["generate_workflow"],
    };

    // Build dependency graph
    tools.forEach((tool) => {
      const deps = toolDeps[tool] || [];
      deps.forEach((dep) => {
        if (tools.includes(dep)) {
          dependencies.push({ tool, dependsOn: dep });
        }
      });
    });

    return {
      tools,
      dependencies,
      parallel: false, // For now, execute sequentially
      estimatedTime: tools.length * 2000, // Rough estimate
    };
  }

  // Method to update context
  updateContext(newContext: Partial<AgentContext>): void {
    this.context = { ...this.context, ...newContext };
  }

  // Method to get current context
  getContext(): AgentContext {
    return this.context;
  }
}
