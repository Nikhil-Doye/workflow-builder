/**
 * API Error Handler
 * Comprehensive error handling, timeout protection, and response validation for external API calls
 */

export interface APICallOptions {
  timeout?: number; // milliseconds
  retries?: number;
  retryDelay?: number; // milliseconds
  validateResponse?: (response: any) => ValidationResult;
  operationName?: string;
  context?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface APIError {
  type: APIErrorType;
  message: string;
  userMessage: string;
  technicalDetails: string;
  isRecoverable: boolean;
  suggestedAction: string;
  statusCode?: number;
  originalError?: any;
  context?: Record<string, any>;
}

export type APIErrorType =
  | "timeout"
  | "quota_exceeded"
  | "rate_limit"
  | "authentication"
  | "invalid_request"
  | "invalid_response"
  | "network_error"
  | "server_error"
  | "validation_error"
  | "unknown";

/**
 * Wrap an API call with comprehensive error handling
 */
export async function safeAPICall<T>(
  apiCall: () => Promise<T>,
  options: APICallOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    retries = 2,
    retryDelay = 1000,
    validateResponse,
    operationName = "API call",
    context = {},
  } = options;

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      // Execute with timeout
      const result = await Promise.race([
        apiCall(),
        createTimeoutPromise<T>(timeout, operationName),
      ]);

      // Validate response if validator provided
      if (validateResponse) {
        const validation = validateResponse(result);
        if (!validation.isValid) {
          throw createAPIError({
            type: "validation_error",
            message: `Response validation failed: ${validation.errors.join(
              ", "
            )}`,
            context: { ...context, validation },
          });
        }

        // Log warnings but continue
        if (validation.warnings.length > 0) {
          console.warn(
            `API response warnings for ${operationName}:`,
            validation.warnings
          );
        }
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      attempt++;

      // Parse and classify error
      const apiError = classifyError(error, operationName, context);

      // Don't retry for non-recoverable errors
      if (!apiError.isRecoverable || attempt > retries) {
        throw enhanceError(apiError);
      }

      // Log retry attempt
      console.warn(
        `${operationName} failed (attempt ${attempt}/${
          retries + 1
        }). Retrying in ${retryDelay}ms...`,
        apiError.userMessage
      );

      // Wait before retry with exponential backoff
      await delay(retryDelay * attempt);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error("Unknown error");
}

/**
 * Create a timeout promise that rejects after specified duration
 */
function createTimeoutPromise<T>(
  timeoutMs: number,
  operationName: string
): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        createAPIError({
          type: "timeout",
          message: `${operationName} timed out after ${timeoutMs}ms`,
          context: { timeout: timeoutMs },
        })
      );
    }, timeoutMs);
  });
}

/**
 * Classify error into specific error types with user-friendly messages
 */
