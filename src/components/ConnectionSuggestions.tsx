import React, { useState, useEffect } from "react";
import { Node, Edge } from "reactflow";
import { NodeData } from "../types";
import {
  ConnectionSuggestion,
  generateConnectionSuggestions,
  validateConnection,
  getWorkflowHealthScore,
} from "../utils/connectionSuggestions";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";

interface ConnectionSuggestionsProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onSuggestionClick: (suggestion: ConnectionSuggestion) => void;
  onValidateConnection: (sourceId: string, targetId: string) => void;
}

export const ConnectionSuggestions: React.FC<ConnectionSuggestionsProps> = ({
  nodes,
  edges,
  onSuggestionClick,
  onValidateConnection,
}) => {
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [healthScore, setHealthScore] = useState<{
    score: number;
    issues: string[];
    suggestions: string[];
  }>({
    score: 100,
    issues: [],
    suggestions: [],
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const newSuggestions = generateConnectionSuggestions(nodes, edges);
    const health = getWorkflowHealthScore(nodes, edges);

    setSuggestions(newSuggestions);
    setHealthScore(health);
  }, [nodes, edges]);

  const getCategoryIcon = (category: ConnectionSuggestion["category"]) => {
    switch (category) {
      case "required":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "best-practice":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "logical-sequence":
        return <ArrowRight className="w-4 h-4 text-blue-500" />;
      case "data-flow":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: ConnectionSuggestion["category"]) => {
    switch (category) {
      case "required":
        return "bg-red-100 text-red-800 border-red-200";
      case "best-practice":
        return "bg-green-100 text-green-800 border-green-200";
      case "logical-sequence":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "data-flow":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60)
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 3);

  if (suggestions.length === 0 && healthScore.score === 100) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Workflow looks great!</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            No connection suggestions at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Workflow Health Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Workflow Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getHealthScoreIcon(healthScore.score)}
              <span
                className={`font-bold text-lg ${getHealthScoreColor(
                  healthScore.score
                )}`}
              >
                {healthScore.score}/100
              </span>
            </div>
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  healthScore.score >= 80
                    ? "bg-green-500"
                    : healthScore.score >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${healthScore.score}%` }}
              />
            </div>
          </div>

          {healthScore.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-red-600">
                Issues Found:
              </h4>
              <ul className="text-sm space-y-1">
                {healthScore.issues.map((issue, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {healthScore.suggestions.length > 0 && (
            <div className="space-y-2 mt-3">
              <h4 className="font-medium text-sm text-blue-600">
                Suggestions:
              </h4>
              <ul className="text-sm space-y-1">
                {healthScore.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5" />
              <span>Connection Suggestions</span>
              <Badge variant="secondary">{suggestions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {displayedSuggestions.map((suggestion, index) => {
                const sourceNode = nodes.find(
                  (n) => n.id === suggestion.sourceId
                );
                const targetNode = nodes.find(
                  (n) => n.id === suggestion.targetId
                );

                if (!sourceNode || !targetNode) return null;

                return (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onSuggestionClick(suggestion)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge
                            variant="outline"
                            className={getCategoryColor(suggestion.category)}
                          >
                            {getCategoryIcon(suggestion.category)}
                            <span className="ml-1 capitalize">
                              {suggestion.category.replace("-", " ")}
                            </span>
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {Math.round(suggestion.confidence * 100)}%
                            confidence
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium">
                            {sourceNode.data.label}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {targetNode.data.label}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                          {suggestion.reason}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onValidateConnection(
                            suggestion.sourceId,
                            suggestion.targetId
                          );
                        }}
                      >
                        <Target className="w-4 h-4 mr-1" />
                        Connect
                      </Button>
                    </div>
                  </div>
                );
              })}

              {suggestions.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full"
                >
                  {showAll
                    ? "Show Less"
                    : `Show All ${suggestions.length} Suggestions`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
