import { Workflow, WorkflowNode } from "../types";

export interface LabelDependency {
  nodeId: string;
  nodeLabel: string;
  references: VariableReference[];
}

export interface VariableReference {
  targetNodeId: string;
  targetNodeLabel: string;
  property: string;
  fullReference: string;
  context: string; // The field where the reference is used (e.g., 'prompt', 'url', etc.)
}

export interface LabelChangeImpact {
  hasDependencies: boolean;
  dependencies: LabelDependency[];
  affectedNodes: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Utility class for managing label dependencies and variable references
 */
export class LabelDependencyManager {
  /**
   * Find all variable references to a specific node label in the workflow
   */
  static findLabelDependencies(
    workflow: Workflow,
    targetNodeId: string,
    targetNodeLabel: string
  ): LabelDependency[] {
    const dependencies: LabelDependency[] = [];
    const variablePattern = /\{\{([^}]+)\}\}/g;

    workflow.nodes.forEach((node) => {
      if (node.id === targetNodeId) return; // Skip the target node itself

      const references: VariableReference[] = [];

      // Search through all string properties in the node's config
      this.findReferencesInObject(
        node.data.config || {},
        node,
        targetNodeLabel,
        references,
        variablePattern
      );

      // Also search in the node's data properties
      this.findReferencesInObject(
        node.data,
        node,
        targetNodeLabel,
        references,
        variablePattern
      );

      if (references.length > 0) {
        dependencies.push({
          nodeId: node.id,
          nodeLabel: node.data.label || node.id,
          references,
        });
      }
    });

    return dependencies;
  }

  /**
   * Recursively search for variable references in an object
   */
  private static findReferencesInObject(
    obj: any,
    node: WorkflowNode,
    targetLabel: string,
    references: VariableReference[],
    variablePattern: RegExp,
    context: string = ""
  ): void {
    if (typeof obj === "string") {
      let match;
      while ((match = variablePattern.exec(obj)) !== null) {
        const variablePath = match[1].trim();

        // Check if this reference uses the target label
        if (this.isReferenceToLabel(variablePath, targetLabel)) {
          const [nodeIdOrLabel, property] = variablePath.includes(".")
            ? variablePath.split(".", 2)
            : [variablePath, "output"];

          references.push({
            targetNodeId: node.id,
            targetNodeLabel: node.data.label || node.id,
            property: property || "output",
            fullReference: match[0],
            context: context || "config",
          });
        }
      }
    } else if (typeof obj === "object" && obj !== null) {
      Object.keys(obj).forEach((key) => {
        this.findReferencesInObject(
          obj[key],
          node,
          targetLabel,
          references,
          variablePattern,
          context || key
        );
      });
    }
  }

  /**
   * Check if a variable path references a specific label
   */
  private static isReferenceToLabel(
    variablePath: string,
    targetLabel: string
  ): boolean {
    const [nodeIdOrLabel] = variablePath.includes(".")
      ? variablePath.split(".", 2)
      : [variablePath];

    return nodeIdOrLabel === targetLabel;
  }

  /**
   * Analyze the impact of changing a node label
   */
  static analyzeLabelChangeImpact(
    workflow: Workflow,
    nodeId: string,
    oldLabel: string,
    newLabel: string
  ): LabelChangeImpact {
    const dependencies = this.findLabelDependencies(workflow, nodeId, oldLabel);
    const affectedNodes = dependencies.map((dep) => dep.nodeId);

    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (dependencies.length > 0) {
      warnings.push(
        `Changing label "${oldLabel}" to "${newLabel}" will break ${dependencies.length} variable reference(s)`
      );

      dependencies.forEach((dep) => {
        dep.references.forEach((ref) => {
          warnings.push(
            `• Node "${dep.nodeLabel}" uses {{${oldLabel}.${ref.property}}} in ${ref.context}`
          );
        });
      });

      suggestions.push(
        "Consider using the 'Update References' option to automatically fix broken references"
      );
      suggestions.push(
        "Or manually update the variable references in the affected nodes"
      );
    }

    return {
      hasDependencies: dependencies.length > 0,
      dependencies,
      affectedNodes,
      warnings,
      suggestions,
    };
  }

