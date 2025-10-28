import React, { useState } from "react";
import { NodeData } from "../types";
import { useWorkflowStore } from "../store/workflowStore";
import { X, Settings, Sparkles } from "lucide-react";
import { promptOptimizer } from "../services/promptOptimizer";
import { callOpenAI } from "../services/openaiService";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { DatabaseNodeConfiguration } from "./DatabaseNodeConfiguration";
import { LabelChangeDialog } from "./LabelChangeDialog";
import { LabelDependencyManager } from "../utils/labelDependencyManager";
import { FieldWithHelp } from "./FieldWithHelp";
import { getNodeTypeConfig } from "../config/nodeTypeConfigs";

interface NodeConfigurationProps {
  nodeId: string;
  data: NodeData;
  onClose: () => void;
}

interface FieldConfig {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: string[];
  multiple?: boolean;
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
}

const nodeTypeConfigs: Record<
  string,
  { title: string; fields: FieldConfig[] }
> = {
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
        options: ["pinecone"],
      },
      {
        key: "indexName",
        label: "Index Name",
        type: "text",
        placeholder: "my-index",
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
  database: {
    title: "Database Operations Configuration",
    fields: [
      {
        key: "operation",
        label: "Operation Type",
        type: "select",
        options: [
          "query",
          "insert",
          "update",
          "delete",
          "aggregate",
          "transaction",
        ],
      },
      {
        key: "connectionId",
        label: "Database Connection",
        type: "text",
        placeholder: "connection-id",
      },
      {
        key: "query",
        label: "SQL Query (for query operation)",
        type: "textarea",
        placeholder: "SELECT * FROM users WHERE id = ?",
      },
      {
        key: "table",
        label: "Table Name (for insert/update/delete)",
        type: "text",
        placeholder: "users",
      },
      {
        key: "data",
        label: "Data (JSON)",
        type: "textarea",
        placeholder: '{"name": "John", "email": "john@example.com"}',
      },
    ],
  },
  slack: {
    title: "Slack Integration Configuration",
    fields: [
      {
        key: "botToken",
        label: "Bot Token",
        type: "text",
        placeholder: "xoxb-your-bot-token",
      },
      {
        key: "operation",
        label: "Operation Type",
        type: "select",
        options: ["message", "channel", "user", "file", "reaction", "reminder"],
      },
      {
        key: "channel",
        label: "Channel (for message/channel operations)",
        type: "text",
        placeholder: "#general or @username",
      },
      {
        key: "text",
        label: "Message Text",
        type: "textarea",
        placeholder: "Hello from the workflow!",
      },
      {
        key: "user",
        label: "User ID (for user operations)",
        type: "text",
        placeholder: "U1234567890",
      },
    ],
  },
  discord: {
    title: "Discord Integration Configuration",
    fields: [
      {
        key: "botToken",
        label: "Bot Token",
        type: "text",
        placeholder: "your-bot-token",
      },
      {
        key: "operation",
        label: "Operation Type",
        type: "select",
        options: [
          "message",
          "channel",
          "user",
          "role",
          "reaction",
          "voice",
          "webhook",
        ],
      },
      {
        key: "channelId",
        label: "Channel ID (for message/channel operations)",
        type: "text",
        placeholder: "123456789012345678",
      },
      {
        key: "message",
        label: "Message Text",
        type: "textarea",
        placeholder: "Hello from the workflow!",
      },
      {
        key: "userId",
        label: "User ID (for user operations)",
        type: "text",
        placeholder: "123456789012345678",
      },
    ],
  },
  gmail: {
    title: "Gmail Integration Configuration",
    fields: [
      {
        key: "accessToken",
        label: "Access Token",
        type: "text",
        placeholder: "your-gmail-access-token",
      },
      {
        key: "operation",
        label: "Operation Type",
        type: "select",
        options: [
          "send",
          "read",
          "reply",
          "forward",
          "draft",
          "label",
          "search",
          "attachment",
        ],
      },
      {
        key: "to",
        label: "To (for send/forward operations)",
        type: "text",
        placeholder: "recipient@example.com",
      },
      {
        key: "subject",
        label: "Subject",
        type: "text",
        placeholder: "Email subject",
      },
      {
        key: "body",
        label: "Message Body",
        type: "textarea",
        placeholder: "Email content",
      },
      {
        key: "messageId",
        label: "Message ID (for read/reply/forward operations)",
        type: "text",
        placeholder: "Message ID",
      },
      {
        key: "query",
        label: "Search Query (for read/search operations)",
        type: "text",
        placeholder: "Search query",
      },
    ],
  },
};

