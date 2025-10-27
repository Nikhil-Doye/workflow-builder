/**
 * Comprehensive Workflow Validation Engine
 * Validates workflows before execution to prevent runtime failures
 */

export interface ValidationIssue {
  id: string;
  severity: "error" | "warning";
  type:
    | "empty_workflow"
    | "no_input_node"
    | "no_output_node"
    | "disconnected_node"
    | "unreachable_node"
    | "dangling_node"
    | "circular_dependency"
    | "self_loop"
    | "invalid_edge"
    | "no_execution_path"
    | "isolated_component";
  nodeIds?: string[];
  message: string;
  suggestion: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    inputNodes: number;
    outputNodes: number;
    connectedComponents: number;
  };
}

export class WorkflowValidationEngine {
  /**
   * Comprehensive workflow validation
   */
  validate(nodes: any[], edges: any[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        inputNodes: 0,
        outputNodes: 0,
        connectedComponents: 0,
      },
    };

    // Check for empty workflow
    if (!nodes || nodes.length === 0) {
      result.isValid = false;
      result.errors.push({
        id: "empty_workflow",
        severity: "error",
        type: "empty_workflow",
        message: "Workflow contains no nodes",
        suggestion: "Add at least one node to the workflow",
      });
      return result;
    }

    // Build node ID set and categorize nodes
    const nodeIds = new Set(nodes.map((n) => n.id));
    const nodeTypes = new Map(nodes.map((n) => [n.id, n.data?.type || n.type]));
    const inputNodes = nodes.filter(
      (n) => n.data?.type === "dataInput" || n.type === "dataInput"
    );
    const outputNodes = nodes.filter(
      (n) => n.data?.type === "dataOutput" || n.type === "dataOutput"
    );

    result.stats.inputNodes = inputNodes.length;
    result.stats.outputNodes = outputNodes.length;

    // Check for input nodes
    if (inputNodes.length === 0) {
      result.errors.push({
        id: "no_input_node",
        severity: "error",
        type: "no_input_node",
        message: "Workflow has no input node (dataInput)",
        suggestion:
          "Add a Data Input node to provide initial data to the workflow",
      });
      result.isValid = false;
    }

    // Check for output nodes
    if (outputNodes.length === 0) {
      result.errors.push({
        id: "no_output_node",
        severity: "error",
        type: "no_output_node",
        message: "Workflow has no output node (dataOutput)",
        suggestion: "Add a Data Output node to collect workflow results",
      });
      result.isValid = false;
    }

    // Validate edges exist and reference valid nodes
    const edgeIds = new Set<string>();
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    const adjacencyList = new Map<string, Set<string>>();
    const reverseAdjacencyList = new Map<string, Set<string>>();

    // Initialize degree maps
    nodeIds.forEach((id) => {
      inDegree.set(id, 0);
      outDegree.set(id, 0);
      adjacencyList.set(id, new Set());
      reverseAdjacencyList.set(id, new Set());
    });

