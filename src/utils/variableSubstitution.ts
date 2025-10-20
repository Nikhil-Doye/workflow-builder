/**
 * Variable substitution utility for workflow nodes
 * Handles patterns like {{nodeId.output}}, {{nodeId.data}}, etc.
 */

export interface NodeOutput {
  nodeId: string;
  output?: any;
  data?: any;
  error?: string;
  status?: string;
}

/**
 * Substitute variables in a string with actual node outputs
 * @param template - String containing variables like {{nodeId.output}}
 * @param nodeOutputs - Map of node outputs keyed by node ID
 * @param nodeLabelToId - Optional mapping from friendly names to node IDs
 * @returns String with variables substituted
 */
export const substituteVariables = (
  template: string,
  nodeOutputs: Map<string, NodeOutput>,
  nodeLabelToId?: Map<string, string>
): string => {
  if (!template || typeof template !== "string") {
    return template;
  }

  // Pattern to match {{nodeId.property}} or {{nodeId}}
  const variablePattern = /\{\{([^}]+)\}\}/g;

  return template.replace(variablePattern, (match, variablePath) => {
    const trimmedPath = variablePath.trim();

    // Handle different variable patterns
    if (trimmedPath.includes(".")) {
      // Pattern: {{nodeId.property}}
      const [nodeIdOrLabel, property] = trimmedPath.split(".", 2);

      // Try to resolve the node ID from the label mapping first
      let actualNodeId = nodeIdOrLabel;
      if (nodeLabelToId && nodeLabelToId.has(nodeIdOrLabel)) {
        actualNodeId = nodeLabelToId.get(nodeIdOrLabel)!;
      }

      const nodeOutput = nodeOutputs.get(actualNodeId);

      if (!nodeOutput) {
        console.warn(
          `Node ${nodeIdOrLabel} (${actualNodeId}) not found for variable ${match}`
        );
        console.warn(
          `Available nodes: ${Array.from(nodeOutputs.keys()).join(", ")}`
        );
        return match; // Return original if node not found
      }

      // Handle different property types
      switch (property) {
        case "output":
          return nodeOutput.output ? String(nodeOutput.output) : "";
        case "data":
          return nodeOutput.data ? String(nodeOutput.data) : "";
        case "error":
          return nodeOutput.error ? String(nodeOutput.error) : "";
        case "status":
          return nodeOutput.status ? String(nodeOutput.status) : "";
        default:
          // Try to access nested property
          try {
            const value = getNestedProperty(nodeOutput, property);
            return value ? String(value) : "";
          } catch (error) {
            console.warn(
              `Property ${property} not found in node ${nodeIdOrLabel}`
            );
            return match;
          }
      }
    } else {
      // Pattern: {{nodeId}} - return the entire output
      // Try to resolve the node ID from the label mapping first
      let actualNodeId = trimmedPath;
      if (nodeLabelToId && nodeLabelToId.has(trimmedPath)) {
        actualNodeId = nodeLabelToId.get(trimmedPath)!;
      }

      const nodeOutput = nodeOutputs.get(actualNodeId);
      if (!nodeOutput) {
        console.warn(
          `Node ${trimmedPath} (${actualNodeId}) not found for variable ${match}`
        );
        console.warn(
          `Available nodes: ${Array.from(nodeOutputs.keys()).join(", ")}`
        );
        return match;
      }
      return nodeOutput.output ? String(nodeOutput.output) : "";
    }
  });
};

/**
 * Get nested property from an object using dot notation
 * @param obj - Object to get property from
 * @param path - Dot-separated property path
 * @returns Property value or undefined
 */
const getNestedProperty = (obj: any, path: string): any => {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

/**
 * Extract all variable references from a string
 * @param template - String to analyze
 * @returns Array of variable references found
 */
export const extractVariables = (template: string): string[] => {
  if (!template || typeof template !== "string") {
    return [];
  }

  const variablePattern = /\{\{([^}]+)\}\}/g;
  const matches = [];
  let match;

  while ((match = variablePattern.exec(template)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
};

/**
 * Check if a string contains variables
 * @param template - String to check
 * @returns True if string contains variables
 */
export const hasVariables = (template: string): boolean => {
  return /\{\{[^}]+\}\}/.test(template);
};

/**
 * Validate that all variables in a template have corresponding node outputs
 * @param template - String containing variables
 * @param nodeOutputs - Map of available node outputs
 * @param nodeLabelToId - Optional mapping from node labels to node IDs
 * @returns Object with validation results
 */
export const validateVariables = (
  template: string,
  nodeOutputs: Map<string, NodeOutput>,
  nodeLabelToId?: Map<string, string>
): {
  isValid: boolean;
  missingNodes: string[];
  availableNodes: string[];
  availableLabels: string[];
} => {
  const variables = extractVariables(template);
  const missingNodes: string[] = [];
  const availableNodes = Array.from(nodeOutputs.keys());
  const availableLabels = nodeLabelToId ? Array.from(nodeLabelToId.keys()) : [];

  variables.forEach((variable) => {
    const nodeIdOrLabel = variable.includes(".")
      ? variable.split(".")[0]
      : variable;

    // Check if it's a node ID
    if (nodeOutputs.has(nodeIdOrLabel)) {
      return; // Node ID exists
    }

    // Check if it's a node label
    if (nodeLabelToId && nodeLabelToId.has(nodeIdOrLabel)) {
      const actualNodeId = nodeLabelToId.get(nodeIdOrLabel)!;
      if (nodeOutputs.has(actualNodeId)) {
        return; // Node label exists and maps to valid node
      }
    }

    // Neither node ID nor label found
    missingNodes.push(nodeIdOrLabel);
  });

  return {
    isValid: missingNodes.length === 0,
    missingNodes,
    availableNodes,
    availableLabels,
  };
};
