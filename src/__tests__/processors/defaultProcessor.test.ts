import defaultProcessor, {
  DefaultProcessorResult,
} from "../../services/processors/defaultProcessor";
import {
  ExecutionContext,
  ExecutionPlan,
} from "../../services/executionEngine";
import { ProcessorRegistry } from "../../services/processors/ProcessorRegistry";

// Mock the ProcessorRegistry
jest.mock("../../services/processors/ProcessorRegistry", () => ({
  ProcessorRegistry: {
    getNodeTypeStatus: jest.fn(),
    getSimilarTypes: jest.fn(),
  },
}));

describe("DefaultProcessor", () => {
  let mockContext: ExecutionContext;
  let mockPlan: ExecutionPlan;

  beforeEach(() => {
    mockContext = {
      nodeId: "test-node-1",
      nodeType: "unsupportedType",
      config: {},
      inputs: new Map([["input1", "test data"]]),
    };

    mockPlan = {
      id: "test-plan-1",
      name: "Test Plan",
      nodes: [],
      edges: [],
      status: "running",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("Unsupported node types", () => {
    beforeEach(() => {
      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        supported: false,
        deprecated: false,
        experimental: false,
        status: "unsupported",
      });
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([
        "dataInput",
        "dataOutput",
      ]);
    });

    it("should process unsupported node types with warnings", async () => {
      const result = await defaultProcessor(mockContext, mockPlan);

      expect(result).toMatchObject({
        input: "test data",
        output: "test data",
        type: "default",
        success: true,
        warning:
          "Node type 'unsupportedType' is not supported. Using fallback processor.",
        diagnostics: {
          nodeType: "unsupportedType",
          status: "unsupported",
          similarTypes: ["dataInput", "dataOutput"],
          suggestion:
            "Consider using one of these supported types: dataInput, dataOutput",
        },
        metadata: {
          executionTime: expect.any(Number),
          timestamp: expect.any(Date),
          fallbackUsed: true,
        },
      });
    });

    it("should log warning to console", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await defaultProcessor(mockContext, mockPlan);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[DefaultProcessor] Node type 'unsupportedType' is not supported. Using fallback processor.",
        expect.objectContaining({
          nodeType: "unsupportedType",
          nodeId: "test-node-1",
          executionId: "test-plan-1",
          suggestion:
            "Consider using one of these supported types: dataInput, dataOutput",
          similarTypes: ["dataInput", "dataOutput"],
        })
      );

      consoleSpy.mockRestore();
    });

    it("should handle unsupported types with no similar types", async () => {
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([]);

      const result = await defaultProcessor(mockContext, mockPlan);

      expect(result.diagnostics?.suggestion).toBe(
        "No similar node types found. Check the documentation for supported types."
      );
    });
  });

  describe("Deprecated node types", () => {
    beforeEach(() => {
      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        supported: true,
        deprecated: true,
        experimental: false,
        status: "deprecated",
      });
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([
        "llmTask",
      ]);
    });

    it("should process deprecated node types with warnings", async () => {
      const result = await defaultProcessor(mockContext, mockPlan);

      expect(result).toMatchObject({
        warning:
          "Node type 'unsupportedType' is deprecated and may be removed in future versions.",
        diagnostics: {
          status: "deprecated",
          suggestion: "Consider migrating to: llmTask",
        },
      });
    });
  });

  describe("Experimental node types", () => {
    beforeEach(() => {
      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        supported: true,
        deprecated: false,
        experimental: true,
        status: "experimental",
      });
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([]);
    });

    it("should process experimental node types with warnings", async () => {
      const result = await defaultProcessor(mockContext, mockPlan);

      expect(result).toMatchObject({
        warning:
          "Node type 'unsupportedType' is experimental and may have limited functionality.",
        diagnostics: {
          status: "experimental",
          suggestion: "Use with caution. API may change in future versions.",
        },
      });
    });
  });

  describe("Supported node types", () => {
    beforeEach(() => {
      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        supported: true,
        deprecated: false,
        experimental: false,
        status: "supported",
      });
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([]);
    });

    it("should process supported node types without warnings", async () => {
      const result = await defaultProcessor(mockContext, mockPlan);

      expect(result).toMatchObject({
        input: "test data",
        output: "test data",
        type: "default",
        success: true,
        warning: undefined,
        diagnostics: {
          nodeType: "unsupportedType",
          status: "supported",
          similarTypes: [],
          suggestion: undefined,
        },
      });
    });
  });

  describe("Error handling", () => {
    it("should handle processing errors gracefully", async () => {
      // Mock an error in the processor
      const errorContext = {
        ...mockContext,
        inputs: new Map([["input1", null]]), // This might cause an error
      };

      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        supported: false,
        deprecated: false,
        experimental: false,
        status: "unsupported",
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(defaultProcessor(errorContext, mockPlan)).rejects.toThrow(
        "Default processing failed for node type 'unsupportedType'"
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "[DefaultProcessor] Processing failed for node type 'unsupportedType':",
        expect.objectContaining({
          nodeType: "unsupportedType",
          nodeId: "test-node-1",
          executionId: "test-plan-1",
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Input handling", () => {
    it("should handle empty inputs", async () => {
      const emptyContext = {
        ...mockContext,
        inputs: new Map(),
      };

      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        supported: false,
        deprecated: false,
        experimental: false,
        status: "unsupported",
      });
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([]);

      const result = await defaultProcessor(emptyContext, mockPlan);

      expect(result).toMatchObject({
        input: "",
        output: "",
        success: true,
      });
    });

    it("should handle multiple inputs by taking the last one", async () => {
      const multiInputContext = {
        ...mockContext,
        inputs: new Map([
          ["input1", "first data"],
          ["input2", "second data"],
          ["input3", "third data"],
        ]),
      };

      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        supported: false,
        deprecated: false,
        experimental: false,
        status: "unsupported",
      });
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([]);

      const result = await defaultProcessor(multiInputContext, mockPlan);

      expect(result).toMatchObject({
        input: "third data",
        output: "third data",
      });
    });
  });

  describe("Metadata", () => {
    it("should include execution metadata", async () => {
      (ProcessorRegistry.getNodeTypeStatus as jest.Mock).mockReturnValue({
        supported: false,
        deprecated: false,
        experimental: false,
        status: "unsupported",
      });
      (ProcessorRegistry.getSimilarTypes as jest.Mock).mockReturnValue([]);

      const startTime = Date.now();
      const result = await defaultProcessor(mockContext, mockPlan);
      const endTime = Date.now();

      expect(result.metadata).toMatchObject({
        executionTime: expect.any(Number),
        timestamp: expect.any(Date),
        fallbackUsed: true,
      });

      expect(result.metadata!.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata!.executionTime).toBeLessThanOrEqual(
        endTime - startTime + 10
      ); // Allow some margin
    });
  });
});
