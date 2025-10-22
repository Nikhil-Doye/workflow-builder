import React, { useState } from "react";
import { WizardStepProps } from "../ConfigurationWizard";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Brain,
  Settings,
  Zap,
  Target,
  CheckCircle,
  Lightbulb,
  Sliders,
  Clock,
} from "lucide-react";

const AI_MODELS = [
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    description: "Fast and efficient for most tasks",
    capabilities: ["Text generation", "Analysis", "Summarization"],
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    description: "Advanced reasoning and complex tasks",
    capabilities: ["Complex reasoning", "Problem solving", "Detailed analysis"],
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "OpenAI's efficient model",
    capabilities: ["Text generation", "Code", "Creative writing"],
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "OpenAI's most capable model",
    capabilities: ["Advanced reasoning", "Complex tasks", "High accuracy"],
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
];

const TASK_TEMPLATES = [
  {
    id: "analyze",
    name: "Analyze Content",
    description: "Analyze and extract insights from text",
    prompt:
      "Analyze the following content and provide:\n1. Key insights\n2. Main topics\n3. Important details\n\nContent: {{input}}",
    icon: Target,
  },
  {
    id: "summarize",
    name: "Summarize",
    description: "Create a concise summary",
    prompt:
      "Summarize the following content in 3-5 bullet points:\n\n{{input}}",
    icon: Zap,
  },
  {
    id: "translate",
    name: "Translate",
    description: "Translate text to another language",
    prompt: "Translate the following text to [TARGET_LANGUAGE]:\n\n{{input}}",
    icon: Brain,
  },
  {
    id: "generate",
    name: "Generate Content",
    description: "Create new content based on input",
    prompt:
      "Generate [CONTENT_TYPE] based on the following information:\n\n{{input}}",
    icon: Lightbulb,
  },
  {
    id: "extract",
    name: "Extract Data",
    description: "Extract structured data from text",
    prompt:
      "Extract the following information from the text and format as JSON:\n- Name\n- Email\n- Phone\n- Company\n\nText: {{input}}",
    icon: Settings,
  },
];

export const LLMTaskWizard: React.FC<WizardStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  canProceed,
}) => {
  const [selectedModel, setSelectedModel] = useState(
    data.model || "deepseek-chat"
  );
  const [prompt, setPrompt] = useState(data.prompt || "");
  const [temperature, setTemperature] = useState(data.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(data.maxTokens || 1000);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    const template = TASK_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setPrompt(template.prompt);
    }
  };

  const handleCustomPrompt = () => {
    setSelectedTemplate("custom");
    setPrompt("");
  };

  const updateConfig = (updates: any) => {
    onChange({
      config: {
        ...data.config,
        ...updates,
      },
    });
  };

  React.useEffect(() => {
    updateConfig({
      model: selectedModel,
      prompt,
      temperature,
      maxTokens,
    });
  }, [selectedModel, prompt, temperature, maxTokens]);

  return (
    <div className="space-y-6">
      {/* Task Templates */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          What do you want the AI to do?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose a template or create a custom task
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TASK_TEMPLATES.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedTemplate === template.id;

            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedTemplate === "custom"
                ? "ring-2 ring-blue-500 bg-blue-50"
                : "hover:bg-gray-50"
            }`}
            onClick={handleCustomPrompt}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Custom Task</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Write your own prompt
                  </p>
                </div>
                {selectedTemplate === "custom" && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prompt Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          AI Instructions
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want the AI to do..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use{" "}
              <code className="bg-gray-100 px-1 rounded">{"{{input}}"}</code> to
              reference data from previous nodes
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-2">
              💡 Tips for better prompts:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about the output format you want</li>
              <li>• Include examples when possible</li>
              <li>• Use clear, direct language</li>
              <li>• Break complex tasks into steps</li>
            </ul>
          </div>
        </div>
      </div>

      {/* AI Model Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Choose AI Model
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AI_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;

            return (
              <Card
                key={model.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedModel(model.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${model.color}`}>
                      <Brain className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {model.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {model.description}
                      </p>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {model.capabilities.map((capability, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Advanced Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Advanced Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Creativity Level (Temperature)
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Focused (0.0)</span>
                <span className="font-medium">{temperature}</span>
                <span>Creative (2.0)</span>
              </div>
              <p className="text-xs text-gray-500">
                Lower values = more focused, Higher values = more creative
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Response Length
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              min="100"
              max="4000"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum tokens in the response (100-4000)
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {prompt && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Configuration Preview
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Model:</strong>{" "}
              {AI_MODELS.find((m) => m.id === selectedModel)?.name}
            </p>
            <p>
              <strong>Temperature:</strong> {temperature}
            </p>
            <p>
              <strong>Max Tokens:</strong> {maxTokens}
            </p>
            <p>
              <strong>Prompt Preview:</strong>
            </p>
            <div className="bg-white p-2 rounded border text-xs font-mono">
              {prompt.substring(0, 200)}
              {prompt.length > 200 ? "..." : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
