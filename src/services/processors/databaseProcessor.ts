import { databaseConnectionManager } from "../databaseConnectionManager";
import { ExecutionContext, ExecutionPlan } from "../executionEngine";
import { CommandFactory } from "./commands/CommandFactory";
import {
  CommandExecutionResult,
  CommandExecutionContext,
} from "./commands/DatabaseCommand";

export default async function databaseProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<CommandExecutionResult> {
  const { config } = context;
  const startTime = Date.now();

  try {
    if (!config.connectionId) {
      throw new Error("No database connection specified");
    }

    // Get the connection
    const connection = databaseConnectionManager.getConnection(
      config.connectionId
    );
    if (!connection) {
      throw new Error("Database connection not found");
    }

    // Connect if not already connected
    if (connection.status !== "connected") {
      const connected = await databaseConnectionManager.connect(
        config.connectionId
      );
      if (!connected) {
        throw new Error("Failed to connect to database");
      }
    }

    // Create command using the factory
    const command = CommandFactory.createCommandFromContext(context);

    // Validate command before execution
    if (!command.validate()) {
      throw new Error(`Invalid command configuration for ${context.nodeType}`);
    }

    // Get the connector instance
    const connector = databaseConnectionManager.getConnector(
      config.connectionId
    );
    if (!connector) {
      throw new Error("Database connector not available");
    }

    // Execute the command
    const result = await command.execute(connector);
    const executionTime = Date.now() - startTime;

    // Create execution context for logging
    const executionContext: CommandExecutionContext = {
      connectionId: config.connectionId,
      nodeType: context.nodeType,
      executionId: plan.id,
      timestamp: new Date(),
    };

    return {
      ...result,
      operation: command.getOperationType(),
      description: command.getDescription(),
      executionTime,
      context: executionContext,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      data: undefined,
      error: `Database operation failed: ${errorMessage}`,
      operation: context.nodeType,
      description: `Failed ${context.nodeType} operation`,
      executionTime,
      metadata: {
        operation: context.nodeType,
        executionTime,
      },
    };
  }
}
