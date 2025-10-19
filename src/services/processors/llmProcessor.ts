import { callOpenAI } from "../openaiService";
import { ExecutionContext, ExecutionPlan } from "../executionEngine";

export default async function llmProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, inputs } = context;

  try {
    // Get input data from previous nodes
    const inputData = Array.from(inputs.values()).pop() || "";

    const result = await callOpenAI(inputData, {
      model: config.model || "gpt-3.5-turbo",
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
    });

    return {
      input: inputData,
      output: result.content,
      model: config.model || "gpt-3.5-turbo",
      usage: result.usage,
      success: true,
    };
  } catch (error) {
    throw new Error(
      `LLM processing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
