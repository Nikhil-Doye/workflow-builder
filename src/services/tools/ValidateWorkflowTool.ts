import { BaseTool } from "./BaseTool";
import { ToolParameter, ToolResult } from "../../types/tools";
import { WorkflowStructure, ValidationResult } from "../../types";
import { validateWorkflowStructure } from "../../utils/workflowValidator";

export class ValidateWorkflowTool extends BaseTool {
  name = "validate_workflow";
  description =
    "Validate a generated workflow for correctness, completeness, and best practices";
  parameters: ToolParameter[] = [
    {
      name: "workflow",
      type: "object",
      description: "The workflow structure to validate",
      required: true,
    },
    {
      name: "originalInput",
      type: "string",
      description: "The original user input for context",
      required: false,
    },
  ];

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { workflow, originalInput } = params;

    if (!workflow) {
      return this.createResult(
        false,
        null,
        "Missing required parameter: workflow"
      );
    }

    try {
      const { result, executionTime } = await this.measureExecution(
        async () => {
          return await this.validateWorkflow(workflow, originalInput || "");
        }
      );

      return this.createResult(true, result, undefined, {
        executionTime,
        confidence: this.calculateValidationConfidence(result),
      });
    } catch (error) {
      console.error("Error in ValidateWorkflowTool:", error);
      return this.createResult(
        false,
        null,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async validateWorkflow(
    workflow: WorkflowStructure,
    originalInput: string
  ): Promise<ValidationResult> {
    try {
      // Use the existing validation logic
      const validationResult = validateWorkflowStructure(
        workflow,
        originalInput
      );

      // Add additional custom validation
      const enhancedResult = this.enhanceValidation(validationResult, workflow);

      return enhancedResult;
    } catch (error) {
      console.error("Error in workflow validation:", error);

      // Return a basic validation result
      return {
        isValid: false,
        issues: ["Validation failed due to internal error"],
        suggestions: ["Please check the workflow structure and try again"],
        complexity: "unknown",
        estimatedExecutionTime: 0,
      };
    }
  }

  private enhanceValidation(
    baseResult: ValidationResult,
    workflow: WorkflowStructure
  ): ValidationResult {
    const issues = [...(baseResult.issues || [])];
    const suggestions = [...(baseResult.suggestions || [])];

    // Add custom validation rules
    this.validateNodeConfiguration(workflow, issues, suggestions);
    this.validateDataFlow(workflow, issues, suggestions);
    this.validatePerformance(workflow, issues, suggestions);
    this.validateBestPractices(workflow, issues, suggestions);

    return {
      ...baseResult,
      issues,
      suggestions,
      complexity: this.determineComplexity(workflow),
      estimatedExecutionTime: this.estimateExecutionTime(workflow),
    };
  }

  private validateNodeConfiguration(
    workflow: WorkflowStructure,
    issues: string[],
    suggestions: string[]
  ): void {
    workflow.nodes.forEach((node, index) => {
      // Check for empty labels
      if (!node.label || node.label.trim() === "") {
        issues.push(`Node ${index + 1} has an empty label`);
        suggestions.push(`Give node ${index + 1} a descriptive label`);
      }

      // Check for missing configuration
      if (!node.config || Object.keys(node.config).length === 0) {
        issues.push(`Node ${index + 1} (${node.type}) has no configuration`);
        suggestions.push(
          `Configure node ${index + 1} with appropriate settings`
        );
      }

      // Type-specific validation
      this.validateNodeTypeSpecific(node, index, issues, suggestions);
    });
  }

  private validateNodeTypeSpecific(
    node: any,
    index: number,
    issues: string[],
    suggestions: string[]
  ): void {
    switch (node.type) {
      case "dataInput":
        if (!node.config.dataType) {
          issues.push(`Data input node ${index + 1} missing data type`);
          suggestions.push(`Specify data type for input node ${index + 1}`);
        }
        break;

      case "webScraping":
        if (!node.config.url && !node.config.url?.includes("{{")) {
          issues.push(`Web scraping node ${index + 1} missing URL`);
          suggestions.push(`Configure URL for web scraping node ${index + 1}`);
        }
        break;

      case "llmTask":
        if (!node.config.prompt) {
          issues.push(`LLM task node ${index + 1} missing prompt`);
          suggestions.push(`Add a prompt for LLM task node ${index + 1}`);
        }
        break;

      case "dataOutput":
        if (!node.config.format) {
          issues.push(`Data output node ${index + 1} missing output format`);
          suggestions.push(`Specify output format for node ${index + 1}`);
        }
        break;
    }
  }

  private validateDataFlow(
    workflow: WorkflowStructure,
    issues: string[],
    suggestions: string[]
  ): void {
    // Check for orphaned nodes
    const connectedNodes = new Set<string>();
    workflow.edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    workflow.nodes.forEach((node, index) => {
      const nodeId = `node-${index}`;
      if (!connectedNodes.has(nodeId) && workflow.nodes.length > 1) {
        issues.push(`Node ${index + 1} (${node.label}) is not connected`);
        suggestions.push(
          `Connect node ${index + 1} to other nodes in the workflow`
        );
      }
    });

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(workflow);
    if (circularDeps.length > 0) {
      issues.push(`Circular dependencies detected: ${circularDeps.join(", ")}`);
      suggestions.push("Remove circular dependencies in the workflow");
    }
  }

  private validatePerformance(
    workflow: WorkflowStructure,
    issues: string[],
    suggestions: string[]
  ): void {
    const estimatedTime = this.estimateExecutionTime(workflow);

    if (estimatedTime > 60000) {
      // More than 1 minute
      issues.push("Workflow execution time is very long");
      suggestions.push(
        "Consider optimizing the workflow for better performance"
      );
    }

    if (workflow.nodes.length > 10) {
      issues.push("Workflow has many nodes which may be complex to maintain");
      suggestions.push(
        "Consider breaking down the workflow into smaller, focused workflows"
      );
    }
  }

  private validateBestPractices(
    workflow: WorkflowStructure,
    issues: string[],
    suggestions: string[]
  ): void {
    // Check for proper input/output nodes
    const hasInput = workflow.nodes.some((n) => n.type === "dataInput");
    const hasOutput = workflow.nodes.some((n) => n.type === "dataOutput");

    if (!hasInput) {
      issues.push("Workflow missing input node");
      suggestions.push("Add a data input node to start the workflow");
    }

    if (!hasOutput) {
      issues.push("Workflow missing output node");
      suggestions.push("Add a data output node to complete the workflow");
    }

    // Check for variable substitution usage
    const hasVariables = workflow.nodes.some((node) =>
      JSON.stringify(node.config).includes("{{")
    );

    if (!hasVariables && workflow.nodes.length > 1) {
      suggestions.push(
        "Consider using variable substitution to pass data between nodes"
      );
    }
  }

  private detectCircularDependencies(workflow: WorkflowStructure): string[] {
    const graph = new Map<string, string[]>();

    // Build adjacency list
    workflow.nodes.forEach((_, index) => {
      graph.set(`node-${index}`, []);
    });

    workflow.edges.forEach((edge) => {
      const sourceList = graph.get(edge.source) || [];
      sourceList.push(edge.target);
      graph.set(edge.source, sourceList);
    });

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart).join(" -> ") + " -> " + node);
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      neighbors.forEach((neighbor) => dfs(neighbor, [...path]));

      recursionStack.delete(node);
    };

