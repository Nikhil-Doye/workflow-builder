import {
  WorkflowStructure,
  WorkflowNodeStructure,
  WorkflowEdgeStructure,
  WorkflowTopology,
  MixedIntentAnalysis,
  ParsedIntent,
} from "../types";
// Simple helper functions to replace pattern matchers
const mapIntentToNodeType = (intent: string): string => {
  const intentLower = intent.toLowerCase();
  if (intentLower.includes("web") || intentLower.includes("scraping"))
    return "webScraping";
  if (
    intentLower.includes("ai") ||
    intentLower.includes("analysis") ||
    intentLower.includes("process")
  )
    return "llmTask";
  if (intentLower.includes("search") || intentLower.includes("similarity"))
    return "similaritySearch";
  if (intentLower.includes("embedding")) return "embeddingGenerator";
  if (intentLower.includes("structure") || intentLower.includes("format"))
    return "structuredOutput";
  return "llmTask"; // Default to LLM task
};

const generateNodeLabel = (intent: string, index: number): string => {
  const intentLower = intent.toLowerCase();
  if (intentLower.includes("job") || intentLower.includes("application")) {
    const labels = [
      "Resume Input",
      "Resume Analyzer",
      "Job Matcher",
      "Application Generator",
    ];
    return labels[index] || `Job Step ${index + 1}`;
  }
  if (intentLower.includes("web") || intentLower.includes("scraping")) {
    const labels = [
      "URL Input",
      "Web Scraper",
      "Content Processor",
      "Data Output",
    ];
    return labels[index] || `Web Step ${index + 1}`;
  }
  if (intentLower.includes("ai") || intentLower.includes("analysis")) {
    const labels = ["Data Input", "AI Analyzer", "Result Processor", "Output"];
    return labels[index] || `AI Step ${index + 1}`;
  }
  return `Processing Step ${index + 1}`;
};

/**
 * Generate workflow structure from parsed intent
 */
export function generateWorkflowStructure(
  parsedIntent: ParsedIntent
): WorkflowStructure {
  const { intent, entities, workflowStructure } = parsedIntent;

  // Use enhanced intent classification if available
  if (workflowStructure && workflowStructure.nodes) {
    return workflowStructure;
  }

  // Fallback to original logic for backward compatibility
  const topology = determineWorkflowTopology(intent, entities);

  // Generate node sequence - use step breakdown if available
  const nodes =
    generateNodeSequenceFromStepBreakdown(intent, entities) ||
    generateNodeSequence(intent, entities);

  // Generate edges
  const edges = generateEdges(nodes, topology);

  // Calculate positions
  const positionedNodes = calculateNodePositions(nodes, topology);

  return {
    id: `workflow-${Date.now()}`,
    name: `Generated Workflow - ${intent}`,
    nodes: positionedNodes,
    edges,
    topology,
    complexity: determineComplexityLevel(nodes.length),
    estimatedExecutionTime: estimateExecutionTime(nodes),
    validationRules: generateValidationRules(nodes),
  };
}

/**
 * Generate node sequence from step breakdown (Phase 1 enhancement)
 */
function generateNodeSequenceFromStepBreakdown(
  intent: any,
  entities: any
): WorkflowNodeStructure[] | null {
  // This will be implemented when we have access to the enhanced intent data
  // For now, return null to use fallback
  return null;
}

/**
 * Generate workflow structure for mixed intents
 */
export function generateMixedWorkflowStructure(
  mixedAnalysis: MixedIntentAnalysis,
  userInput: string
): WorkflowStructure {
  const { subIntents, complexity } = mixedAnalysis;

  // Determine workflow topology based on complexity
  const topology = determineMixedTopology(complexity, userInput);

  // Generate node sequence based on sub-intents
  const nodes = subIntents.map((intent, index) => {
    const nodeConfig = generateNodeConfigForIntent(intent, userInput, index);
    return {
      id: `node-${index}`,
      type: mapIntentToNodeType(intent),
      label: generateNodeLabel(intent, index),
      config: nodeConfig,
    };
  });

  // Add necessary input/output nodes
  const enhancedNodes = ensureInputOutputNodes(nodes);

  // Generate edges based on topology
  const edges = generateEdgesForTopology(enhancedNodes, topology);

  // Calculate positions
  const positionedNodes = calculateNodePositions(enhancedNodes, topology);

  return {
    id: `mixed-workflow-${Date.now()}`,
    name: `Mixed Workflow - ${subIntents.join(", ")}`,
    nodes: positionedNodes,
    edges,
    topology,
    complexity: complexity.level,
    estimatedExecutionTime: estimateExecutionTime(enhancedNodes),
    validationRules: generateValidationRules(enhancedNodes),
  };
}

