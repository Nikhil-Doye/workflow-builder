import React from "react";
import { NodeData } from "../types";
import { useWorkflowStore } from "../store/workflowStore";
import { X, Settings } from "lucide-react";

interface NodeConfigurationProps {
  nodeId: string;
  data: NodeData;
  onClose: () => void;
}

const nodeTypeConfigs = {
  webScraping: {
    title: "Web Scraping Configuration (Firecrawl AI)",
    fields: [
      {
        key: "url",
        label: "URL",
        type: "text",
        placeholder: "https://example.com",
      },
      {
        key: "formats",
        label: "Output Formats",
        type: "select",
        options: ["markdown", "html", "text", "summary", "links", "images"],
        multiple: true,
      },
      {
        key: "onlyMainContent",
        label: "Only Main Content",
        type: "checkbox",
        defaultValue: true,
      },
      {
        key: "includeTags",
        label: "Include Tags (comma-separated)",
        type: "text",
        placeholder: "article, main, .content",
      },
      {
        key: "excludeTags",
        label: "Exclude Tags (comma-separated)",
        type: "text",
        placeholder: "nav, footer, .ads",
      },
      {
        key: "maxLength",
        label: "Max Length",
        type: "number",
        placeholder: "5000",
      },
      {
        key: "waitFor",
        label: "Wait For (ms)",
        type: "number",
        placeholder: "2000",
      },
      {
        key: "timeout",
        label: "Timeout (ms)",
        type: "number",
        placeholder: "30000",
      },
    ],
  },
  llmTask: {
    title: "LLM Task Configuration",
    fields: [
      {
        key: "prompt",
        label: "Prompt",
        type: "textarea",
        placeholder: "Enter your prompt...",
      },
      {
        key: "model",
        label: "Model",
        type: "select",
        options: ["deepseek-chat", "deepseek-reasoner"],
      },
      {
        key: "temperature",
        label: "Temperature",
        type: "number",
        min: 0,
        max: 2,
        step: 0.1,
      },
      {
        key: "maxTokens",
        label: "Max Tokens",
        type: "number",
        placeholder: "1000",
      },
    ],
  },
  embeddingGenerator: {
    title: "Embedding Generator Configuration",
    fields: [
      {
        key: "model",
        label: "Model",
        type: "select",
        options: ["text-embedding-ada-002", "text-embedding-3-small"],
      },
      {
        key: "dimensions",
        label: "Dimensions",
        type: "number",
        placeholder: "1536",
      },
    ],
  },
  similaritySearch: {
    title: "Similarity Search Configuration",
    fields: [
      {
        key: "vectorStore",
        label: "Vector Store",
        type: "select",
        options: ["pinecone", "weaviate", "chroma"],
      },
      { key: "topK", label: "Top K Results", type: "number", placeholder: "5" },
      {
        key: "threshold",
        label: "Similarity Threshold",
        type: "number",
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  },
  structuredOutput: {
    title: "Structured Output Configuration",
    fields: [
      {
        key: "schema",
        label: "JSON Schema",
        type: "textarea",
        placeholder: '{"type": "object", "properties": {...}}',
      },
      {
        key: "model",
        label: "Model",
        type: "select",
        options: ["deepseek-chat", "deepseek-reasoner"],
      },
    ],
  },
  dataInput: {
    title: "Data Input Configuration",
    fields: [
      {
        key: "dataType",
        label: "Data Type",
        type: "select",
        options: ["text", "json", "csv", "url", "pdf"],
      },
      {
        key: "defaultValue",
        label: "Default Value",
        type: "textarea",
        placeholder: "Enter default data...",
      },
    ],
  },
  dataOutput: {
    title: "Data Output Configuration",
    fields: [
      {
        key: "format",
        label: "Output Format",
        type: "select",
        options: ["json", "text", "csv"],
      },
      {
        key: "filename",
        label: "Filename",
        type: "text",
        placeholder: "output.json",
      },
    ],
  },
};

export const NodeConfiguration: React.FC<NodeConfigurationProps> = ({
  nodeId,
  data,
  onClose,
}) => {
  const { updateNode, currentWorkflow } = useWorkflowStore();
  const config = nodeTypeConfigs[data.type];

  // Get the latest node data from the store to ensure we have the most up-to-date config
  const currentNode = currentWorkflow?.nodes.find((node) => node.id === nodeId);
  const currentData = currentNode?.data || data;

  const handleConfigChange = (key: string, value: any) => {
    updateNode(nodeId, {
      config: {
        ...currentData.config,
        [key]: value,
      },
    });
  };

  const handleLabelChange = (label: string) => {
    updateNode(nodeId, { label });
  };

  const renderField = (field: any) => {
    const value = currentData.config[field.key] || field.defaultValue || "";

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
          />
        );
      case "select":
        if (field.multiple) {
          return (
            <div className="space-y-2">
              {field.options.map((option: string) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      Array.isArray(value) ? value.includes(option) : false
                    }
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleConfigChange(field.key, [
                          ...currentValues,
                          option,
                        ]);
                      } else {
                        handleConfigChange(
                          field.key,
                          currentValues.filter((v: string) => v !== option)
                        );
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          );
        }
        return (
          <select
            value={value}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select {field.label}</option>
            {field.options.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleConfigChange(field.key, e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Enable {field.label}</span>
          </label>
        );
      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) =>
              handleConfigChange(field.key, parseFloat(e.target.value) || 0)
            }
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleConfigChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {config.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Node Label
            </label>
            <input
              type="text"
              value={currentData.label}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {config.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
