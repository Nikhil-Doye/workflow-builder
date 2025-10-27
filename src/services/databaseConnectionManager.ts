import { MongoConnector } from "../connectors/database/MongoConnector";
import { MySQLConnector } from "../connectors/database/MySQLConnector";
import { PostgresConnector } from "../connectors/database/PostgresConnector";
import { ConnectorRegistry } from "../connectors/base/ConnectorRegistry";
import { secureCredentialManager } from "./secureCredentialManager";

export interface DatabaseConnection {
  id: string;
  name: string;
  type: "mongodb" | "mysql" | "postgresql";
  host: string;
  port: number;
  database: string;
  username?: string;
  // SECURITY: Never store plaintext passwords - use credential IDs instead
  password?: string; // For backward compatibility (will be migrated)
  passwordCredentialId?: string; // Secure credential ID
  connectionString?: string; // For backward compatibility (will be migrated)
  connectionStringCredentialId?: string; // Secure credential ID
  ssl?: boolean;
  status: "connected" | "disconnected" | "error";
  lastTested?: Date;
  error?: string;
  // Security metadata
  credentialsEncrypted?: boolean;
  lastCredentialUpdate?: Date;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  executionTime: number;
  details?: any;
}

class DatabaseConnectionManager {
  private connections: Map<string, DatabaseConnection> = new Map();
  private connectors: Map<string, any> = new Map();
  private registry = ConnectorRegistry.getInstance();

  constructor() {
    this.loadConnections();
  }

  // Connection Management
  async addConnection(
    connection: Omit<DatabaseConnection, "id" | "status">
  ): Promise<string> {
    // Validate credentials before creating the connection
    this.validateCredentials(connection as DatabaseConnection);

    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // SECURITY: Store sensitive credentials securely
    const secureConnection = await this.secureCredentials(connection, id);

    const newConnection: DatabaseConnection = {
      ...secureConnection,
      id,
      status: "disconnected",
      credentialsEncrypted: true,
      lastCredentialUpdate: new Date(),
    };

    this.connections.set(id, newConnection);
    await this.saveConnections();
    return id;
  }

  /**
   * SECURITY: Store sensitive credentials using encryption
   */
  private async secureCredentials(
    connection: Omit<DatabaseConnection, "id" | "status">,
    connectionId: string
  ): Promise<Omit<DatabaseConnection, "id" | "status">> {
    const secured = { ...connection };

    // Secure password if present
    if (connection.password) {
      const credId = await secureCredentialManager.storeCredential(
        connectionId,
        "password",
        connection.password,
        false // Session-only for maximum security
      );
      secured.passwordCredentialId = credId;
      // Remove plaintext password
      delete secured.password;
    }

    // Secure connection string if present
    if (connection.connectionString) {
      const credId = await secureCredentialManager.storeCredential(
        connectionId,
        "connectionString",
        connection.connectionString,
        false // Session-only for maximum security
      );
      secured.connectionStringCredentialId = credId;
      // Remove plaintext connection string
      delete secured.connectionString;
    }

    return secured;
  }

  /**
   * SECURITY: Retrieve decrypted credential securely
   */
  private async getSecureCredential(
    credentialId: string
  ): Promise<string | null> {
    return await secureCredentialManager.getCredential(credentialId);
  }

  /**
   * Get connection with decrypted credentials (use only when needed)
   */
  async getConnectionWithCredentials(
    id: string
  ): Promise<DatabaseConnection | null> {
    const connection = this.connections.get(id);
    if (!connection) return null;

    const decrypted = { ...connection };

    // Decrypt password if stored securely
    if (connection.passwordCredentialId) {
      const password = await this.getSecureCredential(
        connection.passwordCredentialId
      );
      if (password) {
        decrypted.password = password;
      }
    }

    // Decrypt connection string if stored securely
    if (connection.connectionStringCredentialId) {
      const connectionString = await this.getSecureCredential(
        connection.connectionStringCredentialId
      );
      if (connectionString) {
        decrypted.connectionString = connectionString;
      }
    }

    return decrypted;
  }