/**
 * Determine workflow topology based on intent and entities
 */
function determineWorkflowTopology(
  intent: string,
  entities: any
): WorkflowTopology {
  // Check for parallel processing indicators
  const parallelIndicators = [
    /simultaneously/i,
    /at.*same.*time/i,
    /while.*also/i,
    /concurrently/i,
  ];

  const hasParallel = parallelIndicators.some((pattern) =>
    pattern.test(entities.processingSteps?.join(" ") || "")
  );

  // Check for conditional processing
  const conditionalIndicators = [
    /if.*then/i,
    /depending.*on/i,
    /based.*on/i,
    /when.*also/i,
  ];

  const hasConditional = conditionalIndicators.some((pattern) =>
    pattern.test(entities.processingSteps?.join(" ") || "")
  );

  if (hasConditional) {
    return {
      type: "branching",
      description: "Conditional execution paths",
      parallelExecution: false,
    };
  }

  if (hasParallel) {
    return {
      type: "fork-join",
      description: "Nodes execute in parallel then merge",
      parallelExecution: true,
    };
  }

  return {
    type: "linear",
    description: "Nodes execute in sequence",
    parallelExecution: false,
  };
}

/**
 * Determine topology for mixed workflows
 */
function determineMixedTopology(
  complexity: any,
  userInput: string
): WorkflowTopology {
  if (complexity.level === "high") {
    return {
      type: "branching",
      description: "Complex workflow with multiple execution paths",
      parallelExecution: false,
    };
  }

  if (complexity.patterns.some((p: string) => p.includes("parallel"))) {
    return {
      type: "fork-join",
      description: "Parallel processing with merge points",
      parallelExecution: true,
    };
  }

  return {
    type: "linear",
    description: "Sequential processing pipeline",
    parallelExecution: false,
  };
}

/**
 * Generate node sequence based on intent and entities
 */
function generateNodeSequence(
  intent: string,
  entities: any
): WorkflowNodeStructure[] {
  const nodes: WorkflowNodeStructure[] = [];

  // Always start with data input
  nodes.push({
    id: "input-node",
    type: "dataInput",
    label: "Data Input",
    config: {
      dataType: determineInputDataType(entities),
      defaultValue: generateDefaultValue(entities),
    },
  });

  // Add processing nodes based on intent and data type
  const inputDataType = determineInputDataType(entities);

  // Only add web scraping if input is URL-based, not PDF
  if (
    (intent === "WEB_SCRAPING" || entities.urls?.length > 0) &&
    inputDataType !== "pdf"
  ) {
    nodes.push({
      id: "web-scraper",
      type: "webScraping",
      label: "Web Scraper",
      config: {
        url: entities.urls?.[0] || "{{input.output}}",
        formats: ["markdown", "html"],
        onlyMainContent: true,
      },
    });
  }

  // Add AI analysis node for PDF or when AI tasks are requested
  if (
    intent === "AI_ANALYSIS" ||
    entities.aiTasks?.length > 0 ||
    inputDataType === "pdf"
  ) {
    nodes.push({
      id: "ai-analyzer",
      type: "llmTask",
      label: "AI Analyzer",
      config: {
        prompt: generateAIPrompt(entities),
        model: "deepseek-chat",
        temperature: 0.7,
      },
    });
  }

  if (intent === "DATA_PROCESSING" || entities.dataTypes?.length > 0) {
    nodes.push({
      id: "data-processor",
      type: "structuredOutput",
      label: "Data Processor",
      config: {
        schema: generateDataSchema(entities),
        model: "deepseek-chat",
      },
    });
  }

  if (intent === "SEARCH_AND_RETRIEVAL") {
    nodes.push({
      id: "similarity-search",
      type: "similaritySearch",
      label: "Similarity Search",
      config: {
        vectorStore: "pinecone",
        topK: 5,
        threshold: 0.8,
      },
    });
  }

  // Database operations
  if (intent === "DATABASE_OPERATIONS" || entities.databaseOps?.length > 0) {
    nodes.push({
      id: "database-query",
      type: "database",
      label: "Database Operation",
      config: {
        operation: determineDatabaseOperation(entities),
        query: generateDatabaseQuery(entities),
        connectionId: "{{connectionId}}",
      },
    });
  }

  // Slack notifications
  if (
    intent === "NOTIFICATION_SENDING" ||
    entities.slackChannels?.length > 0 ||
    entities.notificationTypes?.includes("slack") ||
    entities.notificationTypes?.includes("reminder")
  ) {
    nodes.push({
      id: "slack-notification",
      type: "slack",
      label: "Slack Notification",
      config: {
        channel: entities.slackChannels?.[0] || "{{channel}}",
        message: generateSlackMessage(entities),
        botToken: "{{slackToken}}",
      },
    });
  }

  // Discord notifications
  if (
    intent === "NOTIFICATION_SENDING" ||
    entities.discordChannels?.length > 0 ||
    entities.notificationTypes?.includes("discord")
  ) {
    nodes.push({
      id: "discord-notification",
      type: "discord",
      label: "Discord Notification",
      config: {
        channel: entities.discordChannels?.[0] || "{{channel}}",
        message: generateDiscordMessage(entities),
        botToken: "{{discordToken}}",
      },
    });
  }

  // Gmail operations
  if (
    intent === "EMAIL_AUTOMATION" ||
    entities.emailRecipients?.length > 0 ||
    entities.emailTypes?.length > 0
  ) {
    nodes.push({
      id: "gmail-send",
      type: "gmail",
      label: "Send Email",
      config: {
        to: entities.emailRecipients?.[0] || "{{recipient}}",
        subject: generateEmailSubject(entities),
        body: generateEmailBody(entities),
        credentials: "{{gmailCredentials}}",
      },
    });
  }

  // Ensure PDF workflows have at least one processing node
  if (inputDataType === "pdf" && nodes.length === 1) {
    // Only data input node exists, add a default AI analyzer
    nodes.push({
      id: "pdf-analyzer",
      type: "llmTask",
      label: "PDF Analyzer",
      config: {
        prompt: "Analyze and summarize the PDF content: {{input.output}}",
        model: "deepseek-chat",
        temperature: 0.7,
      },
    });
  }

  // Always end with data output
  nodes.push({
    id: "data-output",
    type: "dataOutput",
    label: "Data Output",
    config: {
      format: determineOutputFormat(entities),
      filename: generateOutputFilename(entities),
    },
  });

  return nodes;
}

