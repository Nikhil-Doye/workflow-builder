import { databaseConnectionManager } from "../databaseConnectionManager";
import { ExecutionContext, ExecutionPlan } from "../executionEngine";

export default async function databaseProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, inputs } = context;

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

    // Execute the query based on node type
    let result;
    switch (context.nodeType) {
      case "databaseQuery":
        result = await databaseConnectionManager.executeQuery(
          config.connectionId,
          config.query,
          config.params ? JSON.parse(config.params) : []
        );
        break;
      case "databaseInsert":
        result = await databaseConnectionManager.executeQuery(
          config.connectionId,
          "insert",
          [config.document ? JSON.parse(config.document) : {}]
        );
        break;
      case "databaseUpdate":
        result = await databaseConnectionManager.executeQuery(
          config.connectionId,
          "update",
          [
            config.filter ? JSON.parse(config.filter) : {},
            config.update ? JSON.parse(config.update) : {},
          ]
        );
        break;
      case "databaseDelete":
        result = await databaseConnectionManager.executeQuery(
          config.connectionId,
          "delete",
          [config.filter ? JSON.parse(config.filter) : {}]
        );
        break;
      default:
        throw new Error(`Unsupported database operation: ${context.nodeType}`);
    }

    return {
      operation: context.nodeType,
      query: config.query,
      result: result.data,
      metadata: result.metadata,
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    throw new Error(
      `Database operation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
