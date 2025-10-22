import React, { useState } from "react";
import { WizardStepProps } from "../ConfigurationWizard";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Brain,
  Settings,
  Target,
  CheckCircle,
  Zap,
  Database,
} from "lucide-react";

const EMBEDDING_MODELS = [
  {
    id: "text-embedding-ada-002",
    name: "Ada-002",
    description: "Fast and efficient for most use cases",
    dimensions: 1536,
    cost: "Low",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "text-embedding-3-small",
    name: "3-Small",
    description: "Balanced performance and cost",
    dimensions: 1536,
    cost: "Medium",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    id: "text-embedding-3-large",
    name: "3-Large",
    description: "Highest quality embeddings",
    dimensions: 3072,
    cost: "High",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
];

const USE_CASES = [
  {
    name: "Document Search",
    description: "Find similar documents or content",
    icon: Target,
  },
  {
    name: "Recommendations",
    description: "Suggest similar items or content",
    icon: Zap,
  },
  {
    name: "Clustering",
    description: "Group similar content together",
    icon: Database,
  },
  {
    name: "Classification",
    description: "Categorize content automatically",
    icon: Settings,
  },
];

export const EmbeddingWizard: React.FC<WizardStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  canProceed,
}) => {
  const [model, setModel] = useState(data.model || "text-embedding-ada-002");
  const [dimensions, setDimensions] = useState(data.dimensions || 1536);
  const [batchSize, setBatchSize] = useState(data.batchSize || 100);

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
      model,
      dimensions,
      batchSize,
    });
  }, [model, dimensions, batchSize]);

  const selectedModel = EMBEDDING_MODELS.find((m) => m.id === model);

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Choose Embedding Model
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the AI model that will convert your text into vector embeddings
        </p>

        <div className="space-y-3">
          {EMBEDDING_MODELS.map((modelOption) => {
            const isSelected = model === modelOption.id;

            return (
              <Card
                key={modelOption.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setModel(modelOption.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${modelOption.color}`}>
                      <Brain className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {modelOption.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {modelOption.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {modelOption.dimensions} dimensions
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            modelOption.cost === "Low"
                              ? "text-green-600 border-green-200"
                              : modelOption.cost === "Medium"
                              ? "text-yellow-600 border-yellow-200"
                              : "text-red-600 border-red-200"
                          }`}
                        >
                          {modelOption.cost} cost
                        </Badge>
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

      {/* Use Cases */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          What will you use embeddings for?
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {USE_CASES.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div
                key={index}
                className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
              >
                <Icon className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {useCase.name}
                  </p>
                  <p className="text-xs text-gray-600">{useCase.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Advanced Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vector Dimensions
            </label>
            <input
              type="number"
              value={dimensions}
              onChange={(e) => setDimensions(Number(e.target.value))}
              min="128"
              max="3072"
              step="128"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher dimensions = better accuracy but more storage (128-3072)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Size
            </label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              min="1"
              max="1000"
              step="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of texts to process at once (1-1000)
            </p>
          </div>
        </div>
      </div>

      {/* Model Information */}
      {selectedModel && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            About {selectedModel.name}
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>Dimensions:</strong> {selectedModel.dimensions} vector
              components
            </p>
            <p>
              <strong>Best for:</strong> {selectedModel.description}
            </p>
            <p>
              <strong>Cost:</strong> {selectedModel.cost} - suitable for{" "}
              {selectedModel.cost.toLowerCase()} volume usage
            </p>
            <p>
              <strong>Performance:</strong> Optimized for{" "}
              {selectedModel.id.includes("3-large")
                ? "high accuracy"
                : selectedModel.id.includes("3-small")
                ? "balanced performance"
                : "fast processing"}
            </p>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">
          Configuration Preview
        </h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Model:</strong> {selectedModel?.name}
          </p>
          <p>
            <strong>Dimensions:</strong> {dimensions}
          </p>
          <p>
            <strong>Batch Size:</strong> {batchSize}
          </p>
          <p>
            <strong>Output:</strong> Vector embeddings for similarity search
          </p>
        </div>
      </div>
    </div>
  );
};
