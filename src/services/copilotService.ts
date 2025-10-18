import { callOpenAI } from "./openaiService";
import {
  ParsedIntent,
  IntentClassification,
  EntityExtraction,
  MixedIntentAnalysis,
  WorkflowStructure,
  ValidationResult,
} from "../types";
import { generateMixedWorkflowStructure } from "../utils/workflowGenerator";
import {
  validateWorkflowStructure,
  validateMixedWorkflow,
  generateImprovementSuggestions,
} from "../utils/workflowValidator";

export class CopilotService {
  private cache = new Map<string, ParsedIntent>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Parse natural language input and generate workflow structure
   */
  async parseNaturalLanguage(userInput: string): Promise<ParsedIntent> {
    // Check cache first
    const cacheKey = userInput.toLowerCase().trim();
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    try {
      // Use AI to understand the intent and generate workflow directly
      const workflowStructure = await this.generateWorkflowStructureWithLLM(
        userInput,
        {
          intent: "AI_GENERATED",
          confidence: 0.9,
          reasoning: "AI-generated workflow",
        },
        {
          urls: [],
          dataTypes: [],
          outputFormats: [],
          aiTasks: [],
          processingSteps: [],
          targetSites: [],
          dataSources: [],
        }
      );

      // Extract intent from the generated workflow
      const intent = this.extractIntentFromWorkflow(
        workflowStructure,
        userInput
      );

      const parsedIntent: ParsedIntent = {
        intent: intent.intent,
        confidence: intent.confidence,
        entities: intent.entities,
        workflowStructure,
        reasoning: intent.reasoning,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        ...parsedIntent,
        _cachedAt: Date.now(),
      } as any);

      return parsedIntent;
    } catch (error) {
      console.error("Error in AI workflow generation:", error);

      // Fallback to pattern matching
      return this.fallbackParsing(userInput);
    }
  }

  /**
   * Extract intent from generated workflow
   */
  private extractIntentFromWorkflow(
    workflow: WorkflowStructure,
    userInput: string
  ): {
    intent: string;
    confidence: number;
    entities: EntityExtraction;
    reasoning: string;
  } {
    // Analyze the workflow to determine intent
    const nodeTypes = workflow.nodes.map((node) => node.type);
    const hasWebScraping = nodeTypes.includes("webScraping");
    const hasLLMTask = nodeTypes.includes("llmTask");
    const hasDataProcessing = nodeTypes.includes("structuredOutput");
    const hasSearch = nodeTypes.includes("similaritySearch");

    let intent = "GENERAL_PROCESSING";
    let reasoning = "General data processing workflow";

    if (
      userInput.toLowerCase().includes("job") ||
      userInput.toLowerCase().includes("resume") ||
      userInput.toLowerCase().includes("application")
    ) {
      intent = "JOB_APPLICATION";
      reasoning = "Job application automation workflow";
    } else if (hasWebScraping && hasLLMTask) {
      intent = "WEB_ANALYSIS";
      reasoning = "Web scraping and AI analysis workflow";
    } else if (hasWebScraping) {
      intent = "WEB_SCRAPING";
      reasoning = "Web content extraction workflow";
    } else if (hasLLMTask && hasDataProcessing) {
      intent = "AI_ANALYSIS";
      reasoning = "AI-powered data analysis workflow";
    } else if (hasSearch) {
      intent = "SEARCH_AND_RETRIEVAL";
      reasoning = "Search and similarity matching workflow";
    }

    // Extract entities from user input
    const entities: EntityExtraction = {
      urls: [],
      dataTypes: [],
      outputFormats: [],
      aiTasks: [],
      processingSteps: [],
      targetSites: [],
      dataSources: [],
    };

    // Extract URLs
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = userInput.match(urlPattern);
    if (urls) {
      entities.urls = urls;
    }

    // Extract data types based on context
    if (userInput.toLowerCase().includes("json"))
      entities.dataTypes.push("json");
    if (userInput.toLowerCase().includes("csv")) entities.dataTypes.push("csv");
    if (userInput.toLowerCase().includes("pdf")) entities.dataTypes.push("pdf");
    if (
      userInput.toLowerCase().includes("resume") ||
      userInput.toLowerCase().includes("cv")
    )
      entities.dataTypes.push("text");
    if (
      userInput.toLowerCase().includes("url") ||
      userInput.toLowerCase().includes("website")
    )
      entities.dataTypes.push("url");

    // Extract AI tasks based on context
    if (userInput.toLowerCase().includes("analyze"))
      entities.aiTasks.push("analyze");
    if (userInput.toLowerCase().includes("summarize"))
      entities.aiTasks.push("summarize");
    if (userInput.toLowerCase().includes("generate"))
      entities.aiTasks.push("generate");
    if (userInput.toLowerCase().includes("extract"))
      entities.aiTasks.push("extract");

    return {
      intent,
      confidence: 0.9,
      entities,
      reasoning,
    };
  }

  /**
   * Classify intent using LLM
   */
  private async classifyIntentWithLLM(
    userInput: string
  ): Promise<IntentClassification> {
    const prompt = `
Analyze this natural language description and classify the workflow intent:

User Input: "${userInput}"

Classify into one of these categories:
- WEB_SCRAPING: Extract data from websites
- AI_ANALYSIS: Process text with AI models
- DATA_PROCESSING: Transform or structure data
- SEARCH_AND_RETRIEVAL: Find similar content
- CONTENT_GENERATION: Create new content
- MIXED: Multiple operations requiring different node types

Also identify if this is a MIXED intent by looking for multiple distinct operations.

Respond with JSON:
{
  "intent": "WEB_SCRAPING",
  "confidence": 0.95,
  "reasoning": "User wants to extract data from a website"
}
`;

    try {
      const response = await callOpenAI(prompt, {
        model: "deepseek-chat",
        temperature: 0.1,
        maxTokens: 200,
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error("Error in LLM intent classification:", error);
      return {
        intent: "GENERAL_PROCESSING",
        confidence: 0.5,
        reasoning: "Fallback intent due to AI processing error",
      };
    }
  }

  /**
   * Extract entities using LLM
   */
  private async extractEntitiesWithLLM(
    userInput: string
  ): Promise<EntityExtraction> {
    const prompt = `
Extract specific entities from this workflow description:

Input: "${userInput}"

Extract:
- URLs: Any website addresses
- Data types: text, JSON, CSV, PDF, etc.
- Output formats: JSON, text, markdown, etc.
- AI tasks: summarization, analysis, classification, etc.
- Processing steps: what transformations are needed
- Target sites: job boards, news sites, etc.
- Data sources: resume, documents, etc.

Respond with JSON:
{
  "urls": ["https://example.com"],
  "dataTypes": ["text"],
  "outputFormats": ["JSON"],
  "aiTasks": ["summarize", "extract key points"],
  "processingSteps": ["scrape content", "analyze with AI", "format output"],
  "targetSites": ["job boards"],
  "dataSources": ["resume"]
}
`;

    try {
      const response = await callOpenAI(prompt, {
        model: "deepseek-chat",
        temperature: 0.1,
        maxTokens: 300,
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error("Error in LLM entity extraction:", error);
      return {
        urls: [],
        dataTypes: ["text"],
        outputFormats: ["text"],
        aiTasks: ["process"],
        processingSteps: [],
        targetSites: [],
        dataSources: [],
      };
    }
  }

  /**
   * Generate workflow structure using LLM
   */
  private async generateWorkflowStructureWithLLM(
    userInput: string,
    intent: IntentClassification,
    entities: EntityExtraction
  ): Promise<WorkflowStructure> {
    const prompt = `
You are an AI workflow designer. Analyze the user's request and create a comprehensive workflow structure.

User Request: "${userInput}"

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

      return JSON.parse(response.content);
    } catch (error) {
      console.error("Error in LLM workflow generation:", error);
      // Return a simple fallback workflow
      return {
        nodes: [
          {
            type: "dataInput",
            label: "Input Data",
            config: {
              dataType: "text",
              defaultValue: "Enter your data here",
            },
          },
          {
            type: "llmTask",
            label: "AI Processor",
            config: {
              prompt: `Process the following input: ${userInput}\n\nInput: {{input.output}}`,
              model: "deepseek-chat",
              temperature: 0.7,
            },
          },
          {
            type: "dataOutput",
            label: "Output Result",
            config: {
              format: "text",
              filename: "result.txt",
            },
          },
        ],
        edges: [
          { source: "node-0", target: "node-1" },
          { source: "node-1", target: "node-2" },
        ],
        topology: {
          type: "linear",
          description: "Simple AI processing workflow",
          parallelExecution: false,
        },
        complexity: "low",
        estimatedExecutionTime: 5000,
      };
    }
  }

  /**
   * Fallback parsing using simple AI generation
   */
  private fallbackParsing(userInput: string): ParsedIntent {
    // Create a simple workflow as fallback
    const workflowStructure: WorkflowStructure = {
      nodes: [
        {
          type: "dataInput",
          label: "Input Data",
          config: {
            dataType: "text",
            defaultValue: "Enter your data here",
          },
        },
        {
          type: "llmTask",
          label: "AI Processor",
          config: {
            prompt: `Process the following input: ${userInput}\n\nInput: {{input.output}}`,
            model: "deepseek-chat",
            temperature: 0.7,
          },
        },
        {
          type: "dataOutput",
          label: "Output Result",
          config: {
            format: "text",
            filename: "result.txt",
          },
        },
      ],
      edges: [
        { source: "node-0", target: "node-1" },
        { source: "node-1", target: "node-2" },
      ],
      topology: {
        type: "linear",
        description: "Simple AI processing workflow",
        parallelExecution: false,
      },
      complexity: "low",
      estimatedExecutionTime: 5000,
    };

    return {
      intent: "FALLBACK_PROCESSING",
      confidence: 0.5,
      entities: {
        urls: [],
        dataTypes: ["text"],
        outputFormats: ["text"],
        aiTasks: ["process"],
        processingSteps: [],
        targetSites: [],
        dataSources: [],
      },
      workflowStructure,
      reasoning: "Fallback workflow generated due to AI processing error",
    };
  }

  /**
   * Analyze mixed intent workflows
   */
  async analyzeMixedIntent(userInput: string): Promise<MixedIntentAnalysis> {
    // Simple analysis based on user input
    const hasMultipleKeywords =
      (userInput.toLowerCase().includes("web") &&
        userInput.toLowerCase().includes("ai")) ||
      (userInput.toLowerCase().includes("scrape") &&
        userInput.toLowerCase().includes("analyze")) ||
      (userInput.toLowerCase().includes("data") &&
        userInput.toLowerCase().includes("process"));

    const intent = hasMultipleKeywords ? "MIXED" : "GENERAL_PROCESSING";
    const confidence = hasMultipleKeywords ? 0.8 : 0.6;

    return {
      intent,
      confidence,
      reasoning: hasMultipleKeywords
        ? "Mixed workflow combining multiple processing types"
        : "General processing workflow",
      subIntents: [intent],
      subConfidences: { [intent]: confidence },
      complexity: {
        level: hasMultipleKeywords ? "high" : "medium",
        score: hasMultipleKeywords ? 0.8 : 0.5,
        patterns: hasMultipleKeywords ? ["mixed", "complex"] : ["simple"],
        estimatedNodes: hasMultipleKeywords ? 5 : 3,
      },
    };
  }

  /**
   * Generate workflow from mixed intent analysis
   */
  async generateMixedWorkflow(
    mixedAnalysis: MixedIntentAnalysis,
    userInput: string
  ): Promise<WorkflowStructure> {
    return generateMixedWorkflowStructure(mixedAnalysis, userInput);
  }

  /**
   * Validate generated workflow
   */
  validateWorkflow(
    workflow: WorkflowStructure,
    originalInput: string
  ): ValidationResult {
    return validateWorkflowStructure(workflow, originalInput);
  }

  /**
   * Validate mixed workflow
   */
  validateMixedWorkflow(
    workflow: WorkflowStructure,
    originalInput: string
  ): ValidationResult {
    return validateMixedWorkflow(workflow, originalInput);
  }

  /**
   * Get improvement suggestions
   */
  getImprovementSuggestions(workflow: WorkflowStructure): string[] {
    return generateImprovementSuggestions(workflow);
  }

  /**
   * Generate contextual suggestions based on current workflow
   */
  async generateContextualSuggestions(
    currentWorkflow: WorkflowStructure | null,
    userInput: string
  ): Promise<string[]> {
    const suggestions: string[] = [];

    if (!currentWorkflow) {
      return suggestions;
    }

    // Analyze current workflow state
    const nodeCount = currentWorkflow.nodes.length;
    const hasWebScraping = currentWorkflow.nodes.some(
      (n) => n.type === "webScraping"
    );
    const hasLLM = currentWorkflow.nodes.some((n) => n.type === "llmTask");
    const hasOutput = currentWorkflow.nodes.some(
      (n) => n.type === "dataOutput"
    );

    // Generate suggestions based on current state
    if (nodeCount === 0) {
      suggestions.push("Start by adding a data input node");
    } else if (!hasOutput) {
      suggestions.push("Add a data output node to complete the workflow");
    } else if (hasWebScraping && !hasLLM) {
      suggestions.push(
        "Consider adding an AI analysis node after web scraping"
      );
    } else if (
      hasLLM &&
      !hasWebScraping &&
      userInput.toLowerCase().includes("website")
    ) {
      suggestions.push("Add a web scraping node to extract data from websites");
    }

    return suggestions;
  }

  /**
   * Learn from user modifications
   */
  learnFromModifications(
    originalWorkflow: WorkflowStructure,
    modifiedWorkflow: WorkflowStructure,
    userFeedback?: string
  ): void {
    // In a real implementation, this would update the learning model
    // For now, we'll just log the changes
    console.log("Learning from user modifications:", {
      original: originalWorkflow,
      modified: modifiedWorkflow,
      feedback: userFeedback,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: any): boolean {
    if (!entry._cachedAt) return false;
    return Date.now() - entry._cachedAt < this.CACHE_TTL;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.8, // Placeholder - would track actual hit rate
    };
  }
}

// Export singleton instance
export const copilotService = new CopilotService();