  /**
   * Update all variable references from old label to new label
   */
  static updateLabelReferences(
    workflow: Workflow,
    nodeId: string,
    oldLabel: string,
    newLabel: string
  ): Workflow {
    const updatedWorkflow = { ...workflow };
    const variablePattern = /\{\{([^}]+)\}\}/g;

    updatedWorkflow.nodes = workflow.nodes.map((node) => {
      if (node.id === nodeId) {
        // Update the target node's label
        return {
          ...node,
          data: {
            ...node.data,
            label: newLabel,
          },
        };
      }

      // Update references in other nodes
      const updatedNode = { ...node };
      updatedNode.data = this.updateReferencesInObject(
        node.data,
        oldLabel,
        newLabel,
        variablePattern
      );

      return updatedNode;
    });

    return updatedWorkflow;
  }

  /**
   * Recursively update variable references in an object
   */
  private static updateReferencesInObject(
    obj: any,
    oldLabel: string,
    newLabel: string,
    variablePattern: RegExp
  ): any {
    if (typeof obj === "string") {
      return obj.replace(variablePattern, (match, variablePath) => {
        const trimmedPath = variablePath.trim();
        const [nodeIdOrLabel, property] = trimmedPath.includes(".")
          ? trimmedPath.split(".", 2)
          : [trimmedPath, "output"];

        if (nodeIdOrLabel === oldLabel) {
          return `{{${newLabel}${property ? `.${property}` : ""}}}`;
        }
        return match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map((item) =>
        this.updateReferencesInObject(item, oldLabel, newLabel, variablePattern)
      );
    } else if (typeof obj === "object" && obj !== null) {
      const updatedObj = { ...obj };
      Object.keys(updatedObj).forEach((key) => {
        updatedObj[key] = this.updateReferencesInObject(
          updatedObj[key],
          oldLabel,
          newLabel,
          variablePattern
        );
      });
      return updatedObj;
    }

    return obj;
  }

  /**
   * Get all variable references in a workflow
   */
  static getAllVariableReferences(
    workflow: Workflow
  ): Map<string, VariableReference[]> {
    const allReferences = new Map<string, VariableReference[]>();
    const variablePattern = /\{\{([^}]+)\}\}/g;

    workflow.nodes.forEach((node) => {
      const references: VariableReference[] = [];

      this.findReferencesInObject(
        node.data.config || {},
        node,
        "",
        references,
        variablePattern
      );
      this.findReferencesInObject(
        node.data,
        node,
        "",
        references,
        variablePattern
      );

      if (references.length > 0) {
        allReferences.set(node.id, references);
      }
    });

    return allReferences;
  }

  /**
   * Validate that all variable references in a workflow are valid
   */
  static validateVariableReferences(workflow: Workflow): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const nodeLabels = new Map<string, string>(); // nodeId -> label mapping

    // Build node label mapping
    workflow.nodes.forEach((node) => {
      nodeLabels.set(node.id, node.data.label || node.id);
    });

    const allReferences = this.getAllVariableReferences(workflow);

    allReferences.forEach((references, nodeId) => {
      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      references.forEach((ref) => {
        const [nodeIdOrLabel] = ref.fullReference
          .replace(/[{}]/g, "")
          .split(".", 2);

        // Check if the referenced node exists
        const referencedNode = workflow.nodes.find(
          (n) => n.id === nodeIdOrLabel || n.data.label === nodeIdOrLabel
        );

        if (!referencedNode) {
          errors.push(
            `Node "${
              node.data.label || nodeId
            }" references non-existent node "${nodeIdOrLabel}"`
          );
        } else {
          // Check if the reference uses the correct identifier
          if (
            nodeIdOrLabel !== referencedNode.id &&
            nodeIdOrLabel !== referencedNode.data.label
          ) {
            warnings.push(
              `Node "${
                node.data.label || nodeId
              }" uses ambiguous reference "${nodeIdOrLabel}" (could be ID or label)`
            );
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
