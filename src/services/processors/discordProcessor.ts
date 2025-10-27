import { ExecutionContext, ExecutionPlan } from "../executionEngine";
import { DiscordService } from "../discord/DiscordService";
import { DiscordOperation, DiscordConfig } from "../../types/discord";

/**
 * Discord processor - handles Discord operations with full execution context
 * Refactored to match standard processor signature for consistency, observability, and maintainability
 */
export default async function discordProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, nodeId, nodeType } = context;
  const startTime = Date.now();

  try {
    // Validate configuration exists
    if (!config) {
      throw new Error("Discord configuration is missing");
    }

    const discordService = new DiscordService();

    // Validate configuration structure
    const validation = discordService.validateConfig(config as DiscordConfig);
    if (!validation.isValid) {
      throw new Error(
        `Configuration validation failed: ${validation.errors.join(", ")}`
      );
    }

    // Execute Discord operation
    const result = await discordService.executeOperation(
      config.operation as DiscordOperation,
      config as DiscordConfig
    );

    const executionTime = Date.now() - startTime;

    // Return standardized response with execution metadata
    return {
      success: true,
      operation: config.operation,
      data: result,
      executionTime,
      type: "discord",
      nodeId,
      nodeType,
      metadata: {
        channelId: (config as DiscordConfig).channelId,
        guildId: (config as DiscordConfig).botToken ? "configured" : undefined,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Throw error with context for proper error tracing in execution engine
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown Discord operation error";
    const enhancedError = new Error(
      `Discord operation failed (node: ${nodeId}): ${errorMessage}`
    );

    // Attach metadata for debugging and observability
    (enhancedError as any).nodeId = nodeId;
    (enhancedError as any).nodeType = nodeType;
    (enhancedError as any).executionTime = executionTime;
    (enhancedError as any).operation = config?.operation;

    throw enhancedError;
  }
}
