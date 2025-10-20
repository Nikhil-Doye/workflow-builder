import {
  WorkflowStructure,
  ValidationResult,
  MixedValidationResult,
  WorkflowNodeStructure,
} from "../types";
import { ProcessorRegistry } from "../services/processors/ProcessorRegistry";

/**
 * Validate generated workflow structure
 */
export function validateWorkflowStructure(
  workflow: WorkflowStructure,
  originalInput: string
): ValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for required input/output nodes
  const hasInput = workflow.nodes.some((n) => n.type === "dataInput");
  const hasOutput = workflow.nodes.some((n) => n.type === "dataOutput");

  if (!hasInput) {
    issues.push("Workflow needs an input node");
    suggestions.push("Add a data input node to start the workflow");
  }

  if (!hasOutput) {
    issues.push("Workflow needs an output node");
    suggestions.push("Add a data output node to capture results");
  }

  // Check for logical flow
  const webScrapingNodes = workflow.nodes.filter(
    (n) => n.type === "webScraping"
  );
  const llmNodes = workflow.nodes.filter((n) => n.type === "llmTask");

  if (webScrapingNodes.length > 0 && llmNodes.length > 0) {
    // Check if LLM nodes come after web scraping
    const webScrapingPositions = webScrapingNodes.map((n) =>
      workflow.nodes.indexOf(n)
    );
    const llmPositions = llmNodes.map((n) => workflow.nodes.indexOf(n));

    const allLLMAfterScraping = llmPositions.every((llmPos) =>
      webScrapingPositions.some((scrapePos) => llmPos > scrapePos)
    );

    if (!allLLMAfterScraping) {
      issues.push("AI analysis nodes should come after web scraping nodes");
      suggestions.push(
        "Reorder nodes so that data extraction happens before analysis"
      );
    }
  }

  // Check for proper node connections
  const connectionIssues = validateNodeConnections(workflow);
  issues.push(...connectionIssues.issues);
  suggestions.push(...connectionIssues.suggestions);

  // Check for configuration completeness
  const configIssues = validateNodeConfigurations(workflow);
  issues.push(...configIssues.issues);
  suggestions.push(...configIssues.suggestions);

  // Check for circular dependencies
  const circularDeps = detectCircularDependencies(workflow);
  if (circularDeps.length > 0) {
    issues.push("Circular dependencies detected in workflow");
    suggestions.push("Remove circular connections between nodes");
  }

  // Check for unique node labels
  const labelValidation = validateNodeLabels(workflow);
  issues.push(...labelValidation.issues);
  suggestions.push(...labelValidation.suggestions);

  // Check for unsupported node types
  const nodeTypeValidation = validateNodeTypes(workflow);
  issues.push(...nodeTypeValidation.issues);
  suggestions.push(...nodeTypeValidation.suggestions);

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    complexity: workflow.complexity,
    estimatedExecutionTime: workflow.estimatedExecutionTime,
  };
}

/**
 * Validate mixed workflow structure
 */
export function validateMixedWorkflow(
  workflow: WorkflowStructure,
  originalInput: string
): MixedValidationResult {
  const baseValidation = validateWorkflowStructure(workflow, originalInput);

  // Additional mixed workflow specific validations
  const mixedIssues: string[] = [];
  const mixedSuggestions: string[] = [];

  // Check for proper data flow in mixed workflows
  const dataFlowIssues = validateDataFlow(workflow);
  mixedIssues.push(...dataFlowIssues.issues);
  mixedSuggestions.push(...dataFlowIssues.suggestions);

  // Check for resource conflicts
  const resourceIssues = validateResourceUsage(workflow);
  mixedIssues.push(...resourceIssues.issues);
  mixedSuggestions.push(...resourceIssues.suggestions);

  return {
    ...baseValidation,
    issues: [...baseValidation.issues, ...mixedIssues],
    suggestions: [...baseValidation.suggestions, ...mixedSuggestions],
    complexity: workflow.complexity,
    estimatedExecutionTime: workflow.estimatedExecutionTime || 0,
  };
}

/**
 * Validate node connections
 */
