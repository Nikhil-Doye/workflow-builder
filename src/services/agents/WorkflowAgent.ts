import {
  AgentResult,
  AgentContext,
  ToolExecutionPlan,
  ErrorContext,
} from "../../types/tools";
import { toolRegistry } from "../tools/ToolRegistry";
import { ParsedIntent } from "../../types";

export class WorkflowAgent {
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
  }

  async processRequest(userInput: string): Promise<AgentResult> {
    const startTime = Date.now();
    const toolsUsed: string[] = [];
    const partialResults: Record<string, any> = {};

    try {
      // Step 1: Check cache first
      const cacheTool = toolRegistry.getTool("cache_lookup");
      if (cacheTool) {
        try {
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
        } catch (error) {
          console.warn("Cache lookup failed, continuing without cache:", error);
          // Continue execution without cache
        }
      }

      // Step 2: Classify intent
      const intentResult = await this.executeToolWithContext(
        "classify_intent",
        { userInput },
        "intent_classification",
        partialResults
      );

      if (!intentResult.success) {
        throw this.createDetailedError(
          "Failed to classify intent",
          "intent_classification",
          "classify_intent",
          { userInput },
          partialResults,
          "tool_execution_failure",
          userInput
        );
      }
      toolsUsed.push("classify_intent");
      partialResults.intent = intentResult.data;

      // Step 3: Extract entities
      const entitiesResult = await this.executeToolWithContext(
        "extract_entities",
        { userInput, intent: intentResult.data },
        "entity_extraction",
        partialResults
      );

      if (!entitiesResult.success) {
        throw this.createDetailedError(
          "Failed to extract entities",
          "entity_extraction",
          "extract_entities",
          { userInput, intent: intentResult.data },
          partialResults,
          "tool_execution_failure",
          userInput
        );
      }
      toolsUsed.push("extract_entities");
      partialResults.entities = entitiesResult.data;

      // Step 4: Generate workflow
      const workflowResult = await this.executeToolWithContext(
        "generate_workflow",
        { userInput, intent: intentResult.data, entities: entitiesResult.data },
        "workflow_generation",
        partialResults
      );

      if (!workflowResult.success) {
        throw this.createDetailedError(
          "Failed to generate workflow",
          "workflow_generation",
          "generate_workflow",
          {
            userInput,
            intent: intentResult.data,
            entities: entitiesResult.data,
          },
          partialResults,
          "tool_execution_failure",
          userInput
        );
      }
      toolsUsed.push("generate_workflow");
      partialResults.workflow = workflowResult.data;

      // Step 5: Validate workflow
      const validationResult = await this.executeToolWithContext(
        "validate_workflow",
        { workflow: workflowResult.data, originalInput: userInput },
        "workflow_validation",
        partialResults
      );

      if (!validationResult.success) {
        console.warn(
          "Workflow validation failed, but continuing with generated workflow"
        );
        // Don't throw error for validation failures, just log warning
      }
      toolsUsed.push("validate_workflow");
      partialResults.validation = validationResult.data;

      // Step 6: Generate suggestions
      const suggestionsResult = await this.executeToolWithContext(
        "generate_suggestions",
        { workflow: workflowResult.data, context: userInput },
        "suggestion_generation",
        partialResults
      );

      if (suggestionsResult.success) {
        toolsUsed.push("generate_suggestions");
        partialResults.suggestions = suggestionsResult.data;
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

      // If it's already a detailed error, use it; otherwise create one
      const errorContext =
        error instanceof DetailedError
          ? error.errorContext
          : this.createErrorContext(
              "unknown",
              undefined,
              { userInput },
              partialResults,
              "unknown",
              userInput,
              error instanceof Error ? error.stack : undefined
            );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        toolsUsed,
        executionTime: Date.now() - startTime,
        confidence: 0.0,
        errorContext,
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

  private async executeToolWithContext(
    toolName: string,
    params: Record<string, any>,
    stage: string,
    partialResults: Record<string, any>
  ): Promise<any> {
    try {
      const tool = toolRegistry.getTool(toolName);
      if (!tool) {
        throw this.createDetailedError(
          `Tool not found: ${toolName}`,
          stage,
          toolName,
          params,
          partialResults,
          "tool_registry_miss",
          this.context.userRequest
        );
      }

      const result = await tool.execute(params);
      if (!result.success) {
        throw this.createDetailedError(
          `Tool ${toolName} failed: ${result.error}`,
          stage,
          toolName,
          params,
          partialResults,
          "tool_execution_failure",
          this.context.userRequest
        );
      }

      return result;
    } catch (error) {
      if (error instanceof DetailedError) {
        throw error;
      }

      // Convert generic errors to detailed errors
      throw this.createDetailedError(
        error instanceof Error ? error.message : "Unknown tool execution error",
        stage,
        toolName,
        params,
        partialResults,
        "tool_execution_failure",
        this.context.userRequest,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  private createDetailedError(
    message: string,
    stage: string,
    toolName: string | undefined,
    inputParameters: Record<string, any>,
    partialResults: Record<string, any>,
    errorType: ErrorContext["errorType"],
    userInput: string,
    stackTrace?: string
  ): DetailedError {
    const errorContext = this.createErrorContext(
      stage,
      toolName,
      inputParameters,
      partialResults,
      errorType,
      userInput,
      stackTrace
    );

    return new DetailedError(message, errorContext);
  }

  private createErrorContext(
    stage: string,
    toolName: string | undefined,
    inputParameters: Record<string, any>,
    partialResults: Record<string, any>,
    errorType: ErrorContext["errorType"],
    userInput: string,
    stackTrace?: string
  ): ErrorContext {
    return {
      stage,
      toolName,
      inputParameters,
      partialResults,
      errorType,
      timestamp: Date.now(),
      sessionId: this.context.sessionId,
      userInput,
      stackTrace,
      suggestions: this.generateErrorSuggestions(
        stage,
        errorType,
        partialResults
      ),
    };
  }

  private generateErrorSuggestions(
    stage: string,
    errorType: ErrorContext["errorType"],
    partialResults: Record<string, any>
  ): string[] {
    const suggestions: string[] = [];

    switch (errorType) {
      case "tool_registry_miss":
        suggestions.push("Check if the required tool is properly registered");
        suggestions.push("Verify tool name spelling and availability");
        break;

      case "tool_execution_failure":
        suggestions.push("Check tool configuration and parameters");
        suggestions.push("Verify external service availability (OpenAI, etc.)");
        if (stage === "intent_classification") {
          suggestions.push("Try rephrasing your request with clearer intent");
        } else if (stage === "entity_extraction") {
          suggestions.push(
            "Ensure your input contains recognizable entities (URLs, data types, etc.)"
          );
        } else if (stage === "workflow_generation") {
          suggestions.push(
            "Try breaking down complex requests into simpler steps"
          );
        }
        break;

      case "llm_error":
        suggestions.push("Check API key configuration and quota limits");
        suggestions.push("Try reducing request complexity or length");
        suggestions.push("Verify network connectivity to AI services");
        break;

      case "validation_error":
        suggestions.push(
          "Review generated workflow structure for completeness"
        );
        suggestions.push("Check node configurations and connections");
        break;

      case "cache_error":
        suggestions.push("Cache error is non-critical, workflow will continue");
        break;

      default:
        suggestions.push("Check system logs for additional error details");
        suggestions.push("Try the request again after a brief delay");
    }

    // Add stage-specific suggestions
    if (Object.keys(partialResults).length > 0) {
      suggestions.push(
        "Partial results available - some processing completed successfully"
      );
    }

    return suggestions;
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

/**
 * Custom error class that includes detailed execution context
 */
class DetailedError extends Error {
  public readonly errorContext: ErrorContext;

  constructor(message: string, errorContext: ErrorContext) {
    super(message);
    this.name = "DetailedError";
    this.errorContext = errorContext;
  }
}
