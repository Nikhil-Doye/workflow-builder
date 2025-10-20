import { BaseTool } from "./BaseTool";
import { ToolParameter, ToolResult } from "../../types/tools";
import { naturalLanguageToWorkflowService } from "../naturalLanguageToWorkflowService";
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
          return await naturalLanguageToWorkflowService.classifyIntent(
            userInput
          );
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
}
