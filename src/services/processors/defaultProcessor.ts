import { ExecutionContext, ExecutionPlan } from "../executionEngine";

export default async function defaultProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, inputs } = context;

  try {
    // Get input data from previous nodes
    const inputData = Array.from(inputs.values()).pop() || "";

    // For unknown node types, just pass through the data
    return {
      input: inputData,
      output: inputData,
      type: "default",
      success: true,
    };
  } catch (error) {
    throw new Error(
      `Default processing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
