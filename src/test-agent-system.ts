// Test script for the new agent system
import { agentManager } from "./services/agents/AgentManager";

async function testAgentSystem() {
  console.log("Testing Agent System...");

  try {
    // Test 1: Basic workflow generation
    console.log("\n=== Test 1: Basic Workflow Generation ===");
    const result1 = await agentManager.processWorkflowRequest(
      "Create a workflow that scrapes a website and analyzes the content with AI"
    );

    console.log("Result 1:", {
      success: result1.success,
      toolsUsed: result1.toolsUsed,
      executionTime: result1.executionTime,
      confidence: result1.confidence,
    });

    if (result1.success) {
      console.log(
        "Generated workflow nodes:",
        result1.data.parsedIntent.workflowStructure.nodes.length
      );
    }

    // Test 2: Suggestions generation
    console.log("\n=== Test 2: Suggestions Generation ===");
    const suggestions = await agentManager.getSuggestions(
      "I want to process job applications"
    );
    console.log("Suggestions:", suggestions);

    // Test 3: Tool information
    console.log("\n=== Test 3: Available Tools ===");
    const tools = agentManager.getAvailableTools();
    console.log("Available tools:", tools);

    // Test 4: Session info
    console.log("\n=== Test 4: Session Info ===");
    const sessionInfo = agentManager.getSessionInfo();
    console.log("Session info:", sessionInfo);

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testAgentSystem();