function classifyError(
  error: any,
  operationName: string,
  context: Record<string, any>
): APIError {
  const errorMessage = error?.message || String(error);
  const errorString = errorMessage.toLowerCase();

  // Timeout errors
  if (errorString.includes("timeout") || error.name === "TimeoutError") {
    return createAPIError({
      type: "timeout",
      message: `${operationName} timed out`,
      context,
      originalError: error,
    });
  }

  // Rate limiting / Quota errors
  if (
    errorString.includes("rate limit") ||
    errorString.includes("429") ||
    errorString.includes("too many requests")
  ) {
    return createAPIError({
      type: "rate_limit",
      message: "API rate limit exceeded",
      context,
      statusCode: 429,
      originalError: error,
    });
  }

  if (
    errorString.includes("quota") ||
    errorString.includes("insufficient") ||
    errorString.includes("credits")
  ) {
    return createAPIError({
      type: "quota_exceeded",
      message: "API quota or credits exceeded",
      context,
      originalError: error,
    });
  }

  // Authentication errors
  if (
    errorString.includes("unauthorized") ||
    errorString.includes("401") ||
    errorString.includes("api key") ||
    errorString.includes("authentication")
  ) {
    return createAPIError({
      type: "authentication",
      message: "API authentication failed",
      context,
      statusCode: 401,
      originalError: error,
    });
  }

  // Invalid request errors
  if (
    errorString.includes("400") ||
    errorString.includes("bad request") ||
    errorString.includes("invalid") ||
    errorString.includes("malformed")
  ) {
    return createAPIError({
      type: "invalid_request",
      message: `Invalid request: ${errorMessage}`,
      context,
      statusCode: 400,
      originalError: error,
    });
  }

  // Server errors (5xx)
  if (
    errorString.includes("500") ||
    errorString.includes("502") ||
    errorString.includes("503") ||
    errorString.includes("504") ||
    errorString.includes("server error")
  ) {
    return createAPIError({
      type: "server_error",
      message: "API server error",
      context,
      statusCode: 500,
      originalError: error,
    });
  }

  // Network errors
  if (
    errorString.includes("network") ||
    errorString.includes("fetch failed") ||
    errorString.includes("econnrefused") ||
    errorString.includes("enotfound")
  ) {
    return createAPIError({
      type: "network_error",
      message: "Network connection failed",
      context,
      originalError: error,
    });
  }

  // Response validation errors
  if (errorString.includes("validation")) {
    return createAPIError({
      type: "validation_error",
      message: `Response validation failed: ${errorMessage}`,
      context,
      originalError: error,
    });
  }

  // Unknown error
  return createAPIError({
    type: "unknown",
    message: errorMessage,
    context,
    originalError: error,
  });
}

/**
 * Create a structured API error with user-friendly messages
 */
function createAPIError(options: {
  type: APIErrorType;
  message: string;
  context?: Record<string, any>;
  statusCode?: number;
  originalError?: any;
}): APIError {
  const { type, message, context = {}, statusCode, originalError } = options;

  const errorMessages = getErrorMessages(type, message, statusCode);

  return {
    type,
    message,
    userMessage: errorMessages.userMessage,
    technicalDetails: errorMessages.technicalDetails,
    isRecoverable: isRecoverableErrorType(type),
    suggestedAction: errorMessages.suggestedAction,
    statusCode,
    originalError,
    context,
  };
}

/**
 * Get user-friendly error messages for each error type
 */
function getErrorMessages(
  type: APIErrorType,
  technicalMessage: string,
  statusCode?: number
): {
  userMessage: string;
  technicalDetails: string;
  suggestedAction: string;
} {
  const messages: Record<
    APIErrorType,
    {
      userMessage: string;
      suggestedAction: string;
    }
  > = {
    timeout: {
      userMessage:
        "The AI service took too long to respond. This might be due to a complex request or slow network.",
      suggestedAction:
        "Try again with a shorter prompt, or wait a moment and retry.",
    },
    quota_exceeded: {
      userMessage:
        "Your API quota or credits have been exceeded. The service cannot process more requests at this time.",
      suggestedAction:
        "Check your API account credits/quota, or try again later when your quota resets.",
    },
    rate_limit: {
      userMessage:
        "You've made too many requests in a short time. The service is rate-limiting your requests.",
      suggestedAction: "Wait a few seconds and try again. Avoid rapid retries.",
    },
    authentication: {
      userMessage:
        "Authentication failed. Your API key might be missing, invalid, or expired.",
      suggestedAction:
        "Check your API key in Settings, and make sure it's valid and has the necessary permissions.",
    },
    invalid_request: {
      userMessage:
        "The request to the AI service was invalid. This might be due to incorrect parameters or data format.",
      suggestedAction:
        "Check your node configuration for invalid values, or simplify your request.",
    },
    invalid_response: {
      userMessage:
        "The AI service returned an unexpected response format. The response structure may have changed.",
      suggestedAction:
        "This may be a temporary service issue. Try again, or contact support if the problem persists.",
    },
    network_error: {
      userMessage:
        "Unable to connect to the AI service. This might be due to network issues or service unavailability.",
      suggestedAction:
        "Check your internet connection and try again. The service might be temporarily down.",
    },
    server_error: {
      userMessage:
        "The AI service encountered an internal error. This is typically a temporary issue on their end.",
      suggestedAction:
        "Wait a moment and try again. If the problem persists, the service may be experiencing issues.",
    },
    validation_error: {
      userMessage:
        "The AI service response failed validation. The data structure may have changed.",
      suggestedAction:
        "Try again with different parameters, or contact support if this continues.",
    },
    unknown: {
      userMessage:
        "An unexpected error occurred while communicating with the AI service.",
      suggestedAction:
        "Check the error details below and try again. If the problem persists, contact support.",
    },
  };

  const { userMessage, suggestedAction } = messages[type];

  return {
    userMessage,
    technicalDetails: `${technicalMessage}${
      statusCode ? ` (Status: ${statusCode})` : ""
    }`,
    suggestedAction,
  };
}

