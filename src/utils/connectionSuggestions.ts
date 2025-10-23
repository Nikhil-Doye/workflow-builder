import { Node, Edge } from "reactflow";
import { NodeData, NodeType } from "../types";

export interface ConnectionSuggestion {
  sourceId: string;
  targetId: string;
  reason: string;
  confidence: number;
  category: "data-flow" | "logical-sequence" | "best-practice" | "required";
}

export interface ConnectionValidation {
  isValid: boolean;
  reason?: string;
  suggestion?: string;
  severity: "error" | "warning" | "info";
}

/**
 * Node type compatibility matrix for connection suggestions
 */
const NODE_COMPATIBILITY: Record<
  NodeType,
  {
    canConnectTo: NodeType[];
    shouldConnectTo: NodeType[];
    commonPatterns: string[];
    description: string;
  }
> = {
  dataInput: {
    canConnectTo: [
      "webScraping",
      "llmTask",
      "embeddingGenerator",
      "structuredOutput",
      "database",
    ],
    shouldConnectTo: ["webScraping", "llmTask", "embeddingGenerator"],
    commonPatterns: ["Start workflows", "Provide data to processing nodes"],
    description: "Data input nodes provide data to processing nodes",
  },
  webScraping: {
    canConnectTo: [
      "llmTask",
      "structuredOutput",
      "dataOutput",
      "embeddingGenerator",
    ],
    shouldConnectTo: ["llmTask", "structuredOutput"],
    commonPatterns: [
      "Scrape → Analyze",
      "Scrape → Structure",
      "Scrape → Generate embeddings",
    ],
    description: "Web scraping results are typically analyzed or structured",
  },
  llmTask: {
    canConnectTo: [
      "structuredOutput",
      "dataOutput",
      "embeddingGenerator",
      "similaritySearch",
      "llmTask",
    ],
    shouldConnectTo: ["structuredOutput", "dataOutput"],
    commonPatterns: [
      "Analyze → Structure",
      "Generate → Output",
      "Process → Process",
    ],
    description: "LLM tasks often structure data or provide final outputs",
  },
  embeddingGenerator: {
    canConnectTo: ["similaritySearch", "dataOutput"],
    shouldConnectTo: ["similaritySearch"],
    commonPatterns: [
      "Generate embeddings → Search",
      "Generate embeddings → Store",
    ],
    description: "Embeddings are used for similarity search or storage",
  },
  similaritySearch: {
    canConnectTo: ["llmTask", "dataOutput", "structuredOutput"],
    shouldConnectTo: ["llmTask", "dataOutput"],
    commonPatterns: ["Search → Analyze results", "Search → Output results"],
    description: "Search results are typically analyzed or output",
  },
  structuredOutput: {
    canConnectTo: ["dataOutput", "llmTask"],
    shouldConnectTo: ["dataOutput"],
    commonPatterns: ["Structure → Output", "Structure → Further processing"],
    description: "Structured data is typically output or further processed",
  },
  dataOutput: {
    canConnectTo: [],
    shouldConnectTo: [],
    commonPatterns: ["End of workflow"],
    description: "Data output nodes are typically the end of workflows",
  },
  // Database node
  database: {
    canConnectTo: [
      "llmTask",
      "structuredOutput",
      "dataOutput",
      "embeddingGenerator",
    ],
    shouldConnectTo: ["llmTask", "structuredOutput", "dataOutput"],
    commonPatterns: [
      "Query → Process",
      "Query → Structure",
      "Query → Generate embeddings",
      "Insert/Update/Delete → Confirm output",
    ],
    description:
      "Database operations can feed into processing nodes or output confirmation",
  },
  // Slack node
  slack: {
    canConnectTo: ["dataOutput"],
    shouldConnectTo: ["dataOutput"],
    commonPatterns: [
      "Process → Send notification",
      "Generate report → Post to channel",
      "Data analysis → Share results",
    ],
    description:
      "Slack nodes typically send notifications and updates to team channels",
  },
  discord: {
    canConnectTo: ["dataOutput"],
    shouldConnectTo: ["dataOutput"],
    commonPatterns: [
      "Process → Send message",
      "Generate report → Post to channel",
      "Data analysis → Share results",
      "Game events → Notify community",
    ],
    description:
      "Discord nodes typically send messages and updates to community channels",
  },
  gmail: {
    canConnectTo: ["dataOutput"],
    shouldConnectTo: ["dataOutput"],
    commonPatterns: [
      "Process → Send email",
      "Generate report → Email results",
      "Data analysis → Email summary",
      "Notifications → Email alerts",
    ],
    description:
      "Gmail nodes typically send emails and notifications to recipients",
  },
};

