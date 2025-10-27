import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  ValidationResult,
  ValidationIssue,
  workflowValidationEngine,
} from "../services/workflowValidationEngine";

interface WorkflowValidationPanelProps {
  nodes: any[];
  edges: any[];
  onClose?: () => void;
  autoValidate?: boolean;
}

export const WorkflowValidationPanel: React.FC<
  WorkflowValidationPanelProps
> = ({ nodes, edges, onClose, autoValidate = true }) => {
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  // Auto-validate when nodes or edges change
  useEffect(() => {
    if (!autoValidate) return;

    const validate = () => {
      const result = workflowValidationEngine.validate(nodes, edges);
      setValidationResult(result);
    };

    // Debounce validation to avoid excessive updates
    const timer = setTimeout(validate, 500);
    return () => clearTimeout(timer);
  }, [nodes, edges, autoValidate]);

  if (!validationResult) return null;

  const { isValid, errors, warnings, stats } = validationResult;

  // If valid and no warnings, don't show panel
  if (isValid && warnings.length === 0) {
    return null;
  }

  const toggleIssueExpanded = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const renderIssueIcon = (severity: "error" | "warning") => {
    if (severity === "error") {
      return <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
  };

  const renderIssueBg = (severity: "error" | "warning") => {
    if (severity === "error") {
      return "bg-red-50 border-l-4 border-red-500 hover:bg-red-100";
    }
    return "bg-yellow-50 border-l-4 border-yellow-500 hover:bg-yellow-100";
  };

  const renderIssueGroup = (issues: ValidationIssue[], title: string) => {
    if (issues.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          {title}
          <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
            {issues.length}
          </span>
        </h4>
        <div className="space-y-2">
          {issues.map((issue) => {
            const isExpanded = expandedIssues.has(issue.id);
            return (
              <div
                key={issue.id}
                className={`p-3 rounded-lg transition-colors ${renderIssueBg(
                  issue.severity
                )}`}
              >
                <button
                  onClick={() => toggleIssueExpanded(issue.id)}
                  className="w-full flex items-start space-x-3 text-left"
                >
                  {renderIssueIcon(issue.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {issue.message}
                      </p>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>Issue Type:</strong> {issue.type}
                    </p>
                    {issue.nodeIds && issue.nodeIds.length > 0 && (
                      <p className="text-xs text-gray-600 mb-2">
                        <strong>Affected Nodes:</strong>{" "}
                        {issue.nodeIds.join(", ")}
                      </p>
                    )}
                    <div className="bg-white/60 p-2 rounded border border-gray-300">
                      <p className="text-xs text-gray-700">
                        <strong>💡 Suggestion:</strong> {issue.suggestion}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed left-0 bottom-0 w-96 bg-white border-r border-t border-gray-200 shadow-2xl z-30 flex flex-col max-h-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {isValid && warnings.length === 0 ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : errors.length > 0 ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          )}
          <h3 className="font-semibold text-gray-900">Workflow Validation</h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-600">Nodes</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.totalNodes}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Edges</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.totalEdges}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Input</p>
              <p className="text-lg font-bold text-blue-600">
                {stats.inputNodes}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Output</p>
              <p className="text-lg font-bold text-green-600">
                {stats.outputNodes}
              </p>
            </div>
          </div>

          {/* Issues */}
          {isValid && warnings.length === 0 ? (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">
                ✅ Workflow is valid and ready to execute
              </p>
            </div>
          ) : (
            <>
              {renderIssueGroup(errors, "❌ Errors")}
              {renderIssueGroup(warnings, "⚠️ Warnings")}
            </>
          )}

          {/* Validation Tips */}
          {(errors.length > 0 || warnings.length > 0) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 font-medium mb-1">
                💡 Validation Tips:
              </p>
              <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                <li>Every workflow needs at least one Input node</li>
                <li>Every workflow needs at least one Output node</li>
                <li>All nodes must have a path to the output</li>
                <li>No circular connections between nodes</li>
                <li>All nodes should be connected to the main flow</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
