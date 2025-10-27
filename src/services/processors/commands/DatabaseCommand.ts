import { ConnectorResult } from "../../../connectors/base/BaseConnector";

/**
 * Base interface for all database commands
 */
export interface DatabaseCommand {
  /**
   * Execute the command against the database
   * @param connector - The database connector instance
   * @returns Promise<ConnectorResult> - The result of the command execution
   */
  execute(connector: any): Promise<ConnectorResult>;

  /**
   * Validate the command parameters before execution
   * @returns boolean - Whether the command is valid
   */
  validate(): boolean;

  /**
   * Get the operation type for logging and debugging
   * @returns string - The operation type
   */
  getOperationType(): string;

  /**
   * Get a human-readable description of the command
   * @returns string - Command description
   */
  getDescription(): string;
}

/**
 * Base class for database commands with common functionality
 */
export abstract class BaseDatabaseCommand implements DatabaseCommand {
  protected config: Record<string, any>;

  constructor(config: Record<string, any>) {
    this.config = config;
  }

  abstract execute(connector: any): Promise<ConnectorResult>;
  abstract getOperationType(): string;
  abstract getDescription(): string;

  validate(): boolean {
    return this.config != null && typeof this.config === "object";
  }

  /**
   * Helper method to safely parse JSON parameters
   */
  protected parseJsonParam(
    param: string | undefined,
    defaultValue: any = {}
  ): any {
    if (!param) return defaultValue;
    try {
      return JSON.parse(param);
    } catch (error) {
      console.warn(`Failed to parse JSON parameter: ${param}`, error);
      return defaultValue;
    }
  }

  /**
   * Runtime type guard utilities to enforce stronger config structures.
   * These do not replace compile-time types but provide robust validation
   * at runtime to prevent misconfiguration from propagating.
   */
  protected hasString(config: any, key: string): config is Record<string, any> {
    return (
      config && typeof config[key] === "string" && config[key].trim() !== ""
    );
  }

  protected hasObject(config: any, key: string): boolean {
    return (
      config &&
      typeof config[key] === "object" &&
      config[key] !== null &&
      !Array.isArray(config[key])
    );
  }

  protected ensureKeys(
    config: any,
    keys: Array<{ key: string; type: "string" | "object" }>
  ): { ok: boolean; missing: string[] } {
    const missing: string[] = [];
    for (const { key, type } of keys) {
      if (type === "string" && !this.hasString(config, key)) missing.push(key);
      if (type === "object" && !this.hasObject(config, key)) missing.push(key);
    }
    return { ok: missing.length === 0, missing };
  }

  /**
   * Helper method to create a standardized result
   */
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
      metadata: {
        operation: this.getOperationType(),
        ...metadata,
      },
    };
  }
}

/**
 * Command execution context for additional metadata
 */
export interface CommandExecutionContext {
  connectionId: string;
  nodeType: string;
  executionId?: string;
  userId?: string;
  timestamp?: Date;
}

/**
 * Result of command execution with additional context
 */
export interface CommandExecutionResult extends ConnectorResult {
  operation: string;
  description: string;
  executionTime: number;
  context?: CommandExecutionContext;
}
