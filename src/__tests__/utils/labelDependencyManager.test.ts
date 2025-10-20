import { LabelDependencyManager } from "../../utils/labelDependencyManager";
import { Workflow, WorkflowNode } from "../../types";

describe("LabelDependencyManager", () => {
  const createMockWorkflow = (): Workflow => ({
    id: "test-workflow",
    name: "Test Workflow",
    nodes: [
      {
        id: "node-1",
        type: "dataInput",
        position: { x: 100, y: 100 },
        data: {
          id: "node-1",
          type: "dataInput",
          label: "Input Data",
          status: "idle",
          config: {
            dataType: "text",
            defaultValue: "Sample input",
          },
          inputs: [],
          outputs: [],
        },
      },
      {
        id: "node-2",
        type: "llmTask",
        position: { x: 300, y: 100 },
        data: {
          id: "node-2",
          type: "llmTask",
          label: "AI Processor",
          status: "idle",
          config: {
            prompt: "Process this data: {{Input Data.output}}",
            model: "deepseek-chat",
            temperature: 0.7,
          },
          inputs: [],
          outputs: [],
        },
      },
      {
        id: "node-3",
        type: "dataOutput",
        position: { x: 500, y: 100 },
        data: {
          id: "node-3",
          type: "dataOutput",
          label: "Output Result",
          status: "idle",
          config: {
            format: "text",
            filename: "result.txt",
            content: "{{AI Processor.output}}",
          },
          inputs: [],
          outputs: [],
        },
      },
    ],
    edges: [
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        sourceHandle: "output",
        targetHandle: "input",
      },
      {
        id: "edge-2",
        source: "node-2",
        target: "node-3",
        sourceHandle: "output",
        targetHandle: "input",
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe("findLabelDependencies", () => {
    it("should find dependencies on a node label", () => {
      const workflow = createMockWorkflow();
      const dependencies = LabelDependencyManager.findLabelDependencies(
        workflow,
        "node-1",
        "Input Data"
      );

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0].nodeId).toBe("node-2");
      expect(dependencies[0].nodeLabel).toBe("AI Processor");
      expect(dependencies[0].references).toHaveLength(1);
      expect(dependencies[0].references[0].fullReference).toBe(
        "{{Input Data.output}}"
      );
      expect(dependencies[0].references[0].context).toBe("prompt");
    });

    it("should find multiple dependencies", () => {
      const workflow = createMockWorkflow();
      const dependencies = LabelDependencyManager.findLabelDependencies(
        workflow,
        "node-2",
        "AI Processor"
      );

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0].nodeId).toBe("node-3");
      expect(dependencies[0].references).toHaveLength(1);
      expect(dependencies[0].references[0].fullReference).toBe(
        "{{AI Processor.output}}"
      );
    });

    it("should return empty array when no dependencies exist", () => {
      const workflow = createMockWorkflow();
      const dependencies = LabelDependencyManager.findLabelDependencies(
        workflow,
        "node-3",
        "Output Result"
      );

      expect(dependencies).toHaveLength(0);
    });
  });

  describe("analyzeLabelChangeImpact", () => {
    it("should detect breaking changes when dependencies exist", () => {
      const workflow = createMockWorkflow();
      const impact = LabelDependencyManager.analyzeLabelChangeImpact(
        workflow,
        "node-1",
        "Input Data",
        "New Input"
      );

      expect(impact.hasDependencies).toBe(true);
      expect(impact.dependencies).toHaveLength(1);
      expect(impact.affectedNodes).toContain("node-2");
      expect(impact.warnings).toContain(
        'Changing label "Input Data" to "New Input" will break 1 variable reference(s)'
      );
      expect(impact.suggestions).toContain(
        "Consider using the 'Update References' option to automatically fix broken references"
      );
    });

    it("should detect no breaking changes when no dependencies exist", () => {
      const workflow = createMockWorkflow();
      const impact = LabelDependencyManager.analyzeLabelChangeImpact(
        workflow,
        "node-3",
        "Output Result",
        "New Output"
      );

      expect(impact.hasDependencies).toBe(false);
      expect(impact.dependencies).toHaveLength(0);
      expect(impact.affectedNodes).toHaveLength(0);
      expect(impact.warnings).toHaveLength(0);
    });
  });

  describe("updateLabelReferences", () => {
    it("should update all references when changing a label", () => {
      const workflow = createMockWorkflow();
      const updatedWorkflow = LabelDependencyManager.updateLabelReferences(
        workflow,
        "node-1",
        "Input Data",
        "New Input"
      );

      // Check that the target node's label was updated
      const targetNode = updatedWorkflow.nodes.find((n) => n.id === "node-1");
      expect(targetNode?.data.label).toBe("New Input");

      // Check that references were updated
      const dependentNode = updatedWorkflow.nodes.find(
        (n) => n.id === "node-2"
      );
      expect(dependentNode?.data.config.prompt).toBe(
        "Process this data: {{New Input.output}}"
      );
    });

    it("should update multiple references across different nodes", () => {
      const workflow = createMockWorkflow();

      // Add another node that references the same label
      const additionalNode: WorkflowNode = {
        id: "node-4",
        type: "llmTask",
        position: { x: 300, y: 200 },
        data: {
          id: "node-4",
          type: "llmTask",
          label: "Another Processor",
          status: "idle",
          config: {
            prompt: "Also process: {{Input Data.output}}",
            model: "deepseek-chat",
          },
          inputs: [],
          outputs: [],
        },
      };

      const workflowWithAdditionalNode = {
        ...workflow,
        nodes: [...workflow.nodes, additionalNode],
      };

      const updatedWorkflow = LabelDependencyManager.updateLabelReferences(
        workflowWithAdditionalNode,
        "node-1",
        "Input Data",
        "New Input"
      );

      // Check both dependent nodes were updated
      const node2 = updatedWorkflow.nodes.find((n) => n.id === "node-2");
      const node4 = updatedWorkflow.nodes.find((n) => n.id === "node-4");

      expect(node2?.data.config.prompt).toBe(
        "Process this data: {{New Input.output}}"
      );
      expect(node4?.data.config.prompt).toBe(
        "Also process: {{New Input.output}}"
      );
    });
  });

  describe("validateVariableReferences", () => {
    it("should validate correct variable references", () => {
      const workflow = createMockWorkflow();
      const validation =
        LabelDependencyManager.validateVariableReferences(workflow);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect invalid variable references", () => {
      const workflow = createMockWorkflow();

      // Add a node with invalid reference
      const invalidNode: WorkflowNode = {
        id: "node-4",
        type: "llmTask",
        position: { x: 300, y: 200 },
        data: {
          id: "node-4",
          type: "llmTask",
          label: "Invalid Reference",
          status: "idle",
          config: {
            prompt: "Process: {{NonExistentNode.output}}",
            model: "deepseek-chat",
          },
          inputs: [],
          outputs: [],
        },
      };

      const workflowWithInvalidNode = {
        ...workflow,
        nodes: [...workflow.nodes, invalidNode],
      };

      const validation = LabelDependencyManager.validateVariableReferences(
        workflowWithInvalidNode
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Node "Invalid Reference" references non-existent node "NonExistentNode"'
      );
    });
  });

  describe("getAllVariableReferences", () => {
    it("should return all variable references in the workflow", () => {
      const workflow = createMockWorkflow();
      const allReferences =
        LabelDependencyManager.getAllVariableReferences(workflow);

      expect(allReferences.size).toBe(2); // node-2 and node-3 have references
      expect(allReferences.has("node-2")).toBe(true);
      expect(allReferences.has("node-3")).toBe(true);

      const node2Refs = allReferences.get("node-2");
      expect(node2Refs).toHaveLength(1);
      expect(node2Refs![0].fullReference).toBe("{{Input Data.output}}");
    });
  });
});