    // Build graph and validate edges
    for (const edge of edges) {
      // Check edge properties
      if (!edge.id || !edge.source || !edge.target) {
        result.isValid = false;
        result.errors.push({
          id: `invalid_edge_${edge.id || "unknown"}`,
          severity: "error",
          type: "invalid_edge",
          message: `Edge missing required properties: ${
            !edge.id ? "id" : !edge.source ? "source" : "target"
          }`,
          suggestion: "Ensure all edges have id, source, and target properties",
        });
        continue;
      }

      // Check for duplicate edge IDs
      if (edgeIds.has(edge.id)) {
        result.isValid = false;
        result.errors.push({
          id: `duplicate_edge_${edge.id}`,
          severity: "error",
          type: "invalid_edge",
          message: `Duplicate edge ID: ${edge.id}`,
          suggestion: "Each edge must have a unique ID",
        });
        continue;
      }
      edgeIds.add(edge.id);

      // Check if edge references valid nodes
      if (!nodeIds.has(edge.source)) {
        result.isValid = false;
        result.errors.push({
          id: `invalid_source_${edge.id}`,
          severity: "error",
          type: "invalid_edge",
          message: `Edge ${edge.id} references non-existent source node: ${edge.source}`,
          suggestion: "Verify the source node exists in the workflow",
        });
        continue;
      }

      if (!nodeIds.has(edge.target)) {
        result.isValid = false;
        result.errors.push({
          id: `invalid_target_${edge.id}`,
          severity: "error",
          type: "invalid_edge",
          message: `Edge ${edge.id} references non-existent target node: ${edge.target}`,
          suggestion: "Verify the target node exists in the workflow",
        });
        continue;
      }

      // Check for self-loops
      if (edge.source === edge.target) {
        result.isValid = false;
        result.errors.push({
          id: `self_loop_${edge.id}`,
          severity: "error",
          type: "self_loop",
          nodeIds: [edge.source],
          message: `Self-loop detected: node ${edge.source} cannot connect to itself`,
          suggestion: "Remove the self-referencing connection",
        });
        continue;
      }

      // Build adjacency lists
      adjacencyList.get(edge.source)!.add(edge.target);
      reverseAdjacencyList.get(edge.target)!.add(edge.source);
      outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(nodeIds, edges);
    if (circularDeps.length > 0) {
      result.isValid = false;
      result.errors.push({
        id: "circular_dependency",
        severity: "error",
        type: "circular_dependency",
        nodeIds: Array.from(circularDeps),
        message: `Circular dependencies detected: ${circularDeps.join(", ")}`,
        suggestion:
          "Remove the circular connections between nodes to create a valid execution path",
      });
    }

    // Find connected components
    const visitedGlobal = new Set<string>();
    let componentCount = 0;

    const dfsComponent = (nodeId: string, visited: Set<string>) => {
      visited.add(nodeId);
      adjacencyList.get(nodeId)?.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          dfsComponent(neighbor, visited);
        }
      });
      reverseAdjacencyList.get(nodeId)?.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          dfsComponent(neighbor, visited);
        }
      });
    };

    // Find all components
    nodeIds.forEach((nodeId) => {
      if (!visitedGlobal.has(nodeId)) {
        dfsComponent(nodeId, visitedGlobal);
        componentCount++;
      }
    });

    result.stats.connectedComponents = componentCount;

    if (componentCount > 1) {
      // Find isolated components
      const components: Set<string>[] = [];
      const visitedPerComponent = new Set<string>();

      nodeIds.forEach((nodeId) => {
        if (!visitedPerComponent.has(nodeId)) {
          const component = new Set<string>();
          dfsComponent(nodeId, component);
          component.forEach((n) => visitedPerComponent.add(n));
          components.push(component);
        }
      });

      components.forEach((component, index) => {
        if (component.size > 0) {
          const hasInput = Array.from(component).some(
            (id) => nodeTypes.get(id) === "dataInput"
          );
          const hasOutput = Array.from(component).some(
            (id) => nodeTypes.get(id) === "dataOutput"
          );

          // If this component doesn't have both input and output, it's isolated
          if (!hasInput || !hasOutput) {
            result.warnings.push({
              id: `isolated_component_${index}`,
              severity: "warning",
              type: "isolated_component",
              nodeIds: Array.from(component),
              message: `Isolated component detected: nodes ${Array.from(
                component
              ).join(", ")} are not connected to main workflow`,
              suggestion:
                "Connect these nodes to the main workflow or remove them",
            });
          }
        }
      });
    }

    // Check for unreachable nodes (nodes that can't be reached from any input)
    const reachableFromInput = new Set<string>();

    const dfsFromInput = (nodeId: string, visited: Set<string>) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      reachableFromInput.add(nodeId);
      adjacencyList.get(nodeId)?.forEach((neighbor) => {
        dfsFromInput(neighbor, visited);
      });
    };

    // Start from all input nodes
    inputNodes.forEach((inputNode) => {
      dfsFromInput(inputNode.id, new Set());
    });

    const unreachableFromInput = Array.from(nodeIds).filter(
      (id) => !reachableFromInput.has(id) && nodeTypes.get(id) !== "dataInput"
    );

    if (unreachableFromInput.length > 0) {
      result.errors.push({
        id: "unreachable_node",
        severity: "error",
        type: "unreachable_node",
        nodeIds: unreachableFromInput,
        message: `Unreachable nodes detected: ${unreachableFromInput.join(
          ", "
        )} cannot be reached from input nodes`,
        suggestion: "Connect these nodes to the workflow or remove them",
      });
      result.isValid = false;
    }

    // Check for dangling nodes (nodes that can't reach any output)
    const canReachOutput = new Set<string>();

    const dfsToOutput = (nodeId: string, visited: Set<string>) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      canReachOutput.add(nodeId);

      // Check if this node can reach any output
      const neighbors = adjacencyList.get(nodeId) || new Set();
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          dfsToOutput(neighbor, visited);
        }
      });
    };

    // Start backwards from all output nodes
    outputNodes.forEach((outputNode) => {
      const visited = new Set<string>();
      visited.add(outputNode.id);
      canReachOutput.add(outputNode.id);

      // Traverse backwards to find what can reach this output
      const dfsBackwards = (nodeId: string) => {
        reverseAdjacencyList.get(nodeId)?.forEach((predecessor) => {
          if (!canReachOutput.has(predecessor)) {
            canReachOutput.add(predecessor);
            dfsBackwards(predecessor);
          }
        });
      };

      dfsBackwards(outputNode.id);
    });

    const danglingNodes = Array.from(nodeIds).filter(
      (id) => !canReachOutput.has(id) && nodeTypes.get(id) !== "dataOutput"
    );

    if (danglingNodes.length > 0) {
      result.errors.push({
        id: "dangling_node",
        severity: "error",
        type: "dangling_node",
        nodeIds: danglingNodes,
        message: `Dangling nodes detected: ${danglingNodes.join(
          ", "
        )} don't connect to any output`,
        suggestion: "Connect these nodes to the output or remove them",
      });
      result.isValid = false;
    }

    // Check for valid execution path from input to output
    if (inputNodes.length > 0 && outputNodes.length > 0) {
      const pathExists = inputNodes.some((inputNode) =>
        outputNodes.some((outputNode) =>
          this.hasPath(inputNode.id, outputNode.id, adjacencyList)
        )
      );

      if (!pathExists) {
        result.isValid = false;
        result.errors.push({
          id: "no_execution_path",
          severity: "error",
          type: "no_execution_path",
          message: "No valid execution path from input to output",
          suggestion:
            "Connect the input node(s) to the output node(s) to create at least one valid execution path",
        });
      }
    }

    // Check for disconnected nodes
    const fullyConnectedNodes = reachableFromInput.size;
    const disconnectedNodes = Array.from(nodeIds).filter(
      (id) => !reachableFromInput.has(id)
    );

    if (
      disconnectedNodes.length > 0 &&
      nodeTypes.get(disconnectedNodes[0]) !== "dataOutput"
    ) {
      result.warnings.push({
        id: "disconnected_node",
        severity: "warning",
        type: "disconnected_node",
        nodeIds: disconnectedNodes,
        message: `Disconnected nodes detected: ${disconnectedNodes.join(
          ", "
        )} are not connected to the workflow`,
        suggestion: "Connect these nodes to the workflow or remove them",
      });
    }

    return result;
  }

  /**
   * Check if there's a path from source to target
   */
  private hasPath(
    source: string,
    target: string,
    adjacencyList: Map<string, Set<string>>
  ): boolean {
    if (source === target) return true;

    const visited = new Set<string>();
    const queue = [source];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === target) return true;

      if (visited.has(current)) continue;
      visited.add(current);

      adjacencyList.get(current)?.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }

    return false;
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(
    nodeIds: Set<string>,
    edges: any[]
  ): Set<string> {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularNodes = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        circularNodes.add(nodeId);
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter((e) => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target)) {
          circularNodes.add(nodeId);
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    nodeIds.forEach((nodeId) => {
      if (!visited.has(nodeId)) {
        hasCycle(nodeId);
      }
    });

    return circularNodes;
  }

  /**
   * Get user-friendly summary of validation issues
   */
  getSummary(result: ValidationResult): string {
    if (result.isValid && result.warnings.length === 0) {
      return "✅ Workflow is valid and ready to execute";
    }

    const parts: string[] = [];

    if (result.errors.length > 0) {
      parts.push(`❌ ${result.errors.length} error(s) found:`);
      result.errors.forEach((error) => {
        parts.push(`  • ${error.message}`);
      });
    }

    if (result.warnings.length > 0) {
      parts.push(`⚠️  ${result.warnings.length} warning(s):`);
      result.warnings.forEach((warning) => {
        parts.push(`  • ${warning.message}`);
      });
    }

    return parts.join("\n");
  }
}

// Singleton instance
export const workflowValidationEngine = new WorkflowValidationEngine();
