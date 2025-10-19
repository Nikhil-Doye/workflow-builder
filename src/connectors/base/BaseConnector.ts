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

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract execute(query: string, params?: any[]): Promise<ConnectorResult>;

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
