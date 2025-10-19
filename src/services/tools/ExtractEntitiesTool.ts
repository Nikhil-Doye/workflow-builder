import { BaseTool } from "./BaseTool";
import { ToolParameter, ToolResult } from "../../types/tools";
import { callOpenAI } from "../openaiService";
import { EntityExtraction } from "../../types";

export class ExtractEntitiesTool extends BaseTool {
  name = "extract_entities";
  description =
    "Extract specific entities like URLs, data types, output formats, and AI tasks from user input";
  parameters: ToolParameter[] = [
    {
      name: "userInput",
      type: "string",
      description: "The user's natural language request",
      required: true,
    },
    {
      name: "intent",
      type: "string",
      description: "The classified intent from previous step",
      required: false,
    },
  ];

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { userInput, intent } = params;

    if (!userInput || typeof userInput !== "string") {
      return this.createResult(false, null, "Invalid user input provided");
    }

    try {
      const { result, executionTime } = await this.measureExecution(
        async () => {
          return await this.extractEntitiesWithLLM(userInput, intent);
        }
      );

      return this.createResult(true, result, undefined, {
        executionTime,
        confidence: this.calculateConfidence(result),
      });
    } catch (error) {
      console.error("Error in ExtractEntitiesTool:", error);
      return this.createResult(
        false,
        null,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async extractEntitiesWithLLM(
    userInput: string,
    intent?: string
  ): Promise<EntityExtraction> {
    const prompt = `
Extract specific entities from this workflow description:

Input: "${userInput}"
Intent: ${intent || "Unknown"}

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

      const result = JSON.parse(response.content);

      // Validate and normalize the response
      return this.normalizeEntityExtraction(result);
    } catch (error) {
      console.error("Error in LLM entity extraction:", error);

      // Fallback to pattern-based extraction
      return this.fallbackEntityExtraction(userInput);
    }
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
    };
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

    return entities;
  }

  private calculateConfidence(entities: EntityExtraction): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on number of entities found
    const totalEntities = Object.values(entities).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    confidence += Math.min(totalEntities * 0.1, 0.4);

    // Increase confidence if we found URLs (strong indicator)
    if (entities.urls.length > 0) confidence += 0.2;

    // Increase confidence if we found AI tasks (strong indicator)
    if (entities.aiTasks.length > 0) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }
}
