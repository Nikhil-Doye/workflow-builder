import { callOpenAI } from "../openaiService";
import { ExecutionContext, ExecutionPlan } from "../executionEngine";
import {
  substituteVariables,
  NodeOutput,
} from "../../utils/variableSubstitution";
import {
  safeAPICall,
  validateOpenAIResponse,
  formatAPIErrorForUI,
  getAPIErrorDetails,
} from "../apiErrorHandler";

export default async function llmProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, inputs, nodeId } = context;

  try {
    // Get the prompt from config (may contain variable placeholders)
    let prompt = config.prompt || "";

    // If no prompt in config, fall back to input data from previous nodes
    if (!prompt) {
      prompt = Array.from(inputs.values()).pop() || "";
    }

    // Validate prompt
    if (!prompt || typeof prompt !== "string") {
      throw new Error(
        "Invalid or missing prompt. Please configure a prompt in the LLM node settings or connect an input node."
      );
    }

    // Apply variable substitution to the prompt if it contains placeholders
    if (prompt.includes("{{")) {
      const nodeLabelToId = (plan as any).nodeLabelToId || new Map();

      // Create node outputs map for substitution
      const nodeOutputs = new Map<string, NodeOutput>();
      plan.nodes.forEach((node) => {
        if (node.outputs.has("output")) {
          nodeOutputs.set(node.nodeId, {
            nodeId: node.nodeId,
            output: node.outputs.get("output"),
            data: node.outputs.get("output"),
            status: node.status,
          });
        }
      });

      // Apply variable substitution to the prompt
      prompt = substituteVariables(prompt, nodeOutputs, nodeLabelToId);

      console.log(`LLM prompt after variable substitution:`, {
        nodeId,
        originalPrompt: config.prompt,
        substitutedPrompt:
          prompt.substring(0, 200) + (prompt.length > 200 ? "..." : ""),
        nodeLabelToId: Array.from(nodeLabelToId.entries()),
      });
    }

    // Validate prompt length
    if (prompt.length > 100000) {
      throw new Error(
        `Prompt is too long (${prompt.length} characters). Maximum allowed is 100,000 characters. Consider shortening your input or splitting into multiple nodes.`
      );
    }

    // Prepare model configuration
    const model = config.model || "gpt-3.5-turbo";
    const temperature = Math.max(0, Math.min(2, config.temperature ?? 0.7));
    const maxTokens = Math.max(1, Math.min(100000, config.maxTokens || 1000));

    // Make API call with comprehensive error handling
    const result = await safeAPICall(
      () =>
        callOpenAI(prompt, {
          model,
          temperature,
          maxTokens,
        }),
      {
        timeout: config.timeout || 60000, // 60 seconds default
        retries: 2,
        retryDelay: 2000,
        validateResponse: validateOpenAIResponse,
        operationName: `LLM API call (${model})`,
        context: {
          nodeId,
          model,
          promptLength: prompt.length,
          maxTokens,
        },
      }
    );

    // Additional response validation
    if (!result.content) {
      console.warn(`LLM API returned empty content for node ${nodeId}`);
    }

    return {
      input: prompt.substring(0, 1000), // Limit stored input for performance
      output: result.content,
      model,
      usage: result.usage,
      success: true,
      metadata: {
        nodeId,
        timestamp: new Date().toISOString(),
        promptLength: prompt.length,
        responseLength: result.content?.length || 0,
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

      console.error(`LLM Processor Error (Node ${context.nodeId}):`, {
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
      `LLM processing failed: ${errorMessage}`
    ) as any;
    fallbackError.userMessage = `The AI service encountered an error: ${errorMessage}`;
    fallbackError.suggestedAction =
      "Check your node configuration and try again. If the problem persists, contact support.";
    fallbackError.technicalDetails = errorMessage;
    fallbackError.context = {
      nodeId: context.nodeId,
      model: config.model,
    };

    console.error(`LLM Processor Error (Node ${context.nodeId}):`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw fallbackError;
  }
}
