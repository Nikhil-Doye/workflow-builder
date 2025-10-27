import { ExecutionContext, ExecutionPlan } from "../executionEngine";
import { GmailService } from "../gmail/GmailService";
import { GmailOperation, GmailConfig } from "../../types/gmail";

/**
 * Gmail processor - handles Gmail operations with full execution context
 * Refactored to match standard processor signature for consistency, observability, and maintainability
 */
export default async function gmailProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, nodeId, nodeType } = context;
  const startTime = Date.now();

  try {
    // Validate configuration exists
    if (!config) {
      throw new Error("Gmail configuration is missing");
    }

    const gmailService = new GmailService();

    // Validate configuration structure
    const validation = gmailService.validateConfig(config as GmailConfig);
    if (!validation.isValid) {
      throw new Error(
        `Configuration validation failed: ${validation.errors.join(", ")}`
      );
    }

    // Execute Gmail operation
    const result = await gmailService.executeOperation(
      config.operation as GmailOperation,
      config as GmailConfig
    );

    const executionTime = Date.now() - startTime;

    // Return standardized response with execution metadata
    return {
      success: true,
      operation: config.operation,
      data: result,
      executionTime,
      type: "gmail",
      nodeId,
      nodeType,
      metadata: {
        messageId: (config as GmailConfig).messageId,
        threadId: (config as GmailConfig).threadId,
        to: (config as GmailConfig).to,
        subject: (config as GmailConfig).subject,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Throw error with context for proper error tracing in execution engine
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Gmail operation error";
    const enhancedError = new Error(
      `Gmail operation failed (node: ${nodeId}): ${errorMessage}`
    );

    // Attach metadata for debugging and observability
    (enhancedError as any).nodeId = nodeId;
    (enhancedError as any).nodeType = nodeType;
    (enhancedError as any).executionTime = executionTime;
    (enhancedError as any).operation = config?.operation;

    throw enhancedError;
  }
}
