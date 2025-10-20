import { copilotService } from "../../services/copilotService";

// Mock the centralized service
jest.mock("../../services/naturalLanguageToWorkflowService", () => ({
  naturalLanguageToWorkflowService: {
    parseNaturalLanguage: jest.fn(),
    analyzeMixedIntent: jest.fn(),
    generateMixedWorkflow: jest.fn(),
    validateWorkflow: jest.fn(),
    validateMixedWorkflow: jest.fn(),
    getImprovementSuggestions: jest.fn(),
    generateContextualSuggestions: jest.fn(),
    learnFromModifications: jest.fn(),
    clearCache: jest.fn(),
    getCacheStats: jest.fn(),
  },
}));

describe("CopilotService", () => {
  let mockNaturalLanguageToWorkflowService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNaturalLanguageToWorkflowService =
      require("../../services/naturalLanguageToWorkflowService").naturalLanguageToWorkflowService;
  });

  describe("parseNaturalLanguage", () => {
    it("should parse user intent successfully", async () => {
      const mockResult = {
        intent: "WEB_SCRAPING",
        confidence: 0.9,
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
        reasoning: "Web scraping workflow detected",
      };

      mockNaturalLanguageToWorkflowService.parseNaturalLanguage.mockResolvedValue(
        mockResult
      );

      const result = await copilotService.parseNaturalLanguage(
        "Scrape data from https://example.com"
      );

      expect(result.intent).toBe("WEB_SCRAPING");
      expect(result.entities.urls).toContain("https://example.com");
      expect(result.workflowStructure).toBeDefined();
      expect(
        mockNaturalLanguageToWorkflowService.parseNaturalLanguage
      ).toHaveBeenCalledWith("Scrape data from https://example.com");
    });

    it("should handle parsing errors gracefully", async () => {
      mockNaturalLanguageToWorkflowService.parseNaturalLanguage.mockRejectedValue(
        new Error("API Error")
      );

      await expect(
        copilotService.parseNaturalLanguage("Invalid input")
      ).rejects.toThrow("API Error");
    });

    it("should delegate to centralized service", async () => {
      const mockResult = {
        intent: "DATA_PROCESSING",
        confidence: 0.8,
        entities: {},
        workflowStructure: null,
        reasoning: "Data processing workflow",
      };

      mockNaturalLanguageToWorkflowService.parseNaturalLanguage.mockResolvedValue(
        mockResult
      );

      await copilotService.parseNaturalLanguage("Process some data");

      expect(
        mockNaturalLanguageToWorkflowService.parseNaturalLanguage
      ).toHaveBeenCalledWith("Process some data");
    });
  });

  describe("generateContextualSuggestions", () => {
    it("should generate contextual suggestions", async () => {
      const mockSuggestions = [
        "Add a data validation step",
        "Include error handling",
        "Add data transformation",
      ];

      mockNaturalLanguageToWorkflowService.generateContextualSuggestions.mockResolvedValue(
        mockSuggestions
      );

      const suggestions = await copilotService.generateContextualSuggestions(
        { nodes: [], edges: [] },
        "web scraping workflow"
      );

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toBe("Add a data validation step");
      expect(
        mockNaturalLanguageToWorkflowService.generateContextualSuggestions
      ).toHaveBeenCalledWith({ nodes: [], edges: [] }, "web scraping workflow");
    });

    it("should handle empty suggestions", async () => {
      mockNaturalLanguageToWorkflowService.generateContextualSuggestions.mockResolvedValue(
        []
      );

      const suggestions = await copilotService.generateContextualSuggestions(
        { nodes: [], edges: [] },
        "simple workflow"
      );

      expect(suggestions).toHaveLength(0);
    });
  });

  describe("analyzeMixedIntent", () => {
    it("should analyze mixed intent", async () => {
      const mockAnalysis = {
        intent: "MIXED",
        confidence: 0.8,
        reasoning: "Mixed workflow detected",
        subIntents: ["WEB_SCRAPING", "AI_ANALYSIS"],
        subConfidences: { WEB_SCRAPING: 0.9, AI_ANALYSIS: 0.7 },
        complexity: {
          level: "high",
          score: 0.8,
          patterns: ["mixed", "complex"],
          estimatedNodes: 5,
        },
      };

      mockNaturalLanguageToWorkflowService.analyzeMixedIntent.mockResolvedValue(
        mockAnalysis
      );

      const result = await copilotService.analyzeMixedIntent(
        "Scrape data and analyze with AI"
      );

      expect(result.intent).toBe("MIXED");
      expect(result.complexity.level).toBe("high");
      expect(
        mockNaturalLanguageToWorkflowService.analyzeMixedIntent
      ).toHaveBeenCalledWith("Scrape data and analyze with AI");
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

      const mockValidation = {
        isValid: true,
        issues: [],
        suggestions: [],
      };

      mockNaturalLanguageToWorkflowService.validateWorkflow.mockReturnValue(
        mockValidation
      );

      const result = copilotService.validateWorkflow(
        mockWorkflow,
        "test input"
      );

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(
        mockNaturalLanguageToWorkflowService.validateWorkflow
      ).toHaveBeenCalledWith(mockWorkflow, "test input");
    });

    it("should identify validation issues", async () => {
      const mockWorkflow = {
        nodes: [
          { type: "dataInput", label: "Input" },
          // Missing processor node
        ],
        edges: [],
      };

      const mockValidation = {
        isValid: false,
        issues: ["No processing nodes found"],
        suggestions: ["Add a processing node"],
      };

      mockNaturalLanguageToWorkflowService.validateWorkflow.mockReturnValue(
        mockValidation
      );

      const result = copilotService.validateWorkflow(
        mockWorkflow,
        "test input"
      );

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("No processing nodes found");
      expect(result.suggestions).toContain("Add a processing node");
    });
  });

  describe("getImprovementSuggestions", () => {
    it("should get improvement suggestions", async () => {
      const mockSuggestions = [
        "Add parallel processing for independent nodes",
        "Implement caching for repeated operations",
        "Optimize data flow between nodes",
      ];

      mockNaturalLanguageToWorkflowService.getImprovementSuggestions.mockReturnValue(
        mockSuggestions
      );

      const suggestions = copilotService.getImprovementSuggestions({
        nodes: [],
        edges: [],
      });

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toBe(
        "Add parallel processing for independent nodes"
      );
      expect(
        mockNaturalLanguageToWorkflowService.getImprovementSuggestions
      ).toHaveBeenCalledWith({
        nodes: [],
        edges: [],
      });
    });
  });

  describe("cache operations", () => {
    it("should clear cache", () => {
      copilotService.clearCache();
      expect(
        mockNaturalLanguageToWorkflowService.clearCache
      ).toHaveBeenCalled();
    });

    it("should get cache stats", () => {
      const mockStats = { size: 5, hitRate: 0.8 };
      mockNaturalLanguageToWorkflowService.getCacheStats.mockReturnValue(
        mockStats
      );

      const stats = copilotService.getCacheStats();
      expect(stats).toEqual(mockStats);
      expect(
        mockNaturalLanguageToWorkflowService.getCacheStats
      ).toHaveBeenCalled();
    });
  });

  describe("learnFromModifications", () => {
    it("should learn from modifications", () => {
      const originalWorkflow = { nodes: [], edges: [] };
      const modifiedWorkflow = { nodes: [{ type: "dataInput" }], edges: [] };
      const feedback = "Added input node";

      copilotService.learnFromModifications(
        originalWorkflow,
        modifiedWorkflow,
        feedback
      );

      expect(
        mockNaturalLanguageToWorkflowService.learnFromModifications
      ).toHaveBeenCalledWith(originalWorkflow, modifiedWorkflow, feedback);
    });
  });
});
