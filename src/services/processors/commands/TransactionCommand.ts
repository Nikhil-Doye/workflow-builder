import { BaseDatabaseCommand, DatabaseCommand } from "./DatabaseCommand";
import { ConnectorResult } from "../../../connectors/base/BaseConnector";

/**
 * Command for executing database transactions
 */
export class TransactionCommand
  extends BaseDatabaseCommand
  implements DatabaseCommand
{
  execute(connector: any): Promise<ConnectorResult> {
    const operations = this.parseJsonParam(this.config.operations, []);
    const isolationLevel = this.config.isolationLevel || "READ_COMMITTED";

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return Promise.resolve(
        this.createResult(
          false,
          undefined,
          "Transaction operations are required"
        )
      );
    }

    // Check if the connector supports transactions
    if (connector.beginTransaction && connector.commit && connector.rollback) {
      return this.executeTransaction(connector, operations, isolationLevel);
    }

    // Fallback to sequential execution if transactions aren't supported
    return this.executeSequential(connector, operations);
  }

  private async executeTransaction(
    connector: any,
    operations: any[],
    isolationLevel: string
  ): Promise<ConnectorResult> {
    const startTime = Date.now();

    try {
      // Begin transaction
      await connector.beginTransaction(isolationLevel);

      const results = [];

      // Execute each operation within the transaction
      for (const operation of operations) {
        const result = await this.executeOperation(connector, operation);
        if (!result.success) {
          throw new Error(`Operation failed: ${result.error}`);
        }
        results.push(result);
      }

      // Commit transaction
      await connector.commit();

      return this.createResult(true, results, undefined, {
        executionTime: Date.now() - startTime,
        operationCount: operations.length,
        isolationLevel,
      });
    } catch (error) {
      // Rollback on error
      try {
        await connector.rollback();
      } catch (rollbackError) {
        console.error("Failed to rollback transaction:", rollbackError);
      }

      return this.createResult(
        false,
        undefined,
        `Transaction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { executionTime: Date.now() - startTime }
      );
    }
  }

  private async executeSequential(
    connector: any,
    operations: any[]
  ): Promise<ConnectorResult> {
    const startTime = Date.now();
    const results = [];

    try {
      for (const operation of operations) {
        const result = await this.executeOperation(connector, operation);
        if (!result.success) {
          return this.createResult(
            false,
            results,
            `Sequential execution failed at operation: ${result.error}`,
            { executionTime: Date.now() - startTime }
          );
        }
        results.push(result);
      }

      return this.createResult(true, results, undefined, {
        executionTime: Date.now() - startTime,
        operationCount: operations.length,
        mode: "sequential",
      });
    } catch (error) {
      return this.createResult(
        false,
        results,
        `Sequential execution failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { executionTime: Date.now() - startTime }
      );
    }
  }

  private async executeOperation(
    connector: any,
    operation: any
  ): Promise<ConnectorResult> {
    const { type, query, params, ...config } = operation;

    switch (type) {
      case "query":
        return connector.execute(query, params || []);
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
    return "databaseTransaction";
  }

  getDescription(): string {
    const operationCount = Array.isArray(this.config.operations)
      ? this.config.operations.length
      : 0;
    return `Execute transaction with ${operationCount} operations`;
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
