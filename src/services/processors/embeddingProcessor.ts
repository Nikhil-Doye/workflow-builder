import { generateEmbedding } from "../openaiService";
import { ExecutionContext, ExecutionPlan } from "../executionEngine";
import {
  safeAPICall,
  validateEmbeddingResponse,
  formatAPIErrorForUI,
  getAPIErrorDetails,
} from "../apiErrorHandler";

export default async function embeddingProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, inputs, nodeId } = context;

  try {
    // Get input data from previous nodes
    const inputData = Array.from(inputs.values()).pop() || "";

    // Validate input
    if (!inputData || typeof inputData !== "string") {
      throw new Error(
        "Invalid or missing input text. Please connect a data source or configure input data."
      );
    }

    // Validate input length
    if (inputData.length > 50000) {
      throw new Error(
        `Input text is too long (${inputData.length} characters). Maximum allowed is 50,000 characters for embedding generation.`
      );
    }

    const model = config.model || "text-embedding-ada-002";

    // Generate embedding with comprehensive error handling
    const embedding = await safeAPICall(
      () => generateEmbedding(inputData, model),
      {
        timeout: config.timeout || 30000, // 30 seconds default
        retries: 2,
        retryDelay: 1500,
        validateResponse: validateEmbeddingResponse,
        operationName: `Embedding API call (${model})`,
        context: {
          nodeId,
          model,
          inputLength: inputData.length,
        },
      }
    );

    // Validate embedding dimensions
    if (!embedding || embedding.length === 0) {
      throw new Error(
        "Invalid embedding response: empty or missing embedding vector."
      );
    }

    return {
      input: inputData.substring(0, 500), // Limit stored input for performance
      embedding: embedding,
      model: model,
      dimensions: embedding.length,
      success: true,
      metadata: {
        nodeId,
        timestamp: new Date().toISOString(),
        inputLength: inputData.length,
        vectorDimensions: embedding.length,
      },
    };
  } catch (error) {
    // Enhanced error handling with user-friendly messages
    const apiError = getAPIErrorDetails(error);

    if (apiError) {
      const errorUI = formatAPIErrorForUI(error);

      // Create a comprehensive error object
      const enhancedError = new Error(errorUI.message) as any;
      enhancedError.userMessage = errorUI.message;
      enhancedError.technicalDetails = apiError.technicalDetails;
      enhancedError.suggestedAction = errorUI.action;
      enhancedError.severity = errorUI.severity;
      enhancedError.canRetry = errorUI.canRetry;
      enhancedError.errorType = apiError.type;
      enhancedError.context = {
        nodeId: context.nodeId,
        model: config.model,
        ...apiError.context,
      };

      console.error(`Embedding Processor Error (Node ${context.nodeId}):`, {
        type: apiError.type,
        userMessage: errorUI.message,
        technicalDetails: apiError.technicalDetails,
        suggestedAction: errorUI.action,
        context: enhancedError.context,
      });

      throw enhancedError;
    }

    // Fallback for non-API errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const fallbackError = new Error(
      `Embedding generation failed: ${errorMessage}`
    ) as any;
    fallbackError.userMessage = `Embedding generation encountered an error: ${errorMessage}`;
    fallbackError.suggestedAction =
      "Check your input data and configuration, then try again.";
    fallbackError.technicalDetails = errorMessage;
    fallbackError.context = {
      nodeId: context.nodeId,
      model: config.model,
    };

    console.error(`Embedding Processor Error (Node ${context.nodeId}):`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw fallbackError;
  }
}
