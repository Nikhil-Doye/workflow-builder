import { ExecutionContext, ExecutionPlan } from "../executionEngine";
import { UnifiedDatabaseService } from "../database/UnifiedDatabaseService";
import { DatabaseConfig } from "../../types/database";

export default async function unifiedDatabaseProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config } = context;

  try {
    // Validate configuration
    const service = new UnifiedDatabaseService();
    const validation = service.validateConfig(config as DatabaseConfig);

    if (!validation.valid) {
      throw new Error(
        `Invalid database configuration: ${validation.errors.join(", ")}`
      );
    }

    // Execute the operation
    const result = await service.executeOperation(config as DatabaseConfig);

    if (!result.success) {
      throw new Error(result.error || "Database operation failed");
    }

    // Return standardized response
    return {
      success: true,
      operation: config.operation,
      data: result.data,
      rowsAffected: result.metadata?.rowsAffected,
      executionTime: result.metadata?.executionTime,
      connectionId: result.metadata?.connectionId,
      type: "database",
    };
  } catch (error) {
    throw new Error(
      `Database operation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