function validateNodeConnections(workflow: WorkflowStructure): {
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Get actual node IDs from the workflow structure
  const nodeIds = new Set(workflow.nodes.map((node) => node.id));
  const nodeIdToIndex = new Map(
    workflow.nodes.map((node, index) => [node.id, index])
  );

  // Check if all edges reference existing nodes
  workflow.edges.forEach((edge, index) => {
    if (!nodeIds.has(edge.source)) {
      issues.push(
        `Edge ${index} references non-existent source node: ${edge.source}`
      );
      suggestions.push(
        `Available source nodes: ${Array.from(nodeIds).join(", ")}`
      );
    }

    if (!nodeIds.has(edge.target)) {
      issues.push(
        `Edge ${index} references non-existent target node: ${edge.target}`
      );
      suggestions.push(
        `Available target nodes: ${Array.from(nodeIds).join(", ")}`
      );
    }
  });

  // Check for orphaned nodes
  const connectedNodes = new Set<string>();
  workflow.edges.forEach((edge) => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  const orphanedNodes = Array.from(nodeIds).filter(
    (nodeId) => !connectedNodes.has(nodeId)
  );
  if (orphanedNodes.length > 1) {
    // Allow one orphaned node (usually the output)
    issues.push(`Orphaned nodes detected: ${orphanedNodes.join(", ")}`);
    suggestions.push("Connect all nodes in the workflow");
  }

  return { issues, suggestions };
}

/**
 * Create a mapping between old and new node IDs for workflow migration
 */
export function createNodeIdMapping(workflow: WorkflowStructure): {
  oldToNew: Map<string, string>;
  newToOld: Map<string, string>;
  suggestions: string[];
} {
  const oldToNew = new Map<string, string>();
  const newToOld = new Map<string, string>();
  const suggestions: string[] = [];

  // Check for index-based naming patterns that should be migrated
  const indexBasedNodes = workflow.nodes.filter(
    (node, index) => node.id === `node-${index}` || node.id === `node_${index}`
  );

  if (indexBasedNodes.length > 0) {
    suggestions.push(
      `Found ${indexBasedNodes.length} nodes with index-based IDs. Consider using more descriptive names.`
    );
  }

  // Check for duplicate IDs
  const nodeIds = workflow.nodes.map((node) => node.id);
  const duplicateIds = nodeIds.filter(
    (id, index) => nodeIds.indexOf(id) !== index
  );

  if (duplicateIds.length > 0) {
    suggestions.push(
      `Found duplicate node IDs: ${duplicateIds.join(
        ", "
      )}. These will cause validation errors.`
    );
  }

  // Create mapping for any ID corrections needed
  workflow.nodes.forEach((node, index) => {
    const currentId = node.id;
    const suggestedId = `node-${index}`;

    if (currentId !== suggestedId) {
      oldToNew.set(currentId, suggestedId);
      newToOld.set(suggestedId, currentId);
    }
  });

  return { oldToNew, newToOld, suggestions };
}

/**
 * Fix node ID mismatches in edges by updating edge references
 */
export function fixNodeIdMismatches(workflow: WorkflowStructure): {
  fixedWorkflow: WorkflowStructure;
  fixesApplied: string[];
  remainingIssues: string[];
} {
  const fixesApplied: string[] = [];
  const remainingIssues: string[] = [];

  // Get actual node IDs
  const nodeIds = new Set(workflow.nodes.map((node) => node.id));

  // Create a mapping for common ID patterns
  const idMappings = new Map<string, string>();

  // Try to find matches for missing node IDs
  const missingNodeIds = new Set<string>();
  workflow.edges.forEach((edge) => {
    if (!nodeIds.has(edge.source)) missingNodeIds.add(edge.source);
    if (!nodeIds.has(edge.target)) missingNodeIds.add(edge.target);
  });

  // Try to find close matches
  missingNodeIds.forEach((missingId) => {
    const possibleMatches = Array.from(nodeIds).filter((existingId) => {
      // Check for common patterns
      return (
        existingId.includes(missingId) ||
        missingId.includes(existingId) ||
        existingId.toLowerCase() === missingId.toLowerCase()
      );
    });

    if (possibleMatches.length === 1) {
      idMappings.set(missingId, possibleMatches[0]);
      fixesApplied.push(`Mapped ${missingId} to ${possibleMatches[0]}`);
    } else if (possibleMatches.length > 1) {
      remainingIssues.push(
        `Multiple possible matches for ${missingId}: ${possibleMatches.join(
          ", "
        )}`
      );
    } else {
      remainingIssues.push(`No match found for ${missingId}`);
    }
  });

  // Apply fixes to edges
  const fixedEdges = workflow.edges.map((edge) => ({
    ...edge,
    source: idMappings.get(edge.source) || edge.source,
    target: idMappings.get(edge.target) || edge.target,
  }));

  const fixedWorkflow = {
    ...workflow,
    edges: fixedEdges,
  };

  return { fixedWorkflow, fixesApplied, remainingIssues };
}

/**
 * Validate node configurations
 */
function validateNodeConfigurations(workflow: WorkflowStructure): {
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  workflow.nodes.forEach((node, index) => {
    const nodeIssues = validateSingleNodeConfiguration(node, index);
    issues.push(...nodeIssues.issues);
    suggestions.push(...nodeIssues.suggestions);
  });

  return { issues, suggestions };
}

/**
 * Validate single node configuration
 */
function validateSingleNodeConfiguration(
  node: WorkflowNodeStructure,
  index: number
): { issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];

  switch (node.type) {
    case "webScraping":
      if (!node.config.url) {
        issues.push(`Web scraping node ${index} missing URL configuration`);
        suggestions.push("Configure URL for web scraping node");
      }
      break;

    case "llmTask":
      if (!node.config.prompt) {
        issues.push(`LLM task node ${index} missing prompt configuration`);
        suggestions.push("Configure prompt for LLM task node");
      }
      if (!node.config.model) {
        issues.push(`LLM task node ${index} missing model configuration`);
        suggestions.push("Configure model for LLM task node");
      }
      break;

    case "structuredOutput":
      if (!node.config.schema) {
        issues.push(
          `Structured output node ${index} missing schema configuration`
        );
        suggestions.push("Configure JSON schema for structured output node");
      }
      break;

    case "similaritySearch":
      if (!node.config.vectorStore) {
        issues.push(
          `Similarity search node ${index} missing vector store configuration`
        );
        suggestions.push("Configure vector store for similarity search node");
      }
      break;

    case "dataInput":
      if (!node.config.dataType) {
        issues.push(`Data input node ${index} missing data type configuration`);
        suggestions.push("Configure data type for input node");
      }
      break;

    case "dataOutput":
      if (!node.config.format) {
        issues.push(`Data output node ${index} missing format configuration`);
        suggestions.push("Configure output format for data output node");
      }
      break;
  }

  return { issues, suggestions };
}

