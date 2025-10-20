import { BaseDatabaseCommand, DatabaseCommand } from "../DatabaseCommand";
import { ConnectorResult } from "../../../../connectors/base/BaseConnector";

/**
 * Example command for executing database functions (PostgreSQL, MySQL, etc.)
 * This demonstrates how to add new command types to the system
 */
export class FunctionCommand
  extends BaseDatabaseCommand
  implements DatabaseCommand
{
  execute(connector: any): Promise<ConnectorResult> {
    const functionName = this.config.functionName;
    const parameters = this.parseJsonParam(this.config.parameters, []);
    const returnType = this.config.returnType || "table";

    if (!functionName) {
      return Promise.resolve(
        this.createResult(false, undefined, "Function name is required")
      );
    }

    // Check if connector supports function calls
    if (!connector.supportsOperation("function")) {
      return Promise.resolve(
        this.createResult(
          false,
          undefined,
          "Function calls not supported by this connector"
        )
      );
    }

    // Build function call based on database type
    if (connector.constructor.name.includes("Postgres")) {
      return this.executePostgresFunction(
        connector,
        functionName,
        parameters,
        returnType
      );
    } else if (connector.constructor.name.includes("MySQL")) {
      return this.executeMySQLFunction(
        connector,
        functionName,
        parameters,
        returnType
      );
    } else {
      return Promise.resolve(
        this.createResult(
          false,
          undefined,
          `Function calls not supported for ${connector.constructor.name}`
        )
      );
    }
  }

  private async executePostgresFunction(
    connector: any,
    functionName: string,
    parameters: any[],
    returnType: string
  ): Promise<ConnectorResult> {
    const paramPlaceholders = parameters
      .map((_, index) => `$${index + 1}`)
      .join(", ");
    const query = `SELECT * FROM ${functionName}(${paramPlaceholders})`;

    return connector.execute(query, parameters);
  }

  private async executeMySQLFunction(
    connector: any,
    functionName: string,
    parameters: any[],
    returnType: string
  ): Promise<ConnectorResult> {
    const paramPlaceholders = parameters.map(() => "?").join(", ");
    const query = `SELECT ${functionName}(${paramPlaceholders}) as result`;

    return connector.execute(query, parameters);
  }

  getOperationType(): string {
    return "databaseFunction";
  }

  getDescription(): string {
    const functionName = this.config.functionName || "unknown";
    const paramCount = Array.isArray(this.config.parameters)
      ? this.config.parameters.length
      : 0;
    return `Execute function ${functionName} with ${paramCount} parameters`;
  }

  validate(): boolean {
    return super.validate() && !!this.config.functionName;
  }
}

/**
 * Example command for bulk operations
 */
export class BulkOperationCommand
  extends BaseDatabaseCommand
  implements DatabaseCommand
{
  execute(connector: any): Promise<ConnectorResult> {
    const operations = this.parseJsonParam(this.config.operations, []);
    const batchSize = this.config.batchSize || 100;

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return Promise.resolve(
        this.createResult(false, undefined, "Operations array is required")
      );
    }

    return this.executeBulkOperations(connector, operations, batchSize);
  }

  private async executeBulkOperations(
    connector: any,
    operations: any[],
    batchSize: number
  ): Promise<ConnectorResult> {
    const startTime = Date.now();
    const results = [];
    const errors = [];

    try {
      // Process operations in batches
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const batchResults = await this.processBatch(connector, batch);

        results.push(...batchResults.successful);
        errors.push(...batchResults.failed);
      }

      return this.createResult(
        true,
        {
          totalProcessed: operations.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors,
        },
        undefined,
        {
          executionTime: Date.now() - startTime,
          batchSize,
          totalBatches: Math.ceil(operations.length / batchSize),
        }
      );
    } catch (error) {
      return this.createResult(
        false,
        undefined,
        `Bulk operation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { executionTime: Date.now() - startTime }
      );
    }
  }

  private async processBatch(
    connector: any,
    batch: any[]
  ): Promise<{ successful: any[]; failed: any[] }> {
    const successful = [];
    const failed = [];

    for (const operation of batch) {
      try {
        const result = await this.executeOperation(connector, operation);
        if (result.success) {
          successful.push({ operation, result });
        } else {
          failed.push({ operation, error: result.error });
        }
      } catch (error) {
        failed.push({
          operation,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { successful, failed };
  }

  private async executeOperation(
    connector: any,
    operation: any
  ): Promise<ConnectorResult> {
    const { type, ...config } = operation;

    switch (type) {
      case "insert":
        return connector.execute("insertOne", {
          collection: operation.collection,
          document: operation.document,
        });
      case "update":
        return connector.execute("updateOne", {
          collection: operation.collection,
          filter: operation.filter,
          update: operation.update,
        });
      case "delete":
        return connector.execute("deleteOne", {
          collection: operation.collection,
          filter: operation.filter,
        });
      default:
        return this.createResult(
          false,
          undefined,
          `Unsupported operation type: ${type}`
        );
    }
  }

  getOperationType(): string {
    return "databaseBulkOperation";
  }

  getDescription(): string {
    const operationCount = Array.isArray(this.config.operations)
      ? this.config.operations.length
      : 0;
    return `Execute ${operationCount} bulk operations`;
  }

  validate(): boolean {
    return (
      super.validate() &&
      !!this.config.operations &&
      Array.isArray(this.config.operations) &&
      this.config.operations.length > 0
    );
  }
}
