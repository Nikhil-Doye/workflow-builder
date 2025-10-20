import { BaseDatabaseCommand, DatabaseCommand } from "./DatabaseCommand";
import { ConnectorResult } from "../../../connectors/base/BaseConnector";

/**
 * Command for MongoDB aggregation operations
 */
export class AggregateCommand
  extends BaseDatabaseCommand
  implements DatabaseCommand
{
  execute(connector: any): Promise<ConnectorResult> {
    const pipeline = this.parseJsonParam(this.config.pipeline, []);
    const collection = this.config.collection;

    if (!pipeline || !Array.isArray(pipeline) || pipeline.length === 0) {
      return Promise.resolve(
        this.createResult(false, undefined, "Aggregation pipeline is required")
      );
    }

    if (!collection) {
      return Promise.resolve(
        this.createResult(false, undefined, "Collection name is required")
      );
    }

    // Check if this is a MongoDB connector
    if (connector.constructor.name.includes("Mongo")) {
      return connector.execute("aggregate", { collection, pipeline });
    }

    // For SQL databases, we might need to convert aggregation to SQL
    return this.convertToSQL(connector, collection, pipeline);
  }

  private async convertToSQL(
    connector: any,
    table: string,
    pipeline: any[]
  ): Promise<ConnectorResult> {
    // This is a simplified conversion - in practice, you'd need a more sophisticated
    // aggregation pipeline to SQL converter
    try {
      let query = `SELECT * FROM ${table}`;
      const params: any[] = [];

      // Basic pipeline stages conversion
      for (const stage of pipeline) {
        if (stage.$match) {
          const conditions = Object.keys(stage.$match)
            .map((key) => `${key} = ?`)
            .join(" AND ");
          const values = Object.values(stage.$match);
          query += ` WHERE ${conditions}`;
          params.push(...values);
        } else if (stage.$limit) {
          query += ` LIMIT ${stage.$limit}`;
        } else if (stage.$skip) {
          query += ` OFFSET ${stage.$skip}`;
        }
      }

      return connector.execute(query, params);
    } catch (error) {
      return this.createResult(
        false,
        undefined,
        `Failed to convert aggregation pipeline to SQL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  getOperationType(): string {
    return "databaseAggregate";
  }

  getDescription(): string {
    const collection = this.config.collection || "unknown";
    const stageCount = Array.isArray(this.config.pipeline)
      ? this.config.pipeline.length
      : 0;
    return `Aggregate data from ${collection} (${stageCount} stages)`;
  }

  validate(): boolean {
    return (
      super.validate() &&
      !!this.config.pipeline &&
      Array.isArray(this.config.pipeline) &&
      !!this.config.collection
    );
  }
}
