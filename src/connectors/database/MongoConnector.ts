import {
  BaseConnector,
  ConnectorConfig,
  ConnectorResult,
} from "../base/BaseConnector";

export interface MongoConfig extends ConnectorConfig {
  credentials: {
    connectionString: string;
    database: string;
    username?: string;
    password?: string;
  };
  settings: {
    connectionTimeout?: number;
    queryTimeout?: number;
    maxPoolSize?: number;
  };
}

export class MongoConnector extends BaseConnector {
  private connection: any = null;

  async connect(): Promise<boolean> {
    try {
      if (!this.validateConfig()) {
        throw new Error("Invalid MongoDB configuration");
      }

      // In a real implementation, you would use MongoDB client like 'mongodb'
      // For now, we'll simulate the connection
      const { connectionString, database } = this.config
        .credentials as MongoConfig["credentials"];

      // Simulate connection validation
      if (!connectionString || !database) {
        throw new Error("Missing required MongoDB credentials");
      }

      // In a real implementation:
      // const { MongoClient } = require('mongodb');
      // this.connection = new MongoClient(connectionString);
      // await this.connection.connect();

      this.connection = { connected: true, database };
      return true;
    } catch (error) {
      console.error("MongoDB connection failed:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        // In a real implementation:
        // await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      console.error("MongoDB disconnection failed:", error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.execute("ping", {});
      return result.success;
    } catch (error) {
      return false;
    }
  }

  async execute(operation: string, params: any = {}): Promise<ConnectorResult> {
    const startTime = Date.now();

    try {
      if (!this.connection) {
        throw new Error("Not connected to MongoDB database");
      }

      const db = this.connection.db(this.config.credentials.database);
      const collection = db.collection(params.collection || "default");

      let result;
      switch (operation) {
        case "ping":
          result = await db.admin().ping();
          break;
        case "find":
          result = await collection.find(params.query || {}).toArray();
          break;
        case "insertOne":
          result = await collection.insertOne(params.document);
          break;
        case "updateOne":
          result = await collection.updateOne(params.filter, params.update);
          break;
        case "deleteOne":
          result = await collection.deleteOne(params.filter);
          break;
        case "aggregate":
          result = await collection.aggregate(params.pipeline || []).toArray();
          break;
        case "insertMany":
          result = await collection.insertMany(params.documents || []);
          break;
        case "updateMany":
          result = await collection.updateMany(params.filter, params.update);
          break;
        case "deleteMany":
          result = await collection.deleteMany(params.filter);
          break;
        case "count":
          result = await collection.countDocuments(params.query || {});
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return this.createResult(true, result, undefined, {
        executionTime: Date.now() - startTime,
        rowsAffected: Array.isArray(result)
          ? result.length
          : (result as any)?.acknowledged
          ? (result as any).insertedCount ||
            (result as any).modifiedCount ||
            (result as any).deletedCount ||
            1
          : 0,
        queryTime: Date.now() - startTime,
      });
    } catch (error) {
      return this.createResult(
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
        { executionTime: Date.now() - startTime }
      );
    }
  }

  // Transaction support
  async beginTransaction(isolationLevel?: string): Promise<void> {
    if (!this.connection) {
      throw new Error("Not connected to MongoDB database");
    }

    const session = this.connection.startSession();
    session.startTransaction();
    this.transactionActive = true;
    // Store session for commit/rollback
    (this as any).currentSession = session;
  }

  async commit(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error("No active transaction");
    }

    const session = (this as any).currentSession;
    if (session) {
      await session.commitTransaction();
      await session.endSession();
      this.transactionActive = false;
      (this as any).currentSession = null;
    }
  }

  async rollback(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error("No active transaction");
    }

    const session = (this as any).currentSession;
    if (session) {
      await session.abortTransaction();
      await session.endSession();
      this.transactionActive = false;
      (this as any).currentSession = null;
    }
  }

  supportsTransactions(): boolean {
    return true;
  }

  protected getSupportedOperations(): string[] {
    return [
      "query",
      "find",
      "insert",
      "insertOne",
      "insertMany",
      "update",
      "updateOne",
      "updateMany",
      "delete",
      "deleteOne",
      "deleteMany",
      "aggregate",
      "count",
      "ping",
    ];
  }

  async getCollectionSchema(collectionName: string): Promise<ConnectorResult> {
    // MongoDB doesn't have a fixed schema, but we can sample documents
    const sampleQuery = {
      operation: "find",
      params: {
        collection: collectionName,
        query: {},
        limit: 10,
      },
    };
    return this.execute(sampleQuery.operation, sampleQuery.params);
  }

  async listCollections(): Promise<ConnectorResult> {
    const db = this.connection.db(this.config.credentials.database);
    const collections = await db.listCollections().toArray();
    return this.createResult(true, collections);
  }
}
