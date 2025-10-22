import { getNodeTypeConfig, nodeTypeConfigs } from "../config/nodeTypeConfigs";
import {
  getFieldConfig,
  fieldConfigs,
  getFieldsForNodeType,
} from "../config/fieldConfigs";
import { NodeType } from "../types";

describe("Dual-Label System", () => {
  describe("Node Type Configurations", () => {
    test("should have configurations for all node types", () => {
      const nodeTypes: NodeType[] = [
        "dataInput",
        "webScraping",
        "llmTask",
        "embeddingGenerator",
        "similaritySearch",
        "structuredOutput",
        "dataOutput",
        "databaseQuery",
        "databaseInsert",
        "databaseUpdate",
        "databaseDelete",
      ];

      nodeTypes.forEach((nodeType) => {
        const config = getNodeTypeConfig(nodeType);
        expect(config).toBeDefined();
        expect(config.userFriendlyName).toBeTruthy();
        expect(config.technicalName).toBeTruthy();
        expect(config.description).toBeTruthy();
        expect(config.helpText).toBeTruthy();
        expect(config.commonUseCases).toBeInstanceOf(Array);
        expect(config.commonUseCases.length).toBeGreaterThan(0);
        expect(config.icon).toBeTruthy();
        expect(config.category).toBeTruthy();
      });
    });

    test("should have user-friendly names that are different from technical names", () => {
      Object.entries(nodeTypeConfigs).forEach(([nodeType, config]) => {
        expect(config.userFriendlyName).not.toBe(config.technicalName);
        expect(config.userFriendlyName).toBeTruthy();
        expect(config.technicalName).toBeTruthy();
      });
    });

    test("should have meaningful help text", () => {
      Object.entries(nodeTypeConfigs).forEach(([nodeType, config]) => {
        expect(config.helpText.length).toBeGreaterThan(10);
        expect(config.helpText).toBeTruthy();
      });
    });
  });

  describe("Field Configurations", () => {
    const testFields = [
      "dataType",
      "prompt",
      "url",
      "model",
      "temperature",
      "maxTokens",
      "label",
      "formats",
      "maxLength",
      "query",
      "table",
      "format",
      "filename",
    ];

    test("should have configurations for common fields", () => {
      testFields.forEach((fieldName) => {
        const config = getFieldConfig(fieldName);
        expect(config).toBeDefined();
        expect(config.userFriendlyName).toBeTruthy();
        expect(config.technicalName).toBeTruthy();
        expect(config.description).toBeTruthy();
        expect(config.helpText).toBeTruthy();
        expect(config.examples).toBeInstanceOf(Array);
        expect(config.examples.length).toBeGreaterThan(0);
      });
    });

    test("should have user-friendly field names", () => {
      testFields.forEach((fieldName) => {
        const config = getFieldConfig(fieldName);
        if (config) {
          expect(config.userFriendlyName).not.toBe(config.technicalName);
          expect(config.userFriendlyName).toMatch(/^[A-Z]/); // Should start with capital letter
        }
      });
    });

    test("should have helpful examples for each field", () => {
      testFields.forEach((fieldName) => {
        const config = getFieldConfig(fieldName);
        if (config) {
          expect(config.examples.length).toBeGreaterThan(0);
          config.examples.forEach((example) => {
            expect(example).toBeTruthy();
            expect(example.length).toBeGreaterThan(0);
          });
        }
      });
    });
  });

  describe("Field Mappings", () => {
    const testNodeTypes: NodeType[] = [
      "dataInput",
      "llmTask",
      "webScraping",
      "databaseQuery",
    ];

    test("should return fields for each node type", () => {
      testNodeTypes.forEach((nodeType) => {
        const fields = getFieldsForNodeType(nodeType);
        expect(fields).toBeInstanceOf(Array);
        expect(fields.length).toBeGreaterThan(0);
      });
    });

    test("should have configurations for all mapped fields", () => {
      testNodeTypes.forEach((nodeType) => {
        const fields = getFieldsForNodeType(nodeType);
        fields.forEach((fieldName) => {
          const fieldConfig = getFieldConfig(fieldName);
          expect(fieldConfig).toBeDefined();
          expect(fieldConfig.userFriendlyName).toBeTruthy();
        });
      });
    });
  });

  describe("Content Quality", () => {
    test("should have non-technical language in user-friendly names", () => {
      Object.entries(nodeTypeConfigs).forEach(([nodeType, config]) => {
        // Check that user-friendly names don't contain technical jargon
        const technicalTerms = [
          "API",
          "JSON",
          "HTTP",
          "SQL",
          "LLM",
          "URL",
          "CSV",
        ];
        technicalTerms.forEach((term) => {
          expect(config.userFriendlyName).not.toContain(term);
        });
      });
    });

    test("should have clear, actionable help text", () => {
      Object.entries(nodeTypeConfigs).forEach(([nodeType, config]) => {
        expect(config.helpText).toMatch(/[.!?]$/); // Should end with punctuation
        expect(config.helpText).not.toContain("undefined");
        expect(config.helpText).not.toContain("null");
      });
    });

    test("should have practical common use cases", () => {
      Object.entries(nodeTypeConfigs).forEach(([nodeType, config]) => {
        config.commonUseCases.forEach((useCase) => {
          expect(useCase).toBeTruthy();
          expect(useCase.length).toBeGreaterThan(10);
          expect(useCase).toMatch(/^[A-Z]/); // Should start with capital letter
        });
      });
    });
  });
});
