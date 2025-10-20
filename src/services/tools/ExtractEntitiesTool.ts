import { BaseTool } from "./BaseTool";
import { ToolParameter, ToolResult } from "../../types/tools";
import { naturalLanguageToWorkflowService } from "../naturalLanguageToWorkflowService";
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
          return await naturalLanguageToWorkflowService.extractEntities(
            userInput,
            intent
          );
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
