import { databaseConnectionManager } from "../databaseConnectionManager";
import { CommandFactory } from "../processors/commands/CommandFactory";
import {
  DatabaseConfig,
  DatabaseResponse,
  DatabaseOperation,
} from "../../types/database";

export class UnifiedDatabaseService {
  /**
   * Execute a database operation based on configuration
   */
  async executeOperation(config: DatabaseConfig): Promise<DatabaseResponse> {
    try {
      // Validate required fields
      if (!config.operation) {
        throw new Error("Database operation is required");
      }

      if (!config.connectionId) {
        throw new Error("Database connection ID is required");
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

      // Create execution context
      const context = {
        nodeType: this.mapOperationToNodeType(config.operation),
        config: this.prepareConfigForCommand(config),
      };

      // Create and execute command
      const command = CommandFactory.createCommandFromContext(context);

      if (!command.validate()) {
        throw new Error(
          `Invalid command configuration for ${config.operation}`
        );
      }

      const connector = databaseConnectionManager.getConnector(
        config.connectionId
      );
      if (!connector) {
        throw new Error("Database connector not available");
      }

      const result = await command.execute(connector);

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        metadata: {
          operation: config.operation,
          rowsAffected: result.metadata?.rowsAffected,
          executionTime: result.metadata?.executionTime,
          connectionId: config.connectionId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          operation: config.operation,
          connectionId: config.connectionId,
        },
      };
    }
  }

  /**
   * Map operation type to legacy node type for command factory
   */
  private mapOperationToNodeType(operation: DatabaseOperation): string {
    const mapping: Record<DatabaseOperation, string> = {
      query: "databaseQuery",
      insert: "databaseInsert",
      update: "databaseUpdate",
      delete: "databaseDelete",
      aggregate: "databaseAggregate",
      transaction: "databaseTransaction",
    };
    return mapping[operation];
  }

  /**
   * Prepare config for command execution
   */
  private prepareConfigForCommand(config: DatabaseConfig): Record<string, any> {
    const baseConfig = {
      connectionId: config.connectionId,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
    };

    switch (config.operation) {
      case "query":
        return {
          ...baseConfig,
          query: config.query,
          parameters: config.parameters,
          limit: config.limit,
          offset: config.offset,
          orderBy: config.orderBy,
        };

      case "insert":
        return {
          ...baseConfig,
          table: config.table,
          data: config.data,
          columns: config.columns,
          values: config.values,
          onConflict: config.onConflict,
        };

      case "update":
        return {
          ...baseConfig,
          table: config.updateTable,
          setClause: config.setClause,
          whereClause: config.whereClause,
          whereCondition: config.whereCondition,
          whereParameters: config.whereParameters,
          limit: config.updateLimit,
        };

      case "delete":
        return {
          ...baseConfig,
          table: config.deleteTable,
          whereClause: config.deleteWhereClause,
          whereCondition: config.deleteWhereCondition,
          whereParameters: config.deleteWhereParameters,
          limit: config.deleteLimit,
        };

      case "aggregate":
        return {
          ...baseConfig,
          table: config.aggregateTable,
          function: config.aggregateFunction,
          column: config.aggregateColumn,
          groupBy: config.groupBy,
          havingClause: config.havingClause,
        };

      case "transaction":
        return {
          ...baseConfig,
          queries: config.transactionQueries,
          rollbackOnError: config.rollbackOnError,
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Validate configuration for specific operation
   */
  validateConfig(config: DatabaseConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.operation) {
      errors.push("Operation is required");
    }

    if (!config.connectionId) {
      errors.push("Connection ID is required");
    }

    // Operation-specific validation
    switch (config.operation) {
      case "query":
        if (!config.query) {
          errors.push("Query is required for query operation");
        }
        break;

      case "insert":
        if (!config.table) {
          errors.push("Table is required for insert operation");
        }
        if (!config.data && !config.values) {
          errors.push("Data or values are required for insert operation");
        }
        break;

      case "update":
        if (!config.updateTable) {
          errors.push("Table is required for update operation");
        }
        if (!config.setClause) {
          errors.push("Set clause is required for update operation");
        }
        break;

      case "delete":
        if (!config.deleteTable) {
          errors.push("Table is required for delete operation");
        }
        break;

      case "aggregate":
        if (!config.aggregateTable) {
          errors.push("Table is required for aggregate operation");
        }
        if (!config.aggregateFunction) {
          errors.push("Aggregate function is required for aggregate operation");
        }
        break;

      case "transaction":
        if (
          !config.transactionQueries ||
          config.transactionQueries.length === 0
        ) {
          errors.push(
            "Transaction queries are required for transaction operation"
          );
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
