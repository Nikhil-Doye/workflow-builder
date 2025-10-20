import { databaseConnectionManager } from '../../services/databaseConnectionManager';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock connector classes
jest.mock('../../connectors/database/MongoConnector', () => ({
  MongoConnector: jest.fn().mockImplementation(() => ({
    testConnection: jest.fn().mockResolvedValue(true),
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../connectors/database/MySQLConnector', () => ({
  MySQLConnector: jest.fn().mockImplementation(() => ({
    testConnection: jest.fn().mockResolvedValue(true),
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../connectors/database/PostgresConnector', () => ({
  PostgresConnector: jest.fn().mockImplementation(() => ({
    testConnection: jest.fn().mockResolvedValue(true),
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('DatabaseConnectionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Connection Management', () => {
    it('should add a MongoDB connection', async () => {
      const connectionData = {
        name: 'Test MongoDB',
        type: 'mongodb' as const,
        host: 'localhost',
        port: 27017,
        database: 'testdb',
        connectionString: 'mongodb://localhost:27017/testdb',
      };

      const connectionId = await databaseConnectionManager.addConnection(connectionData);

      expect(connectionId).toBeDefined();
      expect(connectionId).toMatch(/^conn_/);
      
      const connection = databaseConnectionManager.getConnection(connectionId);
      expect(connection).toBeDefined();
      expect(connection!.name).toBe('Test MongoDB');
      expect(connection!.type).toBe('mongodb');
    });

    it('should add a MySQL connection', async () => {
      const connectionData = {
        name: 'Test MySQL',
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'root',
        password: 'password',
      };

      const connectionId = await databaseConnectionManager.addConnection(connectionData);

      expect(connectionId).toBeDefined();
      
      const connection = databaseConnectionManager.getConnection(connectionId);
      expect(connection).toBeDefined();
      expect(connection!.name).toBe('Test MySQL');
      expect(connection!.type).toBe('mysql');
    });

    it('should add a PostgreSQL connection', async () => {
      const connectionData = {
        name: 'Test PostgreSQL',
        type: 'postgresql' as const,
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'postgres',
        password: 'password',
      };

      const connectionId = await databaseConnectionManager.addConnection(connectionData);

      expect(connectionId).toBeDefined();
      
      const connection = databaseConnectionManager.getConnection(connectionId);
      expect(connection).toBeDefined();
      expect(connection!.name).toBe('Test PostgreSQL');
      expect(connection!.type).toBe('postgresql');
    });

    it('should update a connection', async () => {
      const connectionData = {
        name: 'Test Connection',
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'root',
        password: 'password',
      };

      const connectionId = await databaseConnectionManager.addConnection(connectionData);

      const updated = await databaseConnectionManager.updateConnection(connectionId, {
        name: 'Updated Connection',
        port: 3307,
      });

      expect(updated).toBe(true);
      
      const connection = databaseConnectionManager.getConnection(connectionId);
      expect(connection!.name).toBe('Updated Connection');
      expect(connection!.port).toBe(3307);
    });

    it('should delete a connection', async () => {
      const connectionData = {
        name: 'Test Connection',
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'root',
        password: 'password',
      };

      const connectionId = await databaseConnectionManager.addConnection(connectionData);
      const deleted = await databaseConnectionManager.deleteConnection(connectionId);

      expect(deleted).toBe(true);
      expect(databaseConnectionManager.getConnection(connectionId)).toBeUndefined();
    });
  });

  describe('Credential Validation', () => {
    it('should validate MongoDB credentials', async () => {
      const invalidConnection = {
        name: 'Invalid MongoDB',
        type: 'mongodb' as const,
        host: 'localhost',
        port: 27017,
        database: 'testdb',
        // Missing connectionString
      };

      await expect(databaseConnectionManager.addConnection(invalidConnection)).rejects.toThrow(
        'MongoDB requires a connection string'
      );
    });

    it('should validate MySQL credentials', async () => {
      const invalidConnection = {
        name: 'Invalid MySQL',
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        // Missing username and password
      };

      await expect(databaseConnectionManager.addConnection(invalidConnection)).rejects.toThrow(
        'MySQL connection validation failed'
      );
    });

    it('should validate PostgreSQL credentials', async () => {
      const invalidConnection = {
        name: 'Invalid PostgreSQL',
        type: 'postgresql' as const,
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        // Missing username and password
      };

      await expect(databaseConnectionManager.addConnection(invalidConnection)).rejects.toThrow(
        'PostgreSQL connection validation failed'
      );
    });

    it('should validate port ranges', async () => {
      const invalidConnection = {
        name: 'Invalid Port',
        type: 'mysql' as const,
        host: 'localhost',
        port: 99999, // Invalid port
        database: 'testdb',
        username: 'root',
        password: 'password',
      };

      await expect(databaseConnectionManager.addConnection(invalidConnection)).rejects.toThrow(
        'Valid port number (1-65535) is required'
      );
    });

    it('should validate MongoDB connection string format', async () => {
      const invalidConnection = {
        name: 'Invalid MongoDB',
        type: 'mongodb' as const,
        host: 'localhost',
        port: 27017,
        database: 'testdb',
        connectionString: 'invalid-connection-string',
      };

      await expect(databaseConnectionManager.addConnection(invalidConnection)).rejects.toThrow(
        'Invalid MongoDB connection string format'
      );
    });
  });

  describe('Connection Testing', () => {
    it('should test a connection successfully', async () => {
      const connectionData = {
        name: 'Test Connection',
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'root',
        password: 'password',
      };

      const connectionId = await databaseConnectionManager.addConnection(connectionData);
      const result = await databaseConnectionManager.testConnection(connectionId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Connection successful');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle connection test failure', async () => {
      // Mock connector to return false for testConnection
      const { MongoConnector } = require('../../connectors/database/MongoConnector');
      MongoConnector.mockImplementation(() => ({
        testConnection: jest.fn().mockResolvedValue(false),
        connect: jest.fn().mockResolvedValue(false),
        disconnect: jest.fn().mockResolvedValue(undefined),
      }));

      const connectionData = {
        name: 'Test Connection',
        type: 'mongodb' as const,
        host: 'localhost',
        port: 27017,
        database: 'testdb',
        connectionString: 'mongodb://localhost:27017/testdb',
      };

      const connectionId = await databaseConnectionManager.addConnection(connectionData);
      const result = await databaseConnectionManager.testConnection(connectionId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection test failed');
    });

    it('should handle connection test error', async () => {
      // Mock connector to throw an error
      const { MongoConnector } = require('../../connectors/database/MongoConnector');
      MongoConnector.mockImplementation(() => ({
        testConnection: jest.fn().mockRejectedValue(new Error('Connection failed')),
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        disconnect: jest.fn().mockResolvedValue(undefined),
      }));

      const connectionData = {
        name: 'Test Connection',
        type: 'mongodb' as const,
        host: 'localhost',
        port: 27017,
        database: 'testdb',
        connectionString: 'mongodb://localhost:27017/testdb',
      };

      const connectionId = await databaseConnectionManager.addConnection(connectionData);
      const result = await databaseConnectionManager.testConnection(connectionId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection failed');
    });
  });

  describe('Connection Operations', () => {
    it('should connect to database', async () => {
      const connectionData = {
        name: 'Test Connection',
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'root',
        password: 'password',
      };

      const connectionId = await databaseConnectionManager.addConnection(connectionData);
      const connected = await databaseConnectionManager.connect(connectionId);

      expect(connected).toBe(true);
      
      const connection = databaseConnectionManager.getConnection(connectionId);
      expect(connection!.status).toBe('connected');
    });

    it('should disconnect from database', async () => {
      const connectionData = {
        name: 'Test Connection',
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'root',
        password: 'password',
      };

      const connectionId = await databaseConnectionManager.addConnection(connectionData);
      await databaseConnectionManager.connect(connectionId);
      
      const disconnected = await databaseConnectionManager.disconnect(connectionId);

      expect(disconnected).toBe(true);
      
      const connection = databaseConnectionManager.getConnection(connectionId);
      expect(connection!.status).toBe('disconnected');
    });

    it('should get connections by type', async () => {
      const mysqlConnection = {
        name: 'MySQL Connection',
        type: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'root',
        password: 'password',
      };

      const postgresConnection = {
        name: 'PostgreSQL Connection',
        type: 'postgresql' as const,
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'postgres',
        password: 'password',
      };

      await databaseConnectionManager.addConnection(mysqlConnection);
      await databaseConnectionManager.addConnection(postgresConnection);

      const mysqlConnections = databaseConnectionManager.getConnectionsByType('mysql');
      const postgresConnections = databaseConnectionManager.getConnectionsByType('postgresql');

      expect(mysqlConnections).toHaveLength(1);
      expect(postgresConnections).toHaveLength(1);
      expect(mysqlConnections[0].name).toBe('MySQL Connection');
      expect(postgresConnections[0].name).toBe('PostgreSQL Connection');
    });
  });
});
