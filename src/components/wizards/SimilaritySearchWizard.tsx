import React, { useState } from "react";
import { WizardStepProps } from "../ConfigurationWizard";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Search,
  Database,
  Target,
  CheckCircle,
  Settings,
  Filter,
} from "lucide-react";

const VECTOR_STORES = [
  {
    id: "pinecone",
    name: "Pinecone",
    description: "Managed vector database service",
    features: ["High performance", "Scalable", "Managed service"],
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "weaviate",
    name: "Weaviate",
    description: "Open-source vector database",
    features: ["Open source", "Flexible", "GraphQL API"],
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    id: "chroma",
    name: "Chroma",
    description: "Lightweight vector database",
    features: ["Easy setup", "Local deployment", "Python native"],
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
];

const SEARCH_TYPES = [
  {
    name: "Similarity Search",
    description: "Find most similar content",
    icon: Search,
  },
  {
    name: "Semantic Search",
    description: "Search by meaning, not keywords",
    icon: Target,
  },
  {
    name: "Recommendation",
    description: "Suggest related content",
    icon: Settings,
  },
];

export const SimilaritySearchWizard: React.FC<WizardStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  canProceed,
}) => {
  const [vectorStore, setVectorStore] = useState(
    data.vectorStore || "pinecone"
  );
  const [topK, setTopK] = useState(data.topK || 5);
  const [threshold, setThreshold] = useState(data.threshold || 0.8);
  const [indexName, setIndexName] = useState(data.indexName || "default");

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
      vectorStore,
      topK,
      threshold,
      indexName,
    });
  }, [vectorStore, topK, threshold, indexName]);

  const selectedStore = VECTOR_STORES.find((s) => s.id === vectorStore);

  return (
    <div className="space-y-6">
      {/* Vector Store Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Choose Vector Database
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Select where your vector embeddings are stored
        </p>

        <div className="space-y-3">
          {VECTOR_STORES.map((store) => {
            const isSelected = vectorStore === store.id;

            return (
              <Card
                key={store.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setVectorStore(store.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${store.color}`}>
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {store.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {store.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {store.features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
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

      {/* Search Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Search Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Results (Top K)
            </label>
            <input
              type="number"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              min="1"
              max="100"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              How many similar results to return (1-100)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Similarity Threshold
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Any match (0.0)</span>
                <span className="font-medium">{threshold}</span>
                <span>Exact match (1.0)</span>
              </div>
              <p className="text-xs text-gray-500">
                Only return results above this similarity score
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Index/Collection Name
            </label>
            <input
              type="text"
              value={indexName}
              onChange={(e) => setIndexName(e.target.value)}
              placeholder="default"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Name of the vector index or collection to search
            </p>
          </div>
        </div>
      </div>

      {/* Search Types */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Types</h3>
        <div className="grid grid-cols-1 gap-3">
          {SEARCH_TYPES.map((type, index) => {
            const Icon = type.icon;
            return (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {type.name}
                  </p>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vector Store Information */}
      {selectedStore && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            About {selectedStore.name}
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>Type:</strong> {selectedStore.description}
            </p>
            <p>
              <strong>Best for:</strong> {selectedStore.features.join(", ")}
            </p>
            <p>
              <strong>Setup:</strong>{" "}
              {selectedStore.id === "pinecone"
                ? "Requires API key and index creation"
                : selectedStore.id === "weaviate"
                ? "Can be self-hosted or cloud managed"
                : "Easy local setup with Python"}
            </p>
          </div>
        </div>
      )}

      {/* Search Examples */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">How It Works</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>1. Input:</strong> Text query or document
            </p>
            <p>
              <strong>2. Embedding:</strong> Convert to vector representation
            </p>
            <p>
              <strong>3. Search:</strong> Find similar vectors in database
            </p>
            <p>
              <strong>4. Results:</strong> Return most similar content
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">
          Configuration Preview
        </h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Vector Store:</strong> {selectedStore?.name}
          </p>
          <p>
            <strong>Index:</strong> {indexName}
          </p>
          <p>
            <strong>Results:</strong> Top {topK} matches
          </p>
          <p>
            <strong>Threshold:</strong> {threshold} similarity score
          </p>
        </div>
      </div>
    </div>
  );
};