  /**
   * Get connection with masked credentials (safe for display)
   */
  getConnectionWithMaskedCredentials(id: string): DatabaseConnection | null {
    const connection = this.connections.get(id);
    if (!connection) return null;

    const masked = { ...connection };

    // Mask password
    if (connection.passwordCredentialId || connection.password) {
      masked.password = secureCredentialManager.maskCredential(
        "password",
        "password"
      );
    }

    // Mask connection string
    if (
      connection.connectionStringCredentialId ||
      connection.connectionString
    ) {
      masked.connectionString = secureCredentialManager.maskCredential(
        masked.connectionString || "connectionString",
        "connectionString"
      );
    }

    return masked;
  }

  async updateConnection(
    id: string,
    updates: Partial<DatabaseConnection>
  ): Promise<boolean> {
    const connection = this.connections.get(id);
    if (!connection) return false;

    // SECURITY: Handle credential updates securely
    const secureUpdates = await this.secureCredentials(updates, id);
    const updatedConnection = { ...connection, ...secureUpdates };

    // Validate credentials if connection details are being updated
    if (this.hasConnectionDetailsChanged(updates)) {
      this.validateCredentials(updatedConnection);
    }

    // Update credential metadata
    if (updates.password || updates.connectionString) {
      updatedConnection.lastCredentialUpdate = new Date();
      updatedConnection.credentialsEncrypted = true;
    }

    this.connections.set(id, updatedConnection);
    await this.saveConnections();
    return true;
  }

  async deleteConnection(id: string): Promise<boolean> {
    const connection = this.connections.get(id);
    if (!connection) return false;

    // Disconnect if connected
    if (connection.status === "connected") {
      await this.disconnect(id);
    }

    // SECURITY: Delete associated credentials
    if (connection.passwordCredentialId) {
      await secureCredentialManager.deleteCredential(
        connection.passwordCredentialId
      );
    }
    if (connection.connectionStringCredentialId) {
      await secureCredentialManager.deleteCredential(
        connection.connectionStringCredentialId
      );
    }

    this.connections.delete(id);
    await this.saveConnections();
    return true;
  }

  getConnection(id: string): DatabaseConnection | undefined {
    return this.connections.get(id);
  }

  getAllConnections(): DatabaseConnection[] {
    return Array.from(this.connections.values());
  }

