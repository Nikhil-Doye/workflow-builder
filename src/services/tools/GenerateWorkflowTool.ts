import { BaseTool } from "./BaseTool";
import { ToolParameter, ToolResult } from "../../types/tools";
import { callOpenAI } from "../openaiService";
import {
  WorkflowStructure,
  IntentClassification,
  EntityExtraction,
} from "../../types";

export class GenerateWorkflowTool extends BaseTool {
  name = "generate_workflow";
  description =
    "Generate a complete workflow structure based on intent classification and entity extraction";
  parameters: ToolParameter[] = [
    {
      name: "userInput",
      type: "string",
      description: "The original user request",
      required: true,
    },
    {
      name: "intent",
      type: "object",
      description: "The classified intent from previous step",
      required: true,
    },
    {
      name: "entities",
      type: "object",
      description: "The extracted entities from previous step",
      required: true,
    },
  ];

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { userInput, intent, entities } = params;

    if (!userInput || !intent || !entities) {
      return this.createResult(
        false,
        null,
        "Missing required parameters: userInput, intent, or entities"
      );
    }

    try {
      const { result, executionTime } = await this.measureExecution(
        async () => {
          return await this.generateWorkflowWithLLM(
            userInput,
            intent,
            entities
          );
        }
      );

      return this.createResult(true, result, undefined, {
        executionTime,
        confidence: this.calculateWorkflowConfidence(result),
      });
    } catch (error) {
      console.error("Error in GenerateWorkflowTool:", error);
      return this.createResult(
        false,
        null,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async generateWorkflowWithLLM(
    userInput: string,
    intent: IntentClassification,
    entities: EntityExtraction
  ): Promise<WorkflowStructure> {
    const prompt = `
You are an AI workflow designer. Analyze the user's request and create a comprehensive workflow structure.

User Request: "${userInput}"
Intent: ${intent.intent} (confidence: ${intent.confidence})
Reasoning: ${intent.reasoning}

Extracted Entities:
- URLs: ${entities.urls.join(", ") || "None"}
- Data Types: ${entities.dataTypes.join(", ") || "None"}
- Output Formats: ${entities.outputFormats.join(", ") || "None"}
- AI Tasks: ${entities.aiTasks.join(", ") || "None"}
- Processing Steps: ${entities.processingSteps.join(", ") || "None"}

Available node types and their purposes:
- dataInput: Entry point for data (text, JSON, CSV, URL, PDF, etc.)
- webScraping: Extract content from websites using Firecrawl
- llmTask: Process data with AI models (analysis, generation, transformation)
- structuredOutput: Format data according to JSON schemas
- embeddingGenerator: Create vector embeddings for text
- similaritySearch: Find similar content using vector search
- dataOutput: Export results in various formats

Instructions:
1. Understand the user's goal and break it down into logical steps
2. Create a workflow that accomplishes their request
3. Use appropriate node types for each step
4. Configure nodes with realistic settings
5. Connect nodes logically with proper data flow
6. Use variable substitution ({{nodeId.output}}) to pass data between nodes
7. Make the workflow practical and executable

For job application workflows, consider:
- Resume analysis and skill extraction
- Job matching and opportunity identification  
- Application generation and personalization
- Cover letter creation

For web scraping workflows, consider:
- URL input and validation
- Content extraction with appropriate formats
- Data cleaning and processing
- Output formatting

For PDF processing workflows, consider:
- PDF file input and validation
- Text extraction from PDF content
- AI analysis of extracted text
- Structured output formatting

For AI analysis workflows, consider:
- Data input and preprocessing
- AI processing with appropriate prompts
- Result formatting and structuring
- Output generation

Respond with valid JSON only:
{
  "nodes": [
    {
      "type": "dataInput",
      "label": "Descriptive Node Name",
      "config": {
        "dataType": "text|json|csv|url",
        "defaultValue": "Sample input data"
      }
    }
  ],
  "edges": [
    {
      "source": "node-0",
      "target": "node-1"
    }
  ],
  "topology": {
    "type": "linear|fork-join|branching",
    "description": "Workflow description",
    "parallelExecution": false
  },
  "complexity": "low|medium|high",
  "estimatedExecutionTime": 5000
}
`;

    try {
      const response = await callOpenAI(prompt, {
        model: "deepseek-chat",
        temperature: 0.3,
        maxTokens: 1000,
      });

      const result = JSON.parse(response.content);

      // Validate the response structure
      this.validateWorkflowStructure(result);

      return result;
    } catch (error) {
      console.error("Error in LLM workflow generation:", error);

      // Return a simple fallback workflow
      return this.generateFallbackWorkflow(userInput, intent, entities);
    }
  }

  private validateWorkflowStructure(workflow: any): void {
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      throw new Error("Invalid workflow: missing or invalid nodes array");
    }

    if (!workflow.edges || !Array.isArray(workflow.edges)) {
      throw new Error("Invalid workflow: missing or invalid edges array");
    }

    if (!workflow.topology || !workflow.topology.type) {
      throw new Error("Invalid workflow: missing or invalid topology");
    }
  }

  private generateFallbackWorkflow(
    userInput: string,
    intent: IntentClassification,
    entities: EntityExtraction
  ): WorkflowStructure {
    const nodes: any[] = [
      {
        type: "dataInput",
        label: "Input Data",
        config: {
          dataType: entities.dataTypes[0] || "text",
          defaultValue: entities.urls[0] || "Enter your data here",
        },
      },
    ];

    // Add processing nodes based on intent
    if (intent.intent === "WEB_SCRAPING" || entities.urls.length > 0) {
      nodes.push({
        type: "webScraping",
        label: "Web Scraper",
        config: {
          url: entities.urls[0] || "{{input.output}}",
          formats: ["markdown", "html"],
          onlyMainContent: true,
        },
      });
    }

    if (intent.intent === "AI_ANALYSIS" || entities.aiTasks.length > 0) {
      nodes.push({
        type: "llmTask",
        label: "AI Analyzer",
        config: {
          prompt: this.generateAIPrompt(entities),
          model: "deepseek-chat",
          temperature: 0.7,
        },
      });
    }

    // Always add output node
    nodes.push({
      type: "dataOutput",
      label: "Data Output",
      config: {
        format: entities.outputFormats[0] || "json",
        filename: `workflow_output_${Date.now()}.json`,
      },
    });

    // Generate edges
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        source: `node-${i}`,
        target: `node-${i + 1}`,
      });
    }

    return {
      nodes,
      edges,
      topology: {
        type: "linear",
        description: `Generated workflow for: ${intent.intent}`,
        parallelExecution: false,
      },
      complexity:
        nodes.length <= 3 ? "low" : nodes.length <= 6 ? "medium" : "high",
      estimatedExecutionTime: nodes.length * 2000,
    };
  }

  private generateAIPrompt(entities: EntityExtraction): string {
    const tasks = entities.aiTasks || [];

    if (tasks.includes("summarize")) {
      return "Summarize the following content in 2-3 sentences: {{input.output}}";
    }

    if (tasks.includes("analyze")) {
      return "Analyze the following content and provide insights: {{input.output}}";
    }

    if (tasks.includes("extract")) {
      return "Extract key information from the following content: {{input.output}}";
    }

    if (tasks.includes("classify")) {
      return "Classify the following content into categories: {{input.output}}";
    }

    return "Process the following content: {{input.output}}";
  }

  private calculateWorkflowConfidence(workflow: WorkflowStructure): number {
    let confidence = 0.7; // Base confidence for generated workflow

    // Increase confidence based on workflow complexity
    if (workflow.complexity === "low") confidence += 0.1;
    else if (workflow.complexity === "medium") confidence += 0.05;

    // Increase confidence if workflow has proper input/output nodes
    const hasInput = workflow.nodes.some((n) => n.type === "dataInput");
    const hasOutput = workflow.nodes.some((n) => n.type === "dataOutput");
    if (hasInput && hasOutput) confidence += 0.1;

    // Increase confidence if workflow has logical flow
    if (workflow.edges.length > 0) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }
}