/**
 * Validate data flow in mixed workflows
 */
function validateDataFlow(workflow: WorkflowStructure): {
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for data type compatibility between connected nodes
  const dataTypeCompatibility = checkDataTypeCompatibility(workflow);
  issues.push(...dataTypeCompatibility.issues);
  suggestions.push(...dataTypeCompatibility.suggestions);

  // Check for variable substitution validity
  const variableIssues = validateVariableSubstitution(workflow);
  issues.push(...variableIssues.issues);
  suggestions.push(...variableIssues.suggestions);

  return { issues, suggestions };
}

/**
 * Check data type compatibility between nodes
 */
function checkDataTypeCompatibility(workflow: WorkflowStructure): {
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // This is a simplified check - in a real implementation, you'd have more sophisticated type checking
  const outputNodes = workflow.nodes.filter((n) => n.type === "dataOutput");
  const inputNodes = workflow.nodes.filter((n) => n.type === "dataInput");

  if (outputNodes.length === 0) {
    issues.push("No output nodes found for data flow");
    suggestions.push("Add data output nodes to complete the workflow");
  }

  if (inputNodes.length === 0) {
    issues.push("No input nodes found for data flow");
    suggestions.push("Add data input nodes to start the workflow");
  }

  return { issues, suggestions };
}

/**
 * Validate variable substitution in configurations
 */
function validateVariableSubstitution(workflow: WorkflowStructure): {
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const variablePattern = /\{\{([^}]+)\}\}/g;

  workflow.nodes.forEach((node, index) => {
    Object.entries(node.config).forEach(([key, value]) => {
      if (typeof value === "string") {
        const matches = value.match(variablePattern);
        if (matches) {
          matches.forEach((match) => {
            const variable = match.slice(2, -2); // Remove {{ and }}
            if (!isValidVariableReference(variable, workflow)) {
              issues.push(
                `Node ${index} has invalid variable reference: ${match}`
              );
              suggestions.push(
                `Check variable reference ${match} in node configuration`
              );
            }
          });
        }
      }
    });
  });

  return { issues, suggestions };
}

