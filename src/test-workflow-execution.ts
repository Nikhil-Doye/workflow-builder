// Test script to verify workflow execution
import { executionEngine } from "./services/executionEngine";

// Create a simple test workflow
const testWorkflow = {
  id: "test-workflow-1",
  nodes: [
    {
      id: "data-input-1",
      type: "dataInput",
      data: {
        type: "dataInput",
        config: {
          defaultValue: "Hello, World!",
        },
      },
    },
    {
      id: "default-processor-1",
      type: "defaultProcessor",
      data: {
        type: "defaultProcessor",
        config: {},
      },
    },
  ],
  edges: [
    {
      source: "data-input-1",
      target: "default-processor-1",
    },
  ],
};

async function testWorkflowExecution() {
  console.log("Testing workflow execution...");

  try {
    const result = await executionEngine.executeWorkflow(
      testWorkflow.id,
      testWorkflow.nodes,
      testWorkflow.edges,
      {
        mode: "sequential",
        maxConcurrency: 1,
        timeout: 30000,
      }
    );

    console.log("Workflow execution completed successfully!");
    console.log("Result:", result);

    // Check individual node results
    result.nodes.forEach((node) => {
      console.log(`Node ${node.nodeId}:`, {
        status: node.status,
        output: node.outputs.get("output"),
        duration: node.duration,
      });
    });
  } catch (error) {
    console.error("Workflow execution failed:", error);
  }
}

// Run the test
testWorkflowExecution();
