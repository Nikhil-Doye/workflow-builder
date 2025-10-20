import {
  generateNodeTypeDiagnostics,
  getNodeTypeSummary,
  suggestAlternatives,
  canExecuteWithoutFallback,
} from "../../utils/nodeTypeDiagnostics";
import { WorkflowStructure } from "../../types";
import { ProcessorRegistry } from "../../services/processors/ProcessorRegistry";

// Mock the ProcessorRegistry
jest.mock("../../services/processors/ProcessorRegistry", () => ({
  ProcessorRegistry: {
    getNodeTypeStatus: jest.fn(),
    getSimilarTypes: jest.fn(),
  },
}));

describe("NodeTypeDiagnostics", () => {
  let mockWorkflow: WorkflowStructure;

  beforeEach(() => {
    mockWorkflow = {
      nodes: [
        { id: "node-1", type: "dataInput", label: "Input", config: {} },
        {
          id: "node-2",
          type: "unsupportedType",
          label: "Unsupported",
          config: {},
        },
        {
          id: "node-3",
          type: "deprecatedType",
          label: "Deprecated",
          config: {},
        },
        {
          id: "node-4",
          type: "experimentalType",
          label: "Experimental",
          config: {},
        },
      ],
      edges: [],
      complexity: "medium",
      estimatedExecutionTime: 1000,
    };

    jest.clearAllMocks();
  });

  describe("generateNodeTypeDiagnostics", () => {
    it("should generate comprehensive diagnostics for all node types", () => {
      // Mock different statuses for different node types
      (ProcessorRegistry.getNodeTypeStatus as jest.Mock)
        .mockReturnValueOnce({ status: "supported" })
        .mockReturnValueOnce({ status: "unsupported" })
        .mockReturnValueOnce({ status: "deprecated" })
        .mockReturnValueOnce({ status: "experimental" });

      (ProcessorRegistry.getSimilarTypes as jest.Mock)
        .mockReturnValueOnce([])
        .mockReturnValueOnce(["dataInput", "dataOutput"])
        .mockReturnValueOnce(["llmTask"])
        .mockReturnValueOnce([]);

      const report = generateNodeTypeDiagnostics(mockWorkflow);

      expect(report).toMatchObject({
        totalNodes: 4,
        supportedNodes: 1,
        deprecatedNodes: 1,
        experimentalNodes: 1,
        unsupportedNodes: 1,
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            nodeType: "dataInput",
            status: "supported",
            severity: "info",
          }),
          expect.objectContaining({
            nodeType: "unsupportedType",
            status: "unsupported",
            severity: "error",
            warning: "Node type 'unsupportedType' is not supported",
          }),
          expect.objectContaining({
            nodeType: "deprecatedType",
            status: "deprecated",
            severity: "warning",
            warning: "Node type 'deprecatedType' is deprecated",
          }),
          expect.objectContaining({
            nodeType: "experimentalType",
            status: "experimental",
            severity: "warning",
            warning: "Node type 'experimentalType' is experimental",
          }),
        ]),
        recommendations: expect.arrayContaining([
          "Replace 1 unsupported node type(s) with supported alternatives",
          "Migrate 1 deprecated node type(s) to current versions",
          "Review 1 experimental node type(s) for stability",
        ]),
      });
    });

    it("should handle workflows with only supported nodes", () => {
      const supportedWorkflow = {
        ...mockWorkflow,
        nodes: [
          { id: "node-1", type: "dataInput", label: "Input", config: {} },
          { id: "node-2", type: "llmTask", label: "LLM", config: {} },
        ],
      };

      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        status: "supported",
      });
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([]);

      const report = generateNodeTypeDiagnostics(supportedWorkflow);

      expect(report).toMatchObject({
        totalNodes: 2,
        supportedNodes: 2,
        deprecatedNodes: 0,
        experimentalNodes: 0,
        unsupportedNodes: 0,
        recommendations: ["All node types are supported and up-to-date"],
      });
    });
  });

  describe("getNodeTypeSummary", () => {
    it("should provide a concise summary of issues", () => {
      (ProcessorRegistry.getNodeTypeStatus as jest.Mock)
        .mockReturnValueOnce({ status: "supported" })
        .mockReturnValueOnce({ status: "unsupported" })
        .mockReturnValueOnce({ status: "deprecated" })
        .mockReturnValueOnce({ status: "experimental" });

      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([]);

      const summary = getNodeTypeSummary(mockWorkflow);

      expect(summary).toMatchObject({
        hasIssues: true,
        issueCount: 1,
        warningCount: 2,
        summary:
          "1 error(s) - unsupported node types, 2 warning(s) - deprecated/experimental types",
      });
    });

    it("should indicate no issues for supported workflows", () => {
      const supportedWorkflow = {
        ...mockWorkflow,
        nodes: [
          { id: "node-1", type: "dataInput", label: "Input", config: {} },
        ],
      };

      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        status: "supported",
      });
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([]);

      const summary = getNodeTypeSummary(supportedWorkflow);

      expect(summary).toMatchObject({
        hasIssues: false,
        issueCount: 0,
        warningCount: 0,
        summary: "All node types are supported",
      });
    });
  });

  describe("suggestAlternatives", () => {
    it("should suggest alternatives for unsupported types", () => {
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([
        "dataInput",
        "dataOutput",
      ]);
      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        status: "unsupported",
      });

      const result = suggestAlternatives("unsupportedType");

      expect(result).toMatchObject({
        alternatives: ["dataInput", "dataOutput"],
        reason: "This node type is not supported",
      });
    });

    it("should suggest alternatives for deprecated types", () => {
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([
        "llmTask",
      ]);
      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        status: "deprecated",
      });

      const result = suggestAlternatives("deprecatedType");

      expect(result).toMatchObject({
        alternatives: ["llmTask"],
        reason: "This node type is deprecated",
      });
    });
  });

  describe("canExecuteWithoutFallback", () => {
    it("should identify workflows that need fallback processing", () => {
      (ProcessorRegistry.getNodeTypeStatus as jest.Mock)
        .mockReturnValueOnce({ status: "supported" })
        .mockReturnValueOnce({ status: "unsupported" })
        .mockReturnValueOnce({ status: "deprecated" })
        .mockReturnValueOnce({ status: "experimental" });

      const result = canExecuteWithoutFallback(mockWorkflow);

      expect(result).toMatchObject({
        canExecute: false,
        fallbackNodes: ["Unsupported"],
        reason: "1 node(s) will use fallback processing",
      });
    });

    it("should identify workflows that can execute without fallback", () => {
      const supportedWorkflow = {
        ...mockWorkflow,
        nodes: [
          { id: "node-1", type: "dataInput", label: "Input", config: {} },
          { id: "node-2", type: "llmTask", label: "LLM", config: {} },
        ],
      };

      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        status: "supported",
      });

      const result = canExecuteWithoutFallback(supportedWorkflow);

      expect(result).toMatchObject({
        canExecute: true,
        fallbackNodes: [],
        reason: "All nodes have dedicated processors",
      });
    });
  });
});
