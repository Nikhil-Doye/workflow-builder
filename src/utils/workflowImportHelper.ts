import { WorkflowStructure } from "../types";
import { fixNodeIdMismatches, createNodeIdMapping } from "./workflowValidator";

export interface WorkflowImportResult {
  workflow: WorkflowStructure;
  fixesApplied: string[];
  warnings: string[];
  errors: string[];
  needsManualReview: boolean;
}

/**
 * Helper utility for importing and fixing workflows with potential node ID mismatches
 */
export class WorkflowImportHelper {
  /**
   * Import and fix a workflow, handling common ID mismatch issues
   */
  static importWorkflow(
    workflow: WorkflowStructure,
    options: {
      autoFix?: boolean;
      strictMode?: boolean;
      logFixes?: boolean;
    } = {}
  ): WorkflowImportResult {
    const { autoFix = true, strictMode = false, logFixes = false } = options;

    const result: WorkflowImportResult = {
      workflow: { ...workflow },
      fixesApplied: [],
      warnings: [],
      errors: [],
      needsManualReview: false,
    };

    // Check for common issues
    const mapping = createNodeIdMapping(workflow);

    if (mapping.suggestions.length > 0) {
      result.warnings.push(...mapping.suggestions);
    }

    // Check for duplicate node IDs
    const nodeIds = workflow.nodes.map((node) => node.id);
    const duplicateIds = nodeIds.filter(
      (id, index) => nodeIds.indexOf(id) !== index
    );

    if (duplicateIds.length > 0) {
      result.errors.push(
        `Duplicate node IDs found: ${duplicateIds.join(", ")}`
      );
      result.needsManualReview = true;
    }

    // If auto-fix is enabled, try to fix ID mismatches
    if (autoFix && result.errors.length === 0) {
      const fixResult = fixNodeIdMismatches(workflow);

      if (fixResult.fixesApplied.length > 0) {
        result.workflow = fixResult.fixedWorkflow;
        result.fixesApplied.push(...fixResult.fixesApplied);

        if (logFixes) {
          console.log("Applied workflow fixes:", fixResult.fixesApplied);
        }
      }

      if (fixResult.remainingIssues.length > 0) {
        result.warnings.push(...fixResult.remainingIssues);
        result.needsManualReview = true;
      }
    }

    // In strict mode, fail if there are any issues that couldn't be auto-fixed
    if (strictMode && (result.errors.length > 0 || result.needsManualReview)) {
      result.errors.push(
        "Workflow import failed due to strict mode validation"
      );
    }

    return result;
  }

  /**
   * Validate a workflow before import
   */
  static validateBeforeImport(workflow: WorkflowStructure): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const mapping = createNodeIdMapping(workflow);
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for duplicate IDs
    const nodeIds = workflow.nodes.map((node) => node.id);
    const duplicateIds = nodeIds.filter(
      (id, index) => nodeIds.indexOf(id) !== index
    );

    if (duplicateIds.length > 0) {
      issues.push(`Duplicate node IDs: ${duplicateIds.join(", ")}`);
    }

    // Check for edge references to non-existent nodes
    const nodeIdSet = new Set(nodeIds);
    workflow.edges.forEach((edge, index) => {
      if (!nodeIdSet.has(edge.source)) {
        issues.push(
          `Edge ${index} references non-existent source node: ${edge.source}`
        );
      }
      if (!nodeIdSet.has(edge.target)) {
        issues.push(
          `Edge ${index} references non-existent target node: ${edge.target}`
        );
      }
    });

    suggestions.push(...mapping.suggestions);

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * Generate a migration report for a workflow
   */
  static generateMigrationReport(workflow: WorkflowStructure): {
    summary: string;
    details: {
      nodeCount: number;
      edgeCount: number;
      indexBasedNodes: number;
      customNodes: number;
      duplicateIds: string[];
      orphanedNodes: string[];
    };
    recommendations: string[];
  } {
    const nodeIds = workflow.nodes.map((node) => node.id);
    const duplicateIds = nodeIds.filter(
      (id, index) => nodeIds.indexOf(id) !== index
    );

    const indexBasedNodes = workflow.nodes.filter(
      (node, index) =>
        node.id === `node-${index}` || node.id === `node_${index}`
    ).length;

    const customNodes = workflow.nodes.length - indexBasedNodes;

    // Find orphaned nodes
    const connectedNodes = new Set<string>();
    workflow.edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    const orphanedNodes = nodeIds.filter((id) => !connectedNodes.has(id));

    const recommendations: string[] = [];

    if (indexBasedNodes > 0) {
      recommendations.push(
        "Consider using more descriptive node IDs instead of index-based names"
      );
    }

    if (duplicateIds.length > 0) {
      recommendations.push(
        "Fix duplicate node IDs to prevent validation errors"
      );
    }

    if (orphanedNodes.length > 1) {
      recommendations.push(
        "Connect orphaned nodes to create a complete workflow"
      );
    }

    return {
      summary: `Workflow has ${workflow.nodes.length} nodes, ${
        workflow.edges.length
      } edges. ${
        duplicateIds.length > 0
          ? "Has issues that need attention."
          : "Ready for use."
      }`,
      details: {
        nodeCount: workflow.nodes.length,
        edgeCount: workflow.edges.length,
        indexBasedNodes,
        customNodes,
        duplicateIds,
        orphanedNodes,
      },
      recommendations,
    };
  }

  /**
   * Create a clean copy of a workflow with standardized node IDs
   */
  static standardizeNodeIds(
    workflow: WorkflowStructure,
    options: {
      prefix?: string;
      useDescriptiveNames?: boolean;
    } = {}
  ): WorkflowStructure {
    const { prefix = "node", useDescriptiveNames = true } = options;

    const nodeIdMapping = new Map<string, string>();
    const standardizedNodes = workflow.nodes.map((node, index) => {
      let newId: string;

      if (useDescriptiveNames && node.label) {
        // Create ID from label
        newId = `${prefix}-${node.label
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")}-${index}`;
      } else {
        newId = `${prefix}-${index}`;
      }

      nodeIdMapping.set(node.id, newId);

      return {
        ...node,
        id: newId,
      };
    });

    const standardizedEdges = workflow.edges.map((edge) => ({
      ...edge,
      source: nodeIdMapping.get(edge.source) || edge.source,
      target: nodeIdMapping.get(edge.target) || edge.target,
    }));

    return {
      ...workflow,
      nodes: standardizedNodes,
      edges: standardizedEdges,
    };
  }
}
