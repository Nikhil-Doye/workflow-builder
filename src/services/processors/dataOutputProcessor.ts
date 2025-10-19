import { ExecutionContext, ExecutionPlan } from "../executionEngine";

export default async function dataOutputProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { inputs } = context;

  try {
    // Get input data from previous nodes
    const inputData = Array.from(inputs.values()).pop() || "";

    return {
      input: inputData,
      output: inputData,
      type: "dataOutput",
      success: true,
    };
  } catch (error) {
    throw new Error(
      `Data output processing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
