import { generateEmbedding } from "../openaiService";
import { searchSimilarVectors } from "../pineconeService";
import { ExecutionContext, ExecutionPlan } from "../executionEngine";

export default async function similarityProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, inputs } = context;

  try {
    // Get input data from previous nodes
    const inputData = Array.from(inputs.values()).pop() || "";

    if (!inputData) {
      throw new Error("No input data provided for similarity search");
    }

    // Get configuration with defaults
    const vectorStore = config.vectorStore || "pinecone";
    const topK = config.topK || 5;
    const threshold = config.threshold || 0.8;
    const indexName = config.indexName || "default-index";
    const model = config.model || "text-embedding-ada-002";

    if (vectorStore === "pinecone") {
      // Generate embedding for the input data
      const queryEmbedding = await generateEmbedding(inputData, model);

      // Search for similar vectors
      const results = await searchSimilarVectors(
        queryEmbedding,
        indexName,
        topK,
        threshold
      );

      return {
        input: inputData,
        output: results,
        vectorStore,
        topK,
        threshold,
        indexName,
        model,
        type: "pinecone_search",
        success: true,
      };
    } else {
      throw new Error(
        `Vector store '${vectorStore}' is not supported. Only Pinecone is currently supported.`
      );
    }
  } catch (error) {
    throw new Error(
      `Similarity search failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