/**
 * Generate edges between nodes
 */
function generateEdges(
  nodes: WorkflowNodeStructure[],
  topology: WorkflowTopology
): WorkflowEdgeStructure[] {
  const edges: WorkflowEdgeStructure[] = [];

  if (topology.type === "linear") {
    // Simple linear connection
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `edge-${i + 1}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
      });
    }
  } else if (topology.type === "fork-join") {
    // Fork-join pattern
    const processingNodes = nodes.slice(1, -1);

    // Connect input to all processing nodes
    processingNodes.forEach((_, index) => {
      edges.push({
        id: `edge-input-${index + 1}`,
        source: nodes[0].id,
        target: nodes[index + 1].id,
      });
    });

    // Connect all processing nodes to output
    processingNodes.forEach((_, index) => {
      edges.push({
        id: `edge-output-${index + 1}`,
        source: nodes[index + 1].id,
        target: nodes[nodes.length - 1].id,
      });
    });
  }

  return edges;
}

/**
 * Generate edges for mixed workflow topology
 */
function generateEdgesForTopology(
  nodes: WorkflowNodeStructure[],
  topology: WorkflowTopology
): WorkflowEdgeStructure[] {
  return generateEdges(nodes, topology);
}

/**
 * Calculate node positions for visual layout
 */
function calculateNodePositions(
  nodes: WorkflowNodeStructure[],
  topology: WorkflowTopology
): WorkflowNodeStructure[] {
  const positionedNodes = [...nodes];
  const nodeSpacing = 200;
  const startX = 100;
  const startY = 100;

  if (topology.type === "linear") {
    positionedNodes.forEach((node, index) => {
      node.position = {
        x: startX + index * nodeSpacing,
        y: startY,
      };
    });
  } else if (topology.type === "fork-join") {
    const inputNode = positionedNodes[0];
    const outputNode = positionedNodes[positionedNodes.length - 1];
    const processingNodes = positionedNodes.slice(1, -1);

    // Position input node
    inputNode.position = { x: startX, y: startY };

    // Position processing nodes in parallel
    processingNodes.forEach((node, index) => {
      node.position = {
        x: startX + nodeSpacing,
        y: startY + index * nodeSpacing,
      };
    });

    // Position output node
    outputNode.position = {
      x: startX + 2 * nodeSpacing,
      y: startY + ((processingNodes.length - 1) * nodeSpacing) / 2,
    };
  }

  return positionedNodes;
}

/**
 * Ensure workflow has input and output nodes
 */
function ensureInputOutputNodes(
  nodes: WorkflowNodeStructure[]
): WorkflowNodeStructure[] {
  const hasInput = nodes.some((n) => n.type === "dataInput");
  const hasOutput = nodes.some((n) => n.type === "dataOutput");

  const enhancedNodes = [...nodes];

  if (!hasInput) {
    enhancedNodes.unshift({
      id: "input-node",
      type: "dataInput",
      label: "Data Input",
      config: {
        dataType: "text",
        defaultValue: "Enter your data here",
      },
    });
  }

  if (!hasOutput) {
    enhancedNodes.push({
      id: "output-node",
      type: "dataOutput",
      label: "Data Output",
      config: {
        format: "json",
        filename: "output.json",
      },
    });
  }

  return enhancedNodes;
}

/**
 * Generate node configuration for specific intent
 */
function generateNodeConfigForIntent(
  intent: string,
  userInput: string,
  index: number
): Record<string, any> {
  const baseConfigs: Record<string, Record<string, any>> = {
    WEB_SCRAPING: {
      url: "{{input.output}}",
      formats: ["markdown", "html"],
      onlyMainContent: true,
      maxLength: 5000,
    },
    AI_ANALYSIS: {
      prompt: `Analyze the following content: {{input.output}}`,
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 1000,
    },
    DATA_PROCESSING: {
      schema: '{"type": "object", "properties": {"data": {"type": "string"}}}',
      model: "deepseek-chat",
    },
    SEARCH_AND_RETRIEVAL: {
      vectorStore: "pinecone",
      topK: 5,
      threshold: 0.8,
    },
    CONTENT_GENERATION: {
      prompt: `Generate content based on: {{input.output}}`,
      model: "deepseek-chat",
      temperature: 0.8,
      maxTokens: 1500,
    },
  };

  return baseConfigs[intent] || baseConfigs["AI_ANALYSIS"];
}

/**
 * Determine input data type from entities
 */
function determineInputDataType(entities: any): string {
  if (entities.urls?.length > 0) return "url";
  if (entities.dataTypes?.includes("json")) return "json";
  if (entities.dataTypes?.includes("csv")) return "csv";
  if (entities.dataTypes?.includes("pdf")) return "pdf";
  if (
    entities.dataTypes?.includes("resume") ||
    entities.dataTypes?.includes("cv")
  )
    return "text";
  return "text";
}

/**
 * Generate default value for input
 */
function generateDefaultValue(entities: any): string {
  if (entities.urls?.length > 0) return entities.urls[0];
  if (entities.dataTypes?.includes("json")) return '{"data": "example"}';
  if (entities.dataTypes?.includes("csv")) return "name,value\nexample,123";
  if (entities.dataTypes?.includes("pdf"))
    return "Upload a PDF file to process";
  if (
    entities.dataTypes?.includes("resume") ||
    entities.dataTypes?.includes("cv")
  ) {
    return "John Doe\nSoftware Engineer\n5 years experience in React, Node.js, and Python\nBachelor's in Computer Science\nContact: john.doe@email.com";
  }
  return "Enter your text here";
}

/**
 * Generate AI prompt based on entities using the new prompt optimizer
 */
function generateAIPrompt(
  entities: any,
  userInput?: string,
  nodeContext?: any
): string {
  // Import the prompt optimizer
  const { promptOptimizer } = require("../services/promptOptimizer");

  // Create node context if not provided
  const context = nodeContext || {
    dataType: determineInputDataType(entities),
    previousNodes: [],
    intent: "AI_ANALYSIS",
    availableData: new Map(),
  };

  // Generate optimized prompt
  return promptOptimizer.generateOptimizedPrompt(
    userInput || "Process the input data",
    entities,
    context,
    context.availableData
  );
}

/**
 * Generate data schema based on entities
 */
function generateDataSchema(entities: any): string {
  const dataTypes = entities.dataTypes || ["text"];

  if (dataTypes.includes("json")) {
    return '{"type": "object", "properties": {"data": {"type": "string"}}}';
  }

  if (dataTypes.includes("csv")) {
    return '{"type": "array", "items": {"type": "object"}}';
  }

  return '{"type": "object", "properties": {"content": {"type": "string"}}}';
}

/**
 * Determine output format from entities
 */
function determineOutputFormat(entities: any): string {
  if (entities.outputFormats?.includes("json")) return "json";
  if (entities.outputFormats?.includes("csv")) return "csv";
  return "json";
}

/**
 * Generate output filename based on entities
 */
function generateOutputFilename(entities: any): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `workflow_output_${timestamp}.json`;
}

/**
 * Determine complexity level
 */
function determineComplexityLevel(nodeCount: number): string {
  if (nodeCount <= 3) return "low";
  if (nodeCount <= 6) return "medium";
  return "high";
}

/**
 * Estimate execution time
 */
function estimateExecutionTime(nodes: WorkflowNodeStructure[]): number {
  const timeEstimates: Record<string, number> = {
    dataInput: 0,
    webScraping: 5000,
    llmTask: 3000,
    structuredOutput: 2000,
    similaritySearch: 4000,
    database: 3000,
    slack: 2000,
    discord: 2000,
    gmail: 3000,
    dataOutput: 0,
  };

  return nodes.reduce((total, node) => {
    return total + (timeEstimates[node.type] || 1000);
  }, 0);
}

/**
 * Generate validation rules
 */
function generateValidationRules(nodes: WorkflowNodeStructure[]): string[] {
  const rules: string[] = [];

  // Check for required input/output nodes
  const hasInput = nodes.some((n) => n.type === "dataInput");
  const hasOutput = nodes.some((n) => n.type === "dataOutput");

  if (!hasInput) {
    rules.push("Workflow needs an input node");
  }

  if (!hasOutput) {
    rules.push("Workflow needs an output node");
  }

  // Check for logical flow
  const webScrapingNodes = nodes.filter((n) => n.type === "webScraping");
  const llmNodes = nodes.filter((n) => n.type === "llmTask");

  if (webScrapingNodes.length > 0 && llmNodes.length > 0) {
    rules.push("AI analysis nodes should come after web scraping nodes");
  }

  return rules;
}

/**
 * Determine database operation from entities
 */
function determineDatabaseOperation(entities: any): string {
  if (
    entities.databaseOps?.includes("query") ||
    entities.databaseOps?.includes("select")
  ) {
    return "query";
  }
  if (
    entities.databaseOps?.includes("insert") ||
    entities.databaseOps?.includes("create")
  ) {
    return "insert";
  }
  if (
    entities.databaseOps?.includes("update") ||
    entities.databaseOps?.includes("modify")
  ) {
    return "update";
  }
  if (
    entities.databaseOps?.includes("delete") ||
    entities.databaseOps?.includes("remove")
  ) {
    return "delete";
  }
  return "query";
}

/**
 * Generate database query from entities
 */
function generateDatabaseQuery(entities: any): string {
  const operation = determineDatabaseOperation(entities);

  if (operation === "query") {
    return "SELECT * FROM {{table}} WHERE {{condition}}";
  }
  if (operation === "insert") {
    return "INSERT INTO {{table}} ({{columns}}) VALUES ({{values}})";
  }
  if (operation === "update") {
    return "UPDATE {{table}} SET {{set_clause}} WHERE {{condition}}";
  }
  if (operation === "delete") {
    return "DELETE FROM {{table}} WHERE {{condition}}";
  }
  return "SELECT * FROM {{table}}";
}

/**
 * Generate Slack message from entities
 */
function generateSlackMessage(entities: any): string {
  if (entities.notificationTypes?.includes("reminder")) {
    return "🔔 Daily Reminder: {{input.output}}";
  }
  if (entities.notificationTypes?.includes("alert")) {
    return "⚠️ Alert: {{input.output}}";
  }
  if (entities.notificationTypes?.includes("report")) {
    return "📊 Report: {{input.output}}";
  }
  return "{{input.output}}";
}

/**
 * Generate Discord message from entities
 */
function generateDiscordMessage(entities: any): string {
  if (entities.notificationTypes?.includes("reminder")) {
    return "🔔 **Daily Reminder**: {{input.output}}";
  }
  if (entities.notificationTypes?.includes("alert")) {
    return "⚠️ **Alert**: {{input.output}}";
  }
  if (entities.notificationTypes?.includes("report")) {
    return "📊 **Report**: {{input.output}}";
  }
  return "{{input.output}}";
}

/**
 * Generate email subject from entities
 */
function generateEmailSubject(entities: any): string {
  if (entities.emailTypes?.includes("reminder")) {
    return "Daily Reminder - {{date}}";
  }
  if (entities.emailTypes?.includes("report")) {
    return "Daily Report - {{date}}";
  }
  if (entities.emailTypes?.includes("notification")) {
    return "Notification - {{date}}";
  }
  return "Message from Workflow";
}

/**
 * Generate email body from entities
 */
function generateEmailBody(entities: any): string {
  if (entities.emailTypes?.includes("reminder")) {
    return "Hello,\n\nThis is your daily reminder:\n\n{{input.output}}\n\nBest regards,\nAutomated Workflow";
  }
  if (entities.emailTypes?.includes("report")) {
    return "Hello,\n\nPlease find the daily report below:\n\n{{input.output}}\n\nBest regards,\nAutomated Workflow";
  }
  return "{{input.output}}";
}
