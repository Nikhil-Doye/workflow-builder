import { ErrorContext } from "../types/tools";

/**
 * Utility functions for enhanced error handling and debugging
 */
export class ErrorReportingUtils {
  /**
   * Format error context for user-friendly display
   */
  static formatErrorForUser(errorContext: ErrorContext): string {
    const lines: string[] = [];

    lines.push(`❌ Error occurred during ${errorContext.stage}`);

    if (errorContext.toolName) {
      lines.push(`🔧 Tool: ${errorContext.toolName}`);
    }

    lines.push(`📅 Time: ${new Date(errorContext.timestamp).toLocaleString()}`);
    lines.push(`🆔 Session: ${errorContext.sessionId}`);

    if (errorContext.suggestions && errorContext.suggestions.length > 0) {
      lines.push("\n💡 Suggestions:");
      errorContext.suggestions.forEach((suggestion, index) => {
        lines.push(`   ${index + 1}. ${suggestion}`);
      });
    }

    if (
      errorContext.partialResults &&
      Object.keys(errorContext.partialResults).length > 0
    ) {
      lines.push("\n📊 Partial Results Available:");
      Object.keys(errorContext.partialResults).forEach((key) => {
        lines.push(`   • ${key}: ${typeof errorContext.partialResults![key]}`);
      });
    }

    return lines.join("\n");
  }

  /**
   * Format error context for developer debugging
   */
  static formatErrorForDeveloper(errorContext: ErrorContext): string {
    return JSON.stringify(
      {
        stage: errorContext.stage,
        toolName: errorContext.toolName,
        errorType: errorContext.errorType,
        inputParameters: errorContext.inputParameters,
        partialResults: errorContext.partialResults,
        timestamp: errorContext.timestamp,
        sessionId: errorContext.sessionId,
        userInput: errorContext.userInput,
        stackTrace: errorContext.stackTrace,
        suggestions: errorContext.suggestions,
      },
      null,
      2
    );
  }

  /**
   * Check if error is recoverable based on context
   */
  static isRecoverableError(errorContext: ErrorContext): boolean {
    const recoverableTypes = ["cache_error", "validation_error"];
    return recoverableTypes.includes(errorContext.errorType);
  }

  /**
   * Get retry recommendation based on error type
   */
  static getRetryRecommendation(errorContext: ErrorContext): {
    shouldRetry: boolean;
    delayMs: number;
    reason: string;
  } {
    switch (errorContext.errorType) {
      case "cache_error":
        return {
          shouldRetry: true,
          delayMs: 0,
          reason: "Cache error is non-critical",
        };

      case "llm_error":
        return {
          shouldRetry: true,
          delayMs: 2000,
          reason: "LLM service may be temporarily unavailable",
        };

      case "tool_execution_failure":
        return {
          shouldRetry: true,
          delayMs: 1000,
          reason: "Tool execution may succeed on retry",
        };

      case "tool_registry_miss":
        return {
          shouldRetry: false,
          delayMs: 0,
          reason: "Tool registration issue requires system fix",
        };

      case "validation_error":
        return {
          shouldRetry: false,
          delayMs: 0,
          reason: "Validation error requires user input correction",
        };

      default:
        return {
          shouldRetry: true,
          delayMs: 5000,
          reason: "Unknown error - retry with delay",
        };
    }
  }

  /**
   * Generate error report for support team
   */
  static generateSupportReport(errorContext: ErrorContext): {
    summary: string;
    technicalDetails: any;
    userImpact: string;
    recommendedActions: string[];
  } {
    const summary = `Error in ${errorContext.stage} during ${errorContext.errorType}`;

    const technicalDetails = {
      stage: errorContext.stage,
      toolName: errorContext.toolName,
      errorType: errorContext.errorType,
      timestamp: errorContext.timestamp,
      sessionId: errorContext.sessionId,
      stackTrace: errorContext.stackTrace,
    };

    let userImpact = "Workflow generation failed";
    if (
      errorContext.partialResults &&
      Object.keys(errorContext.partialResults).length > 0
    ) {
      userImpact =
        "Partial workflow generated - some steps completed successfully";
    }

    const recommendedActions = [
      ...(errorContext.suggestions || []),
      "Check system logs for additional context",
      "Verify external service availability",
    ];

    return {
      summary,
      technicalDetails,
      userImpact,
      recommendedActions,
    };
  }
}