/**
 * Generate connection suggestions based on current workflow state
 */
export function generateConnectionSuggestions(
  nodes: Node<NodeData>[],
  edges: Edge[]
): ConnectionSuggestion[] {
  const suggestions: ConnectionSuggestion[] = [];
  const connectedNodes = new Set<string>();

  // Track which nodes are already connected
  edges.forEach((edge) => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  // Find unconnected nodes and suggest connections
  const unconnectedNodes = nodes.filter((node) => !connectedNodes.has(node.id));

  // Suggest connections for unconnected nodes
  unconnectedNodes.forEach((node) => {
    const nodeType = node.data.type as NodeType;
    const compatibility = NODE_COMPATIBILITY[nodeType];

    if (!compatibility) return;

    // Find potential targets
    const potentialTargets = nodes.filter(
      (targetNode) =>
        targetNode.id !== node.id &&
        compatibility.canConnectTo.includes(targetNode.data.type as NodeType)
    );

    potentialTargets.forEach((targetNode) => {
      const targetType = targetNode.data.type as NodeType;
      const isRecommended = compatibility.shouldConnectTo.includes(targetType);

      suggestions.push({
        sourceId: node.id,
        targetId: targetNode.id,
        reason: getConnectionReason(nodeType, targetType, isRecommended),
        confidence: isRecommended ? 0.9 : 0.6,
        category: isRecommended ? "best-practice" : "data-flow",
      });
    });
  });

  // Suggest workflow completion patterns
  const inputNodes = nodes.filter((node) => node.data.type === "dataInput");
  const outputNodes = nodes.filter((node) => node.data.type === "dataOutput");

  if (inputNodes.length > 0 && outputNodes.length === 0) {
    // Suggest adding output nodes
    const lastProcessingNodes = nodes.filter(
      (node) =>
        node.data.type !== "dataInput" &&
        !edges.some((edge) => edge.source === node.id)
    );

    lastProcessingNodes.forEach((node) => {
      suggestions.push({
        sourceId: node.id,
        targetId: "suggested-output",
        reason: "Add a Data Output node to complete your workflow",
        confidence: 0.8,
        category: "required",
      });
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Validate a potential connection
 */
export function validateConnection(
  sourceNode: Node<NodeData>,
  targetNode: Node<NodeData>,
  existingEdges: Edge[]
): ConnectionValidation {
  const sourceType = sourceNode.data.type as NodeType;
  const targetType = targetNode.data.type as NodeType;

  // Check if connection already exists
  const existingConnection = existingEdges.find(
    (edge) => edge.source === sourceNode.id && edge.target === targetNode.id
  );

  if (existingConnection) {
    return {
      isValid: false,
      reason: "Connection already exists",
      severity: "warning",
    };
  }

  // Check compatibility
  const compatibility = NODE_COMPATIBILITY[sourceType];
  if (!compatibility) {
    return {
      isValid: false,
      reason: "Unknown source node type",
      severity: "error",
    };
  }

  if (!compatibility.canConnectTo.includes(targetType)) {
    return {
      isValid: false,
      reason: `Cannot connect ${sourceType} to ${targetType}`,
      suggestion: `Try connecting to: ${compatibility.canConnectTo.join(", ")}`,
      severity: "error",
    };
  }

  // Check for circular dependencies
  if (
    wouldCreateCircularDependency(sourceNode.id, targetNode.id, existingEdges)
  ) {
    return {
      isValid: false,
      reason: "This connection would create a circular dependency",
      severity: "error",
    };
  }

  // Check if it's a recommended connection
  const isRecommended = compatibility.shouldConnectTo.includes(targetType);

  return {
    isValid: true,
    reason: isRecommended ? "Recommended connection" : "Valid connection",
    suggestion: isRecommended
      ? undefined
      : "Consider if this connection makes sense for your workflow",
    severity: isRecommended ? "info" : "warning",
  };
}

/**
 * Get human-readable reason for connection suggestion
 */
function getConnectionReason(
  sourceType: NodeType,
  targetType: NodeType,
  isRecommended: boolean
): string {
  const reasons: Record<string, string> = {
    "dataInput-webScraping": "Provide URL to web scraper",
    "dataInput-llmTask": "Provide text data for AI processing",
    "dataInput-embeddingGenerator": "Provide text for embedding generation",
    "webScraping-llmTask": "Analyze scraped content with AI",
    "webScraping-structuredOutput": "Structure scraped data",
    "llmTask-structuredOutput": "Format AI output into structured data",
    "llmTask-dataOutput": "Output AI results",
    "embeddingGenerator-similaritySearch":
      "Use embeddings for similarity search",
    "similaritySearch-llmTask": "Analyze search results with AI",
    "similaritySearch-dataOutput": "Output search results",
    "structuredOutput-dataOutput": "Output structured data",
  };

  const key = `${sourceType}-${targetType}`;
  return (
    reasons[key] ||
    (isRecommended ? "Recommended workflow pattern" : "Possible data flow")
  );
}

/**
 * Check if a connection would create a circular dependency
 */
function wouldCreateCircularDependency(
  sourceId: string,
  targetId: string,
  existingEdges: Edge[]
): boolean {
  // Add the new connection temporarily
  const tempEdges = [
    ...existingEdges,
    { source: sourceId, target: targetId } as Edge,
  ];

  // Check for cycles starting from the target using tempEdges
  return hasCycleWithEdges(targetId, tempEdges);
}

/**
 * Check for cycles using specific edges
 */
function hasCycleWithEdges(nodeId: string, edges: Edge[]): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target)) return true;
    }

    recStack.delete(nodeId);
    return false;
  }

  return hasCycle(nodeId);
}

