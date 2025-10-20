import { ExecutionContext, ExecutionPlan } from "../executionEngine";
import { ProcessorRegistry } from "./ProcessorRegistry";

export interface DefaultProcessorResult {
  input: any;
  output: any;
  type: "default";
  success: boolean;
  warning?: string;
  diagnostics?: {
    nodeType: string;
    status: "unsupported" | "deprecated" | "experimental" | "supported";
    similarTypes: string[];
    suggestion?: string;
  };
  metadata?: {
    executionTime: number;
    timestamp: Date;
    fallbackUsed: boolean;
  };
}

export default async function defaultProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<DefaultProcessorResult> {
  const { inputs, nodeType } = context;
  const startTime = Date.now();

  try {
    // Get input data from previous nodes
    let inputData = "";
    if (inputs.size > 0) {
      const values = Array.from(inputs.values());
      inputData = values.length > 0 ? values[values.length - 1] || "" : "";
    }

    // Check node type status
    const nodeStatus = ProcessorRegistry.getNodeTypeStatus(nodeType);
    const similarTypes = ProcessorRegistry.getSimilarTypes(nodeType);

    // Generate warning message based on status
    let warning: string | undefined;
    let suggestion: string | undefined;

    if (nodeStatus.status === "unsupported") {
      warning = `Node type '${nodeType}' is not supported. Using fallback processor.`;
      suggestion =
        similarTypes.length > 0
          ? `Consider using one of these supported types: ${similarTypes.join(
              ", "
            )}`
          : "No similar node types found. Check the documentation for supported types.";
    } else if (nodeStatus.status === "deprecated") {
      warning = `Node type '${nodeType}' is deprecated and may be removed in future versions.`;
      suggestion =
        similarTypes.length > 0
          ? `Consider migrating to: ${similarTypes.join(", ")}`
          : "Check the documentation for migration guidance.";
    } else if (nodeStatus.status === "experimental") {
      warning = `Node type '${nodeType}' is experimental and may have limited functionality.`;
      suggestion = "Use with caution. API may change in future versions.";
    }

    // Log warning to console for debugging
    if (warning) {
      console.warn(`[DefaultProcessor] ${warning}`, {
        nodeType,
        nodeId: context.nodeId,
        executionId: plan.id,
        suggestion,
        similarTypes,
      });
    }

    // Create diagnostics object
    const diagnostics = {
      nodeType,
      status: nodeStatus.status,
      similarTypes,
      suggestion,
    };

    const executionTime = Date.now() - startTime;

    // Return result with comprehensive diagnostics
    return {
      input: inputData,
      output: inputData, // Pass-through behavior
      type: "default",
      success: true,
      warning,
      diagnostics,
      metadata: {
        executionTime,
        timestamp: new Date(),
        fallbackUsed: true,
      },
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Enhanced error reporting
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[DefaultProcessor] Processing failed for node type '${nodeType}':`,
      {
        error: errorMessage,
        nodeId: context.nodeId,
        executionId: plan.id,
        nodeType,
        executionTime,
      }
    );

    throw new Error(
      `Default processing failed for node type '${nodeType}': ${errorMessage}`
    );
  }
}