/**
 * Check if variable reference is valid
 */
function isValidVariableReference(
  variable: string,
  workflow: WorkflowStructure
): boolean {
  // Check if variable references a valid node output
  const nodeOutputPattern = /^node-\d+\.output$/;
  const simpleOutputPattern = /^input\.output$/;

  return nodeOutputPattern.test(variable) || simpleOutputPattern.test(variable);
}

/**
 * Validate that all node labels are unique within the workflow
 */
function validateNodeLabels(workflow: WorkflowStructure): {
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const labelCounts = new Map<string, number>();
  const duplicateLabels: string[] = [];

  // Count occurrences of each label
  workflow.nodes.forEach((node, index) => {
    const label = node.label || `Node ${index + 1}`;
    const count = labelCounts.get(label) || 0;
    labelCounts.set(label, count + 1);

    if (count > 0) {
      duplicateLabels.push(label);
    }
  });

  // Report duplicate labels
  if (duplicateLabels.length > 0) {
    const uniqueDuplicates = [...new Set(duplicateLabels)];
    issues.push(`Duplicate node labels found: ${uniqueDuplicates.join(", ")}`);
    suggestions.push(
      "Make sure each node has a unique label for variable substitution to work properly"
    );
  }

  // Check for empty labels
  const emptyLabels = workflow.nodes.filter(
    (node, index) => !node.label || node.label.trim() === ""
  );
  if (emptyLabels.length > 0) {
    issues.push(`${emptyLabels.length} nodes have empty labels`);
    suggestions.push(
      "Give each node a descriptive label for better variable substitution"
    );
  }

  return { issues, suggestions };
}

/**
 * Detect circular dependencies
 */
function detectCircularDependencies(workflow: WorkflowStructure): string[] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const circularDeps: string[] = [];

  const nodeIds = workflow.nodes.map((_, index) => `node-${index}`);

  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = workflow.edges.filter(
      (edge) => edge.source === nodeId
    );
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target)) {
        circularDeps.push(`${nodeId} -> ${edge.target}`);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      hasCycle(nodeId);
    }
  }

  return circularDeps;
}

/**
 * Validate resource usage
 */
function validateResourceUsage(workflow: WorkflowStructure): {
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for excessive API calls
  const llmNodes = workflow.nodes.filter((n) => n.type === "llmTask");
  const webScrapingNodes = workflow.nodes.filter(
    (n) => n.type === "webScraping"
  );

  if (llmNodes.length > 5) {
    issues.push("Too many LLM nodes may cause rate limiting");
    suggestions.push("Consider consolidating LLM operations or adding delays");
  }

  if (webScrapingNodes.length > 3) {
    issues.push("Too many web scraping nodes may cause rate limiting");
    suggestions.push("Consider batching web scraping operations");
  }

  // Check for memory-intensive operations
  const embeddingNodes = workflow.nodes.filter(
    (n) => n.type === "embeddingGenerator"
  );
  if (embeddingNodes.length > 2) {
    issues.push("Multiple embedding operations may consume significant memory");
    suggestions.push("Consider caching embeddings or reducing batch sizes");
  }

  return { issues, suggestions };
}

/**
 * Generate improvement suggestions
 */
export function generateImprovementSuggestions(
  workflow: WorkflowStructure
): string[] {
  const suggestions: string[] = [];

  // Performance suggestions
  if (workflow.nodes.length > 8) {
    suggestions.push(
      "Consider breaking down this workflow into smaller, more manageable parts"
    );
  }

  // Error handling suggestions
  const hasErrorHandling = workflow.nodes.some(
    (n) => n.config.errorHandling || n.config.fallback
  );

  if (!hasErrorHandling && workflow.complexity === "high") {
    suggestions.push("Add error handling for complex workflows");
  }

  // Optimization suggestions
  const llmNodes = workflow.nodes.filter((n) => n.type === "llmTask");
  if (llmNodes.length > 1) {
    suggestions.push(
      "Consider using a single LLM node with multiple prompts for better efficiency"
    );
  }

  return suggestions;
}

