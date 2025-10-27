import { BaseDatabaseCommand, DatabaseCommand } from "./DatabaseCommand";
import { ConnectorResult } from "../../../connectors/base/BaseConnector";

/**
 * Command for deleting documents/records from database
 */
export class DeleteCommand
  extends BaseDatabaseCommand
  implements DatabaseCommand
{
  execute(connector: any): Promise<ConnectorResult> {
    const filter = this.parseJsonParam(this.config.filter, {});
    const collection = this.config.collection || this.config.table;

    if (!filter || Object.keys(filter).length === 0) {
      return Promise.resolve(
        this.createResult(
          false,
          undefined,
          "Filter criteria is required for delete"
        )
      );
    }

    // For SQL databases, we need to construct a DELETE query
    if (
      connector.constructor.name.includes("SQL") ||
      connector.constructor.name.includes("Postgres") ||
      connector.constructor.name.includes("MySQL")
    ) {
      return this.executeSQLDelete(connector, collection, filter);
    }

    // For NoSQL databases (MongoDB), use the native delete operation
    return connector.execute("deleteOne", { collection, filter });
  }

  private async executeSQLDelete(
    connector: any,
    table: string,
    filter: any
  ): Promise<ConnectorResult> {
    if (!table) {
      return this.createResult(
        false,
        undefined,
        "Table name is required for SQL delete"
      );
    }

    // Build WHERE clause
    const whereConditions = Object.keys(filter)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const whereValues = Object.values(filter);

    const query = `DELETE FROM ${table} WHERE ${whereConditions}`;

    return connector.execute(query, whereValues);
  }

  getOperationType(): string {
    return "databaseDelete";
  }

  getDescription(): string {
    const collection = this.config.collection || this.config.table || "unknown";
    return `Delete documents from ${collection}`;
  }

  validate(): boolean {
    if (!super.validate()) return false;
    const hasFilter =
      this.hasObject(this.config, "filter") ||
      this.hasObject(this.config, "where");
    if (!hasFilter) {
      console.warn(
        "DeleteCommand validation failed. 'filter' or 'where' object is required."
      );
      return false;
    }
    return true;
  }
}
