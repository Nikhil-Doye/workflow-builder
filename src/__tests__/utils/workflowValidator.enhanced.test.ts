import {
  validateWorkflow,
  createNodeIdMapping,
  fixNodeIdMismatches,
} from "../../utils/workflowValidator";
import { WorkflowStructure } from "../../types";

describe("Enhanced WorkflowValidator - Node ID Validation", () => {
  const createMockWorkflow = (): WorkflowStructure => ({
    id: "test-workflow",
    name: "Test Workflow",
    nodes: [
      {
        id: "input-node",
        type: "dataInput",
        label: "Input Data",
        position: { x: 100, y: 100 },
        config: { dataType: "text" },
      },
      {
        id: "process-node",
        type: "llmTask",
        label: "AI Processor",
        position: { x: 300, y: 100 },
        config: { prompt: "Process data", model: "deepseek-chat" },
      },
      {
        id: "output-node",
        type: "dataOutput",
        label: "Output Result",
        position: { x: 500, y: 100 },
        config: { format: "text" },
      },
    ],
    edges: [
      {
        id: "edge-1",
        source: "input-node",
        target: "process-node",
        sourceHandle: "output",
        targetHandle: "input",
      },
      {
        id: "edge-2",
        source: "process-node",
        target: "output-node",
        sourceHandle: "output",
        targetHandle: "input",
      },
    ],
    complexity: "medium",
    estimatedExecutionTime: 5000,
  });

  describe("validateNodeConnections with actual node IDs", () => {
    it("should validate connections using actual node IDs", () => {
      const workflow = createMockWorkflow();
      const result = validateWorkflow(workflow);

      expect(result.issues).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it("should detect invalid edge references", () => {
      const workflow = createMockWorkflow();
      workflow.edges[0].source = "non-existent-node";

      const result = validateWorkflow(workflow);

      expect(result.issues).toContain(
        "Edge 0 references non-existent source node: non-existent-node"
      );
      expect(result.suggestions).toContain(
        "Available source nodes: input-node, process-node, output-node"
      );
    });

    it("should handle workflows with UUID-based node IDs", () => {
      const workflow: WorkflowStructure = {
        ...createMockWorkflow(),
        nodes: [
          {
            id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            type: "dataInput",
            label: "Input Data",
            position: { x: 100, y: 100 },
            config: { dataType: "text" },
          },
          {
            id: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
            type: "llmTask",
            label: "AI Processor",
            position: { x: 300, y: 100 },
            config: { prompt: "Process data", model: "deepseek-chat" },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            target: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
            sourceHandle: "output",
            targetHandle: "input",
          },
        ],
      };

      const result = validateWorkflow(workflow);
      expect(result.issues).toHaveLength(0);
    });

    it("should handle workflows with custom node IDs", () => {
      const workflow: WorkflowStructure = {
        ...createMockWorkflow(),
        nodes: [
          {
            id: "my-custom-input",
            type: "dataInput",
            label: "Input Data",
            position: { x: 100, y: 100 },
            config: { dataType: "text" },
          },
          {
            id: "ai-processor-123",
            type: "llmTask",
            label: "AI Processor",
            position: { x: 300, y: 100 },
            config: { prompt: "Process data", model: "deepseek-chat" },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "my-custom-input",
            target: "ai-processor-123",
            sourceHandle: "output",
            targetHandle: "input",
          },
        ],
      };

      const result = validateWorkflow(workflow);
      expect(result.issues).toHaveLength(0);
    });

    it("should detect orphaned nodes correctly", () => {
      const workflow = createMockWorkflow();
      // Remove one edge to create an orphaned node
      workflow.edges = [workflow.edges[0]];

      const result = validateWorkflow(workflow);

      expect(result.issues).toContain(
        "Orphaned nodes detected: process-node, output-node"
      );
      expect(result.suggestions).toContain("Connect all nodes in the workflow");
    });
  });

  describe("createNodeIdMapping", () => {
    it("should create mapping for index-based node IDs", () => {
      const workflow: WorkflowStructure = {
        ...createMockWorkflow(),
        nodes: [
          {
            id: "node-0",
            type: "dataInput",
            label: "Input Data",
            position: { x: 100, y: 100 },
            config: { dataType: "text" },
          },
          {
            id: "node-1",
            type: "llmTask",
            label: "AI Processor",
            position: { x: 300, y: 100 },
            config: { prompt: "Process data", model: "deepseek-chat" },
          },
        ],
      };

      const mapping = createNodeIdMapping(workflow);

      expect(mapping.suggestions).toContain(
        "Found 2 nodes with index-based IDs. Consider using more descriptive names."
      );
      expect(mapping.oldToNew.size).toBe(0); // No changes needed for index-based IDs
    });

    it("should detect duplicate node IDs", () => {
      const workflow: WorkflowStructure = {
        ...createMockWorkflow(),
        nodes: [
          {
            id: "duplicate-id",
            type: "dataInput",
            label: "Input Data",
            position: { x: 100, y: 100 },
            config: { dataType: "text" },
          },
          {
            id: "duplicate-id",
            type: "llmTask",
            label: "AI Processor",
            position: { x: 300, y: 100 },
            config: { prompt: "Process data", model: "deepseek-chat" },
          },
        ],
      };

      const mapping = createNodeIdMapping(workflow);

      expect(mapping.suggestions).toContain(
        "Found duplicate node IDs: duplicate-id, duplicate-id. These will cause validation errors."
      );
    });

    it("should create mapping for non-index-based IDs", () => {
      const workflow: WorkflowStructure = {
        ...createMockWorkflow(),
        nodes: [
          {
            id: "custom-input",
            type: "dataInput",
            label: "Input Data",
            position: { x: 100, y: 100 },
            config: { dataType: "text" },
          },
          {
            id: "custom-processor",
            type: "llmTask",
            label: "AI Processor",
            position: { x: 300, y: 100 },
            config: { prompt: "Process data", model: "deepseek-chat" },
          },
        ],
      };

      const mapping = createNodeIdMapping(workflow);

      expect(mapping.oldToNew.get("custom-input")).toBe("node-0");
      expect(mapping.oldToNew.get("custom-processor")).toBe("node-1");
      expect(mapping.newToOld.get("node-0")).toBe("custom-input");
      expect(mapping.newToOld.get("node-1")).toBe("custom-processor");
    });
  });

  describe("fixNodeIdMismatches", () => {
    it("should fix simple ID mismatches", () => {
      const workflow: WorkflowStructure = {
        ...createMockWorkflow(),
        nodes: [
          {
            id: "input-node",
            type: "dataInput",
            label: "Input Data",
            position: { x: 100, y: 100 },
            config: { dataType: "text" },
          },
          {
            id: "process-node",
            type: "llmTask",
            label: "AI Processor",
            position: { x: 300, y: 100 },
            config: { prompt: "Process data", model: "deepseek-chat" },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "input-node",
            target: "process-node",
            sourceHandle: "output",
            targetHandle: "input",
          },
        ],
      };

      // Create a mismatch by changing edge reference
      workflow.edges[0].source = "input_node"; // Different from "input-node"

      const result = fixNodeIdMismatches(workflow);

      expect(result.fixesApplied).toContain("Mapped input_node to input-node");
      expect(result.fixedWorkflow.edges[0].source).toBe("input-node");
      expect(result.remainingIssues).toHaveLength(0);
    });

    it("should handle case-insensitive mismatches", () => {
      const workflow: WorkflowStructure = {
        ...createMockWorkflow(),
        nodes: [
          {
            id: "InputNode",
            type: "dataInput",
            label: "Input Data",
            position: { x: 100, y: 100 },
            config: { dataType: "text" },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "inputnode", // lowercase version
            target: "InputNode",
            sourceHandle: "output",
            targetHandle: "input",
          },
        ],
      };

      const result = fixNodeIdMismatches(workflow);

      expect(result.fixesApplied).toContain("Mapped inputnode to InputNode");
      expect(result.fixedWorkflow.edges[0].source).toBe("InputNode");
    });

    it("should handle multiple possible matches", () => {
      const workflow: WorkflowStructure = {
        ...createMockWorkflow(),
        nodes: [
          {
            id: "input-node-1",
            type: "dataInput",
            label: "Input Data 1",
            position: { x: 100, y: 100 },
            config: { dataType: "text" },
          },
          {
            id: "input-node-2",
            type: "dataInput",
            label: "Input Data 2",
            position: { x: 100, y: 200 },
            config: { dataType: "text" },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "input-node", // Ambiguous - could match either node
            target: "input-node-1",
            sourceHandle: "output",
            targetHandle: "input",
          },
        ],
      };

      const result = fixNodeIdMismatches(workflow);

      expect(result.remainingIssues).toContain(
        "Multiple possible matches for input-node: input-node-1, input-node-2"
      );
      expect(result.fixesApplied).toHaveLength(0);
    });

    it("should handle no matches found", () => {
      const workflow: WorkflowStructure = {
        ...createMockWorkflow(),
        nodes: [
          {
            id: "input-node",
            type: "dataInput",
            label: "Input Data",
            position: { x: 100, y: 100 },
            config: { dataType: "text" },
          },
        ],
        edges: [
          {
            id: "edge-1",
            source: "completely-different-id",
            target: "input-node",
            sourceHandle: "output",
            targetHandle: "input",
          },
        ],
      };

      const result = fixNodeIdMismatches(workflow);

      expect(result.remainingIssues).toContain(
        "No match found for completely-different-id"
      );
      expect(result.fixesApplied).toHaveLength(0);
    });
  });

  describe("Integration with existing validation", () => {
    it("should work with imported workflows from other tools", () => {
      // Simulate a workflow imported from another tool with different ID patterns
      const importedWorkflow: WorkflowStructure = {
        id: "imported-workflow",
        name: "Imported Workflow",
        nodes: [
          {
            id: "step_1_input",
            type: "dataInput",
            label: "Input Data",
            position: { x: 100, y: 100 },
            config: { dataType: "text" },
          },
          {
            id: "step_2_processing",
            type: "llmTask",
            label: "AI Processor",
            position: { x: 300, y: 100 },
            config: { prompt: "Process data", model: "deepseek-chat" },
          },
        ],
        edges: [
          {
            id: "connection_1",
            source: "step_1_input",
            target: "step_2_processing",
            sourceHandle: "output",
            targetHandle: "input",
          },
        ],
        complexity: "medium",
        estimatedExecutionTime: 5000,
      };

      const result = validateWorkflow(importedWorkflow);
      expect(result.issues).toHaveLength(0);
    });

    it("should handle manually edited workflows", () => {
      const workflow = createMockWorkflow();

      // Simulate manual editing that changes node IDs
      workflow.nodes[0].id = "manually-renamed-input";
      workflow.edges[0].source = "manually-renamed-input";

      const result = validateWorkflow(workflow);
      expect(result.issues).toHaveLength(0);
    });
  });
});
