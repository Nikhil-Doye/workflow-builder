import {
  Tool,
  ToolResult,
  ToolValidationResult,
  ToolParameter,
} from "../../types/tools";

export abstract class BaseTool implements Tool {
  abstract name: string;
  abstract description: string;
  abstract parameters: ToolParameter[];

  abstract execute(params: Record<string, any>): Promise<ToolResult>;

  validate(params: Record<string, any>): ToolValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required parameters
    for (const param of this.parameters) {
      if (param.required && !(param.name in params)) {
        errors.push(`Missing required parameter: ${param.name}`);
      }
    }

    // Validate parameter types
    for (const param of this.parameters) {
      if (param.name in params) {
        const value = params[param.name];
        const type = this.getParameterType(value);

        if (type !== param.type) {
          errors.push(
            `Parameter ${param.name} should be of type ${param.type}, got ${type}`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private getParameterType(value: any): string {
    if (value === null || value === undefined) return "undefined";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "object";
    return typeof value;
  }

  protected createResult(
    success: boolean,
    data?: any,
    error?: string,
    metadata?: any
  ): ToolResult {
    return {
      success,
      data,
      error,
      metadata: {
        executionTime: 0,
        ...metadata,
      },
    };
  }

  protected async measureExecution<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now();
    const result = await operation();
    const executionTime = Date.now() - startTime;
    return { result, executionTime };
  }
}
