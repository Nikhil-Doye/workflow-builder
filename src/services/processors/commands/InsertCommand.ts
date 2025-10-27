import { BaseDatabaseCommand, DatabaseCommand } from "./DatabaseCommand";
import { ConnectorResult } from "../../../connectors/base/BaseConnector";

/**
 * Command for inserting documents/records into database
 */
export class InsertCommand
  extends BaseDatabaseCommand
  implements DatabaseCommand
{
  execute(connector: any): Promise<ConnectorResult> {
    const document = this.parseJsonParam(this.config.document, {});
    const collection = this.config.collection || this.config.table;
    const params = [document];

    if (!document || Object.keys(document).length === 0) {
      return Promise.resolve(
        this.createResult(false, undefined, "Document/record data is required")
      );
    }

    // For SQL databases, we need to construct an INSERT query
    if (
      connector.constructor.name.includes("SQL") ||
      connector.constructor.name.includes("Postgres") ||
      connector.constructor.name.includes("MySQL")
    ) {
      return this.executeSQLInsert(connector, collection, document);
    }

    // For NoSQL databases (MongoDB), use the native insert operation
    return connector.execute("insertOne", { collection, document });
  }

  private async executeSQLInsert(
    connector: any,
    table: string,
    document: any
  ): Promise<ConnectorResult> {
    if (!table) {
      return this.createResult(
        false,
        undefined,
        "Table name is required for SQL insert"
      );
    }

    const columns = Object.keys(document);
    const values = Object.values(document);
    const placeholders = columns.map(() => "?").join(", ");

    const query = `INSERT INTO ${table} (${columns.join(
      ", "
    )}) VALUES (${placeholders})`;

    return connector.execute(query, values);
  }

  getOperationType(): string {
    return "databaseInsert";
  }

  getDescription(): string {
    const collection = this.config.collection || this.config.table || "unknown";
    return `Insert document into ${collection}`;
  }

  validate(): boolean {
    if (!super.validate()) return false;
    // Accept either 'document' (object/JSON) or 'record'
    const hasDoc = this.hasObject(this.config, "document");
    const hasRecord = this.hasObject(this.config, "record");
    if (!hasDoc && !hasRecord) {
      console.warn(
        "InsertCommand validation failed. Expected 'document' or 'record' object."
      );
      return false;
    }
    // If SQL-like, ensure table/collection name is present
    const requiresTable = !!(
      (this.config as any).table || (this.config as any).collection
    );
    if (!requiresTable) {
      console.warn(
        "InsertCommand validation warning: missing 'table' or 'collection'. Some connectors require it."
      );
    }
    return true;
  }
}
