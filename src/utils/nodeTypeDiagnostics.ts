import { ProcessorRegistry } from "../services/processors/ProcessorRegistry";
import { WorkflowStructure } from "../types";

export interface NodeTypeDiagnostic {
  nodeType: string;
  status: "supported" | "deprecated" | "experimental" | "unsupported";
  warning?: string;
  suggestion?: string;
  similarTypes: string[];
  severity: "error" | "warning" | "info";
}

export interface WorkflowNodeTypeReport {
  totalNodes: number;
  supportedNodes: number;
  deprecatedNodes: number;
  experimentalNodes: number;
  unsupportedNodes: number;
  diagnostics: NodeTypeDiagnostic[];
  recommendations: string[];
}

/**
 * Generate comprehensive node type diagnostics for a workflow
 */
export function generateNodeTypeDiagnostics(
  workflow: WorkflowStructure
): WorkflowNodeTypeReport {
  const diagnostics: NodeTypeDiagnostic[] = [];
  const recommendations: string[] = [];

  let supportedNodes = 0;
  let deprecatedNodes = 0;
  let experimentalNodes = 0;
  let unsupportedNodes = 0;

  // Analyze each node
  workflow.nodes.forEach((node, index) => {
    const nodeType = node.type;
    const nodeStatus = ProcessorRegistry.getNodeTypeStatus(nodeType);
    const similarTypes = ProcessorRegistry.getSimilarTypes(nodeType);

    let warning: string | undefined;
    let suggestion: string | undefined;
    let severity: "error" | "warning" | "info";

    switch (nodeStatus.status) {
      case "unsupported":
        unsupportedNodes++;
        warning = `Node type '${nodeType}' is not supported`;
        suggestion =
          similarTypes.length > 0
            ? `Consider using: ${similarTypes.join(", ")}`
            : "Check documentation for supported types";
        severity = "error";
        break;

      case "deprecated":
        deprecatedNodes++;
        warning = `Node type '${nodeType}' is deprecated`;
        suggestion =
          similarTypes.length > 0
            ? `Migrate to: ${similarTypes.join(", ")}`
            : "Check migration documentation";
        severity = "warning";
        break;

      case "experimental":
        experimentalNodes++;
        warning = `Node type '${nodeType}' is experimental`;
        suggestion = "Use with caution - API may change";
        severity = "warning";
        break;

      case "supported":
        supportedNodes++;
        severity = "info";
        break;
    }

    diagnostics.push({
      nodeType,
      status: nodeStatus.status,
      warning,
      suggestion,
      similarTypes,
      severity,
    });
  });

  // Generate recommendations
  if (unsupportedNodes > 0) {
    recommendations.push(
      `Replace ${unsupportedNodes} unsupported node type(s) with supported alternatives`
    );
  }

  if (deprecatedNodes > 0) {
    recommendations.push(
      `Migrate ${deprecatedNodes} deprecated node type(s) to current versions`
    );
  }

  if (experimentalNodes > 0) {
    recommendations.push(
      `Review ${experimentalNodes} experimental node type(s) for stability`
    );
  }

  if (supportedNodes === workflow.nodes.length) {
    recommendations.push("All node types are supported and up-to-date");
  }

  return {
    totalNodes: workflow.nodes.length,
    supportedNodes,
    deprecatedNodes,
    experimentalNodes,
    unsupportedNodes,
    diagnostics,
    recommendations,
  };
}

/**
 * Get a summary of node type issues in a workflow
 */
export function getNodeTypeSummary(workflow: WorkflowStructure): {
  hasIssues: boolean;
  issueCount: number;
  warningCount: number;
  summary: string;
} {
  const report = generateNodeTypeDiagnostics(workflow);

  const errorCount = report.diagnostics.filter(
    (d) => d.severity === "error"
  ).length;
  const warningCount = report.diagnostics.filter(
    (d) => d.severity === "warning"
  ).length;

  let summary = "";
  if (errorCount > 0) {
    summary += `${errorCount} error(s) - unsupported node types`;
  }
  if (warningCount > 0) {
    summary +=
      (summary ? ", " : "") +
      `${warningCount} warning(s) - deprecated/experimental types`;
  }
  if (errorCount === 0 && warningCount === 0) {
    summary = "All node types are supported";
  }

  return {
    hasIssues: errorCount > 0 || warningCount > 0,
    issueCount: errorCount,
    warningCount,
    summary,
  };
}

/**
 * Suggest alternative node types for a given node type
 */
export function suggestAlternatives(nodeType: string): {
  alternatives: string[];
  reason: string;
} {
  const similarTypes = ProcessorRegistry.getSimilarTypes(nodeType);
  const nodeStatus = ProcessorRegistry.getNodeTypeStatus(nodeType);

  let reason = "";
  switch (nodeStatus.status) {
    case "unsupported":
      reason = "This node type is not supported";
      break;
    case "deprecated":
      reason = "This node type is deprecated";
      break;
    case "experimental":
      reason = "This node type is experimental";
      break;
    default:
      reason = "Similar functionality available";
  }

  return {
    alternatives: similarTypes,
    reason,
  };
}

/**
 * Check if a workflow can be executed without fallback processors
 */
export function canExecuteWithoutFallback(workflow: WorkflowStructure): {
  canExecute: boolean;
  fallbackNodes: string[];
  reason: string;
} {
  const unsupportedNodes = workflow.nodes.filter(
    (node) =>
      ProcessorRegistry.getNodeTypeStatus(node.type).status === "unsupported"
  );

  const fallbackNodes = unsupportedNodes.map((node) => node.label || node.type);

  return {
    canExecute: unsupportedNodes.length === 0,
    fallbackNodes,
    reason:
      unsupportedNodes.length > 0
        ? `${unsupportedNodes.length} node(s) will use fallback processing`
        : "All nodes have dedicated processors",
  };
}