export const NodeConfiguration: React.FC<NodeConfigurationProps> = ({
  nodeId,
  data,
  onClose,
}) => {
  const { updateNode, updateNodeLabelWithDependencies, currentWorkflow } =
    useWorkflowStore();
  const config = nodeTypeConfigs[data.type];
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string>("");
  const [isPreviewingOptimization, setIsPreviewingOptimization] =
    useState(false);

  // Get the latest node data from the store to ensure we have the most up-to-date config
  const currentNode = currentWorkflow?.nodes.find((node) => node.id === nodeId);
  const currentData = currentNode?.data || data;

  const [originalPrompt, setOriginalPrompt] = useState<string>(
    (currentData.config && currentData.config.prompt) || ""
  );
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  // State for label change dialog
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [pendingLabel, setPendingLabel] = useState<string>("");

  const handleConfigChange = (key: string, value: any) => {
    updateNode(nodeId, {
      config: {
        ...currentData.config,
        [key]: value,
      },
    });
  };

  // Check if this is a database node and use the enhanced configuration
  const isDatabaseNode = data.type === "database";

  if (isDatabaseNode) {
    return (
      <DatabaseNodeConfiguration
        nodeId={nodeId}
        data={data}
        onClose={onClose}
        onConfigChange={handleConfigChange}
      />
    );
  }

  const handleLabelChange = (label: string) => {
    const currentLabel = currentData.label || nodeId;

    // If the label hasn't changed, do nothing
    if (label === currentLabel) {
      return;
    }

    // Check if there are any dependencies on this label
    if (currentWorkflow) {
      const dependencies = LabelDependencyManager.findLabelDependencies(
        currentWorkflow,
        nodeId,
        currentLabel
      );

      if (dependencies.length > 0) {
        // Show dialog to handle dependencies
        setPendingLabel(label);
        setShowLabelDialog(true);
        return;
      }
    }

    // No dependencies, safe to update directly
    updateNode(nodeId, { label });
  };

  const handleLabelChangeConfirm = (
    newLabel: string,
    updateReferences: boolean
  ) => {
    if (!currentWorkflow) return;

    // Use the new store method that handles dependencies
    updateNodeLabelWithDependencies(nodeId, newLabel, updateReferences);

    setShowLabelDialog(false);
    setPendingLabel("");
  };

  const handleLabelChangeCancel = () => {
    setShowLabelDialog(false);
    setPendingLabel("");
  };

  const handleOptimizePrompt = async () => {
    if (!currentData.config.prompt) {
      alert("Please enter a prompt first");
      return;
    }

    setIsOptimizing(true);
    setOptimizationResult("");
    setOriginalPrompt(currentData.config.prompt);

    try {
      // Extract intent from the prompt itself
      const prompt = currentData.config.prompt;
      const entities = {
        aiTasks: prompt.toLowerCase().includes("analyze")
          ? ["analyze"]
          : prompt.toLowerCase().includes("summarize")
          ? ["summarize"]
          : prompt.toLowerCase().includes("extract")
          ? ["extract"]
          : prompt.toLowerCase().includes("classify")
          ? ["classify"]
          : prompt.toLowerCase().includes("generate")
          ? ["generate"]
          : ["process"],
        dataTypes: prompt.toLowerCase().includes("resume")
          ? ["resume"]
          : prompt.toLowerCase().includes("document")
          ? ["document"]
          : prompt.toLowerCase().includes("text")
          ? ["text"]
          : ["text"],
        urls: [],
        complexity: "medium",
      };

      // Create mock node context
      const nodeContext = {
        dataType: "text",
        previousNodes: [],
        intent: "AI_ANALYSIS",
        domain: prompt.toLowerCase().includes("resume")
          ? "jobApplication"
          : prompt.toLowerCase().includes("financial")
          ? "financial"
          : prompt.toLowerCase().includes("legal")
          ? "legal"
          : "general",
        workflowType: "ai_analysis",
        availableData: new Map(),
      };

      // Generate optimized prompt using the prompt optimizer
      const optimizedPrompt = promptOptimizer.generateOptimizedPrompt(
        prompt,
        entities,
        nodeContext,
        new Map()
      );

      // Make DeepSeek API call to further optimize the prompt
      const apiResponse = await callOpenAI(
        `You are a prompt optimization expert. Your task is to optimize the given prompt for better AI performance. 

IMPORTANT: Return ONLY the optimized prompt. Do not include any explanations, comments, or additional text. Just the optimized prompt itself.

Original Prompt: ${prompt}

Optimized Template: ${optimizedPrompt}

Return only the optimized prompt:`,
        {
          model: "deepseek-chat",
          temperature: 0.7,
          maxTokens: 1000,
        }
      );

      // Clean up the response to ensure we only get the optimized prompt
      let cleanedResult = apiResponse.content.trim();

      // Remove common prefixes that might be added by the AI
      const prefixesToRemove = [
        "Optimized Prompt:",
        "Here's the optimized prompt:",
        "The optimized prompt is:",
        "Optimized version:",
        "Here is the optimized prompt:",
        "Optimized prompt:",
        "Here's the improved prompt:",
        "Improved prompt:",
        "Here is the improved prompt:",
        "The improved prompt is:",
        "Here's the enhanced prompt:",
        "Enhanced prompt:",
        "Here is the enhanced prompt:",
        "The enhanced prompt is:",
      ];

      for (const prefix of prefixesToRemove) {
        if (cleanedResult.toLowerCase().startsWith(prefix.toLowerCase())) {
          cleanedResult = cleanedResult.substring(prefix.length).trim();
        }
      }

      // Remove any quotes that might wrap the prompt
      if (
        (cleanedResult.startsWith('"') && cleanedResult.endsWith('"')) ||
        (cleanedResult.startsWith("'") && cleanedResult.endsWith("'"))
      ) {
        cleanedResult = cleanedResult.slice(1, -1).trim();
      }

      setOptimizationResult(cleanedResult);
      setIsPreviewingOptimization(true);
    } catch (error) {
      console.error("Error optimizing prompt:", error);
      setOptimizationResult("Error optimizing prompt. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const applyOptimizedPrompt = () => {
    if (optimizationResult) {
      // Save to history for undo
      setPromptHistory((prev) => [originalPrompt, ...prev].slice(0, 20));
      handleConfigChange("prompt", optimizationResult);
      setOptimizationResult("");
      setIsPreviewingOptimization(false);
    }
  };

  const cancelOptimizationPreview = () => {
    setOptimizationResult("");
    setIsPreviewingOptimization(false);
  };

  const undoLastPromptChange = () => {
    if (promptHistory.length === 0) return;
    const [last, ...rest] = promptHistory;
    handleConfigChange("prompt", last);
    setPromptHistory(rest);
  };

  const renderField = (field: FieldConfig) => {
    const value = currentData.config[field.key] || field.defaultValue || "";

    return (
      <div className="space-y-2">
        <FieldWithHelp
          fieldName={field.key}
          value={value}
          onChange={(newValue) => handleConfigChange(field.key, newValue)}
          type={field.type}
          options={field.options}
          multiple={field.multiple}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          nodeType={data.type}
        />
        {data.type === "llmTask" && field.key === "prompt" && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleOptimizePrompt}
                disabled={isOptimizing || !currentData.config.prompt}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isOptimizing ? "Optimizing..." : "Optimize Prompt"}
              </Button>
              <Button
                onClick={undoLastPromptChange}
                disabled={promptHistory.length === 0}
                size="sm"
                variant="outline"
                title={
                  promptHistory.length === 0
                    ? "Nothing to undo"
                    : "Undo last change"
                }
              >
                Undo
              </Button>
            </div>
            {isPreviewingOptimization && optimizationResult && (
              <div className="p-3 border rounded-lg bg-gray-50">
                <div className="text-xs font-medium text-gray-600 mb-2">
                  Optimized Preview
                </div>
                <div className="text-sm whitespace-pre-wrap text-gray-800 max-h-40 overflow-auto">
                  {optimizationResult}
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    size="sm"
                    onClick={applyOptimizedPrompt}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelOptimizationPreview}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {getNodeTypeConfig(data.type).userFriendlyName} Configuration
              </CardTitle>
              <p className="text-sm text-gray-500">
                {getNodeTypeConfig(data.type).technicalName} •{" "}
                {getNodeTypeConfig(data.type).description}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto max-h-[60vh]">
          <FieldWithHelp
            fieldName="label"
            value={currentData.label}
            onChange={handleLabelChange}
            type="text"
            placeholder="Enter node label"
            nodeType={data.type}
          />

          {config.fields.map((field) => (
            <div key={field.key}>{renderField(field)}</div>
          ))}

          {/* Optimization Result Display */}
          {data.type === "llmTask" && optimizationResult && (
            <Card className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-sm font-semibold text-purple-800">
                    Optimized Prompt Preview
                  </CardTitle>
                  <Badge variant="info" className="text-xs">
                    Preview
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-md border border-purple-100 shadow-sm">
                  <div className="mb-2 text-xs text-gray-500 font-medium">
                    Optimized Prompt:
                  </div>
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed bg-gray-50 p-3 rounded border">
                    {optimizationResult}
                  </pre>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-purple-600">
                    Review the optimized prompt above and click "Apply" to
                    replace your current prompt.
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setOptimizationResult("")}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={applyOptimizedPrompt}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-xs"
                    >
                      Apply Optimized Prompt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>

        <div className="flex justify-end space-x-2 p-4 border-t border-gray-200">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </Card>

      {/* Label Change Dialog */}
      {showLabelDialog && currentWorkflow && (
        <LabelChangeDialog
          isOpen={showLabelDialog}
          onClose={handleLabelChangeCancel}
          onConfirm={handleLabelChangeConfirm}
          nodeId={nodeId}
          oldLabel={currentData.label || nodeId}
          newLabel={pendingLabel}
          workflow={currentWorkflow}
        />
      )}
    </div>
  );
};