/**
 * Determine if an error type is recoverable (should retry)
 */
function isRecoverableErrorType(type: APIErrorType): boolean {
  const recoverableTypes: APIErrorType[] = [
    "timeout",
    "rate_limit",
    "network_error",
    "server_error",
  ];
  return recoverableTypes.includes(type);
}

/**
 * Enhance error with additional context for logging and display
 */
function enhanceError(apiError: APIError): Error {
  const error = new Error(apiError.message) as any;
  error.apiError = apiError;
  error.isAPIError = true;
  return error;
}

/**
 * Check if an error is an enhanced API error
 */
export function isAPIError(
  error: any
): error is Error & { apiError: APIError } {
  return error && error.isAPIError === true && error.apiError;
}

/**
 * Extract API error details from an error
 */
export function getAPIErrorDetails(error: any): APIError | null {
  if (isAPIError(error)) {
    return error.apiError;
  }
  return null;
}

/**
 * Format API error for display in UI
 */
export function formatAPIErrorForUI(error: any): {
  title: string;
  message: string;
  action: string;
  severity: "error" | "warning";
  canRetry: boolean;
} {
  const apiError = getAPIErrorDetails(error);

  if (!apiError) {
    return {
      title: "Error",
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
      action: "Try again or check your configuration",
      severity: "error",
      canRetry: true,
    };
  }

  return {
    title: `${apiError.type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())} Error`,
    message: apiError.userMessage,
    action: apiError.suggestedAction,
    severity: apiError.isRecoverable ? "warning" : "error",
    canRetry: apiError.isRecoverable,
  };
}

/**
 * Simple delay utility
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate OpenAI-like response structure
 */
export function validateOpenAIResponse(response: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!response) {
    errors.push("Response is null or undefined");
    return { isValid: false, errors, warnings };
  }

  if (typeof response !== "object") {
    errors.push("Response is not an object");
    return { isValid: false, errors, warnings };
  }

  // Check for content
  if (!response.content && response.content !== "") {
    errors.push("Response missing 'content' field");
  }

  if (typeof response.content !== "string") {
    errors.push("Response 'content' field is not a string");
  }

  // Check usage (optional but recommended)
  if (response.usage) {
    if (typeof response.usage !== "object") {
      warnings.push("Response 'usage' field is not an object");
    } else {
      if (typeof response.usage.promptTokens !== "number") {
        warnings.push("Response 'usage.promptTokens' is not a number");
      }
      if (typeof response.usage.completionTokens !== "number") {
        warnings.push("Response 'usage.completionTokens' is not a number");
      }
      if (typeof response.usage.totalTokens !== "number") {
        warnings.push("Response 'usage.totalTokens' is not a number");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate embedding response structure
 */
export function validateEmbeddingResponse(response: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!response) {
    errors.push("Response is null or undefined");
    return { isValid: false, errors, warnings };
  }

  if (!Array.isArray(response)) {
    errors.push("Response is not an array");
    return { isValid: false, errors, warnings };
  }

  if (response.length === 0) {
    errors.push("Response array is empty");
  }

  if (response.length > 0 && typeof response[0] !== "number") {
    errors.push("Response array elements are not numbers");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate generic JSON response
 */
export function validateJSONResponse(response: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (response === null || response === undefined) {
    errors.push("Response is null or undefined");
    return { isValid: false, errors, warnings };
  }

  // JSON responses should be objects or arrays
  if (typeof response !== "object") {
    errors.push("Response is not a valid JSON object or array");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
