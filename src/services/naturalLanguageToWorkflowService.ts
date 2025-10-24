import { callOpenAI } from "./openaiService";
import {
  ParsedIntent,
  IntentClassification,
  EntityExtraction,
  WorkflowStructure,
  MixedIntentAnalysis,
} from "../types";
import { generateMixedWorkflowStructure } from "../utils/workflowGenerator";
import {
  validateWorkflowStructure,
  validateMixedWorkflow,
  generateImprovementSuggestions,
} from "../utils/workflowValidator";

/**
 * Centralized service for converting natural language to workflow structures.
 * This service consolidates all NL-to-Workflow logic to prevent duplication
 * between CopilotService and AgentManager systems.
 */
export class NaturalLanguageToWorkflowService {
  private cache = new Map<string, ParsedIntent>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Parse natural language input and generate complete workflow structure
   */
  async parseNaturalLanguage(userInput: string): Promise<ParsedIntent> {
    // Check cache first
    const cacheKey = userInput.toLowerCase().trim();
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    try {
      // Step 1: Classify intent
      const intent = await this.classifyIntent(userInput);

      // Step 2: Extract entities
      const entities = await this.extractEntities(userInput, intent);

      // Step 3: Generate workflow structure
      const workflowStructure = await this.generateWorkflowStructure(
        userInput,
        intent,
        entities
      );

      const parsedIntent: ParsedIntent = {
        intent: intent.intent,
        confidence: intent.confidence,
        entities,
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
      console.error("Error in NL-to-Workflow processing:", error);
      return this.fallbackParsing(userInput);
    }
  }

  /**
   * Classify user intent using LLM with comprehensive analysis
   */
  async classifyIntent(userInput: string): Promise<IntentClassification> {
    const prompt = `
Analyze this workflow request and provide a comprehensive breakdown:

User Input: "${userInput}"

1. PRIMARY INTENT: Choose the main category
2. COMPLEXITY ANALYSIS: Assess workflow complexity
3. STEP BREAKDOWN: Identify all required operations
4. DATA FLOW: Map data transformations needed
5. INTEGRATION POINTS: Identify where different tools connect

Categories:
- WEB_SCRAPING: Extract data from websites
- AI_ANALYSIS: Process text with AI models
- DATA_PROCESSING: Transform or structure data
- SEARCH_AND_RETRIEVAL: Find similar content
- CONTENT_GENERATION: Create new content
- JOB_APPLICATION: Job application automation
- DOCUMENT_PROCESSING: Handle PDFs, documents
- DATA_INTEGRATION: Combine multiple data sources
- DATABASE_OPERATIONS: Database queries and updates
- NOTIFICATION_SENDING: Send alerts and messages
- EMAIL_AUTOMATION: Email sending and management
- WORKFLOW_ORCHESTRATION: Complex multi-step processes
- MIXED: Multiple distinct operations

Complexity Levels:
- SIMPLE: 1-3 nodes, linear flow
- MODERATE: 4-6 nodes, some branching
- COMPLEX: 7+ nodes, multiple data sources, conditional logic
- ENTERPRISE: 10+ nodes, parallel processing, error handling

Respond with JSON:
{
  "intent": "WEB_SCRAPING",
  "complexity": "COMPLEX",
  "stepBreakdown": [
    {
      "step": 1,
      "operation": "data_input",
      "description": "Accept URL input",
      "nodeType": "dataInput"
    },
    {
      "step": 2,
      "operation": "web_scraping",
      "description": "Extract content from website",
      "nodeType": "webScraping"
    },
    {
      "step": 3,
      "operation": "ai_analysis",
      "description": "Analyze content with AI",
      "nodeType": "llmTask"
    }
  ],
  "dataFlow": "url → scraped_content → ai_analysis → structured_output",
  "integrationPoints": ["web_scraper_to_ai", "ai_to_processor"],
  "confidence": 0.95,
  "reasoning": "Multi-step workflow requiring web scraping, AI analysis, and data processing"
}
`;

    try {
      const response = await callOpenAI(prompt, {
        model: "deepseek-chat",
        temperature: 0.1,
        maxTokens: 200,
      });

      const result = JSON.parse(response.content);

      // Validate the response structure
      if (!result.intent || typeof result.confidence !== "number") {
        throw new Error("Invalid response format from LLM");
      }

      return {
        intent: result.intent,
        confidence: Math.min(Math.max(result.confidence, 0), 1), // Clamp between 0 and 1
        reasoning: result.reasoning || "Intent classified by AI",
        complexity: result.complexity || "SIMPLE",
        stepBreakdown: result.stepBreakdown || [],
        dataFlow: result.dataFlow || "",
        integrationPoints: result.integrationPoints || [],
      };
    } catch (error) {
      console.error("Error in LLM intent classification:", error);
      return this.fallbackIntentClassification(userInput);
    }
  }

  /**
   * Extract entities from user input using LLM
   */
  async extractEntities(
    userInput: string,
    intent?: IntentClassification
  ): Promise<EntityExtraction> {
    const prompt = `
Extract specific entities from this workflow description:

Input: "${userInput}"
Intent: ${intent?.intent || "Unknown"}
Complexity: ${intent?.complexity || "SIMPLE"}

Extract:
- URLs: Any website addresses
- Data types: text, JSON, CSV, PDF, etc.
- Output formats: JSON, text, markdown, etc.
- AI tasks: summarization, analysis, classification, etc.
- Processing steps: what transformations are needed
- Target sites: job boards, news sites, etc.
- Data sources: resume, documents, etc.
- Database operations: query, insert, update, delete, etc.
- Slack channels: channel names or mentions
- Discord channels: channel names or mentions
- Email recipients: email addresses or recipient types
- Database types: PostgreSQL, MongoDB, MySQL, etc.
- Notification types: reminder, alert, report, etc.
- Email types: reminder, report, notification, etc.

Respond with JSON:
{
  "urls": ["https://example.com"],
  "dataTypes": ["text"],
  "outputFormats": ["JSON"],
  "aiTasks": ["summarize", "extract key points"],
  "processingSteps": ["scrape content", "analyze with AI", "format output"],
  "targetSites": ["job boards"],
  "dataSources": ["resume"],
  "databaseOps": ["query", "insert"],
  "slackChannels": ["#general", "#notifications"],
  "discordChannels": ["#announcements"],
  "emailRecipients": ["team@company.com"],
  "databaseTypes": ["PostgreSQL", "MongoDB"],
  "notificationTypes": ["reminder", "alert"],
  "emailTypes": ["report", "notification"]
}
`;

    try {
      const response = await callOpenAI(prompt, {
        model: "deepseek-chat",
        temperature: 0.1,
        maxTokens: 300,
      });

      const result = JSON.parse(response.content);
      return this.normalizeEntityExtraction(result);
    } catch (error) {
      console.error("Error in LLM entity extraction:", error);
      return this.fallbackEntityExtraction(userInput);
    }
  }

  /**
   * Generate workflow structure using LLM with optimized prompts
   */
  async generateWorkflowStructure(
    userInput: string,
    intent: IntentClassification,
    entities: EntityExtraction
  ): Promise<WorkflowStructure> {
    // Import the prompt optimizer
    const { promptOptimizer } = require("./promptOptimizer");

    // Create context for workflow generation
    const workflowContext = {
      dataType: this.determineWorkflowDataType(entities),
      previousNodes: [],
      intent: intent.intent,
      domain: this.determineWorkflowDomain(userInput, entities),
      workflowType: this.determineWorkflowType(intent, entities),
      availableData: new Map(),
    };

    // Generate optimized prompt for workflow generation
    const optimizedPrompt = promptOptimizer.generateOptimizedPrompt(
      userInput,
      entities,
      workflowContext,
      workflowContext.availableData
    );

    const prompt = `${optimizedPrompt}

You are an AI workflow designer. Analyze the user's request and create a comprehensive workflow structure.

User Request: "${userInput}"
Intent: ${intent.intent} (confidence: ${intent.confidence})
Complexity: ${intent.complexity || "SIMPLE"}
Reasoning: ${intent.reasoning}

Step Breakdown: ${JSON.stringify(intent.stepBreakdown || [], null, 2)}
Data Flow: ${intent.dataFlow || "Not specified"}
Integration Points: ${intent.integrationPoints?.join(", ") || "None"}

Extracted Entities:
- URLs: ${entities.urls.join(", ") || "None"}
- Data Types: ${entities.dataTypes.join(", ") || "None"}
- Output Formats: ${entities.outputFormats.join(", ") || "None"}
- AI Tasks: ${entities.aiTasks.join(", ") || "None"}
- Processing Steps: ${entities.processingSteps.join(", ") || "None"}

Based on the complexity level (${
      intent.complexity || "SIMPLE"
    }), create an appropriate workflow:
- SIMPLE: 1-3 nodes, linear flow
- MODERATE: 4-6 nodes, some branching
- COMPLEX: 7+ nodes, multiple data sources, conditional logic
- ENTERPRISE: 10+ nodes, parallel processing, error handling

Available node types and their purposes:
- dataInput: Entry point for data (text, JSON, CSV, URL, PDF, etc.)
- webScraping: Extract content from websites using Firecrawl
- llmTask: Process data with AI models (analysis, generation, transformation)
- structuredOutput: Format data according to JSON schemas
- embeddingGenerator: Create vector embeddings for text
- similaritySearch: Find similar content using vector search
- database: Perform database operations (query, insert, update, delete)
- slack: Send messages and notifications to Slack channels
- discord: Send messages and notifications to Discord channels
- gmail: Send emails and manage Gmail communications
- dataOutput: Export results in various formats

Instructions:
1. Understand the user's goal and break it down into logical steps
2. Create a workflow that accomplishes their request
3. Use appropriate node types for each step
4. Configure nodes with realistic settings and optimized prompts
5. Connect nodes logically with proper data flow
6. Use variable substitution ({{nodeId.output}}) to pass data between nodes
7. Make the workflow practical and executable
8. For LLM nodes, use context-aware, domain-specific prompts

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

For database workflows, consider:
- Data input and validation
- Database connection and query execution
- Data processing and transformation
- Result formatting and output

For notification workflows, consider:
- Data processing and message preparation
- Channel/recipient selection
- Message formatting and personalization
- Delivery confirmation and logging

For email workflows, consider:
- Email content generation
- Recipient management
- Template processing
- Delivery tracking

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
      this.validateWorkflowStructure(result);
      return result;
    } catch (error) {
      console.error("Error in LLM workflow generation:", error);
      return this.generateFallbackWorkflow(userInput, intent, entities);
    }
  }

  /**
   * Analyze mixed intent workflows
   */
  async analyzeMixedIntent(userInput: string): Promise<MixedIntentAnalysis> {
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
  validateWorkflow(workflow: WorkflowStructure, originalInput: string): any {
    return validateWorkflowStructure(workflow, originalInput);
  }

  /**
   * Validate mixed workflow
   */
  validateMixedWorkflow(
    workflow: WorkflowStructure,
    originalInput: string
  ): any {
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
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.8, // Placeholder - would track actual hit rate
    };
  }

  // Private helper methods

  private isCacheValid(entry: any): boolean {
    if (!entry._cachedAt) return false;
    return Date.now() - entry._cachedAt < this.CACHE_TTL;
  }

  private fallbackIntentClassification(
    userInput: string
  ): IntentClassification {
    const input = userInput.toLowerCase();

    // Enhanced complexity detection patterns
    const complexityIndicators = {
      multiStep: [
        "then",
        "after",
        "next",
        "followed by",
        "subsequently",
        "and then",
        "finally",
      ],
      conditional: [
        "if",
        "when",
        "depending on",
        "based on",
        "unless",
        "provided that",
      ],
      parallel: [
        "simultaneously",
        "at the same time",
        "in parallel",
        "concurrently",
        "meanwhile",
      ],
      iterative: [
        "for each",
        "loop",
        "repeat",
        "batch",
        "multiple",
        "all",
        "every",
      ],
      integration: ["combine", "merge", "integrate", "connect", "link", "join"],
      analysis: ["analyze", "examine", "evaluate", "assess", "review", "study"],
      transformation: [
        "convert",
        "transform",
        "format",
        "structure",
        "reorganize",
        "restructure",
      ],
      complex: [
        "workflow",
        "pipeline",
        "process",
        "automation",
        "orchestration",
        "system",
      ],
    };

    // Determine complexity level
    let complexity = "SIMPLE";
    Object.entries(complexityIndicators).forEach(([type, keywords]) => {
      const matches = keywords.filter((keyword) =>
        input.includes(keyword)
      ).length;
      if (matches > 0) {
        if (type === "complex" && matches >= 2) complexity = "ENTERPRISE";
        else if (type === "multiStep" && matches >= 2) complexity = "COMPLEX";
        else if (matches >= 1 && complexity === "SIMPLE")
          complexity = "MODERATE";
      }
    });

    // Pattern-based classification as fallback
    if (
      input.includes("web") ||
      input.includes("scrape") ||
      input.includes("url")
    ) {
      return {
        intent: "WEB_SCRAPING",
        confidence: 0.7,
        reasoning: "Detected web-related keywords",
        complexity: complexity,
        stepBreakdown: this.generateBasicStepBreakdown("WEB_SCRAPING", input),
        dataFlow: "url → web_scraping → output",
        integrationPoints: ["web_scraper_to_processor"],
      };
    }

    if (
      input.includes("job") ||
      input.includes("resume") ||
      input.includes("application")
    ) {
      return {
        intent: "JOB_APPLICATION",
        confidence: 0.8,
        reasoning: "Detected job application keywords",
        complexity: complexity,
        stepBreakdown: this.generateBasicStepBreakdown(
          "JOB_APPLICATION",
          input
        ),
        dataFlow: "resume → analysis → matching → application",
        integrationPoints: ["resume_to_analyzer", "analyzer_to_matcher"],
      };
    }

    if (
      input.includes("ai") ||
      input.includes("analyze") ||
      input.includes("process")
    ) {
      return {
        intent: "AI_ANALYSIS",
        confidence: 0.6,
        reasoning: "Detected AI analysis keywords",
        complexity: complexity,
        stepBreakdown: this.generateBasicStepBreakdown("AI_ANALYSIS", input),
        dataFlow: "data → ai_analysis → structured_output",
        integrationPoints: ["data_to_ai", "ai_to_processor"],
      };
    }

    if (
      input.includes("search") ||
      input.includes("similar") ||
      input.includes("find")
    ) {
      return {
        intent: "SEARCH_AND_RETRIEVAL",
        confidence: 0.6,
        reasoning: "Detected search-related keywords",
        complexity: complexity,
        stepBreakdown: this.generateBasicStepBreakdown(
          "SEARCH_AND_RETRIEVAL",
          input
        ),
        dataFlow: "query → embedding → search → results",
        integrationPoints: ["query_to_embedding", "embedding_to_search"],
      };
    }

    // Default fallback
    return {
      intent: "GENERAL_PROCESSING",
      confidence: 0.5,
      reasoning: "Fallback classification due to AI processing error",
      complexity: complexity,
      stepBreakdown: this.generateBasicStepBreakdown(
        "GENERAL_PROCESSING",
        input
      ),
      dataFlow: "input → processing → output",
      integrationPoints: [],
    };
  }

  private generateBasicStepBreakdown(
    intent: string,
    input: string
  ): Array<{
    step: number;
    operation: string;
    description: string;
    nodeType: string;
  }> {
    const breakdowns: Record<
      string,
      Array<{
        step: number;
        operation: string;
        description: string;
        nodeType: string;
      }>
    > = {
      WEB_SCRAPING: [
        {
          step: 1,
          operation: "data_input",
          description: "Accept URL input",
          nodeType: "dataInput",
        },
        {
          step: 2,
          operation: "web_scraping",
          description: "Extract content from website",
          nodeType: "webScraping",
        },
        {
          step: 3,
          operation: "data_output",
          description: "Export scraped data",
          nodeType: "dataOutput",
        },
      ],
      JOB_APPLICATION: [
        {
          step: 1,
          operation: "data_input",
          description: "Accept resume/application data",
          nodeType: "dataInput",
        },
        {
          step: 2,
          operation: "ai_analysis",
          description: "Analyze resume with AI",
          nodeType: "llmTask",
        },
        {
          step: 3,
          operation: "data_processing",
          description: "Structure application data",
          nodeType: "structuredOutput",
        },
        {
          step: 4,
          operation: "data_output",
          description: "Generate application output",
          nodeType: "dataOutput",
        },
      ],
      AI_ANALYSIS: [
        {
          step: 1,
          operation: "data_input",
          description: "Accept text/data input",
          nodeType: "dataInput",
        },
        {
          step: 2,
          operation: "ai_analysis",
          description: "Process with AI model",
          nodeType: "llmTask",
        },
        {
          step: 3,
          operation: "data_output",
          description: "Export analysis results",
          nodeType: "dataOutput",
        },
      ],
      SEARCH_AND_RETRIEVAL: [
        {
          step: 1,
          operation: "data_input",
          description: "Accept search query",
          nodeType: "dataInput",
        },
        {
          step: 2,
          operation: "embedding_generation",
          description: "Create vector embeddings",
          nodeType: "embeddingGenerator",
        },
        {
          step: 3,
          operation: "similarity_search",
          description: "Find similar content",
          nodeType: "similaritySearch",
        },
        {
          step: 4,
          operation: "data_output",
          description: "Export search results",
          nodeType: "dataOutput",
        },
      ],
      GENERAL_PROCESSING: [
        {
          step: 1,
          operation: "data_input",
          description: "Accept input data",
          nodeType: "dataInput",
        },
        {
          step: 2,
          operation: "data_processing",
          description: "Process the data",
          nodeType: "llmTask",
        },
        {
          step: 3,
          operation: "data_output",
          description: "Export processed data",
          nodeType: "dataOutput",
        },
      ],
    };

    return breakdowns[intent] || breakdowns.GENERAL_PROCESSING;
  }

  private fallbackEntityExtraction(userInput: string): EntityExtraction {
    const input = userInput.toLowerCase();
    const entities: EntityExtraction = {
      urls: [],
      dataTypes: [],
      outputFormats: [],
      aiTasks: [],
      processingSteps: [],
      targetSites: [],
      dataSources: [],
      // New entity types
      databaseOps: [],
      slackChannels: [],
      discordChannels: [],
      emailRecipients: [],
      databaseTypes: [],
      notificationTypes: [],
      emailTypes: [],
    };

    // Extract URLs
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = userInput.match(urlPattern);
    if (urls) {
      entities.urls = urls;
    }

    // Extract data types
    if (input.includes("json")) entities.dataTypes.push("json");
    if (input.includes("csv")) entities.dataTypes.push("csv");
    if (input.includes("pdf")) entities.dataTypes.push("pdf");
    if (input.includes("resume") || input.includes("cv")) {
      entities.dataTypes.push("text");
      entities.dataSources!.push("resume");
    }
    if (input.includes("url") || input.includes("website")) {
      entities.dataTypes.push("url");
    }

    // Extract AI tasks
    if (input.includes("analyze")) entities.aiTasks.push("analyze");
    if (input.includes("summarize")) entities.aiTasks.push("summarize");
    if (input.includes("generate")) entities.aiTasks.push("generate");
    if (input.includes("extract")) entities.aiTasks.push("extract");
    if (input.includes("classify")) entities.aiTasks.push("classify");

    // Extract output formats
    if (input.includes("json")) entities.outputFormats.push("json");
    if (input.includes("text")) entities.outputFormats.push("text");
    if (input.includes("csv")) entities.outputFormats.push("csv");
    if (input.includes("markdown")) entities.outputFormats.push("markdown");

    // Extract processing steps
    if (input.includes("scrape"))
      entities.processingSteps.push("scrape content");
    if (input.includes("analyze"))
      entities.processingSteps.push("analyze with AI");
    if (input.includes("format"))
      entities.processingSteps.push("format output");
    if (input.includes("search"))
      entities.processingSteps.push("search content");

    // Extract target sites
    if (input.includes("job")) entities.targetSites!.push("job boards");
    if (input.includes("news")) entities.targetSites!.push("news sites");
    if (input.includes("blog")) entities.targetSites!.push("blog sites");

    // Extract new entity types
    // Database operations
    if (input.includes("query") || input.includes("select"))
      entities.databaseOps!.push("query");
    if (input.includes("insert") || input.includes("create"))
      entities.databaseOps!.push("insert");
    if (input.includes("update") || input.includes("modify"))
      entities.databaseOps!.push("update");
    if (input.includes("delete") || input.includes("remove"))
      entities.databaseOps!.push("delete");

    // Slack channels
    if (input.includes("slack")) {
      entities.notificationTypes!.push("slack");
      if (input.includes("channel")) entities.slackChannels!.push("#general");
    }

    // Discord channels
    if (input.includes("discord")) {
      entities.notificationTypes!.push("discord");
      if (input.includes("channel"))
        entities.discordChannels!.push("#announcements");
    }

    // Email recipients
    if (input.includes("email") || input.includes("gmail")) {
      entities.emailTypes!.push("notification");
      if (input.includes("team"))
        entities.emailRecipients!.push("team@company.com");
    }

    // Notification types
    if (input.includes("reminder"))
      entities.notificationTypes!.push("reminder");
    if (input.includes("alert")) entities.notificationTypes!.push("alert");
    if (input.includes("report")) entities.notificationTypes!.push("report");

    // Database types
    if (input.includes("postgresql") || input.includes("postgres"))
      entities.databaseTypes!.push("PostgreSQL");
    if (input.includes("mongodb") || input.includes("mongo"))
      entities.databaseTypes!.push("MongoDB");
    if (input.includes("mysql")) entities.databaseTypes!.push("MySQL");

    return entities;
  }

  private normalizeEntityExtraction(data: any): EntityExtraction {
    return {
      urls: Array.isArray(data.urls) ? data.urls : [],
      dataTypes: Array.isArray(data.dataTypes) ? data.dataTypes : [],
      outputFormats: Array.isArray(data.outputFormats)
        ? data.outputFormats
        : [],
      aiTasks: Array.isArray(data.aiTasks) ? data.aiTasks : [],
      processingSteps: Array.isArray(data.processingSteps)
        ? data.processingSteps
        : [],
      targetSites: Array.isArray(data.targetSites) ? data.targetSites : [],
      dataSources: Array.isArray(data.dataSources) ? data.dataSources : [],
      // New entity types
      databaseOps: Array.isArray(data.databaseOps) ? data.databaseOps : [],
      slackChannels: Array.isArray(data.slackChannels)
        ? data.slackChannels
        : [],
      discordChannels: Array.isArray(data.discordChannels)
        ? data.discordChannels
        : [],
      emailRecipients: Array.isArray(data.emailRecipients)
        ? data.emailRecipients
        : [],
      databaseTypes: Array.isArray(data.databaseTypes)
        ? data.databaseTypes
        : [],
      notificationTypes: Array.isArray(data.notificationTypes)
        ? data.notificationTypes
        : [],
      emailTypes: Array.isArray(data.emailTypes) ? data.emailTypes : [],
    };
  }

  private fallbackParsing(userInput: string): ParsedIntent {
    // Create a simple workflow as fallback
    const workflowStructure: WorkflowStructure = {
      id: "fallback-workflow",
      name: "Fallback Workflow",
      nodes: [
        {
          id: "input-node",
          type: "dataInput",
          label: "Input Data",
          config: {
            dataType: "text",
            defaultValue: "Enter your data here",
          },
        },
        {
          id: "ai-processor",
          type: "llmTask",
          label: "AI Processor",
          config: {
            prompt: `Process the following input: ${userInput}\n\nInput: {{input.output}}`,
            model: "deepseek-chat",
            temperature: 0.7,
          },
        },
        {
          id: "output-result",
          type: "dataOutput",
          label: "Output Result",
          config: {
            format: "text",
            filename: "result.txt",
          },
        },
      ],
      edges: [
        { id: "edge-1", source: "input-node", target: "ai-processor" },
        { id: "edge-2", source: "ai-processor", target: "output-result" },
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

  private generateFallbackWorkflow(
    userInput: string,
    intent: IntentClassification,
    entities: EntityExtraction
  ): WorkflowStructure {
    const nodes: any[] = [
      {
        id: "input-node",
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
        id: "web-scraper",
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
        id: "ai-analyzer",
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
      id: "data-output",
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
        id: `edge-${i + 1}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
      });
    }

    return {
      id: "generated-workflow",
      name: "Generated Workflow",
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

  private determineWorkflowDataType(entities: EntityExtraction): string {
    if (entities.urls?.length > 0) return "url";
    if (entities.dataTypes?.includes("json")) return "json";
    if (entities.dataTypes?.includes("csv")) return "csv";
    if (entities.dataTypes?.includes("pdf")) return "pdf";
    if (
      entities.dataTypes?.includes("resume") ||
      entities.dataTypes?.includes("cv")
    )
      return "text";
    return "text";
  }

  private determineWorkflowDomain(
    userInput: string,
    entities: EntityExtraction
  ): string {
    const input = userInput.toLowerCase();

    if (
      entities.dataTypes?.includes("resume") ||
      entities.dataTypes?.includes("cv") ||
      input.includes("resume") ||
      input.includes("job") ||
      input.includes("career")
    ) {
      return "jobApplication";
    }

    if (
      entities.dataTypes?.includes("financial") ||
      input.includes("financial") ||
      input.includes("revenue") ||
      input.includes("profit")
    ) {
      return "financial";
    }

    if (
      entities.dataTypes?.includes("legal") ||
      input.includes("legal") ||
      input.includes("contract") ||
      input.includes("agreement")
    ) {
      return "legal";
    }

    if (
      entities.dataTypes?.includes("medical") ||
      input.includes("medical") ||
      input.includes("health") ||
      input.includes("patient")
    ) {
      return "medical";
    }

    if (
      entities.dataTypes?.includes("technical") ||
      input.includes("technical") ||
      input.includes("code") ||
      input.includes("software")
    ) {
      return "technical";
    }

    if (
      input.includes("content") ||
      input.includes("marketing") ||
      input.includes("seo")
    ) {
      return "contentAnalysis";
    }

    return "general";
  }

  private determineWorkflowType(
    intent: IntentClassification,
    entities: EntityExtraction
  ): string {
    if (intent.intent === "WEB_SCRAPING") return "web_scraping";
    if (intent.intent === "AI_ANALYSIS") return "ai_analysis";
    if (intent.intent === "DATA_PROCESSING") return "data_processing";
    if (intent.intent === "SEARCH_AND_RETRIEVAL") return "search_retrieval";
    if (
      entities.dataTypes?.includes("resume") ||
      entities.dataTypes?.includes("cv")
    )
      return "job_application";
    return "general";
  }
}

// Export singleton instance
export const naturalLanguageToWorkflowService =
  new NaturalLanguageToWorkflowService();
