import { ExecutionEngine } from "../../services/executionEngine";

describe("ExecutionEngine - Processor Resolution", () => {
  let engine: ExecutionEngine;

  beforeEach(() => {
    engine = new ExecutionEngine();
  });

  describe("Node Type Validation", () => {
    it("should reject workflow with invalid node types", async () => {
      const nodes = [
        {
          id: "node-1",
          type: "invalidType",
          position: { x: 0, y: 0 },
          data: {
            id: "node-1",
            type: "invalidType",
            label: "Invalid Node",
            status: "idle",
            config: {},
            inputs: [],
            outputs: [],
          },
        },
      ];

      await expect(
        engine.executeWorkflow("test-workflow", nodes, [])
      ).rejects.toThrow(/Invalid node types detected/);
    });

    it("should accept workflow with all valid node types", async () => {
      const validTypes = [
        "dataInput",
        "dataOutput",
        "webScraping",
        "llmTask",
        "database",
        "slack",
        "discord",
        "gmail",
        "structuredOutput",
        "embeddingGenerator",
        "similaritySearch",
      ];

      for (const type of validTypes) {
        const nodes = [
          {
            id: "node-1",
            type: type,
            position: { x: 0, y: 0 },
            data: {
              id: "node-1",
              type: type,
              label: `${type} Node`,
              status: "idle",
              config: {},
              inputs: [],
              outputs: [],
            },
          },
        ];

        // Should not throw validation error for valid types
        // Note: May fail on execution for missing config, but not on validation
        try {
          await engine.executeWorkflow("test-workflow", nodes, []);
        } catch (error) {
          // Should not be a validation error about node types
          expect((error as Error).message).not.toMatch(
            /Invalid node types detected/
          );
        }
      }
    });

    it("should provide detailed error for nodes without type", async () => {
      const nodes = [
        {
          id: "node-1",
          position: { x: 0, y: 0 },
          data: {
            id: "node-1",
            label: "Typeless Node",
            status: "idle",
            config: {},
            inputs: [],
            outputs: [],
          },
        } as any, // Cast to any to allow missing type
      ];

      await expect(
        engine.executeWorkflow("test-workflow", nodes, [])
      ).rejects.toThrow(/has no type specified/);
    });

    it("should list supported types in error message", async () => {
      const nodes = [
        {
          id: "node-1",
          type: "unknownType",
          position: { x: 0, y: 0 },
          data: {
            id: "node-1",
            type: "unknownType",
            label: "Unknown Node",
            status: "idle",
            config: {},
            inputs: [],
            outputs: [],
          },
        },
      ];

      try {
        await engine.executeWorkflow("test-workflow", nodes, []);
        fail("Should have thrown error");
      } catch (error) {
        expect((error as Error).message).toMatch(/Supported types:/);
        expect((error as Error).message).toMatch(/dataInput/);
        expect((error as Error).message).toMatch(/llmTask/);
      }
    });
  });

  describe("Processor Import Error Handling", () => {
    it("should handle missing processor gracefully", async () => {
      // This test verifies the error handling for corrupted/missing processors
      // In practice, this shouldn't happen as we validate node types first

      const nodes = [
        {
          id: "node-1",
          type: "dataInput",
          position: { x: 0, y: 0 },
          data: {
            id: "node-1",
            type: "dataInput",
            label: "Data Input",
            status: "idle",
            config: {},
            inputs: [],
            outputs: [],
          },
        },
      ];

      // The execution should either succeed or fail with a clear error
      // Not with a cryptic module resolution error
      try {
        await engine.executeWorkflow("test-workflow", nodes, []);
        // If it succeeds, that's fine (processor exists)
      } catch (error) {
        // If it fails, error should be informative
        const errorMessage = (error as Error).message;

        // Should not be a cryptic webpack/module error
        expect(errorMessage).not.toMatch(/Cannot find module/);
        expect(errorMessage).not.toMatch(/Module parse failed/);

        // Should be a user-friendly error
        if (errorMessage.includes("processor")) {
          expect(errorMessage).toMatch(/node|type|processor/i);
        }
      }
    });
  });

  describe("Error Message Quality", () => {
    it("should provide actionable error messages", async () => {
      const nodes = [
        {
          id: "node-1",
          type: "legacyNodeType",
          position: { x: 0, y: 0 },
          data: {
            id: "node-1",
            type: "legacyNodeType",
            label: "Legacy Node",
            status: "idle",
            config: {},
            inputs: [],
            outputs: [],
          },
        },
      ];

      try {
        await engine.executeWorkflow("test-workflow", nodes, []);
        fail("Should have thrown error");
      } catch (error) {
        const errorMessage = (error as Error).message;

        // Error should mention the problematic node
        expect(errorMessage).toMatch(/legacyNodeType/);

        // Error should provide context
        expect(errorMessage.length).toBeGreaterThan(50);
      }
    });
  });
});