    workflow.nodes.forEach((_, index) => {
      const nodeId = `node-${index}`;
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    });

    return cycles;
  }

  private determineComplexity(workflow: WorkflowStructure): string {
    const nodeCount = workflow.nodes.length;
    const edgeCount = workflow.edges.length;
    const hasParallel = workflow.topology.parallelExecution;

    if (nodeCount <= 3 && edgeCount <= 2 && !hasParallel) return "low";
    if (nodeCount <= 6 && edgeCount <= 5) return "medium";
    return "high";
  }

  private estimateExecutionTime(workflow: WorkflowStructure): number {
    const timeEstimates: Record<string, number> = {
      dataInput: 0,
      webScraping: 5000,
      llmTask: 3000,
      structuredOutput: 2000,
      embeddingGenerator: 4000,
      similaritySearch: 3000,
      dataOutput: 0,
    };

    return workflow.nodes.reduce((total, node) => {
      return total + (timeEstimates[node.type] || 1000);
    }, 0);
  }

  private calculateValidationConfidence(result: ValidationResult): number {
    let confidence = 0.8; // Base confidence for validation

    // Decrease confidence based on number of issues
    if (result.issues && result.issues.length > 0) {
      confidence -= Math.min(result.issues.length * 0.1, 0.5);
    }

    // Increase confidence if workflow is valid
    if (result.isValid) {
      confidence += 0.2;
    }

    return Math.max(Math.min(confidence, 1.0), 0.0);
  }
}
