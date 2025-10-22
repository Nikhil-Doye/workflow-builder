import React, { useState, useEffect } from "react";
import { Node, Edge } from "reactflow";
import { NodeData } from "../types";
import {
  validateConnection,
  ConnectionValidation as ConnectionValidationType,
} from "../utils/connectionSuggestions";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  ArrowRight,
  Zap,
} from "lucide-react";

interface ConnectionValidationProps {
  sourceNode: Node<NodeData> | null;
  targetNode: Node<NodeData> | null;
  existingEdges: Edge[];
  onConnectionAttempt: (sourceId: string, targetId: string) => void;
  onClear: () => void;
}

export const ConnectionValidation: React.FC<ConnectionValidationProps> = ({
  sourceNode,
  targetNode,
  existingEdges,
  onConnectionAttempt,
  onClear,
}) => {
  const [validation, setValidation] = useState<ConnectionValidationType | null>(
    null
  );
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (sourceNode && targetNode) {
      setIsValidating(true);

      // Simulate validation delay for better UX
      const timer = setTimeout(() => {
        const result = validateConnection(
          sourceNode,
          targetNode,
          existingEdges
        );
        setValidation(result);
        setIsValidating(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setValidation(null);
    }
  }, [sourceNode, targetNode, existingEdges]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const getValidationIcon = (
    severity: ConnectionValidationType["severity"]
  ) => {
    switch (severity) {
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getValidationColor = (
    severity: ConnectionValidationType["severity"]
  ) => {
    switch (severity) {
      case "error":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-green-200 bg-green-50";
    }
  };

  const handleConnect = () => {
    if (validation?.isValid) {
      onConnectionAttempt(sourceNode.id, targetNode.id);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <div
        className={`p-4 rounded-lg border shadow-lg ${getValidationColor(
          validation?.severity || "info"
        )}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {isValidating ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              getValidationIcon(validation?.severity || "info")
            )}
            <h3 className="font-medium text-sm">
              {isValidating
                ? "Validating Connection..."
                : "Connection Validation"}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Connection Preview */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="px-2 py-1 bg-white rounded border text-xs font-medium">
              {sourceNode.data.label}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="px-2 py-1 bg-white rounded border text-xs font-medium">
              {targetNode.data.label}
            </div>
          </div>

          {/* Validation Result */}
          {validation && !isValidating && (
            <div className="space-y-2">
              <Alert className="py-2">
                <AlertDescription className="text-sm">
                  {validation.reason}
                </AlertDescription>
              </Alert>

              {validation.suggestion && (
                <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                  <strong>Tip:</strong> {validation.suggestion}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {validation.isValid && (
                  <Button size="sm" onClick={handleConnect} className="flex-1">
                    <Zap className="w-4 h-4 mr-1" />
                    Create Connection
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClear}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
