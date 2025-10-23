import { ExecutionContext, ExecutionPlan } from "../executionEngine";
import { SlackService } from "../slack/SlackService";
import { SlackConfig } from "../../types/slack";

export default async function slackProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config } = context;

  try {
    // Validate configuration
    const service = new SlackService();
    const validation = service.validateConfig(config as SlackConfig);

    if (!validation.valid) {
      throw new Error(
        `Invalid Slack configuration: ${validation.errors.join(", ")}`
      );
    }

    // Execute the operation
    const result = await service.executeOperation(config as SlackConfig);

    if (!result.success) {
      throw new Error(result.error || "Slack operation failed");
    }

    // Return standardized response
    return {
      success: true,
      operation: config.operation,
      data: result.data,
      channelId: result.metadata?.channelId,
      messageTs: result.metadata?.messageTs,
      userId: result.metadata?.userId,
      executionTime: result.metadata?.executionTime,
      type: "slack",
    };
  } catch (error) {
    throw new Error(
      `Slack operation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
