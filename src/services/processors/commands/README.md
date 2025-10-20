# Database Command Pattern

This directory contains the implementation of a robust command pattern for database operations, replacing the fragile string-based operation routing in the original `databaseProcessor.ts`.

## Overview

The command pattern provides a clean, extensible way to handle database operations by:

1. **Encapsulating operations** in dedicated command classes
2. **Providing a factory** for command creation and registration
3. **Supporting advanced operations** like transactions, aggregation, and bulk operations
4. **Making it easy to extend** with new database operation types

## Architecture

### Core Components

- **`DatabaseCommand`** - Base interface and abstract class for all commands
- **`CommandFactory`** - Factory for creating and validating commands
- **`CommandRegistry`** - Registry for managing command types
- **Specific Commands** - Individual command implementations

### Command Types

| Command              | Description                                  | Database Support            |
| -------------------- | -------------------------------------------- | --------------------------- |
| `QueryCommand`       | Execute raw SQL/NoSQL queries                | All                         |
| `InsertCommand`      | Insert documents/records                     | All                         |
| `UpdateCommand`      | Update documents/records                     | All                         |
| `DeleteCommand`      | Delete documents/records                     | All                         |
| `AggregateCommand`   | MongoDB aggregation pipelines                | MongoDB (with SQL fallback) |
| `TransactionCommand` | Execute multiple operations in a transaction | MongoDB, MySQL, PostgreSQL  |

## Usage

### Basic Usage

```typescript
import { CommandFactory } from "./commands/CommandFactory";

// Create a command
const command = CommandFactory.createCommand("databaseQuery", {
  query: "SELECT * FROM users WHERE age > ?",
  params: [18],
});

// Execute the command
const result = await command.execute(connector);
```

### Using with Database Processor

The `databaseProcessor` now automatically uses the command pattern:

```typescript
// The processor automatically creates the appropriate command
const result = await databaseProcessor(context, plan);
```

## Extending the System

### Adding a New Command Type

1. **Create the command class**:

```typescript
import { BaseDatabaseCommand, DatabaseCommand } from "./DatabaseCommand";

export class CustomCommand extends BaseDatabaseCommand implements DatabaseCommand {
  execute(connector: any): Promise<ConnectorResult> {
    // Implementation
  }

  getOperationType(): string {
    return "customOperation";
  }

  getDescription(): string {
    return "Custom operation description";
  }

  validate(): boolean {
    return super.validate() && /* additional validation */;
  }
}
```

2. **Register the command**:

```typescript
import { CommandRegistry } from "./CommandFactory";
import { CustomCommand } from "./CustomCommand";

CommandRegistry.register("customOperation", CustomCommand);
```

3. **Use the command**:

```typescript
const command = CommandFactory.createCommand("customOperation", config);
const result = await command.execute(connector);
```

### Adding Database-Specific Operations

Commands can detect the database type and implement database-specific logic:

```typescript
execute(connector: any): Promise<ConnectorResult> {
  if (connector.constructor.name.includes('Mongo')) {
    return this.executeMongoOperation(connector);
  } else if (connector.constructor.name.includes('Postgres')) {
    return this.executePostgresOperation(connector);
  } else {
    return this.executeGenericOperation(connector);
  }
}
```

### Adding Transaction Support

Commands can participate in transactions by checking connector capabilities:

```typescript
execute(connector: any): Promise<ConnectorResult> {
  if (connector.supportsTransactions()) {
    // Use transaction-aware execution
    return this.executeWithTransaction(connector);
  } else {
    // Fallback to regular execution
    return this.executeRegular(connector);
  }
}
```

## Advanced Features

### Transaction Support

The system supports database transactions across all supported databases:

```typescript
const transactionCommand = CommandFactory.createCommand("databaseTransaction", {
  operations: [
    { type: "insert", collection: "users", document: { name: "John" } },
    {
      type: "update",
      collection: "profiles",
      filter: { userId: 123 },
      update: { status: "active" },
    },
  ],
  isolationLevel: "READ_COMMITTED",
});
```

### Aggregation Pipelines

MongoDB aggregation with SQL fallback:

```typescript
const aggregateCommand = CommandFactory.createCommand("databaseAggregate", {
  collection: "orders",
  pipeline: [
    { $match: { status: "completed" } },
    { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ],
});
```

### Bulk Operations

Execute multiple operations efficiently:

```typescript
const bulkCommand = CommandFactory.createCommand("databaseBulkOperation", {
  operations: [
    { type: "insert", collection: "logs", document: { message: "Log 1" } },
    { type: "insert", collection: "logs", document: { message: "Log 2" } },
    // ... more operations
  ],
  batchSize: 100,
});
```

## Benefits

### 1. **Extensibility**

- Easy to add new operation types
- No need to modify existing switch statements
- Database-specific optimizations

### 2. **Maintainability**

- Each command is self-contained
- Clear separation of concerns
- Easy to test individual commands

### 3. **Type Safety**

- Strong typing for command parameters
- Validation at command creation time
- Better IDE support

### 4. **Advanced Operations**

- Transaction support
- Aggregation pipelines
- Bulk operations
- Database-specific features

### 5. **Error Handling**

- Consistent error handling across commands
- Detailed error messages
- Graceful fallbacks

## Migration from Old System

The old string-based system:

```typescript
// OLD - Fragile string checking
switch (context.nodeType) {
  case "databaseInsert":
    result = await databaseConnectionManager.executeQuery(
      config.connectionId,
      "insert", // String-based operation
      [config.document ? JSON.parse(config.document) : {}]
    );
    break;
}
```

Is replaced with:

```typescript
// NEW - Command pattern
const command = CommandFactory.createCommandFromContext(context);
const result = await command.execute(connector);
```

## Testing

Commands can be easily unit tested:

```typescript
describe("InsertCommand", () => {
  it("should insert document successfully", async () => {
    const command = new InsertCommand({
      document: { name: "John", age: 30 },
      collection: "users",
    });

    const mockConnector = createMockConnector();
    const result = await command.execute(mockConnector);

    expect(result.success).toBe(true);
  });
});
```

## Future Enhancements

- **Command chaining** for complex workflows
- **Command validation** with schema validation
- **Command metrics** and performance monitoring
- **Command caching** for frequently used operations
- **Command scheduling** for delayed execution
