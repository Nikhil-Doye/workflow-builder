import { callOpenAI } from "../openaiService";
import { ExecutionContext, ExecutionPlan } from "../executionEngine";
import {
  substituteVariables,
  NodeOutput,
} from "../../utils/variableSubstitution";

export default async function llmProcessor(
  context: ExecutionContext,
  plan: ExecutionPlan
): Promise<any> {
  const { config, inputs } = context;

  try {
    // Get the prompt from config (may contain variable placeholders)
    let prompt = config.prompt || "";

    // If no prompt in config, fall back to input data from previous nodes
    if (!prompt) {
      prompt = Array.from(inputs.values()).pop() || "";
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
        originalPrompt: config.prompt,
        substitutedPrompt: prompt,
        nodeLabelToId: Array.from(nodeLabelToId.entries()),
      });
    }

    const result = await callOpenAI(prompt, {
      model: config.model || "gpt-3.5-turbo",
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
    });

    return {
      input: prompt,
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