/**
 * Get workflow health score based on connections
 */
export function getWorkflowHealthScore(
  nodes: Node<NodeData>[],
  edges: Edge[]
): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check for isolated nodes
  const connectedNodes = new Set<string>();
  edges.forEach((edge) => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  const isolatedNodes = nodes.filter((node) => !connectedNodes.has(node.id));
  if (isolatedNodes.length > 0) {
    score -= isolatedNodes.length * 10;
    issues.push(`${isolatedNodes.length} isolated node(s) found`);
    suggestions.push("Connect isolated nodes to your workflow");
  }

  // Check for input nodes without connections
  const inputNodes = nodes.filter((node) => node.data.type === "dataInput");
  const unconnectedInputs = inputNodes.filter(
    (node) => !connectedNodes.has(node.id)
  );
  if (unconnectedInputs.length > 0) {
    score -= unconnectedInputs.length * 15;
    issues.push("Input nodes are not connected");
    suggestions.push("Connect input nodes to processing nodes");
  }

  // Check for processing nodes without outputs
  const processingNodes = nodes.filter(
    (node) => !["dataInput", "dataOutput"].includes(node.data.type)
  );
  const nodesWithoutOutputs = processingNodes.filter(
    (node) => !edges.some((edge) => edge.source === node.id)
  );
  if (nodesWithoutOutputs.length > 0) {
    score -= nodesWithoutOutputs.length * 10;
    issues.push("Some processing nodes have no outputs");
    suggestions.push(
      "Connect processing nodes to outputs or other processing nodes"
    );
  }

  // Check for output nodes without inputs
  const outputNodes = nodes.filter((node) => node.data.type === "dataOutput");
  const unconnectedOutputs = outputNodes.filter(
    (node) => !connectedNodes.has(node.id)
  );
  if (unconnectedOutputs.length > 0) {
    score -= unconnectedOutputs.length * 15;
    issues.push("Output nodes are not connected");
    suggestions.push("Connect processing nodes to output nodes");
  }

  // Check for circular dependencies
  const hasCircularDependency = checkForCircularDependencies(edges);
  if (hasCircularDependency) {
    score -= 30;
    issues.push("Circular dependency detected");
    suggestions.push("Remove circular connections");
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

/**
 * Check for circular dependencies in the workflow
 */
function checkForCircularDependencies(edges: Edge[]): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target)) return true;
    }

    recStack.delete(nodeId);
    return false;
  }

  // Check all nodes for cycles
  const allNodes = new Set<string>();
  edges.forEach((edge) => {
    allNodes.add(edge.source);
    allNodes.add(edge.target);
  });

  for (const nodeId of allNodes) {
    if (hasCycle(nodeId)) return true;
  }

  return false;
}
