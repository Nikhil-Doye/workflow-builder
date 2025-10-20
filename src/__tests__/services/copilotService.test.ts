import { copilotService } from "../../services/copilotService";

// Mock dependencies
jest.mock("../../services/openaiService", () => ({
  callOpenAI: jest.fn(),
}));

jest.mock("../../services/agents/AgentManager", () => ({
  agentManager: {
    generateWorkflowFromDescription: jest.fn(),
  },
}));

jest.mock("../../utils/workflowGenerator", () => ({
  generateWorkflowStructure: jest.fn(),
}));

jest.mock("../../utils/workflowValidator", () => ({
  validateWorkflowStructure: jest.fn(),
}));

describe("CopilotService", () => {
  let mockCallOpenAI: jest.MockedFunction<any>;
  let mockAgentManager: any;
  let mockGenerateWorkflowStructure: jest.MockedFunction<any>;
  let mockValidateWorkflowStructure: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCallOpenAI = require("../../services/openaiService").callOpenAI;
    mockAgentManager =
      require("../../services/agents/AgentManager").agentManager;
    mockGenerateWorkflowStructure =
      require("../../utils/workflowGenerator").generateWorkflowStructure;
    mockValidateWorkflowStructure =
      require("../../utils/workflowValidator").validateWorkflowStructure;
  });

  describe("parseUserIntent", () => {
    it("should parse user intent successfully", async () => {
      const mockResponse = {
        content: JSON.stringify({
          intent: "WEB_SCRAPING",
          entities: {
            urls: ["https://example.com"],
            dataTypes: ["html"],
          },
          workflowStructure: {
            nodes: [
              { type: "dataInput", label: "URL Input" },
              { type: "webScraping", label: "Web Scraper" },
            ],
            edges: [{ source: "node-0", target: "node-1" }],
          },
        }),
      };

      mockCallOpenAI.mockResolvedValue(mockResponse);

      const result = await copilotService.parseUserIntent(
        "Scrape data from https://example.com"
      );

      expect(result.intent).toBe("WEB_SCRAPING");
      expect(result.entities.urls).toContain("https://example.com");
      expect(result.workflowStructure).toBeDefined();
      expect(mockCallOpenAI).toHaveBeenCalledWith(
        expect.stringContaining("Scrape data from https://example.com"),
        expect.any(Object)
      );
    });

    it("should handle parsing errors gracefully", async () => {
      mockCallOpenAI.mockRejectedValue(new Error("API Error"));

      await expect(
        copilotService.parseUserIntent("Invalid input")
      ).rejects.toThrow("API Error");
    });

    it("should use cache for repeated requests", async () => {
      const mockResponse = {
        content: JSON.stringify({
          intent: "DATA_PROCESSING",
          entities: {},
          workflowStructure: null,
        }),
      };

      mockCallOpenAI.mockResolvedValue(mockResponse);

      // First call
      await copilotService.parseUserIntent("Process some data");
      expect(mockCallOpenAI).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await copilotService.parseUserIntent("Process some data");
      expect(mockCallOpenAI).toHaveBeenCalledTimes(1);
    });
  });

  describe("generateWorkflowSuggestions", () => {
    it("should generate workflow suggestions", async () => {
      const mockResponse = {
        content: JSON.stringify({
          suggestions: [
            "Add a data validation step",
            "Include error handling",
            "Add data transformation",
          ],
        }),
      };

      mockCallOpenAI.mockResolvedValue(mockResponse);

      const suggestions = await copilotService.generateWorkflowSuggestions(
        "web scraping workflow",
        { nodes: [], edges: [] }
      );

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toBe("Add a data validation step");
      expect(mockCallOpenAI).toHaveBeenCalledWith(
        expect.stringContaining("web scraping workflow"),
        expect.any(Object)
      );
    });

    it("should handle empty suggestions", async () => {
      const mockResponse = {
        content: JSON.stringify({
          suggestions: [],
        }),
      };

      mockCallOpenAI.mockResolvedValue(mockResponse);

      const suggestions = await copilotService.generateWorkflowSuggestions(
        "simple workflow",
        { nodes: [], edges: [] }
      );

      expect(suggestions).toHaveLength(0);
    });
  });

  describe("generateWorkflowFromDescription", () => {
    it("should generate workflow from description", async () => {
      const mockWorkflowStructure = {
        nodes: [
          { type: "dataInput", label: "Input" },
          { type: "llmTask", label: "Processor" },
        ],
        edges: [{ source: "node-0", target: "node-1" }],
      };

      mockAgentManager.generateWorkflowFromDescription.mockResolvedValue({
        intent: "AI_ANALYSIS",
        entities: {},
        workflowStructure: mockWorkflowStructure,
      });

      const result = await copilotService.generateWorkflowFromDescription(
        "Analyze text data with AI"
      );

      expect(result.intent).toBe("AI_ANALYSIS");
      expect(result.workflowStructure).toEqual(mockWorkflowStructure);
      expect(
        mockAgentManager.generateWorkflowFromDescription
      ).toHaveBeenCalledWith("Analyze text data with AI");
    });

    it("should handle generation errors", async () => {
      mockAgentManager.generateWorkflowFromDescription.mockRejectedValue(
        new Error("Generation failed")
      );

      await expect(
        copilotService.generateWorkflowFromDescription("Invalid request")
      ).rejects.toThrow("Generation failed");
    });
  });

  describe("validateWorkflow", () => {
    it("should validate workflow structure", async () => {
      const mockWorkflow = {
        nodes: [
          { type: "dataInput", label: "Input" },
          { type: "llmTask", label: "Processor" },
        ],
        edges: [{ source: "node-0", target: "node-1" }],
      };

      mockValidateWorkflowStructure.mockReturnValue({
        isValid: true,
        issues: [],
        suggestions: [],
      });

      const result = await copilotService.validateWorkflow(mockWorkflow);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(mockValidateWorkflowStructure).toHaveBeenCalledWith(mockWorkflow);
    });

    it("should identify validation issues", async () => {
      const mockWorkflow = {
        nodes: [
          { type: "dataInput", label: "Input" },
          // Missing processor node
        ],
        edges: [],
      };

      mockValidateWorkflowStructure.mockReturnValue({
        isValid: false,
        issues: ["No processing nodes found"],
        suggestions: ["Add a processing node"],
      });

      const result = await copilotService.validateWorkflow(mockWorkflow);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("No processing nodes found");
      expect(result.suggestions).toContain("Add a processing node");
    });
  });

  describe("optimizeWorkflow", () => {
    it("should optimize workflow performance", async () => {
      const mockResponse = {
        content: JSON.stringify({
          optimizations: [
            "Add parallel processing for independent nodes",
            "Implement caching for repeated operations",
            "Optimize data flow between nodes",
          ],
        }),
      };

      mockCallOpenAI.mockResolvedValue(mockResponse);

      const optimizations = await copilotService.optimizeWorkflow({
        nodes: [],
        edges: [],
      });

      expect(optimizations).toHaveLength(3);
      expect(optimizations[0]).toBe(
        "Add parallel processing for independent nodes"
      );
    });
  });

  describe("getCopilotSuggestions", () => {
    it("should get contextual suggestions", async () => {
      const mockResponse = {
        content: JSON.stringify({
          suggestions: [
            "Consider adding error handling",
            "Add data validation step",
            "Include progress indicators",
          ],
        }),
      };

      mockCallOpenAI.mockResolvedValue(mockResponse);

      const suggestions = await copilotService.getCopilotSuggestions(
        "web scraping workflow"
      );

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toBe("Consider adding error handling");
    });

    it("should handle context-specific suggestions", async () => {
      const mockResponse = {
        content: JSON.stringify({
          suggestions: [
            "Add database connection for data storage",
            "Include data transformation steps",
            "Add output formatting options",
          ],
        }),
      };

      mockCallOpenAI.mockResolvedValue(mockResponse);

      const suggestions = await copilotService.getCopilotSuggestions(
        "data processing workflow with database"
      );

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toBe("Add database connection for data storage");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON responses", async () => {
      mockCallOpenAI.mockResolvedValue({
        content: "Invalid JSON response",
      });

      await expect(
        copilotService.parseUserIntent("Test input")
      ).rejects.toThrow();
    });

    it("should handle network timeouts", async () => {
      mockCallOpenAI.mockRejectedValue(new Error("Request timeout"));

      await expect(
        copilotService.parseUserIntent("Test input")
      ).rejects.toThrow("Request timeout");
    });

    it("should handle empty responses", async () => {
      mockCallOpenAI.mockResolvedValue({
        content: "",
      });

      await expect(
        copilotService.parseUserIntent("Test input")
      ).rejects.toThrow();
    });
  });
});
