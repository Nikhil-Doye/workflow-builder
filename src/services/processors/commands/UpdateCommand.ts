import { BaseDatabaseCommand, DatabaseCommand } from "./DatabaseCommand";
import { ConnectorResult } from "../../../connectors/base/BaseConnector";

/**
 * Command for updating documents/records in database
 */
export class UpdateCommand
  extends BaseDatabaseCommand
  implements DatabaseCommand
{
  execute(connector: any): Promise<ConnectorResult> {
    const filter = this.parseJsonParam(this.config.filter, {});
    const update = this.parseJsonParam(this.config.update, {});
    const collection = this.config.collection || this.config.table;

    if (!filter || Object.keys(filter).length === 0) {
      return Promise.resolve(
        this.createResult(
          false,
          undefined,
          "Filter criteria is required for update"
        )
      );
    }

    if (!update || Object.keys(update).length === 0) {
      return Promise.resolve(
        this.createResult(false, undefined, "Update data is required")
      );
    }

    // For SQL databases, we need to construct an UPDATE query
    if (
      connector.constructor.name.includes("SQL") ||
      connector.constructor.name.includes("Postgres") ||
      connector.constructor.name.includes("MySQL")
    ) {
      return this.executeSQLUpdate(connector, collection, filter, update);
    }

    // For NoSQL databases (MongoDB), use the native update operation
    return connector.execute("updateOne", { collection, filter, update });
  }

  private async executeSQLUpdate(
    connector: any,
    table: string,
    filter: any,
    update: any
  ): Promise<ConnectorResult> {
    if (!table) {
      return this.createResult(
        false,
        undefined,
        "Table name is required for SQL update"
      );
    }

    // Build WHERE clause
    const whereConditions = Object.keys(filter)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const whereValues = Object.values(filter);

    // Build SET clause
    const setClause = Object.keys(update)
      .map((key) => `${key} = ?`)
      .join(", ");
    const setValues = Object.values(update);

    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereConditions}`;
    const params = [...setValues, ...whereValues];

    return connector.execute(query, params);
  }

  getOperationType(): string {
    return "databaseUpdate";
  }

  getDescription(): string {
    const collection = this.config.collection || this.config.table || "unknown";
    return `Update documents in ${collection}`;
  }

  validate(): boolean {
    if (!super.validate()) return false;
    const hasFilter =
      this.hasObject(this.config, "filter") ||
      this.hasObject(this.config, "where");
    const hasUpdate =
      this.hasObject(this.config, "update") ||
      this.hasObject(this.config, "set");
    if (!hasFilter || !hasUpdate) {
      console.warn(
        "UpdateCommand validation failed. 'filter/where' and 'update/set' objects are required."
      );
      return false;
    }
    return true;
  }
}
