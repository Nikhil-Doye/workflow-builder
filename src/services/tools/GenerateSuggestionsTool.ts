import { BaseTool } from "./BaseTool";
import { ToolParameter, ToolResult } from "../../types/tools";
import { WorkflowStructure } from "../../types";

export class GenerateSuggestionsTool extends BaseTool {
  name = "generate_suggestions";
  description =
    "Generate contextual suggestions for improving or extending a workflow";
  parameters: ToolParameter[] = [
    {
      name: "workflow",
      type: "object",
      description: "The current workflow structure",
      required: false,
    },
    {
      name: "context",
      type: "string",
      description: "Additional context for generating suggestions",
      required: false,
    },
  ];

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { workflow, context } = params;

    try {
      const { result, executionTime } = await this.measureExecution(
        async () => {
          return await this.generateSuggestions(workflow, context);
        }
      );

      return this.createResult(true, result, undefined, {
        executionTime,
        confidence: 0.8,
      });
    } catch (error) {
      console.error("Error in GenerateSuggestionsTool:", error);
      return this.createResult(
        false,
        null,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async generateSuggestions(
    workflow?: WorkflowStructure,
    context?: string
  ): Promise<string[]> {
    const suggestions: string[] = [];

    if (!workflow) {
      return this.getDefaultSuggestions();
    }

    // Analyze workflow structure and generate contextual suggestions
    this.analyzeWorkflowStructure(workflow, suggestions);
    this.analyzeNodeTypes(workflow, suggestions);
    this.analyzeConnections(workflow, suggestions);
    this.analyzeConfiguration(workflow, suggestions);
    this.analyzePerformance(workflow, suggestions);

    // Add context-specific suggestions
    if (context) {
      this.addContextualSuggestions(context, suggestions);
    }

    // Remove duplicates and limit to top suggestions
    return [...new Set(suggestions)].slice(0, 10);
  }

  private getDefaultSuggestions(): string[] {
    return [
      "Start by adding a data input node to begin your workflow",
      "Consider what type of data you want to process",
      "Think about the end result you want to achieve",
      "Add an AI task node to process your data intelligently",
      "Include a data output node to export your results",
      "Try the AI Copilot to generate a complete workflow automatically",
    ];
  }

  private analyzeWorkflowStructure(
    workflow: WorkflowStructure,
    suggestions: string[]
  ): void {
    const nodeCount = workflow.nodes.length;
    const hasInput = workflow.nodes.some((n) => n.type === "dataInput");
    const hasOutput = workflow.nodes.some((n) => n.type === "dataOutput");

    if (nodeCount === 0) {
      suggestions.push("Start by adding nodes to build your workflow");
    } else if (nodeCount === 1) {
      suggestions.push("Add more nodes to create a complete workflow");
    } else if (nodeCount > 8) {
      suggestions.push(
        "Consider breaking this complex workflow into smaller, focused workflows"
      );
    }

    if (!hasInput) {
      suggestions.push("Add a data input node to start your workflow");
    }

    if (!hasOutput) {
      suggestions.push("Add a data output node to complete your workflow");
    }

    if (hasInput && hasOutput && nodeCount === 2) {
      suggestions.push(
        "Add processing nodes between input and output for more functionality"
      );
    }
  }

  private analyzeNodeTypes(
    workflow: WorkflowStructure,
    suggestions: string[]
  ): void {
    const nodeTypes = workflow.nodes.map((n) => n.type);
    const hasWebScraping = nodeTypes.includes("webScraping");
    const hasLLM = nodeTypes.includes("llmTask");
    const hasEmbedding = nodeTypes.includes("embeddingGenerator");
    const hasSearch = nodeTypes.includes("similaritySearch");

    if (hasWebScraping && !hasLLM) {
      suggestions.push(
        "Consider adding an AI analysis node after web scraping to process the content"
      );
    }

    if (hasLLM && !hasWebScraping && nodeTypes.includes("dataInput")) {
      const inputNode = workflow.nodes.find((n) => n.type === "dataInput");
      if (inputNode?.config?.dataType === "url") {
        suggestions.push(
          "Add a web scraping node to extract content from URLs"
        );
      }
    }

    if (hasEmbedding && !hasSearch) {
      suggestions.push(
        "Add a similarity search node to find similar content using embeddings"
      );
    }

    if (hasSearch && !hasEmbedding) {
      suggestions.push(
        "Add an embedding generator node to create vector representations of your data"
      );
    }

    if (
      !hasLLM &&
      nodeTypes.some((t) => ["dataInput", "webScraping"].includes(t))
    ) {
      suggestions.push(
        "Add an AI task node to intelligently process your data"
      );
    }
  }

  private analyzeConnections(
    workflow: WorkflowStructure,
    suggestions: string[]
  ): void {
    const connectedNodes = new Set<string>();
    workflow.edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const unconnectedNodes = workflow.nodes.filter((_, index) => {
      const nodeId = `node-${index}`;
      return !connectedNodes.has(nodeId);
    });

    if (unconnectedNodes.length > 0) {
      suggestions.push("Connect all nodes to create a complete data flow");
    }

    if (workflow.edges.length === 0 && workflow.nodes.length > 1) {
      suggestions.push(
        "Connect your nodes to establish data flow between them"
      );
    }

    // Check for potential parallel processing opportunities
    const inputNodes = workflow.nodes.filter((n) => n.type === "dataInput");
    if (inputNodes.length === 1 && workflow.nodes.length > 3) {
      const inputNode = inputNodes[0];
      const connectedToInput = workflow.edges.filter(
        (e) => e.source === `node-${workflow.nodes.indexOf(inputNode)}`
      );

      if (connectedToInput.length > 1) {
        suggestions.push(
          "Consider using parallel processing for better performance"
        );
      }
    }
  }

  private analyzeConfiguration(
    workflow: WorkflowStructure,
    suggestions: string[]
  ): void {
    workflow.nodes.forEach((node, index) => {
      if (!node.config || Object.keys(node.config).length === 0) {
        suggestions.push(
          `Configure node ${index + 1} (${
            node.label
          }) with appropriate settings`
        );
      }

      // Type-specific configuration suggestions
      switch (node.type) {
        case "llmTask":
          if (!node.config.prompt || node.config.prompt.trim() === "") {
            suggestions.push(`Add a prompt to LLM task node ${index + 1}`);
          }
          break;

        case "webScraping":
          if (!node.config.url || node.config.url.trim() === "") {
            suggestions.push(
              `Configure URL for web scraping node ${index + 1}`
            );
          }
          break;

        case "dataOutput":
          if (!node.config.format) {
            suggestions.push(
              `Specify output format for data output node ${index + 1}`
            );
          }
          break;
      }
    });
  }

  private analyzePerformance(
    workflow: WorkflowStructure,
    suggestions: string[]
  ): void {
    const estimatedTime = workflow.estimatedExecutionTime || 0;

    if (estimatedTime > 30000) {
      suggestions.push("Consider optimizing workflow for faster execution");
    }

    const llmNodes = workflow.nodes.filter((n) => n.type === "llmTask");
    if (llmNodes.length > 3) {
      suggestions.push(
        "Consider combining multiple AI tasks or using more efficient models"
      );
    }

    const webScrapingNodes = workflow.nodes.filter(
      (n) => n.type === "webScraping"
    );
    if (webScrapingNodes.length > 2) {
      suggestions.push(
        "Consider using batch processing for multiple web scraping operations"
      );
    }
  }

  private addContextualSuggestions(
    context: string,
    suggestions: string[]
  ): void {
    const lowerContext = context.toLowerCase();

    if (lowerContext.includes("job") || lowerContext.includes("resume")) {
      suggestions.push(
        "Consider adding a job matching node to find relevant opportunities"
      );
      suggestions.push(
        "Add a cover letter generation node for personalized applications"
      );
    }

    if (lowerContext.includes("web") || lowerContext.includes("scrape")) {
      suggestions.push(
        "Add content filtering to extract only relevant information"
      );
      suggestions.push(
        "Consider adding error handling for failed web requests"
      );
    }

    if (lowerContext.includes("data") || lowerContext.includes("analysis")) {
      suggestions.push("Add data validation nodes to ensure data quality");
      suggestions.push(
        "Consider adding data transformation nodes for better processing"
      );
    }

    if (lowerContext.includes("search") || lowerContext.includes("find")) {
      suggestions.push("Add ranking algorithms to improve search results");
      suggestions.push("Consider adding filters to narrow down search results");
    }
  }
}
