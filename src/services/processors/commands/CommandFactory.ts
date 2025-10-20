import { DatabaseCommand } from "./DatabaseCommand";
import { QueryCommand } from "./QueryCommand";
import { InsertCommand } from "./InsertCommand";
import { UpdateCommand } from "./UpdateCommand";
import { DeleteCommand } from "./DeleteCommand";
import { AggregateCommand } from "./AggregateCommand";
import { TransactionCommand } from "./TransactionCommand";

/**
 * Registry for database command types
 */
export class CommandRegistry {
  private static commands: Map<
    string,
    new (config: Record<string, any>) => DatabaseCommand
  > = new Map();

  static {
    // Register default commands
    CommandRegistry.register("databaseQuery", QueryCommand);
    CommandRegistry.register("databaseInsert", InsertCommand);
    CommandRegistry.register("databaseUpdate", UpdateCommand);
    CommandRegistry.register("databaseDelete", DeleteCommand);
    CommandRegistry.register("databaseAggregate", AggregateCommand);
    CommandRegistry.register("databaseTransaction", TransactionCommand);
  }

  /**
   * Register a new command type
   */
  static register(
    operationType: string,
    commandClass: new (config: Record<string, any>) => DatabaseCommand
  ): void {
    this.commands.set(operationType, commandClass);
  }

  /**
   * Get a command class by operation type
   */
  static getCommandClass(
    operationType: string
  ): new (config: Record<string, any>) => DatabaseCommand | undefined {
    return this.commands.get(operationType);
  }

  /**
   * Get all registered command types
   */
  static getRegisteredTypes(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * Check if a command type is registered
   */
  static hasCommand(operationType: string): boolean {
    return this.commands.has(operationType);
  }
}

/**
 * Factory for creating database commands
 */
export class CommandFactory {
  /**
   * Create a command instance based on operation type and configuration
   */
  static createCommand(
    operationType: string,
    config: Record<string, any>
  ): DatabaseCommand {
    const CommandClass = CommandRegistry.getCommandClass(operationType);

    if (!CommandClass) {
      throw new Error(
        `Unsupported database operation: ${operationType}. Available operations: ${CommandRegistry.getRegisteredTypes().join(
          ", "
        )}`
      );
    }

    return new CommandClass(config);
  }

  /**
   * Create a command from execution context
   */
  static createCommandFromContext(context: any): DatabaseCommand {
    const { nodeType, config } = context;
    return this.createCommand(nodeType, config);
  }

  /**
   * Validate that a command can be created with the given configuration
   */
  static validateCommand(
    operationType: string,
    config: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!CommandRegistry.hasCommand(operationType)) {
      errors.push(`Unsupported operation type: ${operationType}`);
      return { valid: false, errors };
    }

    try {
      const command = this.createCommand(operationType, config);
      if (!command.validate()) {
        errors.push(`Invalid configuration for ${operationType}`);
      }
    } catch (error) {
      errors.push(
        `Failed to create command: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get available command types with descriptions
   */
  static getAvailableCommands(): Array<{ type: string; description: string }> {
    return CommandRegistry.getRegisteredTypes().map((type) => {
      try {
        const command = this.createCommand(type, {});
        return {
          type,
          description: command.getDescription(),
        };
      } catch {
        return {
          type,
          description: `Command type: ${type}`,
        };
      }
    });
  }
}