/**
 * Validate workflow against user requirements
 */
export function validateAgainstRequirements(
  workflow: WorkflowStructure,
  originalInput: string,
  requirements: string[]
): ValidationResult {
  const baseValidation = validateWorkflowStructure(workflow, originalInput);
  const requirementIssues: string[] = [];
  const requirementSuggestions: string[] = [];

  // Check if workflow addresses user requirements
  requirements.forEach((requirement) => {
    if (!workflowAddressesRequirement(workflow, requirement)) {
      requirementIssues.push(
        `Workflow may not address requirement: ${requirement}`
      );
      requirementSuggestions.push(
        `Consider adding nodes to handle: ${requirement}`
      );
    }
  });

  return {
    ...baseValidation,
    issues: [...baseValidation.issues, ...requirementIssues],
    suggestions: [...baseValidation.suggestions, ...requirementSuggestions],
  };
}

/**
 * Check if workflow addresses a specific requirement
 */
function workflowAddressesRequirement(
  workflow: WorkflowStructure,
  requirement: string
): boolean {
  const requirementLower = requirement.toLowerCase();

  // Check node types
  const nodeTypes = workflow.nodes.map((n) => n.type);

  if (
    requirementLower.includes("scrape") &&
    !nodeTypes.includes("webScraping")
  ) {
    return false;
  }

  if (requirementLower.includes("analyze") && !nodeTypes.includes("llmTask")) {
    return false;
  }

  if (
    requirementLower.includes("convert") &&
    !nodeTypes.includes("structuredOutput")
  ) {
    return false;
  }

  if (
    requirementLower.includes("search") &&
    !nodeTypes.includes("similaritySearch")
  ) {
    return false;
  }

  return true;
}

/**
 * Validate node types in the workflow
 */
function validateNodeTypes(workflow: WorkflowStructure): {
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  workflow.nodes.forEach((node, index) => {
    const nodeType = node.type;
    const nodeStatus = ProcessorRegistry.getNodeTypeStatus(nodeType);
    const similarTypes = ProcessorRegistry.getSimilarTypes(nodeType);

    switch (nodeStatus.status) {
      case "unsupported":
        issues.push(
          `Node ${index + 1} (${
            node.label || nodeType
          }) uses unsupported node type: ${nodeType}`
        );
        if (similarTypes.length > 0) {
          suggestions.push(
            `Consider replacing '${nodeType}' with one of these supported types: ${similarTypes.join(
              ", "
            )}`
          );
        } else {
          suggestions.push(
            `Node type '${nodeType}' is not supported. Check the documentation for available node types.`
          );
        }
        break;

      case "deprecated":
        issues.push(
          `Node ${index + 1} (${
            node.label || nodeType
          }) uses deprecated node type: ${nodeType}`
        );
        if (similarTypes.length > 0) {
          suggestions.push(
            `Consider migrating '${nodeType}' to: ${similarTypes.join(", ")}`
          );
        } else {
          suggestions.push(
            `Node type '${nodeType}' is deprecated. Check the documentation for migration guidance.`
          );
        }
        break;

      case "experimental":
        // Experimental types are warnings, not errors
        suggestions.push(
          `Node ${index + 1} (${
            node.label || nodeType
          }) uses experimental node type: ${nodeType}. Use with caution.`
        );
        break;

      case "supported":
        // No issues for supported types
        break;
    }
  });

  // Check for mixed deprecated and supported types
  const deprecatedNodes = workflow.nodes.filter(
    (node) =>
      ProcessorRegistry.getNodeTypeStatus(node.type).status === "deprecated"
  );
  const unsupportedNodes = workflow.nodes.filter(
    (node) =>
      ProcessorRegistry.getNodeTypeStatus(node.type).status === "unsupported"
  );

  if (
    deprecatedNodes.length > 0 &&
    workflow.nodes.length > deprecatedNodes.length
  ) {
    suggestions.push(
      `Workflow contains ${deprecatedNodes.length} deprecated node type(s). Consider updating to supported alternatives.`
    );
  }

  if (unsupportedNodes.length > 0) {
    issues.push(
      `Workflow contains ${unsupportedNodes.length} unsupported node type(s). These will use fallback processing.`
    );
  }

  return { issues, suggestions };
}
