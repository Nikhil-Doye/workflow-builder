// Test script to verify Slack integration with AI copilot
import { naturalLanguageToWorkflowService } from "./services/naturalLanguageToWorkflowService";

async function testSlackIntegration() {
  console.log("🧪 Testing Slack Integration with AI Copilot...\n");

  const testInput =
    "Build a workflow to send a daily reminder on a slack channel";

  try {
    console.log(`📝 Input: "${testInput}"`);
    console.log("⏳ Processing...\n");

    const result = await naturalLanguageToWorkflowService.parseNaturalLanguage(
      testInput
    );

    console.log("✅ Results:");
    console.log(`🎯 Intent: ${result.intent}`);
    console.log(`📊 Confidence: ${result.confidence}`);
    console.log(`💭 Reasoning: ${result.reasoning}`);

    console.log("\n🔍 Extracted Entities:");
    console.log(
      `- Notification Types: ${
        result.entities.notificationTypes?.join(", ") || "None"
      }`
    );
    console.log(
      `- Slack Channels: ${result.entities.slackChannels?.join(", ") || "None"}`
    );
    console.log(
      `- Data Types: ${result.entities.dataTypes?.join(", ") || "None"}`
    );
    console.log(`- AI Tasks: ${result.entities.aiTasks?.join(", ") || "None"}`);

    console.log("\n🏗️ Generated Workflow:");
    console.log(`- Nodes: ${result.workflowStructure?.nodes?.length || 0}`);
    console.log(`- Edges: ${result.workflowStructure?.edges?.length || 0}`);
    console.log(
      `- Complexity: ${result.workflowStructure?.complexity || "Unknown"}`
    );

    if (result.workflowStructure?.nodes) {
      console.log("\n📋 Node Details:");
      result.workflowStructure.nodes.forEach((node, index) => {
        console.log(`  ${index + 1}. ${node.type} - ${node.label}`);
        if (node.config) {
          console.log(`     Config: ${JSON.stringify(node.config, null, 2)}`);
        }
      });
    }

    // Check if Slack node was generated
    const hasSlackNode = result.workflowStructure?.nodes?.some(
      (node) => node.type === "slack"
    );
    const hasNotificationIntent = result.intent === "NOTIFICATION_SENDING";
    const hasReminderType =
      result.entities.notificationTypes?.includes("reminder");

    console.log("\n🎯 Integration Test Results:");
    console.log(
      `✅ Intent Classification: ${hasNotificationIntent ? "PASS" : "FAIL"}`
    );
    console.log(`✅ Entity Extraction: ${hasReminderType ? "PASS" : "FAIL"}`);
    console.log(`✅ Slack Node Generation: ${hasSlackNode ? "PASS" : "FAIL"}`);

    if (hasNotificationIntent && hasReminderType && hasSlackNode) {
      console.log(
        "\n🎉 SUCCESS: AI Copilot can now handle Slack reminder workflows!"
      );
    } else {
      console.log(
        "\n❌ FAILURE: AI Copilot needs more work to handle Slack workflows properly."
      );
    }
  } catch (error) {
    console.error("❌ Error testing Slack integration:", error);
  }
}

// Run the test
testSlackIntegration();
