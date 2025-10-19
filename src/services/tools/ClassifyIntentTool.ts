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
Analyze this natural language description and classify the workflow intent:

User Input: "${userInput}"

Classify into one of these categories:
- WEB_SCRAPING: Extract data from websites
- AI_ANALYSIS: Process text with AI models
- DATA_PROCESSING: Transform or structure data
- SEARCH_AND_RETRIEVAL: Find similar content
- CONTENT_GENERATION: Create new content
- JOB_APPLICATION: Job application automation
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

      const result = JSON.parse(response.content);

      // Validate the response structure
      if (!result.intent || typeof result.confidence !== "number") {
        throw new Error("Invalid response format from LLM");
      }

      return {
        intent: result.intent,
        confidence: Math.min(Math.max(result.confidence, 0), 1), // Clamp between 0 and 1
        reasoning: result.reasoning || "Intent classified by AI",
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
      };
    }

    // Default fallback
    return {
      intent: "GENERAL_PROCESSING",
      confidence: 0.5,
      reasoning: "Fallback classification due to AI processing error",
    };
  }
}
