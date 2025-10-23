export type DatabaseOperation =
  | "query"
  | "insert"
  | "update"
  | "delete"
  | "aggregate"
  | "transaction";

export interface DatabaseConfig {
  // Operation selection
  operation: DatabaseOperation;

  // Connection
  connectionId: string;

  // Query operation
  query?: string;
  parameters?: Record<string, any>;

  // Insert operation
  table?: string;
  data?: Record<string, any> | Record<string, any>[];
  columns?: string[];
  values?: any[][];
  onConflict?: "ignore" | "update" | "error";

  // Update operation
  updateTable?: string;
  setClause?: Record<string, any>;
  whereClause?: Record<string, any>;
  whereCondition?: string;
  whereParameters?: Record<string, any>;
  updateLimit?: number;

  // Delete operation
  deleteTable?: string;
  deleteWhereClause?: Record<string, any>;
  deleteWhereCondition?: string;
  deleteWhereParameters?: Record<string, any>;
  deleteLimit?: number;

  // Aggregate operation
  aggregateTable?: string;
  aggregateFunction?: "count" | "sum" | "avg" | "min" | "max";
  aggregateColumn?: string;
  groupBy?: string[];
  havingClause?: Record<string, any>;

  // Transaction operation
  transactionQueries?: Array<{
    type: DatabaseOperation;
    config: Record<string, any>;
  }>;
  rollbackOnError?: boolean;

  // Common options
  limit?: number;
  offset?: number;
  orderBy?: Array<{
    column: string;
    direction: "ASC" | "DESC";
  }>;

  // Advanced options
  useTransaction?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

export interface DatabaseResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    operation: DatabaseOperation;
    rowsAffected?: number;
    executionTime?: number;
    connectionId?: string;
  };
}
