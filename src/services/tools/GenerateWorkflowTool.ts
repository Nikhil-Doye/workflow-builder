import { BaseTool } from "./BaseTool";
import { ToolParameter, ToolResult } from "../../types/tools";
import { naturalLanguageToWorkflowService } from "../naturalLanguageToWorkflowService";
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
          return await naturalLanguageToWorkflowService.generateWorkflowStructure(
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