  getConnectionsByType(type: string): DatabaseConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.type === type
    );
  }

  // Connection Testing & Management
  async testConnection(id: string): Promise<ConnectionTestResult> {
    // SECURITY: Get connection with decrypted credentials
    const connection = await this.getConnectionWithCredentials(id);
    if (!connection) {
      return {
        success: false,
        message: "Connection not found",
        executionTime: 0,
      };
    }

    const startTime = Date.now();

    try {
      const connector = this.createConnector(connection);
      const isConnected = await connector.testConnection();

      const executionTime = Date.now() - startTime;

      if (isConnected) {
        await this.updateConnection(id, {
          status: "connected",
          lastTested: new Date(),
          error: undefined,
        });

        return {
          success: true,
          message: "Connection successful",
          executionTime,
        };
      } else {
        await this.updateConnection(id, {
          status: "error",
          lastTested: new Date(),
          error: "Connection test failed",
        });

        return {
          success: false,
          message: "Connection test failed",
          executionTime,
        };
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await this.updateConnection(id, {
        status: "error",
        lastTested: new Date(),
        error: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
        executionTime,
      };
    }
  }

  async connect(id: string): Promise<boolean> {
    // SECURITY: Get connection with decrypted credentials
    const connection = await this.getConnectionWithCredentials(id);
    if (!connection) return false;

    try {
      const connector = this.createConnector(connection);
      const isConnected = await connector.connect();

      if (isConnected) {
        this.connectors.set(id, connector);
        await this.updateConnection(id, { status: "connected" });
        return true;
      } else {
        await this.updateConnection(id, { status: "error" });
        return false;
      }
    } catch (error) {
      await this.updateConnection(id, {
        status: "error",
        error: error instanceof Error ? error.message : "Connection failed",
      });
      return false;
    }
  }

  async disconnect(id: string): Promise<boolean> {
    const connector = this.connectors.get(id);
    if (connector) {
      try {
        await connector.disconnect();
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
      this.connectors.delete(id);
    }

    await this.updateConnection(id, { status: "disconnected" });
    return true;
  }

  getConnector(id: string): any {
    return this.connectors.get(id);
  }

  // Schema and Data Operations
  async getSchema(id: string, tableName?: string): Promise<any> {
    const connector = this.connectors.get(id);
    if (!connector) {
      throw new Error("Connection not established");
    }

    if (connector.getTableSchema) {
      return await connector.getTableSchema(tableName || "default");
    } else if (connector.getCollectionSchema) {
      return await connector.getCollectionSchema(tableName || "default");
    }

    throw new Error("Schema operation not supported for this connection type");
  }

  async listTables(id: string): Promise<any> {
    const connector = this.connectors.get(id);
    if (!connector) {
      throw new Error("Connection not established");
    }

    if (connector.listTables) {
      return await connector.listTables();
    } else if (connector.listCollections) {
      return await connector.listCollections();
    }

    throw new Error("Table listing not supported for this connection type");
  }

  async executeQuery(id: string, query: string, params?: any[]): Promise<any> {
    const connector = this.connectors.get(id);
    if (!connector) {
      throw new Error("Connection not established");
    }

    return await connector.execute(query, params);
  }

  // Private Methods
  private createConnector(connection: DatabaseConnection): any {
    // Validate credentials based on database type
    this.validateCredentials(connection);

    const baseConfig = {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      settings: {
        connectionTimeout: 30000,
        queryTimeout: 60000,
      },
    };

    switch (connection.type) {
      case "mongodb":
        return new MongoConnector({
          ...baseConfig,
          credentials: {
            connectionString: connection.connectionString!,
            database: connection.database,
            username: connection.username,
            password: connection.password,
          },
        } as any);
      case "mysql":
        return new MySQLConnector({
          ...baseConfig,
          credentials: {
            host: connection.host,
            port: connection.port,
            database: connection.database,
            username: connection.username!,
            password: connection.password!,
            ssl: connection.ssl,
          },
        } as any);
      case "postgresql":
        return new PostgresConnector({
          ...baseConfig,
          credentials: {
            host: connection.host,
            port: connection.port,
            database: connection.database,
            username: connection.username!,
            password: connection.password!,
            ssl: connection.ssl,
          },
        } as any);
      default:
        throw new Error(`Unsupported database type: ${connection.type}`);
    }
  }

  private validateCredentials(connection: DatabaseConnection): void {
    switch (connection.type) {
      case "mongodb":
        this.validateMongoCredentials(connection);
        break;
      case "mysql":
        this.validateMySQLCredentials(connection);
        break;
      case "postgresql":
        this.validatePostgresCredentials(connection);
        break;
      default:
        throw new Error(`Unsupported database type: ${connection.type}`);
    }
  }

  private validateMongoCredentials(connection: DatabaseConnection): void {
    const errors: string[] = [];

    // MongoDB primarily uses connection strings
    if (!connection.connectionString) {
      errors.push(
        "MongoDB requires a connection string (e.g., 'mongodb://localhost:27017' or 'mongodb+srv://...')"
      );
    }

    // Database name is required
    if (!connection.database) {
      errors.push("Database name is required for MongoDB connections");
    }

    // Validate connection string format if provided
    if (connection.connectionString) {
      if (!this.isValidMongoConnectionString(connection.connectionString)) {
        errors.push(
          "Invalid MongoDB connection string format. Expected format: 'mongodb://host:port' or 'mongodb+srv://cluster'"
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `MongoDB connection validation failed:\n${errors.join("\n")}`
      );
    }
  }

  private validateMySQLCredentials(connection: DatabaseConnection): void {
    const errors: string[] = [];

    if (!connection.host) {
      errors.push("Host is required for MySQL connections");
    }

    if (!connection.port || connection.port <= 0 || connection.port > 65535) {
      errors.push(
        "Valid port number (1-65535) is required for MySQL connections"
      );
    }

    if (!connection.database) {
      errors.push("Database name is required for MySQL connections");
    }

    if (!connection.username) {
      errors.push("Username is required for MySQL connections");
    }

    if (!connection.password) {
      errors.push("Password is required for MySQL connections");
    }

    if (errors.length > 0) {
      throw new Error(
        `MySQL connection validation failed:\n${errors.join("\n")}`
      );
    }
  }

  private validatePostgresCredentials(connection: DatabaseConnection): void {
    const errors: string[] = [];

    if (!connection.host) {
      errors.push("Host is required for PostgreSQL connections");
    }

    if (!connection.port || connection.port <= 0 || connection.port > 65535) {
      errors.push(
        "Valid port number (1-65535) is required for PostgreSQL connections"
      );
    }

    if (!connection.database) {
      errors.push("Database name is required for PostgreSQL connections");
    }

    if (!connection.username) {
      errors.push("Username is required for PostgreSQL connections");
    }

    if (!connection.password) {
      errors.push("Password is required for PostgreSQL connections");
    }

    if (errors.length > 0) {
      throw new Error(
        `PostgreSQL connection validation failed:\n${errors.join("\n")}`
      );
    }
  }

  private isValidMongoConnectionString(connectionString: string): boolean {
    // Basic validation for MongoDB connection strings
    const mongoPattern = /^mongodb(\+srv)?:\/\//;
    return mongoPattern.test(connectionString);
  }

  private hasConnectionDetailsChanged(
    updates: Partial<DatabaseConnection>
  ): boolean {
    const connectionFields = [
      "type",
      "host",
      "port",
      "database",
      "username",
      "password",
      "connectionString",
      "ssl",
    ];
    return connectionFields.some((field) => field in updates);
  }

  private loadConnections(): void {
    try {
      const stored = localStorage.getItem("database_connections");
      if (stored) {
        const connections = JSON.parse(stored);
        connections.forEach((conn: DatabaseConnection) => {
          // SECURITY: Migrate old plaintext credentials to secure storage
          this.migrateConnectionCredentials(conn);
          this.connections.set(conn.id, { ...conn, status: "disconnected" });
        });
      }
    } catch (error) {
      console.error("Error loading connections:", error);
    }
  }

  /**
   * SECURITY: Migrate old plaintext credentials to secure encrypted storage
   */
  private async migrateConnectionCredentials(
    connection: DatabaseConnection
  ): Promise<void> {
    let needsMigration = false;

    // Migrate plaintext password
    if (connection.password && !connection.passwordCredentialId) {
      const credId = await secureCredentialManager.storeCredential(
        connection.id,
        "password",
        connection.password,
        false // Session-only for security
      );
      connection.passwordCredentialId = credId;
      delete connection.password; // Remove plaintext
      needsMigration = true;
    }

    // Migrate plaintext connection string
    if (
      connection.connectionString &&
      !connection.connectionStringCredentialId
    ) {
      const credId = await secureCredentialManager.storeCredential(
        connection.id,
        "connectionString",
        connection.connectionString,
        false // Session-only for security
      );
      connection.connectionStringCredentialId = credId;
      delete connection.connectionString; // Remove plaintext
      needsMigration = true;
    }

    if (needsMigration) {
      connection.credentialsEncrypted = true;
      connection.lastCredentialUpdate = new Date();
      console.log(`Migrated credentials for connection ${connection.id}`);
    }
  }

  private async saveConnections(): Promise<void> {
    try {
      const connections = Array.from(this.connections.values()).map((conn) => {
        // SECURITY: Never save plaintext credentials
        const sanitized = {
          ...conn,
          status: "disconnected", // Don't persist connection status
          password: undefined, // Never save plaintext password
          connectionString: undefined, // Never save plaintext connection string
        };

        // Remove undefined fields for cleaner storage
        Object.keys(sanitized).forEach((key) => {
          if (sanitized[key as keyof typeof sanitized] === undefined) {
            delete sanitized[key as keyof typeof sanitized];
          }
        });

        return sanitized;
      });

      localStorage.setItem("database_connections", JSON.stringify(connections));
    } catch (error) {
      console.error("Error saving connections:", error);
    }
  }
}

export const databaseConnectionManager = new DatabaseConnectionManager();
