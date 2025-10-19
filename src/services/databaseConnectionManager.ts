import { MongoConnector } from "../connectors/database/MongoConnector";
import { MySQLConnector } from "../connectors/database/MySQLConnector";
import { PostgresConnector } from "../connectors/database/PostgresConnector";
import { ConnectorRegistry } from "../connectors/base/ConnectorRegistry";

export interface DatabaseConnection {
  id: string;
  name: string;
  type: "mongodb" | "mysql" | "postgresql";
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  connectionString?: string;
  ssl?: boolean;
  status: "connected" | "disconnected" | "error";
  lastTested?: Date;
  error?: string;
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
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConnection: DatabaseConnection = {
      ...connection,
      id,
      status: "disconnected",
    };

    this.connections.set(id, newConnection);
    this.saveConnections();
    return id;
  }

  async updateConnection(
    id: string,
    updates: Partial<DatabaseConnection>
  ): Promise<boolean> {
    const connection = this.connections.get(id);
    if (!connection) return false;

    const updatedConnection = { ...connection, ...updates };
    this.connections.set(id, updatedConnection);
    this.saveConnections();
    return true;
  }

  async deleteConnection(id: string): Promise<boolean> {
    const connection = this.connections.get(id);
    if (!connection) return false;

    // Disconnect if connected
    if (connection.status === "connected") {
      await this.disconnect(id);
    }

    this.connections.delete(id);
    this.saveConnections();
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
    const connection = this.connections.get(id);
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
    const connection = this.connections.get(id);
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
    const config = {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      credentials: {
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        connectionString: connection.connectionString,
        ssl: connection.ssl,
      },
      settings: {
        connectionTimeout: 30000,
        queryTimeout: 60000,
      },
    };

    switch (connection.type) {
      case "mongodb":
        return new MongoConnector(config as any);
      case "mysql":
        return new MySQLConnector(config as any);
      case "postgresql":
        return new PostgresConnector(config as any);
      default:
        throw new Error(`Unsupported database type: ${connection.type}`);
    }
  }

  private loadConnections(): void {
    try {
      const stored = localStorage.getItem("database_connections");
      if (stored) {
        const connections = JSON.parse(stored);
        connections.forEach((conn: DatabaseConnection) => {
          this.connections.set(conn.id, { ...conn, status: "disconnected" });
        });
      }
    } catch (error) {
      console.error("Error loading connections:", error);
    }
  }

  private saveConnections(): void {
    try {
      const connections = Array.from(this.connections.values()).map((conn) => ({
        ...conn,
        status: "disconnected", // Don't persist connection status
      }));
      localStorage.setItem("database_connections", JSON.stringify(connections));
    } catch (error) {
      console.error("Error saving connections:", error);
    }
  }
}

export const databaseConnectionManager = new DatabaseConnectionManager();
