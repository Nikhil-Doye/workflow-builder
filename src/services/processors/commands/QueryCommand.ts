import { BaseDatabaseCommand, DatabaseCommand } from "./DatabaseCommand";
import { ConnectorResult } from "../../../connectors/base/BaseConnector";

/**
 * Command for executing raw SQL/NoSQL queries
 */
export class QueryCommand
  extends BaseDatabaseCommand
  implements DatabaseCommand
{
  execute(connector: any): Promise<ConnectorResult> {
    const query = this.config.query;
    const params = this.parseJsonParam(this.config.params, []);

    if (!query) {
      return Promise.resolve(
        this.createResult(false, undefined, "Query is required")
      );
    }

    return connector.execute(query, params);
  }

  getOperationType(): string {
    return "databaseQuery";
  }

  getDescription(): string {
    return `Execute query: ${this.config.query?.substring(0, 100) || "N/A"}...`;
  }

  validate(): boolean {
    return super.validate() && !!this.config.query;
  }
}
