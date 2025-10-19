import { callOpenAI } from "../openaiService";
import { ExecutionContext, ExecutionPlan } from "../executionEngine";

export default async function structuredOutputProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, inputs } = context;

  try {
    // Get input data from previous nodes
    const inputData = Array.from(inputs.values()).pop() || "";
    const schema = config.schema || '{"type": "object"}';
    const model = config.model || "gpt-3.5-turbo";

    // Use LLM to structure the data according to the schema
    const prompt = `Structure the following data according to the provided JSON schema. Return only valid JSON that matches the schema exactly.

Data: ${inputData}

Schema: ${schema}

Return the structured data as JSON:`;

    const response = await callOpenAI(prompt, {
      model: model,
      temperature: 0.1,
      maxTokens: 1000,
    });

    const structuredOutput = {
      input: inputData,
      structured: JSON.parse(response.content),
      schema: JSON.parse(schema),
      model: model,
      success: true,
    };

    return structuredOutput;
  } catch (error) {
    // Fallback to basic structure if LLM fails
    const inputData = Array.from(inputs.values()).pop() || "";
    const schema = config.schema || '{"type": "object"}';

    const fallbackStructuredOutput = {
      input: inputData,
      structured: {
        text: inputData,
        length: inputData.length,
        timestamp: new Date().toISOString(),
      },
      schema: JSON.parse(schema),
      model: config.model || "gpt-3.5-turbo",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return fallbackStructuredOutput;
  }
}
