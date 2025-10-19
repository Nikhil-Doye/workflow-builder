import { generateEmbedding } from "../openaiService";
import { ExecutionContext, ExecutionPlan } from "../executionEngine";

export default async function embeddingProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, inputs } = context;

  try {
    // Get input data from previous nodes
    const inputData = Array.from(inputs.values()).pop() || "";
    const model = config.model || "text-embedding-ada-002";

    // Generate embedding
    const embedding = await generateEmbedding(inputData, model);

    return {
      input: inputData,
      embedding: embedding,
      model: model,
      dimensions: embedding.length,
      success: true,
    };
  } catch (error) {
    throw new Error(
      `Embedding generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
