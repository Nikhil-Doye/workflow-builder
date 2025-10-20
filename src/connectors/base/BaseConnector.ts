export interface ConnectorConfig {
  id: string;
  name: string;
  type: string;
  credentials: Record<string, any>;
  settings: Record<string, any>;
}

export interface ConnectorResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    rowsAffected?: number;
    queryTime?: number;
  };
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected transactionActive: boolean = false;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract execute(query: string, params?: any[]): Promise<ConnectorResult>;

  // Transaction support (optional - connectors can override)
  async beginTransaction(isolationLevel?: string): Promise<void> {
    // Default implementation - override in connectors that support transactions
    throw new Error("Transactions not supported by this connector");
  }

  async commit(): Promise<void> {
    // Default implementation - override in connectors that support transactions
    throw new Error("Transactions not supported by this connector");
  }

  async rollback(): Promise<void> {
    // Default implementation - override in connectors that support transactions
    throw new Error("Transactions not supported by this connector");
  }

  // Check if connector supports transactions
  supportsTransactions(): boolean {
    return false; // Override in connectors that support transactions
  }

  // Check if connector supports specific operation types
  supportsOperation(operationType: string): boolean {
    const supportedOperations = this.getSupportedOperations();
    return supportedOperations.includes(operationType);
  }

  // Get list of supported operations (override in connectors)
  protected getSupportedOperations(): string[] {
    return ["query", "insert", "update", "delete"];
  }

  protected validateConfig(): boolean {
    return (
      this.config.credentials && Object.keys(this.config.credentials).length > 0
    );
  }

  protected createResult(
    success: boolean,
    data?: any,
    error?: string,
    metadata?: any
  ): ConnectorResult {
    return {
      success,
      data,
      error,
      metadata,
    };
  }
}
