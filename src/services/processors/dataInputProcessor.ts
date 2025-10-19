import { ExecutionContext, ExecutionPlan } from "../executionEngine";

export default async function dataInputProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config } = context;

  try {
    // Get the input data from the config
    const inputData = config.defaultValue || config.input || "";

    return {
      input: inputData,
      output: inputData,
      type: "dataInput",
      success: true,
    };
  } catch (error) {
    throw new Error(
      `Data input processing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
