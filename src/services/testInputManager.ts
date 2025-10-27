/**
 * Test Input Manager
 * Manages test data distribution across multiple data input nodes in a workflow
 */

export interface DataInputNode {
  id: string;
  label: string;
  type: "dataInput";
}

export interface TestInputMapping {
  nodeId: string;
  value: string | any;
  label?: string;
}

export interface TestInputConfig {
  mode: "single" | "multiple" | "auto";
  mappings: TestInputMapping[];
  fallbackValue?: string;
}

export class TestInputManager {
  /**
   * Find all data input nodes in the workflow
   */
  findDataInputNodes(nodes: any[]): DataInputNode[] {
    return nodes
      .filter(
        (node) => node.data?.type === "dataInput" || node.type === "dataInput"
      )
      .map((node) => ({
        id: node.id,
        label: node.data?.label || `Input (${node.id.slice(0, 8)})`,
        type: "dataInput" as const,
      }));
  }

  /**
   * Validate test input configuration
   */
  validateTestInputConfig(
    config: TestInputConfig,
    nodes: any[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const dataInputNodes = this.findDataInputNodes(nodes);

    if (dataInputNodes.length === 0) {
      errors.push("No data input nodes found in workflow");
      return { isValid: false, errors };
    }

    if (config.mode === "multiple") {
      if (config.mappings.length === 0) {
        errors.push("Multiple mode selected but no mappings provided");
      }

      config.mappings.forEach((mapping) => {
        if (!dataInputNodes.some((n) => n.id === mapping.nodeId)) {
          errors.push(`Node ${mapping.nodeId} is not a data input node`);
        }

        if (!mapping.value) {
          errors.push(`No value provided for node ${mapping.nodeId}`);
        }
      });
    } else if (config.mode === "single") {
      if (config.mappings.length !== 1) {
        errors.push("Single mode requires exactly one mapping");
      }

      if (config.mappings.length > 0 && !config.mappings[0].value) {
        errors.push("No value provided for single input");
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Apply test inputs to workflow nodes
   */
  applyTestInputs(nodes: any[], testInputConfig: TestInputConfig): any[] {
    const dataInputNodes = this.findDataInputNodes(nodes);

    if (dataInputNodes.length === 0) {
      console.warn("No data input nodes found in workflow");
      return nodes;
    }

    const updatedNodes = nodes.map((node) => {
      // Find matching mapping for this node
      const mapping = testInputConfig.mappings.find(
        (m) => m.nodeId === node.id
      );

      if (!mapping && testInputConfig.mode === "auto") {
        // In auto mode, use fallback value for all inputs
        if (testInputConfig.fallbackValue && node.data?.type === "dataInput") {
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data?.config,
                defaultValue: testInputConfig.fallbackValue,
              },
            },
          };
        }
      } else if (mapping && node.id === mapping.nodeId) {
        // Apply mapped value
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data?.config,
              defaultValue: mapping.value,
            },
          },
        };
      }

      return node;
    });

    return updatedNodes;
  }

  /**
   * Generate test input config from legacy format (single string)
   */
  fromLegacyFormat(
    testInput: string | undefined,
    nodes: any[]
  ): TestInputConfig {
    const dataInputNodes = this.findDataInputNodes(nodes);

    if (!testInput) {
      return { mode: "auto", mappings: [], fallbackValue: undefined };
    }

    if (dataInputNodes.length === 0) {
      return { mode: "auto", mappings: [], fallbackValue: testInput };
    }

    if (dataInputNodes.length === 1) {
      return {
        mode: "single",
        mappings: [
          {
            nodeId: dataInputNodes[0].id,
            value: testInput,
            label: dataInputNodes[0].label,
          },
        ],
      };
    }

    // Multiple input nodes: use auto mode with fallback
    return {
      mode: "auto",
      mappings: [],
      fallbackValue: testInput,
    };
  }

  /**
   * Get summary of test input configuration
   */
  getSummary(config: TestInputConfig, nodes: any[]): string {
    const dataInputNodes = this.findDataInputNodes(nodes);

    if (dataInputNodes.length === 0) {
      return "⚠️ No data input nodes in workflow";
    }

    if (config.mode === "single") {
      const mapping = config.mappings[0];
      const node = dataInputNodes.find((n) => n.id === mapping.nodeId);
      return `📥 Single input: "${mapping.value}" → ${
        node?.label || mapping.nodeId
      }`;
    }

    if (config.mode === "multiple") {
      const mappedCount = config.mappings.length;
      return `📥 Multiple inputs: ${mappedCount} node(s) configured`;
    }

    // Auto mode
    if (config.fallbackValue) {
      return `📥 Auto mode: "${config.fallbackValue}" → all inputs (${dataInputNodes.length} nodes)`;
    }

    return "📥 Auto mode: No value set";
  }

  /**
   * Validate that all data input nodes are provided inputs
   */
  allInputsProvided(config: TestInputConfig, nodes: any[]): boolean {
    const dataInputNodes = this.findDataInputNodes(nodes);

    if (config.mode === "auto") {
      return !!config.fallbackValue;
    }

    if (config.mode === "single") {
      return config.mappings.length === 1 && !!config.mappings[0].value;
    }

    // Multiple mode: all configured nodes must have values
    return (
      config.mappings.length === dataInputNodes.length &&
      config.mappings.every((m) => !!m.value)
    );
  }

  /**
   * Get test input status for UI display
   */
  getStatus(
    config: TestInputConfig,
    nodes: any[]
  ): {
    status: "unconfigured" | "partial" | "complete";
    message: string;
    icon: string;
  } {
    const dataInputNodes = this.findDataInputNodes(nodes);

    if (dataInputNodes.length === 0) {
      return {
        status: "unconfigured",
        message: "No input nodes",
        icon: "ℹ️",
      };
    }

    if (config.mode === "auto") {
      if (!config.fallbackValue) {
        return {
          status: "unconfigured",
          message: `${dataInputNodes.length} inputs, no data`,
          icon: "⚠️",
        };
      }
      return {
        status: "complete",
        message: `${dataInputNodes.length} inputs configured`,
        icon: "✅",
      };
    }

    if (config.mode === "single") {
      if (config.mappings.length === 0 || !config.mappings[0].value) {
        return {
          status: "unconfigured",
          message: "No test data",
          icon: "⚠️",
        };
      }
      return {
        status: "complete",
        message: "Test data ready",
        icon: "✅",
      };
    }

    // Multiple mode
    const providedCount = config.mappings.filter((m) => m.value).length;
    const totalCount = dataInputNodes.length;

    if (providedCount === 0) {
      return {
        status: "unconfigured",
        message: `No inputs configured (${totalCount} available)`,
        icon: "⚠️",
      };
    }

    if (providedCount < totalCount) {
      return {
        status: "partial",
        message: `${providedCount}/${totalCount} inputs configured`,
        icon: "⚠️",
      };
    }

    return {
      status: "complete",
      message: `All ${totalCount} inputs configured`,
      icon: "✅",
    };
  }
}

// Singleton instance
export const testInputManager = new TestInputManager();
