import {
  substituteVariables,
  NodeOutput,
} from "../../utils/variableSubstitution";

describe("Variable Substitution", () => {
  describe("Basic Substitution", () => {
    it("should substitute simple node output", () => {
      const template = "Hello {{node1.output}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        ["node1", { nodeId: "node1", output: "World", data: "World" }],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Hello World");
    });

    it("should substitute multiple variables", () => {
      const template = "{{node1.output}} and {{node2.output}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        ["node1", { nodeId: "node1", output: "Hello", data: "Hello" }],
        ["node2", { nodeId: "node2", output: "World", data: "World" }],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Hello and World");
    });

    it("should handle empty template", () => {
      const template = "";
      const nodeOutputs = new Map<string, NodeOutput>();

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("");
    });

    it("should handle template without variables", () => {
      const template = "No variables here";
      const nodeOutputs = new Map<string, NodeOutput>();

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("No variables here");
    });
  });

  describe("Property Access", () => {
    it("should access output property", () => {
      const template = "{{node1.output}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        [
          "node1",
          { nodeId: "node1", output: "Test Output", data: "Test Data" },
        ],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Test Output");
    });

    it("should access data property", () => {
      const template = "{{node1.data}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        [
          "node1",
          { nodeId: "node1", output: "Test Output", data: "Test Data" },
        ],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Test Data");
    });

    it("should access error property", () => {
      const template = "{{node1.error}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        [
          "node1",
          { nodeId: "node1", output: "Test Output", error: "Test Error" },
        ],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Test Error");
    });

    it("should access status property", () => {
      const template = "{{node1.status}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        [
          "node1",
          { nodeId: "node1", output: "Test Output", status: "completed" },
        ],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("completed");
    });
  });

  describe("Node Label to ID Mapping", () => {
    it("should resolve node labels to IDs", () => {
      const template = "{{inputNode.output}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        [
          "node-1",
          { nodeId: "node-1", output: "Input Data", data: "Input Data" },
        ],
      ]);
      const nodeLabelToId = new Map<string, string>([["inputNode", "node-1"]]);

      const result = substituteVariables(template, nodeOutputs, nodeLabelToId);

      expect(result).toBe("Input Data");
    });

    it("should fall back to direct ID when label not found", () => {
      const template = "{{node-1.output}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        [
          "node-1",
          {
            nodeId: "node-1",
            output: "Direct ID Data",
            data: "Direct ID Data",
          },
        ],
      ]);
      const nodeLabelToId = new Map<string, string>();

      const result = substituteVariables(template, nodeOutputs, nodeLabelToId);

      expect(result).toBe("Direct ID Data");
    });
  });

  describe("Missing Node Handling", () => {
    it("should return original template when node not found", () => {
      const template = "{{missingNode.output}}";
      const nodeOutputs = new Map<string, NodeOutput>();

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("{{missingNode.output}}");
    });

    it("should warn when node not found", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const template = "{{missingNode.output}}";
      const nodeOutputs = new Map<string, NodeOutput>();

      substituteVariables(template, nodeOutputs);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Node missingNode (missingNode) not found for variable {{missingNode.output}}"
      );

      consoleSpy.mockRestore();
    });

    it("should show available nodes in warning", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const template = "{{missingNode.output}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        ["node1", { nodeId: "node1", output: "Data1", data: "Data1" }],
        ["node2", { nodeId: "node2", output: "Data2", data: "Data2" }],
      ]);

      substituteVariables(template, nodeOutputs);

      expect(consoleSpy).toHaveBeenCalledWith("Available nodes: node1, node2");

      consoleSpy.mockRestore();
    });
  });

  describe("Complex Templates", () => {
    it("should handle mixed content and variables", () => {
      const template = "Process {{node1.output}} and save to {{node2.data}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        ["node1", { nodeId: "node1", output: "input.txt", data: "input.txt" }],
        [
          "node2",
          { nodeId: "node2", output: "output.txt", data: "output.txt" },
        ],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Process input.txt and save to output.txt");
    });

    it("should handle multiple occurrences of same variable", () => {
      const template = "{{node1.output}} and {{node1.output}} again";
      const nodeOutputs = new Map<string, NodeOutput>([
        ["node1", { nodeId: "node1", output: "Hello", data: "Hello" }],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Hello and Hello again");
    });

    it("should handle nested object properties", () => {
      const template = "{{node1.result.data}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        [
          "node1",
          {
            nodeId: "node1",
            output: { result: { data: "Nested Data" } },
            data: { result: { data: "Nested Data" } },
          },
        ],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Nested Data");
    });
  });

  describe("Type Conversion", () => {
    it("should convert numbers to strings", () => {
      const template = "Count: {{node1.output}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        ["node1", { nodeId: "node1", output: 42, data: 42 }],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Count: 42");
    });

    it("should convert booleans to strings", () => {
      const template = "Status: {{node1.output}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        ["node1", { nodeId: "node1", output: true, data: true }],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Status: true");
    });

    it("should handle null and undefined values", () => {
      const template = "Value: {{node1.output}}";
      const nodeOutputs = new Map<string, NodeOutput>([
        ["node1", { nodeId: "node1", output: null, data: null }],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("Value: ");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed variable syntax", () => {
      const template = "{{node1.output";
      const nodeOutputs = new Map<string, NodeOutput>([
        ["node1", { nodeId: "node1", output: "Data", data: "Data" }],
      ]);

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("{{node1.output");
    });

    it("should handle empty variable names", () => {
      const template = "{{}}";
      const nodeOutputs = new Map<string, NodeOutput>();

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe("{{}}");
    });

    it("should handle non-string templates", () => {
      const template = null as any;
      const nodeOutputs = new Map<string, NodeOutput>();

      const result = substituteVariables(template, nodeOutputs);

      expect(result).toBe(null);
    });
  });
});
