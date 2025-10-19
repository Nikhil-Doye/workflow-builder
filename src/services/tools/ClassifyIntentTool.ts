import { BaseTool } from "./BaseTool";
import { ToolParameter, ToolResult } from "../../types/tools";
import { callOpenAI } from "../openaiService";
import { IntentClassification } from "../../types";

export class ClassifyIntentTool extends BaseTool {
  name = "classify_intent";
  description =
    "Analyze user input to determine workflow intent and classify the type of processing needed";
  parameters: ToolParameter[] = [
    {
      name: "userInput",
      type: "string",
      description: "The user's natural language request",
      required: true,
    },
  ];

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { userInput } = params;

    if (!userInput || typeof userInput !== "string") {
      return this.createResult(false, null, "Invalid user input provided");
    }

    try {
      const { result, executionTime } = await this.measureExecution(
        async () => {
          return await this.classifyIntentWithLLM(userInput);
        }
      );

      return this.createResult(true, result, undefined, {
        executionTime,
        confidence: result.confidence,
      });
    } catch (error) {
      console.error("Error in ClassifyIntentTool:", error);
      return this.createResult(
        false,
        null,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async classifyIntentWithLLM(
    userInput: string
  ): Promise<IntentClassification> {
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

      // Fallback to pattern-based classification
      return this.fallbackIntentClassification(userInput);
    }
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
}
